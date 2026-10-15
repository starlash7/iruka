// Synthetic, documented OpenAI Responses SSE shapes. No live calls or customer data.
export function eventsFor(text='안녕하세요',usage={input_tokens:40,input_tokens_details:{cached_tokens:10},output_tokens:8,output_tokens_details:{reasoning_tokens:0},total_tokens:48}) {
 const output=[{type:'message',id:'msg_fixture',role:'assistant',status:'completed',content:[{type:'output_text',text,annotations:[]}]}];
 return [
  {type:'response.created',sequence_number:0,response:{id:'resp_fixture',status:'in_progress'}},
  {type:'response.in_progress',sequence_number:1,response:{id:'resp_fixture',status:'in_progress'}},
  {type:'response.output_text.delta',sequence_number:2,item_id:'msg_fixture',output_index:0,content_index:0,delta:text},
  {type:'response.output_text.done',sequence_number:3,item_id:'msg_fixture',output_index:0,content_index:0,text},
  {type:'response.completed',sequence_number:4,response:{id:'resp_fixture',status:'completed',output,usage}},
 ];
}
export function responseFor(events=eventsFor(),{chunkSize=7,newline='\r\n'}={}) {
 const source=events.map(e=>`event: ${e.type}${newline}data: ${JSON.stringify(e)}${newline}${newline}`).join('');
 const bytes=new TextEncoder().encode(': heartbeat'+newline+newline+source);let index=0;
 return new Response(new ReadableStream({pull(controller){if(index===bytes.length){controller.close();return;}controller.enqueue(bytes.slice(index,index+chunkSize));index=Math.min(bytes.length,index+chunkSize);}}),{headers:{'content-type':'text/event-stream'}});
}
export function options(fetch,overrides={}) {
 return {apiKey:'fixture-key-not-a-secret',modelId:'gpt-5.4-mini',timeoutMs:1000,maxOutputTokens:100,
  policy:{maxContextTokens:4000,maxOutputCharacters:4000,reservedCredits:2,actualCredits:()=>1},
  safety:{id:'fixture-only',async check(text){return !text.includes('BLOCKED_FIXTURE');}},fetch,...overrides};
}
export const input=()=>({messages:[{role:'system',content:'Private setting + lore + memory'},{role:'assistant',content:'Selected branch only'},{role:'user',content:'Continue'}],signal:new AbortController().signal});
export async function collect(stream){const values=[];for await(const event of stream)values.push(event);return values;}
