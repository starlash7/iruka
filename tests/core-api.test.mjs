import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase,migrateDatabase} from '../server/db/index.ts';
import {createApiHandler} from '../server/app.ts';
const db = await openDatabase();
await migrateDatabase(db);
const handler = createApiHandler({db,verifyToken:async token=>({privyDid:`did:privy:${token}`})});
const call = (path,token='alice',body,method=body?'POST':'GET')=>handler(new Request(`http://local/api${path}`,{method,headers:{...(token?{authorization:`Bearer ${token}`}:{ }),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined}));
let alice,bob,work,version,chat;
test('session upsert is stable and requires bearer',async()=>{
 assert.equal((await call('/auth/session',null)).status,401);
 alice=(await (await call('/auth/session')).json()).data;
 bob=(await (await call('/auth/session','bob')).json()).data;
 assert.equal((await (await call('/auth/session')).json()).data.id,alice.id);
 assert.notEqual(alice.id,bob.id);
});
test('personas are isolated and validate inputs',async()=>{
 assert.equal((await call('/me/personas','alice',{name:''})).status,400);
 const created=await call('/me/personas','alice',{name:'별',description:'여행자'});
 assert.equal(created.status,201);
 assert.equal((await (await call('/me/personas','alice')).json()).data.length,1);
 assert.equal((await (await call('/me/personas','bob')).json()).data.length,0);
});
test('public work response cannot leak private config; author route enforces ownership',async()=>{
 work=(await db.query("INSERT INTO works(owner_id,mode,title,visibility) VALUES($1,'character','테스트','public') RETURNING id",[alice.id])).rows[0].id;
 version=(await db.query("INSERT INTO work_versions(work_id,version,public_snapshot,private_config,published_at) VALUES($1,1,$2,$3,now()) RETURNING id",[work,JSON.stringify({tagline:'공개',systemPrompt:'injected-secret',openings:[{id:'start',title:'시작',prologue:'공개 프롤로그',firstMessage:'안녕',suggestedReplies:['반가워'],hiddenContext:'secret'}]}),JSON.stringify({systemPrompt:'secret',hiddenContext:'hidden'})])).rows[0].id;
 const publicResponse=await call(`/works/${work}`,null);
 assert.equal(publicResponse.status,200);
 const detail=(await publicResponse.json()).data;
 assert.equal(detail.snapshot.openings[0].prologue,'공개 프롤로그');
 assert.doesNotMatch(JSON.stringify(detail),/secret|hidden|systemPrompt/);
 assert.equal((await call(`/studio/works/${work}`,'bob')).status,404);
 const owned=await call(`/studio/works/${work}`,'alice');assert.equal(owned.status,200);
 assert.equal((await owned.json()).data.versions[0].publicSnapshot.tagline,'공개');
});
test('chat creation pins published version and refuses others personas',async()=>{
 const persona=(await (await call('/me/personas','alice')).json()).data[0];
 assert.equal((await call('/chats','bob',{workId:work,personaId:persona.id})).status,404);
 const response=await call('/chats','bob',{workId:work});
 assert.equal(response.status,201);
 chat=(await response.json()).data;
 assert.equal(chat.workVersionId,version);
 assert.equal((await call(`/chats/${chat.id}`,'alice')).status,404);
 assert.equal((await call(`/chats/${chat.id}`,'bob')).status,200);
});
test('stream checks owner and fails closed without service',async()=>{
 const request = token=>new Request(`http://local/api/chats/${chat.id}/turns`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json','idempotency-key':'request-12345678'},body:JSON.stringify({content:'안녕',parentMessageId:null,model:'basic'})});
 assert.equal((await handler(request('alice'))).status,404);
 assert.equal((await handler(request('bob'))).status,503);
});
test.after(()=>db.close());

test('injected discovery cannot leak private fields through the public list',async()=>{
 const api=createApiHandler({db,verifyToken:async()=>{throw Error('not public');},discovery:{listWorks:async()=>[{id:'work',creatorId:'author',mode:'story',title:'공개',description:'소개',tags:[],coverUrl:null,publishedVersionId:null,createdAt:'2026-10-14',private_config:{systemPrompt:'secret'}}],getWork:async()=>null}});
 const response=await api(new Request('http://local/api/works'));assert.equal(response.status,200);assert.doesNotMatch(await response.text(),/private_config|systemPrompt|secret/);
});
