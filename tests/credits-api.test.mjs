import test from 'node:test'
import assert from 'node:assert/strict'
import {createTestDatabase} from './helpers/db.ts'
import {getOrCreateUser} from '../server/core/accounts.ts'
import {createCreditsService} from '../server/credits/index.ts'
import {createCreditsHandler} from '../server/credits/http.ts'
import {ApiError} from '../server/core/errors.ts'
test('credit HTTP authenticates, isolates history, paginates and exposes no grant endpoint',async()=>{
 const db=await createTestDatabase()
 try {
  const service=createCreditsService({db}), user=await getOrCreateUser(db,'did:privy:alice')
  const handler=createCreditsHandler({db,credits:service,verifyToken:async token=>{
   if(!['alice','bob'].includes(token))throw new ApiError('UNAUTHORIZED','로그인이 필요해요.')
   return {privyDid:`did:privy:${token}`}
  }})
  const call=(path,token='alice',method='GET')=>handler(new Request('http://local'+path,{method,headers:token?{authorization:`Bearer ${token}`}:{}}))
  for(const token of [null,'invalid']) assert.equal((await call('/api/credits/history',token)).status,401)
  for(let i=0;i<3;i++)await service.grantFreeCredits({userId:user.id,credits:1,grantKey:'test-'+i})
  const response=await call('/api/credits/history?limit=2')
  assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store')
  const first=await response.json()
  assert.equal(first.data.entries.length,2)
  assert.equal(first.data.entries[0].verification,'unverified')
  assert.ok(first.requestId)
  assert.doesNotMatch(JSON.stringify(first),/privy|user_id|idempotency_key|test-0/)
  const second=await (await call('/api/credits/history?limit=2&before='+first.data.nextCursor)).json()
  assert.equal(second.data.entries.length,1);assert.equal(second.data.nextCursor,null)
  assert.equal(new Set([...first.data.entries,...second.data.entries].map(e=>e.id)).size,3)
  assert.equal((await (await call('/api/credits/history?userId='+user.id,'bob')).json()).data.entries.length,0)
  assert.deepEqual((await (await call('/api/credits/balance')).json()).data,{available:3,reserved:0})
  for(const query of ['limit=0','limit=101','limit=1.5','limit=','before=-1','before=abc','before=9223372036854775808'])
   assert.equal((await call('/api/credits/history?'+query)).status,400)
  assert.equal((await call('/api/credits/grant','alice','POST')).status,404)
 } finally {await db.close()}
})
