import type {Database} from '../db/index.ts';
import type {CreditsService,StreamTurnInput} from '../core/interfaces.ts';
import type {ChatEvent,MessageDto} from '../../src/shared/contracts.ts';
import {beginTurnRequest,finishTurnRequest} from '../core/turnRequests.ts';
import {savePresentation} from './presentations.ts';
import {ApiError} from '../core/errors.ts';
import {loadChat,loadPath,assertIdle,insertMessage,selectLeaf} from './repository.ts';
export type EventPayload = ChatEvent extends infer E ? E extends ChatEvent ? Omit<E,'requestId'|'sequence'> : never : never;
export async function claimTurn(db:Database,credits:CreditsService,input:StreamTurnInput,reserve:number,leaseMs:number) {
  return db.transaction(async tx=>{
    await tx.query('SELECT id FROM users WHERE id=$1 FOR NO KEY UPDATE',[input.userId]);
    const state=await loadChat(tx,input.userId,input.chatId,true);
    const turn=await beginTurnRequest(tx,input);
    if(turn.state==='replay')return {...turn,...state,path:[] as MessageDto[]};
    if(turn.state==='in_progress')throw new ApiError('CONFLICT','같은 요청이 진행 중이에요.');
    await assertIdle(tx,input.chatId);
    const path=await loadPath(tx,input.chatId,state.chat.activeMessageId);
    const parent=input.body.parentMessageId,leaf=path.at(-1);
    // Regeneration selects the user parent of the active assistant; all other writes use the leaf.
    if(parent!==state.chat.activeMessageId&&!(leaf?.role==='assistant'&&leaf.parentMessageId===parent&&parent!==null))
      throw new ApiError('CONFLICT','현재 선택된 분기에서 다시 요청해 주세요.');
    const parentMessage=path.find(m=>m.id===parent);
    if(parentMessage?.role==='user'&&parentMessage.content!==input.body.content)
      throw new ApiError('CONFLICT','메시지 수정 기능을 사용해 주세요.');
    const selected=parent?path.slice(0,path.findIndex(m=>m.id===parent)+1):[];
    await credits.reserveTurn({userId:input.userId,turnId:turn.turnId,credits:reserve});
    await tx.query("UPDATE turn_requests SET status='running' WHERE id=$1",[turn.turnId]);
    await tx.query('INSERT INTO chat_turn_leases(turn_id,chat_id,expires_at) VALUES($1,$2,$3)',[turn.turnId,input.chatId,new Date(Date.now()+leaseMs)]);
    return {...turn,...state,path:selected};
  });
}
export async function settleTurn(db:Database,credits:CreditsService,input:{userId:string;chatId:string;turnId:string;status:'succeeded'|'failed'|'aborted';events:EventPayload[];content?:string;parentId?:string|null;reuseUser?:boolean;userContent?:string;actualCredits?:number;signal?:AbortSignal}) {
  return db.transaction(async tx=>{
    // Credit writers use account -> chat -> turn, including recovery.
    await tx.query('SELECT id FROM users WHERE id=$1 FOR NO KEY UPDATE',[input.userId]);
    await tx.query('SELECT id FROM chats WHERE id=$1 AND user_id=$2 FOR UPDATE',[input.chatId,input.userId]);
    const {rows}=await tx.query<{status:string;response:EventPayload[]}>('SELECT status,response FROM turn_requests WHERE id=$1 AND user_id=$2 FOR UPDATE',[input.turnId,input.userId]);
    if(!rows[0])throw new ApiError('NOT_FOUND','요청을 찾을 수 없어요.');
    if(!['running','pending'].includes(rows[0].status))return rows[0].response;
    if(input.status==='succeeded'){
      input.signal?.throwIfAborted();
      const lease=await tx.query('SELECT turn_id FROM chat_turn_leases WHERE turn_id=$1 AND expires_at>now()',[input.turnId]);
      if(!lease.rows.length)throw new ApiError('CONFLICT','대화 요청 시간이 만료되었어요.');
      const parentId=input.reuseUser?input.parentId!:(await insertMessage(tx,input.chatId,input.parentId??null,'user',input.userContent!)).id;
      const message=await insertMessage(tx,input.chatId,parentId,'assistant',input.content!);
      await selectLeaf(tx,input.chatId,message.id);
      await savePresentation(tx,message.id,input.events);
      await credits.completeTurn({userId:input.userId,turnId:input.turnId,actualCredits:input.actualCredits!});
      input.signal?.throwIfAborted();
      input.events.push({type:'done',turnId:input.turnId,status:'completed',messageId:message.id});
      const path=await loadPath(tx,input.chatId,message.id);
      if(path.filter(m=>m.role==='user').length%20===0)await tx.query('INSERT INTO chat_summary_jobs(chat_id,anchor_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[input.chatId,message.id]);
    }else{
      await credits.releaseTurn({userId:input.userId,turnId:input.turnId,reason:input.status==='aborted'?'cancelled':'failed'});
    }
    const result=await finishTurnRequest(tx,{userId:input.userId,turnId:input.turnId,status:input.status,response:input.events});
    await tx.query('DELETE FROM chat_turn_leases WHERE turn_id=$1',[input.turnId]);
    return result.response as EventPayload[];
  });
}
