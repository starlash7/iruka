import test from 'node:test';
import assert from 'node:assert/strict';
import {createOpenAIRuntime} from '../server/models/index.ts';
import {eventsFor,responseFor,options,input,collect} from './models-fixtures/responses.mjs';
test('preserves messages and returns provider token totals through fixed stateless request',async()=>{
 let request,calls=0;const runtime=createOpenAIRuntime(options(async(url,init)=>{calls++;request={url,init};return responseFor();}));
 const source=input(),result=await collect(runtime.model.stream(source));
 assert.equal(request.url,'https://api.openai.com/v1/responses');assert.equal(request.init.redirect,'error');
 const body=JSON.parse(request.init.body);assert.deepEqual(body.input,source.messages);assert.equal(body.model,'gpt-5.4-mini');
 assert.equal(body.store,false);assert.equal(body.background,false);assert.equal(body.stream,true);assert.equal(body.max_output_tokens,100);assert.equal(body.reasoning.effort,'none');assert.equal(body.truncation,'disabled');
 assert.equal(body.previous_response_id,undefined);assert.equal(body.conversation,undefined);assert.equal(body.tools,undefined);
 assert.equal(result.filter(e=>e.type==='delta').map(e=>e.text).join(''),'안녕하세요');assert.deepEqual(result.at(-1),{type:'usage',inputTokens:40,outputTokens:8});assert.equal(calls,1);
 assert.ok(!JSON.stringify(runtime).includes('fixture-key'));
});
test('missing key/model/policy/safety and invalid limits fail before transport',()=>{
 let calls=0;const config=options(async()=>{calls++;return responseFor();});
 for(const patch of [{apiKey:''},{modelId:''},{modelId:'test'},{modelId:'gpt-6'},{policy:undefined},{safety:undefined},{safety:{check:async()=>true}},{timeoutMs:0},{maxOutputTokens:0},{policy:{...config.policy,maxContextTokens:400000}}])
  assert.throws(()=>createOpenAIRuntime({...config,...patch}),{code:'SERVICE_UNAVAILABLE'});
 assert.equal(calls,0);
});
for(const variant of ['missing usage','bad usage','missing terminal','incomplete','failed','refusal','error','mismatched output','out of order','duplicate terminal','unsupported output'])test(`rejects ${variant} without exposing provider errors`,async()=>{
 const events=eventsFor();
 if(variant==='missing usage')delete events.at(-1).response.usage;
 if(variant==='bad usage')events.at(-1).response.usage.input_tokens=-1;
 if(variant==='missing terminal')events.pop();
 if(variant==='incomplete'||variant==='failed'){events.at(-1).type='response.'+variant;events.at(-1).response.status=variant;}
 if(variant==='refusal')events[2]={type:'response.refusal.delta',sequence_number:2,delta:'PROVIDER_SECRET'};
 if(variant==='error')events[2]={type:'error',sequence_number:2,message:'PROVIDER_SECRET'};
 if(variant==='mismatched output')events.at(-1).response.output[0].content[0].text='different';
 if(variant==='out of order')events[2].sequence_number=0;
 if(variant==='duplicate terminal')events.push({...events.at(-1),sequence_number:5});
 if(variant==='unsupported output')events.at(-1).response.output.push({type:'function_call',arguments:'PROVIDER_SECRET'});
 const model=createOpenAIRuntime(options(async()=>responseFor(events))).model;
 await assert.rejects(collect(model.stream(input())),error=>error.code==='SERVICE_UNAVAILABLE'&&!String(error).includes('PROVIDER_SECRET'));
});
test('HTTP errors do not retry, parse or expose the body',async()=>{
 for(const status of [401,429,500]){
 let calls=0;const model=createOpenAIRuntime(options(async()=>{calls++;return new Response('PROVIDER_SECRET',{status});})).model;
 await assert.rejects(collect(model.stream(input())),error=>error.code==='SERVICE_UNAVAILABLE'&&!String(error).includes('PROVIDER_SECRET'));assert.equal(calls,1);
 }
});
test('pre-abort and stalled fetch/read are bounded and cancelled',async()=>{
 let calls=0;const controller=new AbortController();controller.abort('SECRET_REASON');
 const pre=createOpenAIRuntime(options(async()=>{calls++;return responseFor();})).model;
 await assert.rejects(collect(pre.stream({...input(),signal:controller.signal})),{name:'AbortError'});assert.equal(calls,0);
 for(const phase of ['fetch','read']){
 let signal,cancelled=false;
 const fetch=async(_,init)=>{signal=init.signal;if(phase==='fetch')return new Promise(()=>{});return new Response(new ReadableStream({cancel(){cancelled=true;}}),{headers:{'content-type':'text/event-stream'}});};
 const model=createOpenAIRuntime(options(fetch,{timeoutMs:20})).model;
 await assert.rejects(collect(model.stream(input())),{code:'SERVICE_UNAVAILABLE'});assert.equal(signal.aborted,true);if(phase==='read')assert.equal(cancelled,true);
 }
});
test('input/output safety rejects and hanging safety is bounded',async()=>{
 let calls=0;const fetch=async()=>{calls++;return responseFor(eventsFor('BLOCKED_FIXTURE'));};
 const model=createOpenAIRuntime(options(fetch)).model;
 await assert.rejects(collect(model.stream({...input(),messages:[{role:'user',content:'BLOCKED_FIXTURE'}]})),{code:'FORBIDDEN'});assert.equal(calls,0);
 await assert.rejects(collect(model.stream(input())),{code:'FORBIDDEN'});assert.equal(calls,1);
 const hanging=createOpenAIRuntime(options(fetch,{timeoutMs:20,safety:{id:'fixture',check:()=>new Promise(()=>{})}})).model;
 await assert.rejects(collect(hanging.stream(input())),{code:'SERVICE_UNAVAILABLE'});assert.equal(calls,1);
});
test('malformed frames, wrong content type and oversized output fail closed',async()=>{
 for(const response of [new Response('not sse'),new Response('data: invalid\n\n',{headers:{'content-type':'text/event-stream'}}),responseFor(eventsFor('x'.repeat(5000)))]){
  await assert.rejects(collect(createOpenAIRuntime(options(async()=>response)).model.stream(input())),{code:'SERVICE_UNAVAILABLE'});
 }
});
test('synchronous transport abort does not leave an unhandled rejected promise',async()=>{
 const controller=new AbortController();
 const runtime=createOpenAIRuntime(options(async()=>{controller.abort();throw Error('SECRET_TRANSPORT_ERROR');}));
 await assert.rejects(collect(runtime.model.stream({...input(),signal:controller.signal})),{name:'AbortError'});
 await new Promise(resolve=>setImmediate(resolve));
});
test('consumer return aborts transport and closes its body',async()=>{
 let signal,cancelled=false;
 const encoder=new TextEncoder();let sent=false;
 const fetch=async(_,init)=>{signal=init.signal;return new Response(new ReadableStream({pull(controller){if(!sent){sent=true;controller.enqueue(encoder.encode('data: '+JSON.stringify(eventsFor()[2])+'\n\n'));}},cancel(){cancelled=true;}}),{headers:{'content-type':'text/event-stream'}});};
 const iterator=createOpenAIRuntime(options(fetch)).model.stream(input())[Symbol.asyncIterator]();
 assert.equal((await iterator.next()).value.type,'delta');await iterator.return();assert.equal(signal.aborted,true);assert.equal(cancelled,true);
});
test('LF multiline data and one-byte UTF-8 frames parse, truncated frames and invalid UTF-8 fail',async()=>{
 const events=eventsFor();
 const wire=events.map(e=>'event: '+e.type+'\ndata: '+JSON.stringify(e,null,2).replaceAll('\n','\ndata: ')+'\n\n').join('');
 const result=await collect(createOpenAIRuntime(options(async()=>new Response(wire,{headers:{'content-type':'text/event-stream'}}))).model.stream(input()));assert.equal(result.at(-1).outputTokens,8);
 assert.equal((await collect(createOpenAIRuntime(options(async()=>responseFor(events,{chunkSize:1}))).model.stream(input()))).at(-1).inputTokens,40);
 for(const content of [wire.slice(0,-1),new Uint8Array([0xff]),'data: '+ 'x'.repeat(1048577)])await assert.rejects(collect(createOpenAIRuntime(options(async()=>new Response(content,{headers:{'content-type':'text/event-stream'}}))).model.stream(input())),{code:'SERVICE_UNAVAILABLE'});
});
