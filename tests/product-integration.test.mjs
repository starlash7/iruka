import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../server/db/index.ts';
import {migrateProductDatabase} from '../server/product/migrate.ts';
import {createProduct} from '../server/product/index.ts';
import {TestModelService} from '../server/core/testAdapters.ts';
import {createReaderApi} from '../src/features/discover/readerApi.ts';
import {makeDraft} from '../src/features/studio/draft.ts';
import {getLocalPolicy} from '../server/product/localPolicy.ts';

test('local model and grants are opt-in and forbidden in hosted production',()=>{
 assert.deepEqual(getLocalPolicy({}),{});
 assert.ok(getLocalPolicy({LOCAL_TEST_CHAT:'1'}).model);
 assert.throws(()=>getLocalPolicy({LOCAL_TEST_CHAT:'1',NODE_ENV:'production'}));
 assert.throws(()=>getLocalPolicy({LOCAL_TEST_CHAT:'1',VERCEL:'1'}));
});

test('real reader contract connects studio publication, chat, credits, branches and replay',async()=>{
 const db=await openDatabase();await migrateProductDatabase(db);
 const model=new TestModelService(['도서관 창가에서 이야기를 이어갑니다.'],{inputTokens:10,outputTokens:8});
 const product=createProduct({db,verifyToken:async token=>({privyDid:`did:privy:${token}`}),model,safety:{check:async()=>true},models:{test:{maxContextTokens:4000,maxOutputCharacters:4000,reservedCredits:1,actualCredits:()=>1}},testGrant:{amount:20,key:'integration'}});
 const request=async(path,method='GET',body,token='reader')=>product.handler(new Request(`http://local${path}`,{method,headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}));
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async(input,init)=>product.handler(new Request(new URL(String(input),'http://local'),init));
 try{
  const draft=makeDraft();draft.title='통합 작품';draft.privateConfig.systemPrompt='PRIVATE_PROMPT_SECRET';draft.publicSnapshot.openings=[{id:'first',title:'시작',prologue:'도서관',firstMessage:'어서 오세요',suggestedReplies:['안녕하세요']}];
  let response=await request('/api/studio/works','POST',draft);assert.equal(response.status,201);const saved=(await response.json()).data;
  response=await request(`/api/studio/works/${saved.work.id}/publish`,'POST',{revision:saved.revision});assert.equal(response.status,201);
  const api=createReaderApi({getAccessToken:async()=>'reader'});
  assert.equal((await api.listWorks())[0].title,draft.title);
  assert.equal((await api.getRanking()).length,0);
  assert.equal((await product.handler(new Request('http://local/api/chats'))).status,401);
  assert.equal((await api.getModels())[0].id,'test');
  assert.equal((await api.getBalance()).available,20);
  assert.equal((await api.getBalance()).available,20);
  const chat=await api.startChat({workId:saved.work.id,openingId:'first',personaId:null,model:'test'});assert.ok(chat.id);
  let view=await api.getChat(chat.id);assert.equal(view.messages.length,1);assert.doesNotMatch(JSON.stringify(view),/PRIVATE_PROMPT_SECRET/);
  const body={content:'안녕하세요',parentMessageId:view.chat.activeMessageId,model:'test'};
  const events=[];for await(const event of api.streamTurn(chat.id,body,{idempotencyKey:'turn-one'}))events.push(event);
  assert.equal(events.at(-1).status,'completed');assert.equal((await api.getBalance()).available,19);
  assert.equal((await api.getRanking())[0].id,saved.work.id);
  for await(const event of api.streamTurn(chat.id,body,{idempotencyKey:'turn-one'})){}
  assert.equal((await api.getBalance()).available,19);
  view=await api.getChat(chat.id);const user=view.messages.find(m=>m.role==='user');
  for await(const event of api.streamTurn(chat.id,{content:user.content,parentMessageId:user.id,model:'test'},{idempotencyKey:'regen'})){}
  view=await api.getChat(chat.id);const siblings=view.messages.filter(m=>m.parentMessageId===user.id);assert.equal(siblings.length,2);
  assert.equal((await api.selectBranch(chat.id,siblings[0].id)).chat.activeMessageId,siblings[0].id);
  const branch=await api.branchChat(chat.id,siblings[0].id);assert.notEqual(branch.chat.id,chat.id);
  await api.saveMemo(chat.id,'도서관을 기억해');assert.equal((await api.getChat(chat.id)).memo,'도서관을 기억해');
  await api.saveMemo(chat.id,'');assert.equal((await api.getChat(chat.id)).memo,'');
  assert.equal((await api.listChats()).length,2);
  assert.equal((await request(`/api/chats/${chat.id}/view`,'GET',undefined,'other')).status,404);
  const before=(await api.getBalance()).available;
  await api.editMessage(chat.id,user.id,'수정한 인사');assert.equal((await api.getBalance()).available,before);
  model.stream=async function*(){throw new Error('provider unavailable');};
  const failed=[];for await(const event of api.streamTurn(branch.chat.id,{content:'계속해 주세요',parentMessageId:branch.chat.activeMessageId,model:'test'},{idempotencyKey:'failure'}))failed.push(event);
  assert.equal(failed.at(-1).type,'error');assert.deepEqual(await api.getBalance(),{available:before,reserved:0});
  let release,started;const gate=new Promise(resolve=>release=resolve),began=new Promise(resolve=>started=resolve);
  model.stream=async function*(){started();await gate;yield {type:'delta',text:'늦은 응답'};yield {type:'usage',inputTokens:1,outputTokens:1};};
  const running=(async()=>{const events=[];for await(const event of api.streamTurn(branch.chat.id,{content:'다음 이야기',parentMessageId:branch.chat.activeMessageId,model:'test'},{idempotencyKey:'recover'}))events.push(event);return events;})();
  await began;
  assert.ok((await api.getChat(branch.chat.id)).pendingTurn);
  assert.equal((await api.getBalance()).reserved,1);
  await product.db.query("UPDATE chat_turn_leases SET expires_at=now()-interval '1 second'");
  await product.maintain();release();assert.equal((await running).at(-1).status,'cancelled');
  assert.equal((await api.getChat(branch.chat.id)).pendingTurn,null);
  assert.deepEqual(await api.getBalance(),{available:before,reserved:0});
 }finally{globalThis.fetch=originalFetch;await db.close();}
});
