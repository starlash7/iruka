import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {generateKeyPair,exportSPKI,SignJWT} from 'jose';
import {fixture,collect} from './chat-fixture.mjs';
import {createChatApiHandler} from '../api/chats/handler.ts';
import {createTokenVerifier} from '../server/core/auth.ts';
import {createNodeServer} from '../server/nodeServer.ts';
import {createChatService} from '../server/chat/index.ts';
import {TestModelService} from '../server/core/testAdapters.ts';
import {parseChatStream} from '../src/shared/stream.ts';
async function auth(){
 const {privateKey,publicKey}=await generateKeyPair('ES256');const verifyToken=createTokenVerifier({appId:'chat-test',verificationKey:await exportSPKI(publicKey)});
 const sign=did=>new SignJWT({}).setProtectedHeader({alg:'ES256'}).setSubject(did).setIssuer('privy.io').setAudience('chat-test').setIssuedAt().setExpirationTime('5m').sign(privateKey);
 return {verifyToken,token:await sign('did:privy:chat-test'),other:await sign('did:privy:other')};
}
test('authenticated HTTP starts, streams, restores presentation and enforces ownership',async()=>{
 const f=await fixture(),a=await auth();let server;
 try{
 const stream=createChatService({...f,model:new TestModelService(['안녕 {{img:PORT}}\n```status\ncalm\n``` {{ending:arrival}}'],{inputTokens:2,outputTokens:3})},{...f.options,assets:async()=>[{code:'PORT',url:'https://example.org/port.png',alt:'Port'}]});
 const handler=createChatApiHandler({...f,...a,stream});server=createNodeServer(handler);server.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;
 const req=(path,method='GET',body,token=a.token,extra={})=>fetch(base+path,{method,headers:{authorization:`Bearer ${token}`,'content-type':'application/json',...extra},...(body?{body:JSON.stringify(body)}:{})});
 assert.equal((await fetch(base+'/api/chats/'+f.chat.id)).status,401);
 const started=await req('/api/chats','POST',{workId:f.work.id,openingId:'port',userId:f.other.id});assert.equal(started.status,201);const view=(await started.json()).data;assert.equal(view.messages[0].content,'Hello 사용자');assert.equal(view.chat.userId,f.user.id);
 const url='/api/chats/'+view.chat.id;
 assert.equal((await req(url,'GET',undefined,a.other)).status,404);
 const response=await req(url+'/turns','POST',{content:'hello',model:'test',parentMessageId:view.chat.activeMessageId},a.token,{'idempotency-key':'http'});assert.equal(response.status,200);
 const events=await collect(parseChatStream(response));assert.equal(events.at(-1).status,'completed');assert.equal(events.filter(e=>e.type==='image').length,1);
 const restored=(await (await req(url)).json()).data;assert.equal(restored.messages.length,3);assert.equal(restored.presentations.at(-1).images[0].url,'https://example.org/port.png');
 const serialized=JSON.stringify(restored);for(const secret of ['private_config','systemPrompt','PRIVATE_SYSTEM','hiddenContext','PRIVATE_ENDING'])assert.ok(!serialized.includes(secret));
 const status=await req(url+'/turns/'+events[0].turnId);assert.equal((await status.json()).data.status,'succeeded');
 assert.equal((await req(url+'/turns','POST',{content:'hello',model:'test',parentMessageId:view.chat.activeMessageId},a.token,{'idempotency-key':'http'})).status,200);
 assert.equal((await req(url+'/turns','POST',{content:'changed',model:'test',parentMessageId:view.chat.activeMessageId},a.token,{'idempotency-key':'http'})).status,409);
 assert.equal((await req(url+'/memories','POST',{content:'Likes tea'})).status,201);
 assert.equal((await req(url,'DELETE')).status,200);assert.equal((await req(url)).status,404);
 }finally{server?.closeAllConnections();if(server)await new Promise(r=>server.close(r));await f.db.close();}
});
test('response cancellation aborts generation and releases reservation',async()=>{
 const f=await fixture(),a=await auth();try{
 let started;const began=new Promise(r=>started=r);
 const stream=createChatService({...f,model:{async *stream({signal}){started();await new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}));}}},f.options);
 const handler=createChatApiHandler({...f,...a,stream});
 const response=await handler(new Request('http://localhost/api/chats/'+f.chat.id+'/turns',{method:'POST',headers:{authorization:`Bearer ${a.token}`,'content-type':'application/json','idempotency-key':'abort'},body:JSON.stringify(f.input().body)}));
 const reader=response.body.getReader();await reader.read();await began;await reader.cancel();
 assert.deepEqual(f.calls,['reserve','release']);assert.equal((await f.db.query('SELECT status FROM turn_requests')).rows[0].status,'aborted');
 }finally{await f.db.close();}
});
test('TCP disconnect reaches runtime and leaves an aborted recoverable turn',async()=>{
 const f=await fixture(),a=await auth();let server;
 try{
 let started;const began=new Promise(r=>started=r);
 const stream=createChatService({...f,model:{async *stream({signal}){started();await new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}));}}},f.options);
 server=createNodeServer(createChatApiHandler({...f,...a,stream}));server.listen(0,'127.0.0.1');await once(server,'listening');
 const controller=new AbortController();
 const response=await fetch(`http://127.0.0.1:${server.address().port}/api/chats/${f.chat.id}/turns`,{method:'POST',signal:controller.signal,headers:{authorization:`Bearer ${a.token}`,'content-type':'application/json','idempotency-key':'tcp-abort'},body:JSON.stringify(f.input().body)});
 const reader=response.body.getReader();await reader.read();await began;controller.abort();await reader.cancel().catch(()=>{});
 let status;
 for(let i=0;i<100;i++){status=(await f.db.query('SELECT status FROM turn_requests')).rows[0].status;if(status==='aborted')break;await new Promise(r=>setTimeout(r,10));}
 assert.equal(status,'aborted');assert.deepEqual(f.calls,['reserve','release']);
 }finally{server?.closeAllConnections();if(server)await new Promise(r=>server.close(r));await f.db.close();}
});
