import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import type {Database} from '../../server/db/index.ts';
import {createStudioService} from '../../server/studio/index.ts';
import {ApiError} from '../../server/core/errors.ts';
import type {StudioDraft} from '../../src/features/studio/types.ts';
import type {PublicWorkSnapshot} from '../../src/shared/contracts.ts';
import {seedSlugs} from './importWorks.ts';
import {isBundledStoryImage,isPrivateStoryImage} from '../../server/media/bundled.ts';
type Presentation={coverUrl:string;characters:PublicWorkSnapshot['characters'];gallery:NonNullable<PublicWorkSnapshot['gallery']>;openings:Array<{id:string;imageUrl:string}>;codeImages:Array<{code:string;label:string;url:string}>;privateImages?:Array<{code:string;hash:string;label:string}>};
export function applySeedPresentation(draft:StudioDraft,presentation:Presentation):StudioDraft{
 const next=structuredClone(draft);next.coverUrl=presentation.coverUrl;next.publicSnapshot.gallery=presentation.gallery;
 for(const character of next.publicSnapshot.characters)Object.assign(character,presentation.characters.find(item=>item.id===character.id)??{});
 for(const opening of next.publicSnapshot.openings)Object.assign(opening,presentation.openings.find(item=>item.id===opening.id)??{});
 return next;
}
function manuscript(draft:StudioDraft){const {id:_id,revision:_revision,assets,...body}=draft;return {...body,assets:assets?.map(item=>item.code).sort()};}
/** Deliberate local seed enrichment; refuses edited manuscripts and never rewrites old versions. */
export async function attachSeedArtwork(db:Database){return db.transaction(async tx=>{
 await tx.query('SELECT pg_advisory_xact_lock(2026101404)');const service=createStudioService({db:tx});const result=[];
 for(const slug of seedSlugs){
  const source=await readFile(new URL(`../../seed/works/${slug}/work.json`,import.meta.url),'utf8');
  const row=(await tx.query<{work_id:string;source_hash:string;owner_id:string;privy_did:string}>('SELECT i.work_id,i.source_hash,w.owner_id,u.privy_did FROM studio_seed_imports i JOIN works w ON w.id=i.work_id JOIN users u ON u.id=w.owner_id WHERE i.slug=$1',[slug])).rows[0];
  if(!row)throw new ApiError('NOT_FOUND','먼저 원본 시드 작품을 가져와 주세요.');
  if(row.privy_did!=='did:privy:local-studio-seed'||row.source_hash!==createHash('sha256').update(source).digest('hex'))throw new ApiError('CONFLICT','시드 출처가 달라 자동 연결하지 않았어요.');
  const presentation=JSON.parse(await readFile(new URL(`../../seed/works/${slug}/presentation.json`,import.meta.url),'utf8')) as Presentation;
  const urls=[presentation.coverUrl,...presentation.characters.flatMap(c=>c.imageUrl?[c.imageUrl]:[]),...presentation.gallery.map(item=>item.imageUrl),...presentation.openings.map(item=>item.imageUrl),...presentation.codeImages.map(item=>item.url)];
  if(urls.some(url=>!isBundledStoryImage(url)))throw new ApiError('INVALID_REQUEST','채택된 번들 이미지만 연결할 수 있어요.');
  const work=await service.getWork(row.owner_id,row.work_id);const next=applySeedPresentation(work.draft,presentation);
  const privateImages=(presentation.privateImages??[]).map(image=>{if(!isPrivateStoryImage(image.code,image.hash))throw new ApiError('INVALID_REQUEST','채택된 비공개 이미지 코드를 확인해 주세요.');return {code:image.code,label:image.label,url:`/api/studio/media/${row.work_id}/${image.hash}`};});
  const boundUrls=new Map(work.assets.filter(asset=>work.draft.assets?.some(item=>item.id===asset.id)).map(asset=>[asset.code,asset.url]));
  if(isDeepStrictEqual(manuscript(next),manuscript(work.draft))&&privateImages.every(image=>boundUrls.get(image.code)===image.url)){result.push({slug,id:row.work_id,changed:false});continue;}
  const original=JSON.parse(source) as StudioDraft;
  if(!isDeepStrictEqual(manuscript(work.draft),manuscript(original))&&!isDeepStrictEqual(manuscript(work.draft),manuscript(applySeedPresentation(original,presentation))))throw new ApiError('CONFLICT',`${slug}: 수정된 초안을 자동 덮어쓰지 않아요.`);
  for(const image of [...presentation.codeImages,...privateImages]){
   const latest=(await tx.query<{id:string;url:string|null;revision:number}>('SELECT id,url,revision FROM studio_assets WHERE work_id=$1 AND code=$2 ORDER BY revision DESC LIMIT 1',[row.work_id,image.code])).rows[0];
   let id=latest?.url===image.url?latest.id:null;
   if(!id){
    if((await tx.query<{count:number}>('SELECT count(*)::int AS count FROM studio_assets WHERE work_id=$1',[row.work_id])).rows[0].count>=200)throw new ApiError('INVALID_REQUEST','이미지 교체 이력을 포함한 200개 한도를 확인해 주세요.');
    id=(await tx.query<{id:string}>('INSERT INTO studio_assets(work_id,owner_id,code,label,url,revision) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',[row.work_id,row.owner_id,image.code,image.label,image.url,(latest?.revision??0)+1])).rows[0].id;
   }
   next.assets=[...(next.assets??[]).filter(item=>item.code!==image.code),{id,code:image.code}];
  }
  const saved=await service.saveDraft(row.owner_id,{...next,revision:work.revision});await service.publishVersion(row.owner_id,row.work_id,saved.revision);
  result.push({slug,id:row.work_id,changed:true});
 }return result;
});}
