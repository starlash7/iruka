import type {Database} from '../db/index.ts'
import {ApiError} from '../core/errors.ts'

export interface LedgerRow {
 id: string; seq: string; kind: 'grant'|'reserve'|'charge'|'release'; amount: string;
 turn_request_id: string|null; idempotency_key: string; created_at: string;
}
export function requireCredits(value: number, allowZero = false): void {
 if (!Number.isSafeInteger(value) || value < (allowZero ? 0 : 1))
  throw new ApiError('INVALID_REQUEST', '크레딧은 유효한 정수여야 해요.')
}
export function toSafeCredits(value: string|bigint): number {
 const result=BigInt(value)
 if (result<0n || result>BigInt(Number.MAX_SAFE_INTEGER))
  throw new ApiError('CONFLICT', '크레딧 잔액 범위를 확인해 주세요.')
 return Number(result)
}
/** All credit writers acquire this row lock first, including when composed in an outer transaction. */
export async function lockAccount(db: Database, userId: string): Promise<void> {
 const {rows}=await db.query('SELECT id FROM users WHERE id=$1 FOR NO KEY UPDATE',[userId])
 if (!rows.length) throw new ApiError('NOT_FOUND','계정을 찾을 수 없어요.')
}
export async function getOwnedTurn(db: Database, userId: string, turnId: string): Promise<string> {
 const {rows}=await db.query<{status:string}>('SELECT status FROM turn_requests WHERE id=$1 AND user_id=$2 FOR NO KEY UPDATE',[turnId,userId])
 if (!rows.length) throw new ApiError('NOT_FOUND','요청을 찾을 수 없어요.')
 return rows[0].status
}
export async function readBalance(db: Database, userId: string) {
 const {rows}=await db.query<{available:string;reserved:string}>(`
  SELECT COALESCE(SUM(amount),0)::text AS available,
   COALESCE(SUM(-amount) FILTER (WHERE kind='reserve' AND NOT EXISTS (
    SELECT 1 FROM credit_ledger t WHERE t.turn_request_id=l.turn_request_id AND t.kind IN ('charge','release')
   )),0)::text AS reserved
  FROM credit_ledger l WHERE user_id=$1`,[userId])
 return {available:toSafeCredits(rows[0].available),reserved:toSafeCredits(rows[0].reserved)}
}
export async function readTurnLedger(db: Database, userId: string, turnId: string) {
 return (await db.query<LedgerRow>(`SELECT id,seq::text,kind,amount::text,turn_request_id,idempotency_key,created_at::text
  FROM credit_ledger WHERE user_id=$1 AND turn_request_id=$2 ORDER BY seq`,[userId,turnId])).rows
}
export async function appendEntry(db: Database, input: {
 userId:string;turnId?:string;kind:LedgerRow['kind'];amount:number;key:string
}) {
 await db.query(`INSERT INTO credit_ledger(user_id,turn_request_id,kind,amount,idempotency_key)
  VALUES($1,$2,$3,$4,$5)`,[input.userId,input.turnId??null,input.kind,input.amount,input.key])
}
