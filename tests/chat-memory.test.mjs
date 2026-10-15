import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,collect} from './chat-fixture.mjs';
import {createMemoryService} from '../server/chat/memory.ts';
import {runSummaryJobs} from '../server/chat/summarize.ts';
import {createChatService} from '../server/chat/index.ts';
import {createConversationService} from '../server/chat/conversations.ts';
import {TestModelService} from '../server/core/testAdapters.ts';
import {createProduct} from '../server/product/index.ts';
const model=text=>new TestModelService([text],{inputTokens:1,outputTokens:1});
test('product maintenance recovers leases without implicitly running model summary jobs',async()=>{
 const f=await fixture();try{
  const service=createChatService({...f,model:model('answer')},f.options);
  const leaf=(await collect(service.streamTurn(f.input()))).at(-1).messageId;
  await createMemoryService(f.db,f.safety).enqueueSummary(f.user.id,f.chat.id,leaf);
  let calls=0;
  const options={db:f.db,verifyToken:async()=>({privyDid:'did:privy:test'}),safety:f.safety,model:{async *stream(){calls++;yield {type:'delta',text:'safe summary'};yield {type:'usage',inputTokens:1,outputTokens:1};}}};
  await createProduct(options).maintain();assert.equal(calls,0);
  assert.equal((await f.db.query('SELECT state FROM chat_summary_jobs')).rows[0].state,'queued');
  await createProduct({...options,runSummaries:true}).maintain();assert.equal(calls,1);
  assert.equal((await f.db.query('SELECT state FROM chat_summary_jobs')).rows[0].state,'done');
 }finally{await f.db.close();}
});
test('pinned notes enforce ownership, safety and update/delete',async()=>{
 const f=await fixture();try{
 const memory=createMemoryService(f.db,f.safety);
 const note=await memory.savePinned(f.user.id,f.chat.id,'Likes tea');assert.equal((await memory.listMemories(f.user.id,f.chat.id))[0].content,'Likes tea');
 await assert.rejects(memory.savePinned(f.other.id,f.chat.id,'bad'),{code:'NOT_FOUND'});
 await assert.rejects(memory.savePinned(f.user.id,f.chat.id,'UNSAFE'),{code:'FORBIDDEN'});
 await memory.savePinned(f.user.id,f.chat.id,'Likes coffee',note.id);assert.equal((await memory.listMemories(f.user.id,f.chat.id))[0].content,'Likes coffee');
 await memory.deletePinned(f.user.id,f.chat.id,note.id);assert.equal((await memory.listMemories(f.user.id,f.chat.id)).length,0);
 }finally{await f.db.close();}
});
test('summary worker is durable, deduplicated and never recalls sibling memory',async()=>{
 const f=await fixture();try{
 const service=createChatService({...f,model:model('first branch')},f.options),conv=createConversationService(f.db,f.safety),memory=createMemoryService(f.db,f.safety);
 const first=await collect(service.streamTurn(f.input()));const leaf=first.at(-1).messageId;
 await memory.enqueueSummary(f.user.id,f.chat.id,leaf);await memory.enqueueSummary(f.user.id,f.chat.id,leaf);
 assert.equal(await runSummaryJobs({db:f.db,model:model('SUMMARY_BRANCH_A'),safety:f.safety}),1);
 assert.equal(await runSummaryJobs({db:f.db,model:model('should not run'),safety:f.safety}),0);
 assert.equal((await memory.listMemories(f.user.id,f.chat.id)).length,1);
 const userId=(await conv.getChat(f.user.id,f.chat.id)).messages[0].id;
 await collect(service.streamTurn(f.input('regen','hello',userId)));
 assert.equal((await memory.listMemories(f.user.id,f.chat.id)).length,0);
 let prompt;const next=createChatService({...f,model:{async *stream({messages}){prompt=messages;yield {type:'delta',text:'next'};yield {type:'usage',inputTokens:1,outputTokens:1};}}},f.options);
 await collect(next.streamTurn(f.input('next','next',(await conv.getChat(f.user.id,f.chat.id)).chat.activeMessageId)));
 assert.ok(!JSON.stringify(prompt).includes('SUMMARY_BRANCH_A'));
 await conv.selectMessage(f.user.id,f.chat.id,leaf);assert.equal((await memory.listMemories(f.user.id,f.chat.id)).length,1);
 }finally{await f.db.close();}
});
test('failed summary can retry, deleted path is never summarized',async()=>{
 const f=await fixture();try{
 const service=createChatService({...f,model:model('answer')},f.options),memory=createMemoryService(f.db,f.safety),conv=createConversationService(f.db,f.safety);
 const leaf=(await collect(service.streamTurn(f.input()))).at(-1).messageId;await memory.enqueueSummary(f.user.id,f.chat.id,leaf);
 await runSummaryJobs({db:f.db,model:model('UNSAFE'),safety:f.safety});assert.equal((await memory.listMemories(f.user.id,f.chat.id)).length,0);
 await runSummaryJobs({db:f.db,model:model('safe summary'),safety:f.safety});assert.equal((await memory.listMemories(f.user.id,f.chat.id)).length,1);
 await conv.deleteMessage(f.user.id,f.chat.id,leaf);assert.equal((await memory.listMemories(f.user.id,f.chat.id)).length,0);
 }finally{await f.db.close();}
});
test('pinned memories remain included even after ten newer branch summaries',async()=>{
 const f=await fixture();try{
 const memory=createMemoryService(f.db,f.safety);await memory.savePinned(f.user.id,f.chat.id,'PINNED_IMPORTANT_FACT');
 const service=createChatService({...f,model:model('answer')},f.options);let parent=null;
 for(let i=0;i<10;i++){
  const events=await collect(service.streamTurn(f.input('turn'+i,'hello',parent)));parent=events.at(-1).messageId;
  await f.db.query("INSERT INTO chat_memories(chat_id,kind,anchor_id,content,created_at) VALUES($1,'summary',$2,'summary',now()+interval '1 hour')",[f.chat.id,parent]);
 }
 assert.ok((await memory.listMemories(f.user.id,f.chat.id)).some(m=>m.kind==='pinned'));
 let prompt;const next=createChatService({...f,model:{async *stream({messages}){prompt=messages;yield {type:'delta',text:'ok'};yield {type:'usage',inputTokens:1,outputTokens:1};}}},f.options);
 await collect(next.streamTurn(f.input('next','hello',parent)));assert.ok(JSON.stringify(prompt).includes('PINNED_IMPORTANT_FACT'));
 }finally{await f.db.close();}
});
