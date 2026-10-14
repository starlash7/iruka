import type {Database} from '../db/index.ts'
import type {CreateCreditsService, CreditsService} from '../core/interfaces.ts'
import type {CreditReservation} from '../../src/shared/contracts.ts'
import {ApiError} from '../core/errors.ts'
import {appendEntry,getOwnedTurn,lockAccount,readBalance,readTurnLedger,requireCredits,toSafeCredits,type LedgerRow} from './ledger.ts'

const conflict = () => new ApiError('CONFLICT','이미 처리된 요청이거나 크레딧이 부족해요.')
function reservation(turnId:string, rows:LedgerRow[]):CreditReservation {
 const reserve=rows.find(row=>row.kind==='reserve')
 if (!reserve) throw conflict()
 return {turnId,reserved:toSafeCredits(-BigInt(reserve.amount)),state:
  rows.some(row=>row.kind==='charge')?'completed':rows.some(row=>row.kind==='release')?'released':'reserved'}
}
export interface CreditHistoryEntry {
 id:string;sequence:string;kind:LedgerRow['kind'];amount:number;turnId:string|null;createdAt:string;
 verification:'unverified';
}
export interface CreditHistory {entries:CreditHistoryEntry[];nextCursor:string|null}
export interface TestCreditsService extends CreditsService {
 /** Trusted server policy only: never accept credits or grantKey from a browser. */
 grantFreeCredits(input:{userId:string;credits:number;grantKey:string}):Promise<void>;
 getHistory(userId:string,options?:{before?:string;limit?:number}):Promise<CreditHistory>;
}
export function createCreditsService({db}:{db:Database}):TestCreditsService {
 return {
  async getBalance(userId) {
   return db.transaction(async tx=>{await lockAccount(tx,userId);return readBalance(tx,userId)})
  },
  async grantFreeCredits({userId,credits,grantKey}) {
   requireCredits(credits)
   if (typeof grantKey!=='string'||!grantKey.trim()||grantKey.length>190) throw new ApiError('INVALID_REQUEST','지급 키를 확인해 주세요.')
   await db.transaction(async tx=>{
    await lockAccount(tx,userId)
    const key=`grant:${grantKey}`
    const {rows}=await tx.query<{amount:string}>("SELECT amount::text FROM credit_ledger WHERE user_id=$1 AND idempotency_key=$2 AND kind='grant'",[userId,key])
    if (rows[0]) {if(BigInt(rows[0].amount)!==BigInt(credits))throw conflict();return}
    const balance=await readBalance(tx,userId)
    toSafeCredits(BigInt(balance.available)+BigInt(balance.reserved)+BigInt(credits))
    await appendEntry(tx,{userId,kind:'grant',amount:credits,key})
   })
  },
  async reserveTurn({userId,turnId,credits}) {
   requireCredits(credits)
   return db.transaction(async tx=>{
    await lockAccount(tx,userId)
    const status=await getOwnedTurn(tx,userId,turnId)
    const rows=await readTurnLedger(tx,userId,turnId)
    if (rows.length) {const result=reservation(turnId,rows);if(result.reserved!==credits)throw conflict();return result}
    if (!['pending','running'].includes(status)) throw conflict()
    if ((await readBalance(tx,userId)).available<credits) throw conflict()
    await appendEntry(tx,{userId,turnId,kind:'reserve',amount:-credits,key:`turn:${turnId}:reserve`})
    return {turnId,reserved:credits,state:'reserved'}
   })
  },
  async completeTurn({userId,turnId,actualCredits}) {
   requireCredits(actualCredits,true)
   return db.transaction(async tx=>{
    await lockAccount(tx,userId)
    const status=await getOwnedTurn(tx,userId,turnId)
    const rows=await readTurnLedger(tx,userId,turnId), result=reservation(turnId,rows)
    if (result.state==='released'||actualCredits>result.reserved) throw conflict()
    const released=Number(rows.find(row=>row.kind==='release')?.amount??0)
    if (result.state==='completed') {if(result.reserved-released!==actualCredits)throw conflict();return result}
    if (status==='failed'||status==='aborted') throw conflict()
    await appendEntry(tx,{userId,turnId,kind:'charge',amount:0,key:`turn:${turnId}:charge`})
    if (actualCredits<result.reserved) await appendEntry(tx,{userId,turnId,kind:'release',amount:result.reserved-actualCredits,key:`turn:${turnId}:release:unused`})
    return {...result,state:'completed'}
   })
  },
  async releaseTurn({userId,turnId,reason}) {
   if (!['failed','cancelled'].includes(reason)) throw new ApiError('INVALID_REQUEST','복구 사유를 확인해 주세요.')
   return db.transaction(async tx=>{
    await lockAccount(tx,userId)
    const status=await getOwnedTurn(tx,userId,turnId)
    const rows=await readTurnLedger(tx,userId,turnId),result=reservation(turnId,rows)
    const key=`turn:${turnId}:release:${reason}`
    if (result.state==='completed') throw conflict()
    if (result.state==='released') {if(!rows.some(row=>row.idempotency_key===key))throw conflict();return result}
    if (status==='succeeded'||(status==='failed'&&reason!=='failed')||(status==='aborted'&&reason!=='cancelled')) throw conflict()
    await appendEntry(tx,{userId,turnId,kind:'release',amount:result.reserved,key})
    return {...result,state:'released'}
   })
  },
  async getHistory(userId,{before,limit=25}={}) {
   if (!Number.isInteger(limit)||limit<1||limit>100||
    (before!==undefined&&(!/^[1-9][0-9]{0,18}$/.test(before)||BigInt(before)>9223372036854775807n)))
    throw new ApiError('INVALID_REQUEST','내역 조회 범위를 확인해 주세요.')
   return db.transaction(async tx=>{
    await lockAccount(tx,userId)
    const {rows}=await tx.query<LedgerRow>(`SELECT id,seq::text,kind,amount::text,turn_request_id,idempotency_key,created_at::text
     FROM credit_ledger WHERE user_id=$1 AND ($2::bigint IS NULL OR seq<$2::bigint) ORDER BY seq DESC LIMIT $3`,[userId,before??null,limit+1])
    return {entries:rows.slice(0,limit).map(row=>({id:row.id,sequence:row.seq,kind:row.kind,amount:Number(row.amount),turnId:row.turn_request_id,
     createdAt:new Date(row.created_at).toISOString(),verification:'unverified' as const})),nextCursor:rows.length>limit?rows[limit-1].seq:null}
   })
  },
 }
}
// Compile-time check against the unmodified Wave 02 factory contract.
const checkFactory:CreateCreditsService=createCreditsService
void checkFactory
