import {test} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {openDatabase,migrateDatabase} from '../server/db/index.ts';
import {createApiHandler} from '../server/app.ts';
import {createNodeServer} from '../server/nodeServer.ts';
import {TestStreamService} from '../server/core/testAdapters.ts';
import {createUnavailableServices} from '../server/core/interfaces.ts';
import {createApiClient} from '../src/shared/apiClient.ts';
import {seedChat} from './helpers/db.ts';

test('real HTTP and SSE round trip preserves Korean chunks and request ID',async()=>{
 const db=await openDatabase();await migrateDatabase(db);const ids=await seedChat(db);
 const did=(await db.query('SELECT privy_did FROM users WHERE id=$1',[ids.userId])).rows[0].privy_did;
 const server=createNodeServer(createApiHandler({db,verifyToken:async()=>({privyDid:did}),stream:new TestStreamService(['안녕',' 반가워요'])}));
 server.listen(0,'127.0.0.1');await once(server,'listening');
 const baseUrl=`http://127.0.0.1:${server.address().port}`;
 try{
  const client=createApiClient({baseUrl,getAccessToken:async()=>'test-only'});
  const result=await client.request('/api/auth/session');assert.equal(result.data.id,ids.userId);
  const events=[];for await(const event of client.streamTurn(ids.chatId,{content:'안녕',parentMessageId:null,model:'basic'},{idempotencyKey:'network-1'}))events.push(event);
  assert.deepEqual(events.map(e=>e.type),['ready','delta','delta','done']);
  assert.equal(events.filter(e=>e.type==='delta').map(e=>e.text).join(''),'안녕 반가워요');
  assert.equal(new Set(events.map(e=>e.requestId)).size,1);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await db.close();}
});
test('unavailable injected service is a structured 503 before SSE headers',async()=>{
 const db=await openDatabase();await migrateDatabase(db);const ids=await seedChat(db);
 const did=(await db.query('SELECT privy_did FROM users WHERE id=$1',[ids.userId])).rows[0].privy_did;
 const handler=createApiHandler({db,verifyToken:async()=>({privyDid:did}),stream:createUnavailableServices().stream});
 try{
  const response=await handler(new Request(`http://local/api/chats/${ids.chatId}/turns`,{method:'POST',headers:{authorization:'Bearer test','content-type':'application/json','idempotency-key':'test'},body:JSON.stringify({content:'hi',parentMessageId:null,model:'basic'})}));
  assert.equal(response.status,503);assert.equal((await response.json()).error.code,'SERVICE_UNAVAILABLE');
 }finally{await db.close();}
});
