import assert from 'node:assert/strict';
import {test} from 'node:test';
import {request as httpRequest} from 'node:http';
import {once} from 'node:events';
import {createNodeServer} from '../server/nodeServer.ts';
import {createRequestGuard} from '../server/security/requestGuard.ts';
import {jsonResponse,errorResponse} from '../server/core/http.ts';

async function serve(handler,options,run){
 const server=createNodeServer(handler,options);server.listen(0,'127.0.0.1');await once(server,'listening');
 try{await run(`http://127.0.0.1:${server.address().port}`,server);}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}
test('HTTP rejects a foreign Origin and excessive declared body before handler side effects',async()=>{
 let calls=0;
 await serve(async()=>{calls++;return jsonResponse('ok','test');},{allowedOrigins:['http://127.0.0.1:5173']},async origin=>{
  const bad=await fetch(origin+'/api/test',{method:'POST',headers:{origin:'https://attacker.invalid'}});assert.equal(bad.status,403);assert.equal(calls,0);
  const status=await new Promise((resolve,reject)=>{const req=httpRequest(origin+'/api/test',{method:'POST',headers:{'content-length':5*1024*1024+1}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);req.end();});assert.equal(status,413);assert.equal(calls,0);
  assert.equal((await fetch(origin+'/api/test',{method:'POST',headers:{origin:'http://127.0.0.1:5173'}})).status,200);assert.equal(calls,1);
  assert.equal((await fetch(origin+'/api/test')).status,200);assert.equal(calls,2);
 });
});
test('rate limit uses the socket identity even when forwarded headers change',async()=>{
 let calls=0;await serve(async()=>{calls++;return jsonResponse('ok','test');},{limits:{requests:2}},async origin=>{
  for(let i=0;i<2;i++)assert.equal((await fetch(origin+'/api/test',{headers:{'x-forwarded-for':`192.0.2.${i}`}})).status,200);
  const blocked=await fetch(origin+'/api/test',{headers:{'x-forwarded-for':'198.51.100.1'}});assert.equal(blocked.status,429);assert.ok(Number(blocked.headers.get('retry-after'))>0);assert.equal(calls,2);
 });
});
test('concurrency admission blocks while the handler runs and releases after the response',async()=>{
 let release,entered;const waiting=new Promise(resolve=>entered=resolve),gate=new Promise(resolve=>release=resolve);
 await serve(async request=>{
  if(new URL(request.url).pathname==='/api/hold'){entered();await gate;}
  return jsonResponse('ok','test');
 },{limits:{concurrentTotal:1}},async origin=>{
  const controller=new AbortController();const held=fetch(origin+'/api/hold',{signal:controller.signal}).catch(()=>{});await waiting;
  assert.equal((await fetch(origin+'/api/test')).status,429);release();await held;
  assert.equal((await fetch(origin+'/api/test')).status,200);
 });
});
test('request guard expires counters, independently limits writes, and bounds client memory',()=>{
 let time=0;const guard=createRequestGuard({windowMs:1000,requests:5,writes:1,clients:1,concurrentPerClient:1},()=>time);
 const first=guard.acquire('one','POST');assert.equal(first.allowed,true);
 assert.equal(guard.acquire('one','GET').allowed,false);first.release();first.release();
 assert.equal(guard.acquire('one','POST').allowed,false);const read=guard.acquire('one','GET');assert.equal(read.allowed,true);read.release();
 assert.equal(guard.acquire('two','GET').allowed,false);time=1000;
 const second=guard.acquire('two','POST');assert.equal(second.allowed,true);second.release();
 assert.throws(()=>createRequestGuard({clients:0}));
});
test('JSON, error and bridge failure responses prevent caching/executable content and hide exceptions',async()=>{
 for(const response of [jsonResponse({ok:true},'r'),errorResponse(Error('SERVER_SECRET'),'r')]){
  assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.match(response.headers.get('content-security-policy'),/default-src 'none'/);assert.doesNotMatch(await response.text(),/SERVER_SECRET/);
 }
 await serve(async()=>{throw Error('SERVER_SECRET');},{},async(origin,server)=>{
  assert.equal(server.maxConnections,128);assert.equal(server.maxHeadersCount,64);assert.equal(server.requestTimeout,30000);assert.equal(server.headersTimeout,10000);
  const response=await fetch(origin+'/api/test');assert.equal(response.status,500);assert.equal(response.headers.get('cache-control'),'no-store');assert.doesNotMatch(await response.text(),/SERVER_SECRET/);
 });
});
