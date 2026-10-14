import type {Database} from '../db/index.ts';
import type {ChatDto} from '../../src/shared/contracts.ts';
import {ApiError} from './errors.ts';
import {requireId} from './http.ts';
type ChatRow={id:string;user_id:string;work_id:string;work_version_id:string;persona_snapshot:Record<string,string>;created_at:Date};
function mapChat(row:ChatRow):ChatDto {return {id:row.id,userId:row.user_id,workId:row.work_id,workVersionId:row.work_version_id,personaSnapshot:row.persona_snapshot.name?{name:row.persona_snapshot.name,description:row.persona_snapshot.description??''}:null,activeMessageId:null,createdAt:new Date(row.created_at).toISOString()};}
export async function getOwnedChat(db:Database,id:string,userId:string):Promise<ChatDto> {
 const {rows}=await db.query<ChatRow>('SELECT * FROM chats WHERE id=$1 AND user_id=$2',[id,userId]);
 if(!rows[0]) throw new ApiError('NOT_FOUND','대화를 찾을 수 없어요.'); return mapChat(rows[0]);
}
export async function createChat(db:Database,userId:string,body:Record<string,unknown>):Promise<ChatDto> {
 const workId=requireId(body.workId), personaId=body.personaId==null?null:requireId(body.personaId);
 return db.transaction(async tx=>{
  const versions=await tx.query<{id:string}>(`SELECT v.id FROM work_versions v JOIN works w ON w.id=v.work_id WHERE w.id=$1 AND (w.visibility IN ('public','unlisted') OR w.owner_id=$2) AND v.published_at IS NOT NULL ORDER BY v.version DESC LIMIT 1`,[workId,userId]);
  if(!versions.rows[0]) throw new ApiError('NOT_FOUND','발행된 작품을 찾을 수 없어요.');
  let snapshot={};
  if(personaId){const {rows}=await tx.query<{name:string;profile:{description?:string}}>('SELECT name,profile FROM personas WHERE id=$1 AND user_id=$2',[personaId,userId]);if(!rows[0])throw new ApiError('NOT_FOUND','페르소나를 찾을 수 없어요.');snapshot={name:rows[0].name,description:rows[0].profile.description??''};}
  const {rows}=await tx.query<ChatRow>('INSERT INTO chats(user_id,work_id,work_version_id,persona_id,persona_snapshot) VALUES($1,$2,$3,$4,$5) RETURNING *',[userId,workId,versions.rows[0].id,personaId,JSON.stringify(snapshot)]);
  return mapChat(rows[0]);
 });
}
