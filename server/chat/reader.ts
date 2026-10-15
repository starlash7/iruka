import type {Database} from '../db/index.ts';
import {loadChat,mapMessage,type MessageRow} from './repository.ts';
import {getPresentations} from './presentations.ts';
import {projectPublicSnapshot} from '../core/publicSnapshot.ts';
import {createMemoryService} from './memory.ts';
import type {SafetyService} from './safety.ts';

/** Projects only public fields from the version pinned to this conversation. */
export function createReaderService(db:Database,safety?:SafetyService) {
  async function getView(userId:string,chatId:string) {
    const {chat,openingId}=await loadChat(db,userId,chatId);
    const {rows}=await db.query<{title:string;public_snapshot:Record<string,unknown>}>(
      `SELECT COALESCE(v.private_config->'workMetadata'->>'title',w.title) AS title,v.public_snapshot
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
  return {getView,async listChats(userId:string) {
    const {rows}=await db.query<{id:string}>(`SELECT c.id FROM chats c LEFT JOIN chat_state s ON s.chat_id=c.id
      WHERE c.user_id=$1 AND s.deleted_at IS NULL ORDER BY c.created_at DESC LIMIT 100`,[userId]);
    const result=[];
    for(const row of rows){const view=await getView(userId,row.id);result.push({chat:view.chat,title:view.title,preview:view.messages.find(m=>m.id===view.chat.activeMessageId)?.content.slice(0,160)??'',coverUrl:null});}
    return result;
  }};
}
