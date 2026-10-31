import {createHash} from 'node:crypto';
import type {Database} from '../db/index.ts';
import type {ImageStorage} from './storage.ts';
import {normalizePng} from './png.ts';
import {ApiError} from '../core/errors.ts';
import {requireId} from '../core/http.ts';
import type {StudioAsset} from '../../src/features/studio/types.ts';
import type {PublicWorkSnapshot} from '../../src/shared/contracts.ts';
import {readPrivateStoryImage} from './bundled.ts';
async function requireOwner(db:Database,userId:string,workId:string,lock=false){
 requireId(workId);requireId(userId);
 const row=(await db.query<{owner_id:string}>(`SELECT owner_id FROM works WHERE id=$1${lock?' FOR UPDATE':''}`,[workId])).rows[0];
 if(!row)throw new ApiError('NOT_FOUND','작품을 찾을 수 없어요.');
 if(row.owner_id!==userId)throw new ApiError('FORBIDDEN','작성자만 이미지를 등록할 수 있어요.');
}
export function createMediaService({db,storage}:{db:Database;storage:ImageStorage}) {
 return {
  requireOwner:(userId:string,workId:string)=>requireOwner(db,userId,workId),
  async uploadAssetImage(userId:string,workId:string,assetId:string,input:Uint8Array):Promise<StudioAsset>{
   requireId(assetId);await requireOwner(db,userId,workId);
   const bytes=normalizePng(input),hash=createHash('sha256').update(bytes).digest('hex');
   const key=`${workId}/${hash}`,url=`/api/studio/media/${key}`;
   return db.transaction(async tx=>{
    await requireOwner(tx,userId,workId,true);
    const source=(await tx.query<StudioAsset>('SELECT id,code,label,url,revision FROM studio_assets WHERE id=$1 AND work_id=$2 AND owner_id=$3',[assetId,workId,userId])).rows[0];
    if(!source)throw new ApiError('NOT_FOUND','이미지 코드를 찾을 수 없어요.');
    const latest=(await tx.query<StudioAsset>('SELECT id,code,label,url,revision FROM studio_assets WHERE work_id=$1 AND code=$2 ORDER BY revision DESC LIMIT 1',[workId,source.code])).rows[0];
    if(latest.url===url)return latest;
    if(latest.id!==assetId)throw new ApiError('CONFLICT','다른 이미지 버전이 있어요. 최신 이미지를 확인해 주세요.');
    const count=(await tx.query<{count:number}>('SELECT count(*)::int AS count FROM studio_assets WHERE work_id=$1',[workId])).rows[0].count;
    if(count>=200)throw new ApiError('INVALID_REQUEST','이전 버전을 포함해 작품 이미지는 200개까지 등록할 수 있어요.');
    await storage.put(key,bytes);
    return (await tx.query<StudioAsset>('INSERT INTO studio_assets(work_id,owner_id,code,label,url,revision) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,code,label,url,revision',[workId,userId,source.code,source.label,url,(latest.revision??1)+1])).rows[0];
   });
  },
  async uploadImage(userId:string,workId:string,input:Uint8Array,label='등록 이미지'):Promise<StudioAsset>{
   if(!label.trim()||label.length>200)throw new ApiError('INVALID_REQUEST','이미지 설명을 확인해 주세요.');
   await requireOwner(db,userId,workId);
   const bytes=normalizePng(input),hash=createHash('sha256').update(bytes).digest('hex');
   const key=`${workId}/${hash}`,url=`/api/studio/media/${key}`,code=`IMG_${hash.slice(0,60)}`;
   return db.transaction(async tx=>{
    await requireOwner(tx,userId,workId,true);
    const existing=(await tx.query<StudioAsset>('SELECT id,code,label,url FROM studio_assets WHERE work_id=$1 AND code=$2',[workId,code])).rows[0];
    if(existing){if(existing.url!==url)throw new ApiError('CONFLICT','같은 이미지 코드가 이미 있어요.');return existing;}
    const count=(await tx.query<{count:number}>('SELECT count(*)::int AS count FROM studio_assets WHERE work_id=$1',[workId])).rows[0].count;
    if(count>=200)throw new ApiError('INVALID_REQUEST','작품 이미지는 200개까지 등록할 수 있어요.');
    // Check capacity under the work lock before allocating immutable storage.
    await storage.put(key,bytes);
    return (await tx.query<StudioAsset>('INSERT INTO studio_assets(work_id,owner_id,code,label,url) VALUES($1,$2,$3,$4,$5) RETURNING id,code,label,url',[workId,userId,code,label.trim(),url])).rows[0];
   });
  },
  async readImage(userId:string|null,workId:string,hash:string){
   requireId(workId);if(!/^[a-f0-9]{64}$/.test(hash))throw new ApiError('NOT_FOUND','이미지를 찾을 수 없어요.');
   const url=`/api/studio/media/${workId}/${hash}`;
   const assets=(await db.query<StudioAsset&{owner_id:string;visibility:string}>(`SELECT a.id,a.code,a.label,a.url,a.owner_id,w.visibility FROM studio_assets a JOIN works w ON w.id=a.work_id WHERE a.work_id=$1 AND a.url=$2`,[workId,url])).rows;
   const asset=assets[0];
   if(!asset)throw new ApiError('NOT_FOUND','이미지를 찾을 수 없어요.');
   let allowed=asset.owner_id===userId;
   const versions=(await db.query<{id:string;public_snapshot:PublicWorkSnapshot;private_config:{assets?:StudioAsset[];workMetadata?:{coverUrl?:string}}}>('SELECT id,public_snapshot,private_config FROM work_versions WHERE work_id=$1 AND published_at IS NOT NULL',[workId])).rows;
   for(const v of versions){
    const bound=assets.filter(candidate=>v.private_config.assets?.some(a=>a.id===candidate.id&&a.url===url));
    if(!bound.length)continue;
    const publicReference=v.private_config.workMetadata?.coverUrl===url||v.public_snapshot.characters?.some(c=>c.imageUrl===url)||v.public_snapshot.gallery?.some(item=>item.imageUrl===url)||v.public_snapshot.openings?.some(o=>o.imageUrl===url||[o.prologue,o.firstMessage].some(text=>bound.some(candidate=>text.includes(`{{img:${candidate.code}}}`))));
    if(asset.visibility==='public'&&publicReference){allowed=true;break;}
    if(userId&&(await db.query('SELECT id FROM chats WHERE user_id=$1 AND work_version_id=$2 LIMIT 1',[userId,v.id])).rows.length){allowed=true;break;}
   }
   if(!allowed)throw new ApiError(userId?'FORBIDDEN':'UNAUTHORIZED','이미지를 볼 권한이 없어요.');
   const bytes=await storage.get(`${workId}/${hash}`)??await readPrivateStoryImage(hash);
   if(!bytes)throw new ApiError('NOT_FOUND','이미지 파일을 찾을 수 없어요.');return bytes;
  },
 };
}
