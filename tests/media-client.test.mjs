import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createApiClient} from '../src/shared/apiClient.ts';
import {createReaderApi} from '../src/features/discover/readerApi.ts';
import {postprocessOutput,isSafeImageUrl} from '../server/chat/postprocess.ts';
const url='/api/studio/media/11111111-1111-4111-8111-111111111111/'+'a'.repeat(64);
test('registered internal media survives chat output filtering without allowing arbitrary relative URLs',()=>{
 assert.equal(isSafeImageUrl(url),true);
 for(const bad of ['/api/me','//external.example/image.png',url+'?token=secret',url+'/../other','data:image/png;base64,AA','javascript:alert(1)'])assert.equal(isSafeImageUrl(bad),false);
 assert.deepEqual(postprocessOutput('{{img:LOCAL}}',{assets:[{code:'LOCAL',url,alt:'등록 이미지'}]}).images,[{url,alt:'등록 이미지'}]);
 assert.deepEqual(postprocessOutput('{{img:UNKNOWN}}',{assets:[{code:'LOCAL',url,alt:'등록 이미지'}]}).images,[]);
});
test('protected media uses bearer, rejects external paths and never follows redirects',async()=>{
 let calls=0;
 const options={getAccessToken:async()=>'secret',fetch:async(path,init)=>{
  calls++;assert.equal(path,url);assert.equal(init.headers.get('Authorization'),'Bearer secret');assert.equal(init.redirect,'error');
  return new Response(new Uint8Array([1,2,3]),{headers:{'Content-Type':'image/png'}});
 }};
 const api=createApiClient(options);
 for(const bad of ['https://external.example/image.png','//external.example',url+'?redirect=other','/api/me',url+'/../other'])await assert.rejects(api.image(bad));
 assert.equal(calls,0);
 assert.equal((await createReaderApi(options).loadImage(url)).type,'image/png');assert.equal(calls,1);
 const abort=new AbortController();abort.abort();await assert.rejects(api.image(url,abort.signal),{name:'AbortError'});assert.equal(calls,1);
 await assert.rejects(createApiClient({...options,fetch:async()=>new Response('html',{headers:{'Content-Type':'text/html'}})}).image(url));
});
