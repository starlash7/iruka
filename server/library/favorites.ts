import type {Database} from '../db/index.ts';
import {ApiError} from '../core/errors.ts';
import {createDiscoveryService} from '../discover/index.ts';

export function createFavoritesService(db:Database){
 const discovery=createDiscoveryService({db});
 return {
  list:(userId:string,offset:number)=>discovery.searchWorks({favoriteUserId:userId,offset}),
  async get(userId:string,workId:string){
   const {rows}=await db.query(`SELECT f.work_id FROM work_favorites f JOIN works w ON w.id=f.work_id WHERE f.user_id=$1 AND f.work_id=$2 AND w.visibility='public' AND EXISTS(SELECT 1 FROM work_versions v WHERE v.work_id=w.id AND v.published_at IS NOT NULL)`,[userId,workId]);
   return {saved:rows.length>0};
  },
  async set(userId:string,workId:string,input:Record<string,unknown>){
   if(Object.keys(input).some(key=>key!=='saved')||typeof input.saved!=='boolean')throw new ApiError('INVALID_REQUEST','찜 상태를 확인해 주세요.');
   await db.transaction(async tx=>{
    if(input.saved){
     const row=await tx.query("SELECT id FROM works w WHERE id=$1 AND visibility='public' AND EXISTS(SELECT 1 FROM work_versions v WHERE v.work_id=w.id AND v.published_at IS NOT NULL) FOR KEY SHARE",[workId]);
     if(!row.rows.length)throw new ApiError('NOT_FOUND','작품을 찾을 수 없어요.');
     await tx.query('INSERT INTO work_favorites(user_id,work_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[userId,workId]);
    }else await tx.query('DELETE FROM work_favorites WHERE user_id=$1 AND work_id=$2',[userId,workId]);
   });return {saved:input.saved};
  }
 };
}
