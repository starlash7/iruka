import {getPrivateTexts} from './privateSettings.ts';
import type {ChatServiceDependencies,StreamService,CreateChatService} from '../core/interfaces.ts';
import {ApiError,toApiError} from '../core/errors.ts';
import {requireText,requireId} from '../core/http.ts';
import {requireChatDatabase} from './database.ts';
import {claimTurn,settleTurn,type EventPayload} from './turnLifecycle.ts';
import {loadVersion} from './repository.ts';
import {assemblePrompt} from './promptAssembler.ts';
import {postprocessOutput,type ChatAsset} from './postprocess.ts';
import {requireSafeText,type SafetyService} from './safety.ts';
import {generateOutput} from './generate.ts';
export interface ChatPolicy {
  maxContextTokens:number;maxOutputCharacters:number;reservedCredits:number;
  actualCredits(usage:{inputTokens:number;outputTokens:number}):number;
}
export interface ChatOptions {
  safety?:SafetyService;models?:Readonly<Record<string,ChatPolicy>>;
  assets?:(workVersionId:string)=>Promise<ChatAsset[]>;
  leaseMilliseconds?:number;generationMilliseconds?:number;
}
export function createChatService({db,model,credits}:ChatServiceDependencies,options:ChatOptions={}):StreamService {
  requireChatDatabase(db);
  return {async *streamTurn(input){
    requireText(input.body.content,8000);requireText(input.body.model,50);
    if(input.body.parentMessageId!==null)requireId(input.body.parentMessageId);
    const policy=options.models?.[input.body.model];
    if(!policy||!options.safety)throw new ApiError('SERVICE_UNAVAILABLE','모델과 안전 정책을 준비 중이에요.');
    const leaseMs=options.leaseMilliseconds??90000,generationMs=options.generationMilliseconds??60000;
    if(!Number.isSafeInteger(policy.reservedCredits)||policy.reservedCredits<=0||!Number.isSafeInteger(policy.maxContextTokens)||policy.maxContextTokens<=0||!Number.isSafeInteger(policy.maxOutputCharacters)||policy.maxOutputCharacters<=0||generationMs<=0||leaseMs<=generationMs)
      throw new ApiError('SERVICE_UNAVAILABLE','모델 정책을 확인해 주세요.');
    await requireSafeText(options.safety,input.body.content,'input');input.signal.throwIfAborted();
    const claim=await claimTurn(db,credits,input,policy.reservedCredits,leaseMs);
    let sequence=0,settled=claim.state==='replay';
    const emit=(event:EventPayload)=>({...event,requestId:input.requestId,sequence:sequence++});
    let timer:ReturnType<typeof setTimeout>|undefined;
    const deadline=new AbortController(),signal=AbortSignal.any([input.signal,deadline.signal]);
    try {
      yield emit({type:'ready',turnId:claim.turnId});
      if(claim.state==='replay'){for(const event of claim.response as EventPayload[])yield emit(event);return;}
      timer=setTimeout(()=>deadline.abort(new DOMException('Generation timed out','TimeoutError')),generationMs);
      let events:EventPayload[];
      try {
        const version=await loadVersion(db,input.chatId),assets=await options.assets?.(claim.chat.workVersionId)??[];
        const path=claim.path,reuseUser=path.at(-1)?.role==='user';
        const history=(reuseUser?path.slice(0,-1):path).map(m=>({role:m.role,content:m.content}));
        const {rows:memories}=await db.query<{content:string}>(`SELECT content FROM chat_memories WHERE chat_id=$1 AND (kind='pinned' OR anchor_id=ANY($2::uuid[])) ORDER BY (kind='pinned') DESC,created_at DESC LIMIT 10`,[input.chatId,path.map(m=>m.id)]);
        const prompt=assemblePrompt({...version,openingId:claim.openingId,persona:claim.chat.personaSnapshot,memories:memories.map(m=>m.content),history,content:input.body.content,maxTokens:policy.maxContextTokens,assets});
        if(prompt.omitted.length&&path.length){
          // Anchor only to the retained selected path, never sibling timestamps.
          const anchor=path[Math.min(prompt.omitted.length-1,path.length-1)].id;
          await db.query('INSERT INTO chat_summary_jobs(chat_id,anchor_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[input.chatId,anchor]);
        }
        const output=await generateOutput(model,prompt.messages,signal,policy.maxOutputCharacters);
        const privateTexts=getPrivateTexts(version.config);
        await requireSafeText(options.safety,output.text,'output',privateTexts);
        const processed=postprocessOutput(output.text,{assets,endings:version.config.endings,personaName:claim.chat.personaSnapshot?.name,characterName:version.snapshot.characters?.[0]?.name});
        await requireSafeText(options.safety,JSON.stringify(processed),'output',privateTexts);
        if(!processed.text&&!processed.images.length&&!processed.statuses.length&&!processed.endings.length)throw new ApiError('INVALID_REQUEST','빈 응답을 받았어요.');
        const actualCredits=policy.actualCredits(output.usage);
        if(!Number.isSafeInteger(actualCredits)||actualCredits<0||actualCredits>policy.reservedCredits)throw Error('Invalid credit policy result');
        events=[];
        for(const text of processed.text.match(/[\s\S]{1,256}/gu)??[])events.push({type:'delta',text});
        for(const image of processed.images)events.push({type:'image',...image});
        for(const status of processed.statuses)events.push({type:'status',status});
        for(const ending of processed.endings)events.push({type:'ending',...ending});
        events.push({type:'usage',...output.usage,credits:actualCredits});
        events=await settleTurn(db,credits,{...input,turnId:claim.turnId,status:'succeeded',events,content:processed.text,parentId:input.body.parentMessageId,reuseUser,userContent:input.body.content,actualCredits,signal});
      }catch(error){
        const cancelled=input.signal.aborted;
        const safe=toApiError(error);
        events=await settleTurn(db,credits,{...input,turnId:claim.turnId,status:cancelled?'aborted':'failed',events:cancelled?[{type:'done',turnId:claim.turnId,status:'cancelled',messageId:null}]:[{type:'error',code:safe.code,message:safe.message}]});
      }
      settled=true;
      if(timer)clearTimeout(timer);
      for(const event of events)yield emit(event);
    }finally{
      if(timer)clearTimeout(timer);deadline.abort();
      if(!settled)await settleTurn(db,credits,{...input,turnId:claim.turnId,status:'aborted',events:[{type:'done',turnId:claim.turnId,status:'cancelled',messageId:null}]});
    }
  }};
}
// Compile-time check of the foundation factory signature; runtime policy is an optional extension.
const checkFactory:CreateChatService=createChatService;void checkFactory;
