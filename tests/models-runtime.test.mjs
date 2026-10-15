import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './chat-fixture.mjs';
import {createCreditsService} from '../server/credits/index.ts';
import {createChatService} from '../server/chat/index.ts';
import {createConversationService} from '../server/chat/conversations.ts';
import {createMemoryService} from '../server/chat/memory.ts';
import {createOpenAIRuntime} from '../server/models/index.ts';
import {eventsFor,responseFor,options,collect} from './models-fixtures/responses.mjs';
const turn=(f,key='one',content='hello',parentMessageId=null)=>({...f.input(key,content,parentMessageId),body:{content,parentMessageId,model:'gpt-5.4-mini'}});
async function funded(f){const credits=createCreditsService({db:f.db});await credits.grantFreeCredits({userId:f.user.id,credits:20,grantKey:'fixture'});return credits;}

test('real ledger settles provider usage once; full prompt and selected branch survive adapter',async()=>{
 const f=await fixture({characterSettings:[{characterId:'sol',description:'CHARACTER_PRIVATE_FACT',speechStyle:'PRIVATE_SPEECH_STYLE'}],lorebook:[{id:'harbor',keywords:['harbor'],content:'LORE_PRIVATE_FACT',hidden:true,priority:1,alwaysOn:false}]});
 try{
 const credits=await funded(f),requests=[];
 const runtime=createOpenAIRuntime(options(async(_,init)=>{requests.push(JSON.parse(init.body));return responseFor(eventsFor('reply-'+requests.length));}));
 const conv=createConversationService(f.db,runtime.safety),memory=createMemoryService(f.db,runtime.safety);
 const persona=(await f.db.query('INSERT INTO personas(user_id,name,profile) VALUES($1,$2,$3) RETURNING id',[f.user.id,'Kai',JSON.stringify({description:'PERSONA_FACT'})])).rows[0];
 const view=await conv.startChat(f.user.id,{workId:f.work.id,personaId:persona.id,openingId:'port'});
 const chatId=view.chat.id;await memory.savePinned(f.user.id,chatId,'PINNED_MEMORY_FACT');
 const service=createChatService({db:f.db,credits,model:runtime.model},runtime);
 const request={...turn(f,'one','harbor',view.chat.activeMessageId),chatId};
 const first=await collect(service.streamTurn(request));assert.equal(first.at(-1).status,'completed');
 assert.deepEqual(first.find(e=>e.type==='usage'),{type:'usage',inputTokens:40,outputTokens:8,credits:1,requestId:request.requestId,sequence:2});
 assert.deepEqual(await credits.getBalance(f.user.id),{available:19,reserved:0});
 await collect(service.streamTurn(request));assert.equal(requests.length,1);assert.equal((await credits.getBalance(f.user.id)).available,19);
 const prompt=JSON.stringify(requests[0].input);
 for(const text of [f.config.systemPrompt,'HIDDEN_START_CONTEXT','CHARACTER_PRIVATE_FACT','LORE_PRIVATE_FACT','PERSONA_FACT','PINNED_MEMORY_FACT'])assert.ok(prompt.includes(text),text);
 const current=await conv.getChat(f.user.id,chatId),parent=current.messages.find(m=>m.role==='user');
 const second=await collect(service.streamTurn({...turn(f,'regen','harbor',parent.id),chatId}));
 await collect(service.streamTurn({...turn(f,'next','continue',second.at(-1).messageId),chatId}));
 assert.ok(!JSON.stringify(requests[2].input).includes('reply-1'));assert.ok(JSON.stringify(requests[2].input).includes('reply-2'));
 assert.ok(!JSON.stringify(first).includes('PRIVATE'));
 }finally{await f.db.close();}
});

test('provider errors, missing usage and private output restore real credits with no public delta',async()=>{
 const f=await fixture();try{
 const credits=await funded(f);
 for(const mode of ['http','usage','private','safety']){
  const runtime=createOpenAIRuntime(options(async()=>{
   if(mode==='http')return new Response('API_KEY_AND_PRIVATE_PROMPT',{status:429});
   const events=eventsFor(mode==='private'?f.config.systemPrompt:mode==='safety'?'BLOCKED_FIXTURE':'answer');if(mode==='usage')delete events.at(-1).response.usage;return responseFor(events);
  }));
  const service=createChatService({db:f.db,credits,model:runtime.model},runtime);
  const events=await collect(service.streamTurn(turn(f,mode)));assert.equal(events.at(-1).type,'error');assert.equal(events.filter(e=>e.type==='delta').length,0);
  assert.deepEqual(await credits.getBalance(f.user.id),{available:20,reserved:0});assert.ok(!JSON.stringify(events).includes('PRIVATE'));
 }
 assert.equal((await f.db.query('SELECT * FROM messages')).rows.length,0);
 }finally{await f.db.close();}
});

test('settlement failure rolls back charge/messages and cannot trigger a second provider call',async()=>{
 const f=await fixture();try{
 const real=await funded(f);let calls=0;
 const credits={...real,async completeTurn(input){await real.completeTurn(input);throw Error('fixture commit failure');}};
 const runtime=createOpenAIRuntime(options(async()=>{calls++;return responseFor();}));
 const service=createChatService({db:f.db,credits,model:runtime.model},runtime);
 const result=await collect(service.streamTurn(turn(f)));assert.equal(result.at(-1).type,'error');
 assert.deepEqual(await real.getBalance(f.user.id),{available:20,reserved:0});assert.equal((await f.db.query("SELECT * FROM credit_ledger WHERE kind='charge'")).rows.length,0);
 assert.equal((await f.db.query('SELECT * FROM messages')).rows.length,0);await collect(service.streamTurn(turn(f)));assert.equal(calls,1);
 }finally{await f.db.close();}
});

test('disconnect and provider timeout release reserved credits; duplicate while running cannot call provider',async()=>{
 for(const mode of ['abort','timeout']){
 const f=await fixture();try{
 const credits=await funded(f);let started,calls=0;const began=new Promise(r=>started=r),controller=new AbortController();
 const runtime=createOpenAIRuntime(options(async()=>{calls++;started();return new Response(new ReadableStream(),{headers:{'content-type':'text/event-stream'}});},{timeoutMs:mode==='timeout'?50:1000}));
 const service=createChatService({db:f.db,credits,model:runtime.model},runtime),request={...turn(f),signal:controller.signal};
 const running=collect(service.streamTurn(request));await began;
 if(mode==='abort'){await assert.rejects(collect(service.streamTurn(turn(f))),{code:'CONFLICT'});controller.abort();}
 const result=await running;assert.equal(result.at(-1).type,mode==='abort'?'done':'error');if(mode==='abort')assert.equal(result.at(-1).status,'cancelled');
 assert.equal(calls,1);assert.deepEqual(await credits.getBalance(f.user.id),{available:20,reserved:0});
 }finally{await f.db.close();}}
});
