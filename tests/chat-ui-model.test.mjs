import assert from 'node:assert/strict';
import {test} from 'node:test';
import {getMessageBranch, getSiblingMessages} from '../src/features/chat/messageTree.ts';
import {createReaderApi} from '../src/features/discover/readerApi.ts';
test('selected branch retains ancestors and siblings without mixing histories',()=>{
 const messages=[{id:'a',parentMessageId:null},{id:'b',parentMessageId:'a'},{id:'c',parentMessageId:'a'},{id:'d',parentMessageId:'c'}];
 assert.deepEqual(getMessageBranch(messages,'d').map(x=>x.id),['a','c','d']);
 assert.deepEqual(getSiblingMessages(messages,messages[1]).map(x=>x.id),['b','c']);
 assert.throws(()=>getMessageBranch([{id:'a',parentMessageId:'b'},{id:'b',parentMessageId:'a'}],'a'));
 assert.throws(()=>getMessageBranch(messages,'missing'));
});
test('real API errors remain errors; credentials refreshed for each request',async()=>{
 let calls=0;
 const api=createReaderApi({getAccessToken:async()=>{calls++;return 'token';},fetch:async(_url,init)=>{
  assert.equal(new Headers(init.headers).get('authorization'),'Bearer token');
  return Response.json({error:{code:'SERVICE_UNAVAILABLE',message:'준비 중'},requestId:'r'},{status:503});
 }});
 await assert.rejects(api.listWorks(),{code:'SERVICE_UNAVAILABLE'});
 await assert.rejects(api.getBalance(),{code:'SERVICE_UNAVAILABLE'});
 assert.equal(calls,2);
});
