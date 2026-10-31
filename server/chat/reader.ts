import type {Database} from '../db/index.ts';
import {loadChat,mapMessage,type MessageRow} from './repository.ts';
import {getPresentations} from './presentations.ts';
import {projectPublicSnapshot} from '../core/publicSnapshot.ts';
import {createMemoryService} from './memory.ts';
import type {SafetyService} from './safety.ts';
import type {ChatListQuery} from './library.ts';

/** Projects only public fields from the version pinned to this conversation. */
export function createReaderService(db:Database,safety?:SafetyService) {
  async function getView(userId:string,chatId:string) {
    const {chat,openingId}=await loadChat(db,userId,chatId);
    const {rows}=await db.query<{title:string;public_snapshot:Record<string,unknown>}>(
      `SELECT COALESCE(c.title,v.private_config->'workMetadata'->>'title',w.title) AS title,v.public_snapshot
       FROM chats c JOIN works w ON w.id=c.work_id JOIN work_versions v ON v.id=c.work_version_id WHERE c.id=$1`,[chatId]);
    const snapshot=projectPublicSnapshot(rows[0].public_snapshot);
    const messages=(await db.query<MessageRow>('SELECT * FROM messages WHERE chat_id=$1 AND deleted_at IS NULL ORDER BY created_at,id',[chatId])).rows.map(mapMessage);
    const presentations=await getPresentations(db,messages.map(m=>m.id));
    const memories=await createMemoryService(db,safety).listMemories(userId,chatId);
    const pending=(await db.query<{id:string;status:string}>('SELECT t.id,t.status FROM turn_requests t JOIN chat_turn_leases l ON l.turn_id=t.id WHERE t.chat_id=$1',[chatId])).rows[0];
    return {chat,title:rows[0].title,messages:messages.map(message=>{
      const presentation=presentations.find(p=>p.messageId===message.id);
      const ending=presentation?.endings[0];
      return {...message,images:presentation?.images??[],status:presentation?.statuses.join('\n')??'',ending:ending?{id:ending.endingId,title:ending.title}:null};
    }),memo:memories.filter(m=>m.kind==='pinned').map(m=>m.content).join('\n'),guide:snapshot.playGuide,
      suggestedReplies:snapshot.openings.find(o=>o.id===openingId)?.suggestedReplies??[],pendingTurn:pending?{id:pending.id,status:pending.status}:null};
  }
  return {getView,async listChats(userId:string,query:ChatListQuery={}) {
    const {rows}=await db.query<{id:string;folder_id:string|null;updated_at:Date}>(`SELECT c.id,c.folder_id,GREATEST(c.created_at,COALESCE((SELECT max(m.created_at) FROM messages m WHERE m.chat_id=c.id AND m.deleted_at IS NULL),c.created_at)) AS updated_at
      FROM chats c JOIN chat_state s ON s.chat_id=c.id WHERE c.user_id=$1 AND s.deleted_at IS NULL
      AND ($2::uuid IS NULL OR c.work_id=$2) AND ($3::text IS NULL OR ($3='unfiled' AND c.folder_id IS NULL) OR c.folder_id::text=$3)
      ORDER BY updated_at DESC,c.created_at DESC,c.id DESC LIMIT $4 OFFSET $5`,[userId,query.workId??null,query.folderId??null,query.limit??50,query.offset??0]);
    const result=[];
    for(const row of rows){const view=await getView(userId,row.id);result.push({chat:view.chat,title:view.title,folderId:row.folder_id,updatedAt:new Date(row.updated_at).toISOString(),preview:view.messages.find(m=>m.id===view.chat.activeMessageId)?.content.slice(0,160)??'',coverUrl:null});}
    return result;
  }};
}
