import type {Database} from '../db/index.ts';
import type {CreditsService} from '../core/interfaces.ts';
import {requireChatDatabase} from './database.ts';
import {settleTurn} from './turnLifecycle.ts';
/** Invoke from a trusted worker, never from an unauthenticated cron HTTP endpoint. */
export async function recoverExpiredTurns(db:Database,credits:CreditsService):Promise<number> {
  requireChatDatabase(db);
  const {rows}=await db.query<{turn_id:string;chat_id:string;user_id:string}>(`SELECT l.turn_id,l.chat_id,t.user_id FROM chat_turn_leases l JOIN turn_requests t ON t.id=l.turn_id WHERE l.expires_at<=now() ORDER BY l.expires_at LIMIT 100`);
  for(const row of rows)await settleTurn(db,credits,{userId:row.user_id,chatId:row.chat_id,turnId:row.turn_id,status:'aborted',events:[{type:'done',turnId:row.turn_id,status:'cancelled',messageId:null}]});
  return rows.length;
}
