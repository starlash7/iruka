import type {Database} from '../db/index.ts';
import type {CreateStudioService} from '../core/interfaces.ts';
import {ApiError} from '../core/errors.ts';
import {requireId} from '../core/http.ts';
import {getCreatorWork} from '../core/works.ts';
import type {StudioDraft,StudioWork,StudioAsset} from '../../src/features/studio/types.ts';
import {validateDraft} from './validate.ts';
import {isBundledStoryImage} from '../media/bundled.ts';
async function lockWork(db:Database,userId:string,id:string) {
 requireId(id);requireId(userId);
 const {rows}=await db.query<{owner_id:string}>('SELECT owner_id FROM works WHERE id=$1 FOR UPDATE',[id]);
 if(!rows[0])throw new ApiError('NOT_FOUND','작품을 찾을 수 없어요.');
 if(rows[0].owner_id!==userId)throw new ApiError('FORBIDDEN','작성자만 편집할 수 있어요.');
}
async function readDraft(db:Database,id:string) {
 const row=(await db.query<{body:StudioDraft;revision:number}>('SELECT body,revision FROM studio_drafts WHERE work_id=$1',[id])).rows[0];
 if(!row)throw new ApiError('NOT_FOUND','편집 초안이 없어요.');return row;
}
async function readAssets(db:Database,id:string):Promise<StudioAsset[]> {
 return (await db.query<StudioAsset>('SELECT id,code,label,url,revision FROM studio_assets WHERE work_id=$1 ORDER BY code,revision DESC',[id])).rows;
}
async function checkAssets(db:Database,userId:string,id:string,draft:StudioDraft) {
 const owned=(await db.query<StudioAsset>('SELECT id,code,label,url FROM studio_assets WHERE work_id=$1 AND owner_id=$2',[id,userId])).rows;
 const selected=(draft.assets??[]).map(a=>{
  const asset=owned.find(o=>o.id===a.id&&o.code===a.code);
  if(!asset)throw new ApiError('FORBIDDEN','이 작품이 소유한 이미지만 사용할 수 있어요.');return asset;
 });
 const urls=[draft.coverUrl,...draft.publicSnapshot.characters.map(c=>c.imageUrl),...draft.publicSnapshot.openings.map(o=>o.imageUrl??null),...(draft.publicSnapshot.gallery??[]).map(item=>item.imageUrl),...draft.privateConfig.endings.map(e=>e.imageUrl)];
 if(urls.some(url=>url!==null&&!isBundledStoryImage(url)&&!selected.some(a=>a.url===url)))throw new ApiError('FORBIDDEN','등록된 소유 이미지만 사용할 수 있어요.');
 return selected;
}
async function getWork(db:Database,userId:string,id:string):Promise<StudioWork> {
 await lockWork(db,userId,id);
 const [dto,row,assets]=await Promise.all([getCreatorWork(db,id,userId),readDraft(db,id),readAssets(db,id)]);
 return {...dto,work:{...dto.work,mode:row.body.mode,title:row.body.title,description:row.body.description,coverUrl:row.body.coverUrl,tags:row.body.tags},draft:{...row.body,id},revision:row.revision,assets};
}
function checkRevision(expected:number|undefined,actual:number) {
 if(expected!==actual)throw new ApiError('CONFLICT','다른 저장 내용이 있어요. 다시 열어 확인해 주세요.');
}
export function createStudioService({db}:{db:Database}) {
 return {
  getWork(userId:string,id:string){return db.transaction(tx=>getWork(tx,userId,id));},
  async listWorks(userId:string) {
   requireId(userId);
   const rows=(await db.query<{id:string;title:string;mode:string;revision:number;published:boolean;cover_url:string|null;updated_at:Date}>(`SELECT w.id,d.body->>'title' AS title,d.body->>'mode' AS mode,d.body->>'coverUrl' AS cover_url,d.updated_at,d.revision,
    EXISTS(SELECT 1 FROM work_versions v WHERE v.work_id=w.id AND published_at IS NOT NULL) AS published
    FROM works w JOIN studio_drafts d ON d.work_id=w.id WHERE w.owner_id=$1 ORDER BY d.updated_at DESC,w.id`,[userId])).rows;
   return rows.map(({cover_url,updated_at,...row})=>({...row,coverUrl:cover_url,updatedAt:new Date(updated_at).toISOString()}));
  },
  async saveDraft(userId:string,input:StudioDraft):Promise<StudioWork> {
   const draft=validateDraft(input);requireId(userId);
   return db.transaction(async tx=>{
    let id=draft.id;
    if(id){await lockWork(tx,userId,id);if(draft.revision!==undefined)checkRevision(draft.revision,(await readDraft(tx,id)).revision);}
    else {id=(await tx.query<{id:string}>('INSERT INTO works(owner_id,mode,title) VALUES($1,$2,$3) RETURNING id',[userId,draft.mode,draft.title])).rows[0].id;}
    await checkAssets(tx,userId,id,draft);
    const {revision:_,...body}=draft;body.id=id;
    await tx.query(`INSERT INTO studio_drafts(work_id,body) VALUES($1,$2)
     ON CONFLICT(work_id) DO UPDATE SET body=EXCLUDED.body,revision=studio_drafts.revision+1,updated_at=clock_timestamp()`,[id,JSON.stringify(body)]);
    return getWork(tx,userId,id);
   });
  },
  async publishVersion(userId:string,id:string,revision?:number) {
   return db.transaction(async tx=>{
    await lockWork(tx,userId,id);const row=await readDraft(tx,id);
    if(revision!==undefined){
     const replay=(await tx.query<{id:string}>("SELECT id FROM work_versions WHERE work_id=$1 AND published_at IS NOT NULL AND private_config->>'studioRevision'=$2",[id,String(revision)])).rows[0];
     if(replay)return (await getCreatorWork(tx,id,userId)).versions.find(v=>v.id===replay.id)!;
     checkRevision(revision,row.revision);
    }
    // Publishing only increments revision; with no intervening save, reuse that version after reload.
    const unchanged=(await tx.query<{id:string}>("SELECT id FROM work_versions WHERE work_id=$1 AND published_at IS NOT NULL AND private_config->>'studioRevision'=$2",[id,String(row.revision-1)])).rows[0];
    if(unchanged)return (await getCreatorWork(tx,id,userId)).versions.find(v=>v.id===unchanged.id)!;
    const draft=validateDraft(row.body,true);const assets=await checkAssets(tx,userId,id,draft);
    const version=(await tx.query<{version:number}>('SELECT COALESCE(MAX(version),0)+1 AS version FROM work_versions WHERE work_id=$1',[id])).rows[0].version;
    const created=(await tx.query<{id:string}>(`INSERT INTO work_versions(work_id,version,public_snapshot,private_config,published_at)
     VALUES($1,$2,$3,$4,now()) RETURNING id`,[id,version,JSON.stringify(draft.publicSnapshot),JSON.stringify({...draft.privateConfig,studioRevision:row.revision,assets,workMetadata:{mode:draft.mode,title:draft.title,description:draft.description,coverUrl:draft.coverUrl,tags:draft.tags}})])).rows[0];
    await tx.query("UPDATE works SET mode=$2,title=$3,description=$4,cover_url=$5,tags=$6,show_creator=$7,visibility='public' WHERE id=$1",[id,draft.mode,draft.title,draft.description,draft.coverUrl,draft.tags,draft.showCreator===true]);
    await tx.query('UPDATE studio_drafts SET revision=revision+1 WHERE work_id=$1',[id]);
    return (await getCreatorWork(tx,id,userId)).versions.find(v=>v.id===created.id)!;
   });
  },
  /** Records an unuploaded slot. No browser-supplied URL or owner is trusted. */
  async createAsset(userId:string,id:string,input:{code:string;label:string}) {
   if(!input||typeof input.code!=='string'||! /^[A-Za-z0-9_-]{1,64}$/.test(input.code)||typeof input.label!=='string'||input.label.length>200)throw new ApiError('INVALID_REQUEST','이미지 코드를 확인해 주세요.');
   return db.transaction(async tx=>{
    await lockWork(tx,userId,id);
    const existing=await readAssets(tx,id);
    if(existing.length>=200)throw new ApiError('INVALID_REQUEST','이미지는 200개까지 등록할 수 있어요.');
    if(existing.some(a=>a.code===input.code))throw new ApiError('CONFLICT','이미지 코드가 이미 있어요.');
    return (await tx.query<StudioAsset>('INSERT INTO studio_assets(work_id,owner_id,code,label) VALUES($1,$2,$3,$4) RETURNING id,code,label,url',[id,userId,input.code,input.label])).rows[0];
   });
  },
 };
}
const _contract:CreateStudioService=createStudioService;
void _contract;
