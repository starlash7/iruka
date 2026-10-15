import test from 'node:test'
import assert from 'node:assert/strict'
import { beginTurnRequest, finishTurnRequest } from '../server/core/turnRequests.ts'
import { createTestDatabase, seedChat } from './helpers/db.ts'
const body = {content:'안녕',parentMessageId:null,model:'test'}
const hasCode = code => error => error.code === code

test('concurrent identical requests claim exactly one turn; changed payloads conflict', async () => {
 const db=await createTestDatabase()
 try {
  const ids=await seedChat(db), input={userId:ids.userId,chatId:ids.chatId,idempotencyKey:'same',body}
  const results=await Promise.all(Array.from({length:8},()=>beginTurnRequest(db,input)))
  assert.equal(results.filter(r=>r.state==='new').length,1)
  assert.equal(results.filter(r=>r.state==='in_progress').length,7)
  assert.equal(new Set(results.map(r=>r.turnId)).size,1)
  assert.equal(results[0].status,'pending')
  assert.equal(results[0].response,null)
  const reordered=await beginTurnRequest(db,{...input,body:{model:'test',parentMessageId:null,content:'안녕'}})
  assert.equal(reordered.turnId,results[0].turnId)
  for(const change of [{content:'다른 내용'},{model:'other'},{parentMessageId:'11111111-1111-4111-8111-111111111111'}]) {
   await assert.rejects(beginTurnRequest(db,{...input,body:{...body,...change}}),hasCode('CONFLICT'))
  }
  const otherChat=(await db.query('INSERT INTO chats(user_id,work_id,work_version_id) VALUES ($1,$2,$3) RETURNING id',[ids.userId,ids.workId,ids.versionId])).rows[0].id
  await assert.rejects(beginTurnRequest(db,{...input,chatId:otherChat}),hasCode('CONFLICT'))
 } finally {await db.close()}
})

test('success failure and abort replay stored results, reject terminal changes, allow new keys', async () => {
 const db=await createTestDatabase()
 try {
  const {userId,chatId}=await seedChat(db)
  for(const status of ['succeeded','failed','aborted']) {
   const input={userId,chatId,idempotencyKey:status,body}
   const begun=await beginTurnRequest(db,input)
   const response={outcome:status}
   const finished=await finishTurnRequest(db,{userId,turnId:begun.turnId,status,response})
   assert.equal(finished.status,status)
   assert.deepEqual(finished.response,response)
   const replay=await beginTurnRequest(db,input)
   assert.equal(replay.state,'replay')
   assert.deepEqual(replay.response,response)
   const again=await finishTurnRequest(db,{userId,turnId:begun.turnId,status,response:{ignored:true}})
   assert.deepEqual(again.response,response)
   await assert.rejects(finishTurnRequest(db,{userId,turnId:begun.turnId,status:status==='succeeded'?'failed':'succeeded',response:{}}),hasCode('CONFLICT'))
   const retry=await beginTurnRequest(db,{...input,idempotencyKey:status+'-retry'})
   assert.equal(retry.state,'new')
   assert.notEqual(retry.turnId,begun.turnId)
  }
 } finally {await db.close()}
})

test('turn begin and finish enforce user ownership without exposing another result', async () => {
 const db=await createTestDatabase()
 try {
  const {userId,chatId,workId,versionId}=await seedChat(db)
  const stranger=(await db.query("INSERT INTO users(privy_did) VALUES ('did:privy:stranger') RETURNING id")).rows[0].id
  const input={userId,chatId,idempotencyKey:'key',body}
  const mine=await beginTurnRequest(db,input)
  await assert.rejects(beginTurnRequest(db,{...input,userId:stranger}),hasCode('NOT_FOUND'))
  await assert.rejects(finishTurnRequest(db,{userId:stranger,turnId:mine.turnId,status:'failed',response:{}}),hasCode('NOT_FOUND'))
  await assert.rejects(beginTurnRequest(db,{...input,chatId:'11111111-1111-4111-8111-111111111111'}),hasCode('NOT_FOUND'))
  const theirs=(await db.query('INSERT INTO chats(user_id,work_id,work_version_id) VALUES ($1,$2,$3) RETURNING id',[stranger,workId,versionId])).rows[0].id
  assert.equal((await beginTurnRequest(db,{...input,userId:stranger,chatId:theirs})).state,'new')
 } finally {await db.close()}
})

test('concurrent terminal transitions persist one winner', async () => {
 const db=await createTestDatabase()
 try {
  const {userId,chatId}=await seedChat(db)
  const {turnId}=await beginTurnRequest(db,{userId,chatId,idempotencyKey:'race',body})
  const outcomes=await Promise.allSettled(['succeeded','aborted'].map(status=>finishTurnRequest(db,{userId,turnId,status,response:{status}})))
  assert.equal(outcomes.filter(item=>item.status==='fulfilled').length,1)
  assert.equal(outcomes.find(item=>item.status==='rejected').reason.code,'CONFLICT')
  const winner=outcomes.find(item=>item.status==='fulfilled').value
  const replay=await beginTurnRequest(db,{userId,chatId,idempotencyKey:'race',body})
  assert.equal(replay.status,winner.status)
  assert.deepEqual(replay.response,winner.response)
 } finally {await db.close()}
})
