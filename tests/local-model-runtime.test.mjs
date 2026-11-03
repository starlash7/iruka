import assert from 'node:assert/strict';
import {test} from 'node:test';
import {getLocalModelRuntime} from '../server/product/modelRuntime.ts';
const options=()=>({modelId:'gpt-5.4-mini',timeoutMs:20000,maxOutputTokens:1000,policy:{maxContextTokens:8000,maxOutputCharacters:4000,reservedCredits:2,actualCredits:()=>1},safety:{id:'test-only-policy',async check(){return true;}}});
test('default environment cannot load or call a real model',async()=>{
 let reads=0;const load=async()=>{reads++;throw Error('must not load');};
 assert.deepEqual(await getLocalModelRuntime({},load),{});
 assert.ok((await getLocalModelRuntime({LOCAL_TEST_CHAT:'1'},load)).model);
 assert.equal(reads,0);
});
test('live local model requires key, one mode and non-production context',async()=>{
 const enabled={LOCAL_LIVE_MODEL:'1',OPENAI_API_KEY:'server-test-key'};
 for(const env of [{LOCAL_LIVE_MODEL:'1'},{...enabled,LOCAL_TEST_CHAT:'1'},{...enabled,NODE_ENV:'production'},{...enabled,VERCEL:'1'}]){
  let reads=0;await assert.rejects(getLocalModelRuntime(env,async()=>{reads++;return {createOptions:options};}));assert.equal(reads,0);
 }
});
test('explicit policy mounts the existing adapter without making provider calls',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('no network allowed');};
 try{
  const result=await getLocalModelRuntime({LOCAL_LIVE_MODEL:'1',OPENAI_API_KEY:'server-test-key'},async()=>({createOptions:options}));
  assert.ok(result.model);assert.equal(result.models['gpt-5.4-mini'].reservedCredits,2);assert.equal(calls,0);
  await assert.rejects(getLocalModelRuntime({LOCAL_LIVE_MODEL:'1',OPENAI_API_KEY:'server-secret'},async()=>{throw Error('server-secret');}),error=>!error.message.includes('server-secret'));
  await assert.rejects(getLocalModelRuntime({LOCAL_LIVE_MODEL:'1',OPENAI_API_KEY:'server-test-key'},async()=>({createOptions:()=>({...options(),safety:undefined})})));
 }finally{globalThis.fetch=original;}
});
