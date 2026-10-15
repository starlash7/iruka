import type {ModelService,ModelMessage,ModelEvent} from '../core/interfaces.ts';
import {ApiError} from '../core/errors.ts';
/** Abort even an adapter that stalls in next(). Late output is discarded. */
export async function generateOutput(model:ModelService,messages:ModelMessage[],signal:AbortSignal,maxCharacters:number) {
  signal.throwIfAborted();
  const iterator=model.stream({messages,signal})[Symbol.asyncIterator]();
  let rejectAbort:(reason:unknown)=>void=()=>{};
  const aborted=new Promise<never>((_,reject)=>{rejectAbort=reject;});
  const onAbort=()=>rejectAbort(signal.reason??new DOMException('Aborted','AbortError'));
  signal.addEventListener('abort',onAbort,{once:true});
  let text='',usage={inputTokens:0,outputTokens:0},seenUsage=false;
  try {
    for(;;){
      const result=await Promise.race([iterator.next(),aborted]);if(result.done)break;
      const event:ModelEvent=result.value;
      if(event.type==='delta'){
        if(typeof event.text!=='string'||seenUsage)throw Error('Invalid model event');
        text+=event.text;if(text.length>maxCharacters)throw new ApiError('INVALID_REQUEST','응답이 허용 길이를 초과했어요.');
      }else if(event.type==='usage'){
        if(seenUsage||![event.inputTokens,event.outputTokens].every(n=>Number.isSafeInteger(n)&&n>=0))throw Error('Invalid model usage');
        seenUsage=true;usage={inputTokens:event.inputTokens,outputTokens:event.outputTokens};
      }else throw Error('Invalid model event');
    }
    signal.throwIfAborted();
    if(!seenUsage)throw Error('Missing model usage');
    return {text,usage};
  }finally{
    signal.removeEventListener('abort',onAbort);
    // An uncooperative provider must not prevent lease cancellation.
    void iterator.return?.().catch(()=>{});
  }
}
