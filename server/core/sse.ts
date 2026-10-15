import type {ChatEvent} from '../../src/shared/contracts.ts';
import {validateChatEvent} from '../../src/shared/stream.ts';
import type {StreamService,StreamTurnInput} from './interfaces.ts';
import {ApiError,toApiError} from './errors.ts';
/** Prime before headers: unavailable services remain JSON 503, not a false 200 stream. */
export async function createEventResponse(service:StreamService,input:StreamTurnInput):Promise<Response> {
 const cancellation=new AbortController();
 const signal=AbortSignal.any([input.signal,cancellation.signal]);
 signal.throwIfAborted();
 const iterator=service.streamTurn({...input,signal})[Symbol.asyncIterator]();
 let cleanup:Promise<void>|undefined;
 const closeIterator=()=>cleanup??=Promise.resolve().then(async()=>{await iterator.return?.();}).catch(()=>{});
 let first:IteratorResult<ChatEvent>;
 try{
  first=await iterator.next();
  if(first.done)throw new ApiError('INTERNAL_ERROR','응답 스트림이 비어 있어요.');
 }catch(error){await closeIterator();throw error;}
 let pending:IteratorResult<ChatEvent>|undefined=first, sequence=-1, closed=false;
 const encoder=new TextEncoder();
 const encode=(event:ChatEvent)=>encoder.encode(`id: ${event.sequence}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
 const body=new ReadableStream<Uint8Array>({
  async pull(controller){
   try{
    const result=pending??await iterator.next(); pending=undefined;
    if(closed)return;
    if(result.done)throw new Error('Missing terminal event');
    const event=validateChatEvent(result.value);
    if(event.requestId!==input.requestId||event.sequence<=sequence)throw new Error('Invalid event envelope');
    sequence=event.sequence;
    controller.enqueue(encode(event));
    if(event.type==='done'||event.type==='error'){
     closed=true;controller.close();await closeIterator();
    }
   }catch(error){
    if(closed)return;
    closed=true;
    const safe=toApiError(error);
    controller.enqueue(encode({type:'error',requestId:input.requestId,sequence:sequence+1,code:safe.code,message:safe.message}));
    controller.close();
    cancellation.abort(error);
    await closeIterator();
   }
  },
  async cancel(reason){closed=true;cancellation.abort(reason);await closeIterator();}
 });
 return new Response(body,{headers:{'content-type':'text/event-stream; charset=utf-8','cache-control':'no-cache, no-transform','x-accel-buffering':'no','x-request-id':input.requestId}});
}
