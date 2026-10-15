import test from 'node:test'
import assert from 'node:assert/strict'
import {createTestDatabase, seedChat} from './helpers/db.ts'
import {beginTurnRequest, finishTurnRequest} from '../server/core/turnRequests.ts'
import {createCreditsService} from '../server/credits/index.ts'
const code = value => error => error.code === value
async function fixture(fn) {
 const db=await createTestDatabase()
 try {
  const ids=await seedChat(db), service=createCreditsService({db})
  const turn=async key=>(await beginTurnRequest(db,{...ids,idempotencyKey:key,body:{content:'test',parentMessageId:null,model:'test'}})).turnId
  await fn({db,...ids,service,turn})
 } finally {await db.close()}
}
test('free grants are server-controlled, persistent, and payload-idempotent',()=>fixture(async({db,userId,service})=>{
 const input={userId,credits:20,grantKey:'test-policy:period-1'}
 await Promise.all(Array.from({length:10},()=>service.grantFreeCredits(input)))
 assert.deepEqual(await service.getBalance(userId),{available:20,reserved:0})
 await assert.rejects(service.grantFreeCredits({...input,credits:21}),code('CONFLICT'))
 assert.equal((await createCreditsService({db}).getHistory(userId)).entries.length,1)
 for(const credits of [0,-1,0.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])
  await assert.rejects(service.grantFreeCredits({...input,credits}),code('INVALID_REQUEST'))
}))
test('50 concurrent turns cannot overdraw; duplicate reservations charge only once',()=>fixture(async({userId,service,turn})=>{
 await service.grantFreeCredits({userId,credits:20,grantKey:'test'})
 const turns=await Promise.all(Array.from({length:50},(_,i)=>turn('request-'+i)))
 const results=await Promise.allSettled(turns.map(turnId=>service.reserveTurn({userId,turnId,credits:1})))
 assert.equal(results.filter(r=>r.status==='fulfilled').length,20)
 assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.code==='CONFLICT').length,30)
 assert.deepEqual(await service.getBalance(userId),{available:0,reserved:20})
 const turnId=results.find(r=>r.status==='fulfilled').value.turnId
 await Promise.all(Array.from({length:10},()=>service.reserveTurn({userId,turnId,credits:1})))
 await assert.rejects(service.reserveTurn({userId,turnId,credits:2}),code('CONFLICT'))
 assert.deepEqual(await service.getBalance(userId),{available:0,reserved:20})
}))
test('complete and release persist exact terminal payload and race to one winner',()=>fixture(async({userId,service,turn})=>{
 await service.grantFreeCredits({userId,credits:20,grantKey:'test'})
 const turnId=await turn('partial'), input={userId,turnId}
 await service.reserveTurn({...input,credits:10})
 assert.equal((await service.completeTurn({...input,actualCredits:3})).state,'completed')
 await service.completeTurn({...input,actualCredits:3})
 await assert.rejects(service.completeTurn({...input,actualCredits:4}),code('CONFLICT'))
 await assert.rejects(service.releaseTurn({...input,reason:'failed'}),code('CONFLICT'))
 assert.deepEqual(await service.getBalance(userId),{available:17,reserved:0})
 const second={userId,turnId:await turn('release')}
 await service.reserveTurn({...second,credits:5})
 await service.releaseTurn({...second,reason:'cancelled'})
 await service.releaseTurn({...second,reason:'cancelled'})
 await assert.rejects(service.releaseTurn({...second,reason:'failed'}),code('CONFLICT'))
 const race={userId,turnId:await turn('race')}
 await service.reserveTurn({...race,credits:5})
 const results=await Promise.allSettled([service.completeTurn({...race,actualCredits:5}),service.releaseTurn({...race,reason:'failed'})])
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1)
 assert.equal(results.find(r=>r.status==='rejected').reason.code,'CONFLICT')
 assert.equal((await service.getBalance(userId)).reserved,0)
}))
test('ownership, invalid costs, terminal turns, and atomic outer rollback',()=>fixture(async({db,userId,service,turn})=>{
 await service.grantFreeCredits({userId,credits:10,grantKey:'test'})
 const turnId=await turn('owned'), input={userId,turnId}
 const other=(await db.query("INSERT INTO users(privy_did) VALUES('did:privy:other') RETURNING id")).rows[0].id
 await assert.rejects(service.reserveTurn({...input,userId:other,credits:1}),code('NOT_FOUND'))
 assert.deepEqual(await service.getHistory(other),{entries:[],nextCursor:null})
 for(const credits of [0,-1,1.5,Infinity]) await assert.rejects(service.reserveTurn({...input,credits}),code('INVALID_REQUEST'))
 await service.reserveTurn({...input,credits:5})
 await assert.rejects(service.completeTurn({...input,actualCredits:6}),code('CONFLICT'))
 await assert.rejects(db.transaction(async tx=>{
  await createCreditsService({db:tx}).completeTurn({...input,actualCredits:2})
  await finishTurnRequest(tx,{...input,status:'succeeded',response:{}})
  throw new Error('rollback')
 }),/rollback/)
 assert.deepEqual(await service.getBalance(userId),{available:5,reserved:5})
 assert.equal((await db.query('SELECT status FROM turn_requests WHERE id=$1',[turnId])).rows[0].status,'pending')
 await service.completeTurn({...input,actualCredits:0})
 assert.deepEqual(await service.getBalance(userId),{available:10,reserved:0})
 const ended={userId,turnId:await turn('ended')}
 await finishTurnRequest(db,{...ended,status:'failed',response:{}})
 await assert.rejects(service.reserveTurn({...ended,credits:1}),code('CONFLICT'))
}))
