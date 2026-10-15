import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,collect} from './chat-fixture.mjs';
import {TestModelService} from '../server/core/testAdapters.ts';
import {createChatService} from '../server/chat/index.ts';
import {createConversationService} from '../server/chat/conversations.ts';
import {recoverExpiredTurns} from '../server/chat/recovery.ts';
const model=()=>new TestModelService(['Hello {{user}} {{img:NO}}','\n```status\ncalm\n``` {{ending:arrival}}'],{inputTokens:10,outputTokens:5});
test('successful turn settles and replays persisted safe events without model/credit calls',async()=>{
 const f=await fixture();try{
 let generations=0;const service=createChatService({...f,model:{async *stream(input){generations++;yield* model().stream(input);}}},f.options);
 const events=await collect(service.streamTurn(f.input()));assert.equal(events.at(-1).status,'completed');assert.equal(generations,1);assert.deepEqual(f.calls,['reserve','complete']);
 const replay=await collect(service.streamTurn({...f.input(),requestId:'replay'}));assert.equal(replay.at(-1).messageId,events.at(-1).messageId);assert.equal(generations,1);assert.equal(replay[0].requestId,'replay');
 assert.ok(!JSON.stringify(events).includes('PRIVATE'));assert.ok(!JSON.stringify(events).includes('{{'));
 await assert.rejects(collect(service.streamTurn(f.input('one','changed'))),{code:'CONFLICT'});
 await assert.rejects(collect(service.streamTurn({...f.input(),userId:f.other.id})),{code:'NOT_FOUND'});
 const view=await createConversationService(f.db,f.safety).getChat(f.user.id,f.chat.id);assert.equal(view.messages.length,2);assert.equal(view.chat.activeMessageId,events.at(-1).messageId);
 }finally{await f.db.close();}
});
test('regenerate produces siblings; prompts, edits, branches and delete use only selected path',async()=>{
 const f=await fixture();try{
 const prompts=[];let n=0;const service=createChatService({...f,model:{async *stream({messages}){prompts.push(messages);yield {type:'delta',text:`answer-${++n}`};yield {type:'usage',inputTokens:1,outputTokens:1};}}},f.options);
 const conv=createConversationService(f.db,f.safety);
 const first=await collect(service.streamTurn(f.input()));let view=await conv.getChat(f.user.id,f.chat.id);const userId=view.messages[0].id;
 const second=await collect(service.streamTurn(f.input('regen','hello',userId)));assert.notEqual(second.at(-1).messageId,first.at(-1).messageId);
 await collect(service.streamTurn(f.input('next','next',second.at(-1).messageId)));assert.ok(!JSON.stringify(prompts.at(-1)).includes('answer-1'));assert.ok(JSON.stringify(prompts.at(-1)).includes('answer-2'));
 const branch=await conv.branchChat(f.user.id,f.chat.id,second.at(-1).messageId);assert.equal(branch.messages.length,2);
 const edited=await conv.editMessage(f.user.id,f.chat.id,userId,'changed');assert.equal(edited.messages.at(-1).content,'changed');assert.equal(edited.messages.length,1);
 await conv.deleteMessage(f.user.id,f.chat.id,edited.messages[0].id);assert.equal((await conv.getChat(f.user.id,f.chat.id)).messages.length,0);
 await assert.rejects(conv.selectMessage(f.other.id,f.chat.id,first.at(-1).messageId),{code:'NOT_FOUND'});
 }finally{await f.db.close();}
});
test('failure, private output and abort release; no partial output persisted',async()=>{
 for(const mode of ['failure','private','unsafe','abort']){
 const f=await fixture();try{
 const controller=new AbortController();const service=createChatService({...f,model:{async *stream(){yield {type:'delta',text:'partial'};if(mode==='failure')throw Error('PRIVATE_STACK');if(mode==='abort')controller.abort();yield {type:'delta',text:mode==='private'?f.config.systemPrompt:'UNSAFE'};yield {type:'usage',inputTokens:1,outputTokens:1};}}},f.options);
 const events=await collect(service.streamTurn({...f.input(),signal:controller.signal}));assert.equal(events.at(-1).type,mode==='abort'?'done':'error');assert.equal(events.filter(e=>e.type==='delta').length,0);assert.deepEqual(f.calls,['reserve','release']);assert.equal((await f.db.query('SELECT * FROM messages')).rows.length,0);
 }finally{await f.db.close();}}
});
test('concurrent duplicate never re-invokes model; different key on busy chat conflicts',async()=>{
 const f=await fixture();try{
 let resume,started;const began=new Promise(r=>started=r);const gate=new Promise(r=>resume=r);let count=0;
 const service=createChatService({...f,model:{async *stream(){count++;started();await gate;yield {type:'delta',text:'ok'};yield {type:'usage',inputTokens:1,outputTokens:1};}}},f.options);
 const running=collect(service.streamTurn(f.input()));await began;
 await assert.rejects(collect(service.streamTurn(f.input())),{code:'CONFLICT'});
 await assert.rejects(collect(service.streamTurn(f.input('other'))),{code:'CONFLICT'});assert.equal(count,1);
 resume();assert.equal((await running).at(-1).status,'completed');
 }finally{await f.db.close();}
});
test('expired lease recovery refunds and prevents late completion',async()=>{
 const f=await fixture();try{
 let resume,started;const began=new Promise(r=>started=r),gate=new Promise(r=>resume=r);
 const service=createChatService({...f,model:{async *stream(){started();await gate;yield {type:'delta',text:'late'};yield {type:'usage',inputTokens:1,outputTokens:1};}}},f.options);
 const running=collect(service.streamTurn(f.input()));await began;
 await f.db.query("UPDATE chat_turn_leases SET expires_at=now()-interval '1 second'");
 assert.equal(await recoverExpiredTurns(f.db,f.credits),1);resume();const result=await running;assert.equal(result.at(-1).status,'cancelled');assert.equal((await f.db.query('SELECT * FROM messages')).rows.length,0);assert.deepEqual(f.calls,['reserve','release']);
 }finally{await f.db.close();}
});
test('credit completion failure rolls back messages and releases reservation',async()=>{
 const f=await fixture();try{
 const credits={...f.credits,async completeTurn(input){await f.credits.completeTurn(input);throw Error('settlement failed');}};
 const service=createChatService({...f,credits,model:model()},f.options);assert.equal((await collect(service.streamTurn(f.input()))).at(-1).type,'error');
 assert.equal((await f.db.query("SELECT * FROM credit_ledger WHERE kind='charge'")).rows.length,0);assert.equal((await f.db.query('SELECT * FROM messages')).rows.length,0);assert.equal((await f.db.query("SELECT * FROM credit_ledger WHERE kind='release'")).rows.length,1);
 }finally{await f.db.close();}
});
test('cancellation inside credit finalization rolls back success and restores credits',async()=>{
 const f=await fixture();try{
 const controller=new AbortController(),credits={...f.credits,async completeTurn(input){const result=await f.credits.completeTurn(input);controller.abort();return result;}};
 const service=createChatService({...f,credits,model:model()},f.options);
 assert.equal((await collect(service.streamTurn({...f.input(),signal:controller.signal}))).at(-1).status,'cancelled');
 assert.equal((await f.db.query('SELECT * FROM messages')).rows.length,0);
 assert.equal((await f.db.query("SELECT * FROM credit_ledger WHERE kind='charge'")).rows.length,0);
 assert.equal((await f.db.query("SELECT * FROM credit_ledger WHERE kind='release'")).rows.length,1);
 }finally{await f.db.close();}
});
test('abandoning ready event cancels; timeout handles a model ignoring AbortSignal',async()=>{
 const f=await fixture();try{
 const service=createChatService({...f,model:{async *stream(){await new Promise(()=>{});}}},{...f.options,generationMilliseconds:20,leaseMilliseconds:100});
 const iterator=service.streamTurn(f.input())[Symbol.asyncIterator]();assert.equal((await iterator.next()).value.type,'ready');await iterator.return();
 assert.deepEqual(f.calls,['reserve','release']);
 const result=await collect(service.streamTurn(f.input('timeout')));assert.equal(result.at(-1).type,'error');assert.deepEqual(f.calls,['reserve','release','reserve','release']);
 }finally{await f.db.close();}
});
test('reserve failure rolls back claim; missing policy/input rejection never reserve',async()=>{
 const f=await fixture();try{
 const credits={...f.credits,async reserveTurn(){throw Error('not enough credits');}};
 await assert.rejects(collect(createChatService({...f,credits,model:model()},f.options).streamTurn(f.input())));
 assert.equal((await f.db.query('SELECT * FROM turn_requests')).rows.length,0);
 await assert.rejects(collect(createChatService({...f,model:model()}).streamTurn(f.input())),{code:'SERVICE_UNAVAILABLE'});
 await assert.rejects(collect(createChatService({...f,model:model()},f.options).streamTurn(f.input('unsafe','UNSAFE'))),{code:'FORBIDDEN'});
 assert.deepEqual(f.calls,[]);
 }finally{await f.db.close();}
});
test('failed release remains recoverable; expired worker retries without duplicate model invocation',async()=>{
 const f=await fixture();try{
 let releaseFails=true;const credits={...f.credits,async releaseTurn(input){if(releaseFails)throw Error('temporarily unavailable');return f.credits.releaseTurn(input);}};
 const service=createChatService({...f,credits,model:{async *stream(){throw Error('model failed');}}},f.options);
 await assert.rejects(collect(service.streamTurn(f.input())));assert.equal((await f.db.query('SELECT status FROM turn_requests')).rows[0].status,'running');
 releaseFails=false;await f.db.query("UPDATE chat_turn_leases SET expires_at=now()-interval '1 second'");
 assert.equal(await recoverExpiredTurns(f.db,credits),1);assert.equal(await recoverExpiredTurns(f.db,credits),0);
 const events=await collect(service.streamTurn(f.input()));assert.equal(events.at(-1).status,'cancelled');assert.deepEqual(f.calls,['reserve','release']);
 }finally{await f.db.close();}
});
test('private author settings cannot be echoed even across model chunks',async()=>{
 const privateFields={outputRules:'SECRET_AUTHOR_OUTPUT_RULE_82741',statusTemplate:'SECRET_STATUS_TEMPLATE_82741',characterSettings:[{characterId:'sol',description:'SECRET_CHARACTER_DESCRIPTION_82741',speechStyle:'SECRET_SPEECH_STYLE_82741'}],examples:[{user:'SECRET_EXAMPLE_USER_82741',assistant:'SECRET_EXAMPLE_ASSISTANT_82741'}],lorebook:[{id:'lore',keywords:[],content:'SECRET_LORE_CONTENT_82741',hidden:false,priority:1,alwaysOn:true}]};
 const f=await fixture(privateFields);try{
 const secrets=[privateFields.outputRules,privateFields.statusTemplate,...privateFields.characterSettings.flatMap(c=>[c.description,c.speechStyle]),...privateFields.examples.flatMap(e=>[e.user,e.assistant]),privateFields.lorebook[0].content];
 for(const [i,secret]of secrets.entries()){
  const service=createChatService({...f,model:new TestModelService([secret.slice(0,10),secret.slice(10)],{inputTokens:2,outputTokens:2})},f.options);
  const events=await collect(service.streamTurn(f.input('private'+i)));assert.equal(events.at(-1).type,'error');assert.ok(!JSON.stringify(events).includes(secret));
 }
 assert.equal((await f.db.query('SELECT * FROM messages')).rows.length,0);
 }finally{await f.db.close();}
});
test('missing model usage fails closed instead of reporting zero-token success',async()=>{
 const f=await fixture();try{
 const service=createChatService({...f,model:{async *stream(){yield {type:'delta',text:'unmetered'};}}},f.options);
 const events=await collect(service.streamTurn(f.input()));assert.equal(events.at(-1).type,'error');assert.deepEqual(f.calls,['reserve','release']);
 }finally{await f.db.close();}
});
