import assert from 'node:assert/strict';
import {test} from 'node:test';
import {TestModelService} from '../server/core/testAdapters.ts';
async function collect(iterable){const events=[];for await(const event of iterable)events.push(event);return events;}
test('explicit model fixture replays deterministic delta and usage without mutating its configuration',async()=>{
 const chunks=['안녕','🐬'],usage={inputTokens:5,outputTokens:2};
 const model=new TestModelService(chunks,usage);
 chunks.push('later');usage.outputTokens=99;
 const input={messages:[{role:'user',content:'안녕'}],signal:new AbortController().signal};
 const expected=[{type:'delta',text:'안녕'},{type:'delta',text:'🐬'},{type:'usage',inputTokens:5,outputTokens:2}];
 assert.deepEqual(await collect(model.stream(input)),expected);
 assert.deepEqual(await collect(model.stream(input)),expected);
});
test('model abort stops before further output or success usage',async()=>{
 const controller=new AbortController();
 const model=new TestModelService(['first','second'],{inputTokens:1,outputTokens:2});
 const iterator=model.stream({messages:[],signal:controller.signal})[Symbol.asyncIterator]();
 assert.equal((await iterator.next()).value.text,'first');controller.abort();
 await assert.rejects(iterator.next(),error=>error.name==='AbortError');
 await assert.rejects(collect(model.stream({messages:[],signal:controller.signal})),error=>error.name==='AbortError');
});
