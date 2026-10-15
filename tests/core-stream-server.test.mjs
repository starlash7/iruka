import assert from 'node:assert/strict';
import {test} from 'node:test';
import {once} from 'node:events';
import {request} from 'node:http';
import {createNodeServer} from '../server/nodeServer.ts';
import {createEventResponse} from '../server/core/sse.ts';
import {parseChatStream} from '../src/shared/stream.ts';
const input=()=>({userId:'u',chatId:'c',requestId:'r',idempotencyKey:'key',body:{content:'hi',parentMessageId:null,model:'test'},signal:new AbortController().signal});
const ready={type:'ready',requestId:'r',sequence:0,turnId:'t'};
const done={type:'done',requestId:'r',sequence:1,turnId:'t',status:'completed',messageId:null};
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
async function collect(response){const result=[];for await(const event of parseChatStream(response))result.push(event);return result;}

test('server rejects malformed provider payload and emits one valid terminal error',async()=>{
 for(const invalid of [{...ready,sequence:NaN},{...ready,sequence:0.5},{...ready,sequence:undefined},{...ready,turnId:42},{...ready,type:'unknown'}]){
  let cleaned=false;
  const response=await createEventResponse({async *streamTurn(){try{yield invalid;}finally{cleaned=true;}}},input());
  const events=await collect(response);
  assert.equal(events.length,1);assert.equal(events[0].type,'error');assert.equal(events[0].sequence,0);assert.equal(cleaned,true);
 }
});
test('rejecting iterator cleanup cannot append a second terminal or break response',async()=>{
 let calls=0;
 const service={streamTurn(){return {[Symbol.asyncIterator](){return {next:async()=>({done:false,value:done}),return:async()=>{calls++;throw new Error('cleanup failure');}};}};}};
 const events=await collect(await createEventResponse(service,input()));
 assert.deepEqual(events,[done]);assert.equal(calls,1);
});
test('browser response cancellation aborts provider signal during pending next and closes iterator', {timeout:2000},async()=>{
 const waiting=deferred(),cleaned=deferred();let providerSignal;
 const service={async *streamTurn({signal}){
  providerSignal=signal;
  try{yield ready;waiting.resolve();await new Promise(resolve=>signal.addEventListener('abort',resolve,{once:true}));yield done;}
  finally{cleaned.resolve();}
 }};
 const response=await createEventResponse(service,input());
 const reader=response.body.getReader();await reader.read();await waiting.promise;
 await reader.cancel('client cancelled');await cleaned.promise;
 assert.equal(providerSignal.aborted,true);assert.equal(providerSignal.reason,'client cancelled');
 reader.releaseLock();
});
test('upstream request abort reaches injected provider signal',async()=>{
 const controller=new AbortController();let signal;
 const service={async *streamTurn(value){signal=value.signal;yield ready;yield done;}};
 const response=await createEventResponse(service,{...input(),signal:controller.signal});
 controller.abort();assert.equal(signal.aborted,true);await response.body.cancel();
});
test('HTTP disconnect while handler is pending cancels the late response body',{timeout:2000},async()=>{
 const entered=deferred(),aborted=deferred(),release=deferred(),cancelled=deferred();
 const server=createNodeServer(async request=>{
  request.signal.addEventListener('abort',()=>aborted.resolve(),{once:true});entered.resolve();
  await release.promise;
  return new Response(new ReadableStream({cancel(){cancelled.resolve();}}));
 });
 server.listen(0,'127.0.0.1');await once(server,'listening');
 try{
  const req=request(`http://127.0.0.1:${server.address().port}/api/test`);req.on('error',()=>{});req.end();
  await entered.promise;req.destroy();await aborted.promise;release.resolve();await cancelled.promise;
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
test('server SSE projects only public event fields before serializing provider output',async()=>{
 const service={async *streamTurn(){
  yield {type:'delta',requestId:'r',sequence:0,text:'공개 응답',systemPrompt:'hidden prompt',privateConfig:{secret:'hidden configuration'}};
  yield {...done,internalTrace:'hidden trace'};
 }};
 const wire=await (await createEventResponse(service,input())).text();
 assert.match(wire,/공개 응답/);
 assert.doesNotMatch(wire,/systemPrompt|privateConfig|internalTrace|hidden/);
 const data=wire.split('\n').filter(line=>line.startsWith('data: ')).map(line=>JSON.parse(line.slice(6)));
 assert.deepEqual(data[0],{type:'delta',requestId:'r',sequence:0,text:'공개 응답'});
 assert.deepEqual(data[1],done);
});
