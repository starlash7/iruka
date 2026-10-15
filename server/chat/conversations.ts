import {getPresentations} from './presentations.ts';
import {requireChatDatabase} from './database.ts';
import type {Database} from '../db/index.ts';
import {createChat} from '../core/chats.ts';
import {ApiError} from '../core/errors.ts';
import {requireText} from '../core/http.ts';
import {loadChat,loadPath,loadVersion,assertIdle,selectLeaf,insertMessage} from './repository.ts';
import {requireSafeText,type SafetyService} from './safety.ts';
export function createConversationService(db:Database,safety?:SafetyService) {
  requireChatDatabase(db);
  async function getChat(userId:string,chatId:string) {
    const {chat,openingId}=await loadChat(db,userId,chatId);
    const messages=await loadPath(db,chatId,chat.activeMessageId);
    return {chat,openingId,messages,presentations:await getPresentations(db,messages.map(m=>m.id))};
  }
  return {
    getChat,
    async startChat(userId:string,body:Record<string,unknown>) {
      return db.transaction(async tx=>{
        const chat=await createChat(tx,userId,body);await loadChat(tx,userId,chat.id,true);
        const version=await loadVersion(tx,chat.id),openingId=body.openingId??version.snapshot.openings?.[0]?.id??null;
        const opening=version.snapshot.openings?.find(o=>o.id===openingId);
        if(openingId&&!opening)throw new ApiError('INVALID_REQUEST','시작 상황을 확인해 주세요.');
        await tx.query('UPDATE chat_state SET opening_id=$2 WHERE chat_id=$1',[chat.id,openingId]);
        if(opening?.firstMessage){
          const text=opening.firstMessage.replaceAll('{{user}}',chat.personaSnapshot?.name??'사용자').replaceAll('{{char}}',version.snapshot.characters?.[0]?.name??'등장인물');
          await requireSafeText(safety,text,'output');
          const message=await insertMessage(tx,chat.id,null,'assistant',text);await selectLeaf(tx,chat.id,message.id);
        }
        return getChat(userId,chat.id);
      });
    },
    async selectMessage(userId:string,chatId:string,messageId:string) {
      return db.transaction(async tx=>{await loadChat(tx,userId,chatId,true);await assertIdle(tx,chatId);await loadPath(tx,chatId,messageId);await selectLeaf(tx,chatId,messageId);return getChat(userId,chatId);});
    },
    async editMessage(userId:string,chatId:string,messageId:string,content:string) {
      content=requireText(content,8000);await requireSafeText(safety,content,'input');
      return db.transaction(async tx=>{
        await loadChat(tx,userId,chatId,true);await assertIdle(tx,chatId);
        const source=(await loadPath(tx,chatId,messageId)).at(-1)!;
        if(source.role!=='user')throw new ApiError('INVALID_REQUEST','사용자 메시지만 수정할 수 있어요.');
        const message=await insertMessage(tx,chatId,source.parentMessageId,'user',content);await selectLeaf(tx,chatId,message.id);return getChat(userId,chatId);
      });
    },
    async deleteMessage(userId:string,chatId:string,messageId:string) {
      return db.transaction(async tx=>{
        const {chat}=await loadChat(tx,userId,chatId,true);await assertIdle(tx,chatId);
        const source=(await loadPath(tx,chatId,messageId)).at(-1)!;
        const active=await loadPath(tx,chatId,chat.activeMessageId);
        await tx.query(`WITH RECURSIVE descendants AS (SELECT id FROM messages WHERE id=$1 AND chat_id=$2
          UNION ALL SELECT m.id FROM messages m JOIN descendants d ON m.parent_id=d.id WHERE m.chat_id=$2)
          UPDATE messages SET deleted_at=now() WHERE id IN (SELECT id FROM descendants)`,[messageId,chatId]);
        if(active.some(m=>m.id===messageId))await selectLeaf(tx,chatId,source.parentMessageId);
        return getChat(userId,chatId);
      });
    },
    async branchChat(userId:string,chatId:string,messageId:string) {
      return db.transaction(async tx=>{
        const {openingId}=await loadChat(tx,userId,chatId,true);await assertIdle(tx,chatId);const path=await loadPath(tx,chatId,messageId);
        const {rows}=await tx.query<{id:string}>(`INSERT INTO chats(user_id,work_id,work_version_id,persona_id,persona_snapshot)
          SELECT user_id,work_id,work_version_id,persona_id,persona_snapshot FROM chats WHERE id=$1 AND user_id=$2 RETURNING id`,[chatId,userId]);
        const id=rows[0].id;await tx.query('INSERT INTO chat_state(chat_id,opening_id,branch_from_message_id) VALUES($1,$2,$3)',[id,openingId,messageId]);
        let parent:string|null=null;
        for(const message of path){
          parent=(await insertMessage(tx,id,parent,message.role,message.content)).id;
          await tx.query('INSERT INTO chat_message_presentations(message_id,images,statuses,endings) SELECT $1,images,statuses,endings FROM chat_message_presentations WHERE message_id=$2',[parent,message.id]);
        }
        await selectLeaf(tx,id,parent);
        await tx.query("INSERT INTO chat_memories(chat_id,kind,content) SELECT $1,kind,content FROM chat_memories WHERE chat_id=$2 AND kind='pinned'",[id,chatId]);
        return getChat(userId,id);
      });
    },
    async deleteChat(userId:string,chatId:string) {
      await db.transaction(async tx=>{await loadChat(tx,userId,chatId,true);await assertIdle(tx,chatId);await tx.query('UPDATE chat_state SET deleted_at=now() WHERE chat_id=$1',[chatId]);});
    },
    async getTurn(userId:string,chatId:string,turnId:string) {
      await loadChat(db,userId,chatId);
      const {rows}=await db.query<{id:string;status:string;response:unknown}>('SELECT id,status,response FROM turn_requests WHERE id=$1 AND user_id=$2 AND chat_id=$3',[turnId,userId,chatId]);
      if(!rows[0])throw new ApiError('NOT_FOUND','요청을 찾을 수 없어요.');
      return {turnId:rows[0].id,status:rows[0].status,response:rows[0].response};
    },
  };
}
