import type {ModelService} from '../core/interfaces.ts';
import {ApiError} from '../core/errors.ts';
import {requireSafeText,type SafetyService} from '../chat/safety.ts';
import {readOpenAIStream} from './openaiStream.ts';
import {awaitWithSignal} from './requestScope.ts';
export interface OpenAISettings {
  apiKey:string;modelId:'gpt-5.4-mini';timeoutMs:number;maxOutputTokens:number;
  maxOutputCharacters:number;safety:SafetyService;fetch:typeof globalThis.fetch;
}
/** Internal constructor; initialize through createOpenAIRuntime to validate configuration. */
export function createOpenAIModel(settings:OpenAISettings):ModelService {
  return {async *stream({messages,signal:external}){
    const controller=new AbortController(),signal=AbortSignal.any([external,controller.signal]);
    const timer=setTimeout(()=>controller.abort(),settings.timeoutMs);
    let response:Response|undefined;
    try{
      signal.throwIfAborted();
      if(!Array.isArray(messages)||!messages.length||messages.some(m=>!m||!['system','user','assistant'].includes(m.role)||typeof m.content!=='string'))throw Error('Invalid model input');
      // Copy only contract fields. No caller-controlled URL, model, tools, or conversation state.
      const input=messages.map(({role,content})=>({role,content}));
      const body=JSON.stringify({model:settings.modelId,input,stream:true,store:false,background:false,
        reasoning:{effort:'none'},truncation:'disabled',max_output_tokens:settings.maxOutputTokens});
      if(new TextEncoder().encode(body).byteLength>2097152)throw Error('Model request too large');
      await awaitWithSignal(requireSafeText(settings.safety,input.map(m=>m.content).join('\n'),'input'),signal);
      signal.throwIfAborted();
      const pending=settings.fetch('https://api.openai.com/v1/responses',{
        method:'POST',redirect:'error',signal,headers:{authorization:`Bearer ${settings.apiKey}`,'content-type':'application/json',accept:'text/event-stream'},body,
      }).then(value=>{if(signal.aborted)void value.body?.cancel().catch(()=>{});return value;});
      response=await awaitWithSignal(pending,signal);
      if(!response.ok||!response.headers.get('content-type')?.toLowerCase().startsWith('text/event-stream')||!response.body)throw Error('Provider request failed');
      let output='';
      for await(const event of readOpenAIStream(response.body,signal,settings.maxOutputCharacters)){
        if(event.type==='delta')output+=event.text;
        else await awaitWithSignal(requireSafeText(settings.safety,output,'output'),signal);
        signal.throwIfAborted();yield event;
      }
    }catch(error){
      if(external.aborted)throw new DOMException('Model request cancelled','AbortError');
      if(controller.signal.aborted)throw new ApiError('SERVICE_UNAVAILABLE','모델 응답 시간이 초과됐어요.');
      if(error instanceof ApiError&&error.code==='FORBIDDEN')throw new ApiError('FORBIDDEN','안전 기준에 따라 이 내용을 처리할 수 없어요.');
      // Never expose provider bodies, messages, request headers or original Error.cause.
      throw new ApiError('SERVICE_UNAVAILABLE','모델 응답을 처리하지 못했어요.');
    }finally{
      clearTimeout(timer);controller.abort();
      if(response?.body&&!response.body.locked)void response.body.cancel().catch(()=>{});
    }
  }};
}
