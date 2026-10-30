import {randomUUID} from 'node:crypto'
import type {Database} from '../db/index.ts'
import {authenticateRequest,type TokenVerifier} from '../core/auth.ts'
import {getOrCreateUser} from '../core/accounts.ts'
import {ApiError} from '../core/errors.ts'
import {jsonResponse,errorResponse} from '../core/http.ts'
import type {TestCreditsService} from './index.ts'

/** Integration owner mounts this handler for /api/credits/*; authentication is never optional. */
export function createCreditsHandler({db,verifyToken,credits}:{db:Database;verifyToken:TokenVerifier;credits:TestCreditsService}) {
 return async(request:Request):Promise<Response>=>{
  const requestId=randomUUID()
  try {
   const identity=await authenticateRequest(request,verifyToken)
   const user=await getOrCreateUser(db,identity.privyDid)
   const url=new URL(request.url)
   if(request.method==='GET'&&url.pathname==='/api/credits/balance')
    return jsonResponse(await credits.getBalance(user.id),requestId)
   if(request.method==='GET'&&url.pathname==='/api/credits/history') {
    const limit=url.searchParams.get('limit')
    return jsonResponse(await credits.getHistory(user.id,{before:url.searchParams.get('before')??undefined,limit:limit===null?25:Number(limit)}),requestId)
   }
   throw new ApiError('NOT_FOUND','경로를 찾을 수 없어요.')
  } catch(error) {return errorResponse(error,requestId)}
 }
}
