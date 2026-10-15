import type {Database} from '../db/index.ts';
import {ApiError} from '../core/errors.ts';
import {requireText} from '../core/http.ts';
import {loadChat,loadPath,assertIdle} from './repository.ts';
import {requireSafeText,type SafetyService} from './safety.ts';
export interface MemoryDto {id:string;kind:'pinned'|'summary';content:string;anchorId:string|null;createdAt:string}
type MemoryRow={id:string;kind:'pinned'|'summary';content:string;anchor_id:string|null;created_at:Date};
const mapMemory=(row:MemoryRow):MemoryDto=>({id:row.id,kind:row.kind,content:row.content,anchorId:row.anchor_id,createdAt:new Date(row.created_at).toISOString()});
export function createMemoryService(db:Database,safety?:SafetyService) {
  return {
    async listMemories(userId:string,chatId:string):Promise<MemoryDto[]> {
      const {chat}=await loadChat(db,userId,chatId);const path=await loadPath(db,chatId,chat.activeMessageId);
      const {rows}=await db.query<MemoryRow>(`SELECT * FROM chat_memories WHERE chat_id=$1 AND (kind='pinned' OR anchor_id=ANY($2::uuid[])) ORDER BY (kind='pinned') DESC,created_at DESC LIMIT 10`,[chatId,path.map(m=>m.id)]);return rows.map(mapMemory);
    },
    async savePinned(userId:string,chatId:string,content:string,id?:string):Promise<MemoryDto> {
      return db.transaction(async tx=>{
        await loadChat(tx,userId,chatId,true);await assertIdle(tx,chatId);
        content=requireText(content,4000);await requireSafeText(safety,content,'input');
        if(id){
          const {rows}=await tx.query<MemoryRow>("UPDATE chat_memories SET content=$3 WHERE id=$1 AND chat_id=$2 AND kind='pinned' RETURNING *",[id,chatId,content]);
          if(!rows[0])throw new ApiError('NOT_FOUND','메모를 찾을 수 없어요.');return mapMemory(rows[0]);
        }
        const count=await tx.query("SELECT id FROM chat_memories WHERE chat_id=$1 AND kind='pinned'",[chatId]);
        if(count.rows.length>=5)throw new ApiError('INVALID_REQUEST','고정 메모는 5개까지 저장할 수 있어요.');
        const {rows}=await tx.query<MemoryRow>("INSERT INTO chat_memories(chat_id,kind,content) VALUES($1,'pinned',$2) RETURNING *",[chatId,content]);return mapMemory(rows[0]);
      });
    },
    async deletePinned(userId:string,chatId:string,id:string) {
      await db.transaction(async tx=>{
        await loadChat(tx,userId,chatId,true);await assertIdle(tx,chatId);
        const {rows}=await tx.query("DELETE FROM chat_memories WHERE id=$1 AND chat_id=$2 AND kind='pinned' RETURNING id",[id,chatId]);
        if(!rows[0])throw new ApiError('NOT_FOUND','메모를 찾을 수 없어요.');
      });
    },
    async enqueueSummary(userId:string,chatId:string,anchorId:string) {
      return db.transaction(async tx=>{
        const {chat}=await loadChat(tx,userId,chatId,true);const path=await loadPath(tx,chatId,chat.activeMessageId);
        if(!path.some(m=>m.id===anchorId))throw new ApiError('NOT_FOUND','현재 분기의 메시지가 아니에요.');
        const {rows}=await tx.query<{id:string}>('INSERT INTO chat_summary_jobs(chat_id,anchor_id) VALUES($1,$2) ON CONFLICT(chat_id,anchor_id) DO UPDATE SET anchor_id=EXCLUDED.anchor_id RETURNING id',[chatId,anchorId]);
        return {jobId:rows[0].id};
      });
    },
  };
}
