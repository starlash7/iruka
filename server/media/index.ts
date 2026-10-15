import {createHash} from 'node:crypto';
import type {Database} from '../db/index.ts';
import type {ImageStorage} from './storage.ts';
import {normalizePng} from './png.ts';
import {ApiError} from '../core/errors.ts';
import {requireId} from '../core/http.ts';
import type {StudioAsset} from '../../src/features/studio/types.ts';
async function requireOwner(db:Database,userId:string,workId:string,lock=false){
 requireId(workId);requireId(userId);
 const row=(await db.query<{owner_id:string}>(`SELECT owner_id FROM works WHERE id=$1${lock?' FOR UPDATE':''}`,[workId])).rows[0];
 if(!row)throw new ApiError('NOT_FOUND','작품을 찾을 수 없어요.');
 if(row.owner_id!==userId)throw new ApiError('FORBIDDEN','작성자만 이미지를 등록할 수 있어요.');
}
export function createMediaService({db,storage}:{db:Database;storage:ImageStorage}) {
 return {
  requireOwner:(userId:string,workId:string)=>requireOwner(db,userId,workId),
  async uploadImage(userId:string,workId:string,input:Uint8Array):Promise<StudioAsset>{
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
    return (await tx.query<StudioAsset>('INSERT INTO studio_assets(work_id,owner_id,code,label,url) VALUES($1,$2,$3,$4,$5) RETURNING id,code,label,url',[workId,userId,code,'등록 이미지',url])).rows[0];
   });
  },
  async readImage(userId:string|null,workId:string,hash:string){
   requireId(workId);if(!/^[a-f0-9]{64}$/.test(hash))throw new ApiError('NOT_FOUND','이미지를 찾을 수 없어요.');
   const url=`/api/studio/media/${workId}/${hash}`;
   const asset=(await db.query<StudioAsset&{owner_id:string;visibility:string}>(`SELECT a.id,a.code,a.label,a.url,a.owner_id,w.visibility FROM studio_assets a JOIN works w ON w.id=a.work_id WHERE a.work_id=$1 AND a.url=$2`,[workId,url])).rows[0];
   if(!asset)throw new ApiError('NOT_FOUND','이미지를 찾을 수 없어요.');
   let allowed=asset.owner_id===userId;
   const versions=(await db.query<{id:string;public_snapshot:{characters?:Array<{imageUrl:string|null}>;openings?:Array<{prologue:string;firstMessage:string}>};private_config:{assets?:StudioAsset[];workMetadata?:{coverUrl?:string}}}>('SELECT id,public_snapshot,private_config FROM work_versions WHERE work_id=$1 AND published_at IS NOT NULL',[workId])).rows;
   for(const v of versions){
    if(!v.private_config.assets?.some(a=>a.id===asset.id&&a.url===url))continue;
    const publicReference=v.private_config.workMetadata?.coverUrl===url||v.public_snapshot.characters?.some(c=>c.imageUrl===url)||v.public_snapshot.openings?.some(o=>[o.prologue,o.firstMessage].some(text=>text.includes(`{{img:${asset.code}}}`)));
    if(asset.visibility==='public'&&publicReference){allowed=true;break;}
    if(userId&&(await db.query('SELECT id FROM chats WHERE user_id=$1 AND work_version_id=$2 LIMIT 1',[userId,v.id])).rows.length){allowed=true;break;}
   }
   if(!allowed)throw new ApiError(userId?'FORBIDDEN':'UNAUTHORIZED','이미지를 볼 권한이 없어요.');
   const bytes=await storage.get(`${workId}/${hash}`);
   if(!bytes)throw new ApiError('NOT_FOUND','이미지 파일을 찾을 수 없어요.');return bytes;
  },
 };
}
