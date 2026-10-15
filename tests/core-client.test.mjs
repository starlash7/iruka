import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApiClient } from '../src/shared/apiClient.ts';
import { parseChatStream } from '../src/shared/stream.ts';
const event = (type, sequence, payload = {}) => ({type,requestId:'req',sequence,...payload});
const done = event('done', 2, {turnId:'turn',status:'completed',messageId:null});
const frame = value => `event: ${value.type}\r\ndata: ${JSON.stringify(value)}\r\n\r\n`;
function response(text) {
  const bytes = new TextEncoder().encode(text);
  return new Response(new ReadableStream({ start(controller) {
    for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
    controller.close();
  } }), {headers:{'Content-Type':'text/event-stream'}});
}
async function collect(iterable) { const values = []; for await (const value of iterable) values.push(value); return values; }
test('POST streaming gets a fresh access token and decodes split Unicode CRLF/multiline frames', async () => {
  let tokens = 0;
  const client = createApiClient({getAccessToken:async () => `token-${++tokens}`, fetch:async (url, init) => {
    assert.equal(url, '/api/chats/chat/turns');
    assert.equal(init.headers.get('Authorization'), `Bearer token-${tokens}`);
    assert.equal(init.headers.get('Idempotency-Key'), 'key');
    assert.equal(init.method, 'POST');
    return response(': heartbeat\r\n\r\ndata: {"type":"delta","requestId":"req",\r\ndata: "sequence":1,"text":"안녕🐬"}\r\n\r\n' + frame(done));
  }});
  for (let i = 0; i < 2; i++) {
    const events = await collect(client.streamTurn('chat',{content:'hi',parentMessageId:null,model:'test'},{idempotencyKey:'key'}));
    assert.equal(events[0].text, '안녕🐬'); assert.equal(events.at(-1).type, 'done');
  }
  assert.equal(tokens, 2);
});
test('malformed, missing terminal, wrong sequence and duplicate terminals reject', async () => {
  for (const wire of ['data: nope\n\n', frame(event('delta',1,{text:'hi'})), frame(done)+frame(done), frame(event('delta',3,{text:'hi'}))+frame(done), frame({...done,status:'other'})])
    await assert.rejects(collect(parseChatStream(response(wire))));
});
test('structured errors retain server request ID', async () => {
  const client = createApiClient({getAccessToken:async ()=>'token',fetch:async()=>Response.json({error:{code:'SERVICE_UNAVAILABLE',message:'준비 중'},requestId:'r'},{status:503})});
  await assert.rejects(client.request('/api/me'), error=>error.status===503 && error.requestId==='r');
});
test('abort cancels a pending stream read', async () => {
  let cancelled = false;
  const controller = new AbortController();
  const stream = new Response(new ReadableStream({cancel(){cancelled=true;}}),{headers:{'content-type':'text/event-stream'}});
  const pending = collect(parseChatStream(stream,controller.signal));
  controller.abort();
  await assert.rejects(pending,error=>error.name==='AbortError'); assert.equal(cancelled,true);
});
test('error is a valid sole terminal event; consumer return releases reader', async () => {
  assert.equal((await collect(parseChatStream(response(frame(event('error',0,{code:'FAILED',message:'실패'}))))))[0].type,'error');
  let cancelled = false;
  const stream = new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode(frame(event('delta',0,{text:'a'}))));},cancel(){cancelled=true;}}),{headers:{'content-type':'text/event-stream'}});
  for await (const value of parseChatStream(stream)) { assert.equal(value.text,'a'); break; }
  assert.equal(cancelled,true);
});
test('malformed JSON envelopes produce a stable client error', async () => {
  for (const status of [200,503]) {
    const client=createApiClient({getAccessToken:async()=>'token',fetch:async()=>Response.json(null,{status})});
    await assert.rejects(client.request('/api/me'),error=>error.code==='INVALID_RESPONSE');
  }
});

test('public requests work without a login token and protected errors remain server-authoritative', async () => {
 const client=createApiClient({getAccessToken:async()=>null,fetch:async(path,init)=>{
  assert.equal(init.headers.has('Authorization'),false);
  return path==='/api/works'?Response.json({data:[],requestId:'public'}):Response.json({error:{code:'UNAUTHORIZED',message:'로그인'},requestId:'private'},{status:401});
 }});
 assert.deepEqual((await client.request('/api/works')).data,[]);
 await assert.rejects(client.request('/api/me'),e=>e.code==='UNAUTHORIZED'&&e.status===401);
});
