import type {Database} from '../db/index.ts';
import type {MessageDto,PrivateWorkConfig,PublicWorkSnapshot} from '../../src/shared/contracts.ts';
import {getOwnedChat} from '../core/chats.ts';
import {ApiError} from '../core/errors.ts';
export interface MessageRow {id:string;chat_id:string;parent_id:string|null;role:'user'|'assistant';content:string;created_at:Date}
export function mapMessage(row:MessageRow):MessageDto {return {id:row.id,chatId:row.chat_id,parentMessageId:row.parent_id,role:row.role,content:row.content,createdAt:new Date(row.created_at).toISOString()};}
export async function loadChat(db:Database,userId:string,chatId:string,lock=false) {
  const chat=await getOwnedChat(db,chatId,userId);
  if(lock)await db.query('SELECT id FROM chats WHERE id=$1 AND user_id=$2 FOR UPDATE',[chatId,userId]);
  await db.query('INSERT INTO chat_state(chat_id) VALUES($1) ON CONFLICT DO NOTHING',[chatId]);
  const {rows}=await db.query<{active_message_id:string|null;opening_id:string|null;deleted_at:Date|null}>('SELECT * FROM chat_state WHERE chat_id=$1',[chatId]);
  if(rows[0].deleted_at)throw new ApiError('NOT_FOUND','대화를 찾을 수 없어요.');
  return {chat:{...chat,activeMessageId:rows[0].active_message_id},openingId:rows[0].opening_id};
}
export async function assertIdle(db:Database,chatId:string):Promise<void> {
  if((await db.query('SELECT turn_id FROM chat_turn_leases WHERE chat_id=$1',[chatId])).rows.length)
    throw new ApiError('CONFLICT','진행 중인 대화 요청이 있어요.');
}
export async function loadPath(db:Database,chatId:string,leafId:string|null):Promise<MessageDto[]> {
  if(!leafId)return [];
  const {rows}=await db.query<MessageRow>(`WITH RECURSIVE path AS (
    SELECT id,chat_id,parent_id,role,content,created_at,deleted_at,0 AS depth FROM messages WHERE id=$1 AND chat_id=$2
    UNION ALL SELECT m.id,m.chat_id,m.parent_id,m.role,m.content,m.created_at,m.deleted_at,p.depth+1
    FROM messages m JOIN path p ON m.id=p.parent_id AND m.chat_id=p.chat_id WHERE p.depth<10000
  ) SELECT * FROM path ORDER BY depth DESC`,[leafId,chatId]);
  if(!rows.length||rows[0].parent_id!==null||rows.some(r=>(r as MessageRow&{deleted_at:unknown}).deleted_at))
    throw new ApiError('NOT_FOUND','메시지를 찾을 수 없어요.');
  return rows.map(mapMessage);
}
export async function insertMessage(db:Database,chatId:string,parentId:string|null,role:'user'|'assistant',content:string) {
  const {rows}=await db.query<MessageRow>('INSERT INTO messages(chat_id,parent_id,role,content) VALUES($1,$2,$3,$4) RETURNING *',[chatId,parentId,role,content]);return mapMessage(rows[0]);
}
export async function selectLeaf(db:Database,chatId:string,leafId:string|null) {await db.query('UPDATE chat_state SET active_message_id=$2 WHERE chat_id=$1',[chatId,leafId]);}
export async function loadVersion(db:Database,chatId:string) {
  const {rows}=await db.query<{mode:'character'|'story';private_config:Partial<PrivateWorkConfig>;public_snapshot:Partial<PublicWorkSnapshot>}>(`SELECT w.mode,v.private_config,v.public_snapshot FROM chats c JOIN works w ON w.id=c.work_id JOIN work_versions v ON v.id=c.work_version_id WHERE c.id=$1`,[chatId]);
  return {mode:rows[0].mode,config:rows[0].private_config,snapshot:rows[0].public_snapshot};
}
