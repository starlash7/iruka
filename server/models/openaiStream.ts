import type {ModelEvent} from '../core/interfaces.ts';
import {awaitWithSignal} from './requestScope.ts';
type RecordValue=Record<string,unknown>;
function object(value:unknown):RecordValue {
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid provider object');
  return value as RecordValue;
}
function tokens(value:unknown):number {
  if(!Number.isSafeInteger(value)||(value as number)<0)throw Error('Invalid provider usage');return value as number;
}
function readCompleted(value:unknown,expectedId:string|undefined,text:string) {
  const response=object(value);
  if(response.status!=='completed'||typeof response.id!=='string'||(expectedId&&expectedId!==response.id)||!Array.isArray(response.output))throw Error('Incomplete provider response');
  let completedText='';
  for(const entry of response.output){
    const item=object(entry);
    if(item.type!=='message'||item.role!=='assistant'||item.status!=='completed'||!Array.isArray(item.content))throw Error('Unsupported provider output');
    for(const value of item.content){
      const part=object(value);if(part.type!=='output_text'||typeof part.text!=='string')throw Error('Unsupported provider content');completedText+=part.text;
    }
  }
  if(!text||completedText!==text)throw Error('Incomplete provider text');
  const usage=object(response.usage),inputTokens=tokens(usage.input_tokens),outputTokens=tokens(usage.output_tokens);
  if(tokens(usage.total_tokens)!==inputTokens+outputTokens)throw Error('Invalid provider totals');
  // input_tokens already includes cached tokens; output_tokens includes reasoning tokens.
  return {type:'usage' as const,inputTokens,outputTokens};
}
async function* readEvents(body:ReadableStream<Uint8Array>,signal:AbortSignal):AsyncGenerator<RecordValue> {
  const reader=body.getReader(),decoder=new TextDecoder('utf-8',{fatal:true});
  let buffer='',data:string[]=[],name='',bytes=0,frameLength=0;
  function readLine(line:string):RecordValue|undefined {
    if(line===''){
      if(!data.length){name='';frameLength=0;return;}
      const event=object(JSON.parse(data.join('\n')));
      if(typeof event.type!=='string'||(name&&name!==event.type))throw Error('Invalid SSE event');
      data=[];name='';frameLength=0;return event;
    }
    frameLength+=line.length;if(frameLength>1048576)throw Error('Provider frame too large');
    if(line.startsWith(':'))return;
    const colon=line.indexOf(':'),field=colon<0?line:line.slice(0,colon);
    const raw=colon<0?'':line.slice(colon+1),value=raw.startsWith(' ')?raw.slice(1):raw;
    if(field==='data')data.push(value);if(field==='event')name=value;
  }
  try{
    for(;;){
      const {done,value}=await awaitWithSignal(reader.read(),signal);
      if(value){bytes+=value.byteLength;if(bytes>4194304)throw Error('Provider stream too large');}
      buffer+=done?decoder.decode():decoder.decode(value,{stream:true});
      while(true){
        const match=/[\r\n]/.exec(buffer);if(!match)break;
        const index=match.index;if(!done&&buffer[index]==='\r'&&index===buffer.length-1)break;
        const line=buffer.slice(0,index),width=buffer[index]==='\r'&&buffer[index+1]==='\n'?2:1;
        buffer=buffer.slice(index+width);const event=readLine(line);if(event)yield event;
      }
      if(buffer.length+frameLength>1048576)throw Error('Provider frame too large');
      if(done){if(buffer||data.length)throw Error('Truncated provider event');break;}
    }
  }finally{
    void reader.cancel().catch(()=>{});reader.releaseLock();
  }
}
/** Only assistant text and terminal totals cross the internal ModelService boundary. */
export async function* readOpenAIStream(body:ReadableStream<Uint8Array>,signal:AbortSignal,maxCharacters:number):AsyncGenerator<ModelEvent> {
  let sequence=-1,text='',id:string|undefined,usage:Extract<ModelEvent,{type:'usage'}>|undefined;
  const metadata=new Set(['response.created','response.in_progress','response.output_item.added','response.output_item.done','response.content_part.added','response.content_part.done','response.output_text.done']);
  for await(const event of readEvents(body,signal)){
    if(usage||!Number.isSafeInteger(event.sequence_number)||(event.sequence_number as number)<=sequence)throw Error('Invalid provider event sequence');
    sequence=event.sequence_number as number;
    if(event.type==='response.created'){
      const response=object(event.response);if(id||typeof response.id!=='string')throw Error('Invalid provider identity');id=response.id;
    }else if(event.type==='response.output_text.delta'){
      if(typeof event.delta!=='string')throw Error('Invalid provider delta');text+=event.delta;
      if(text.length>maxCharacters)throw Error('Provider output too long');
      yield {type:'delta',text:event.delta};
    }else if(event.type==='response.completed')usage=readCompleted(event.response,id,text);
    else if(!metadata.has(event.type as string))throw Error('Provider refused, failed, or returned unsupported event');
  }
  if(!usage)throw Error('Missing provider completion');
  signal.throwIfAborted();yield usage;
}
