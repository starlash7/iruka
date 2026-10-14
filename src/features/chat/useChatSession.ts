import {useEffect,useRef,useState} from 'react';
import type {ChatEvent,TurnRequest} from '../../shared/contracts';
import type {ChatView,ReaderApi} from '../discover/readerApi';
import {getMessageBranch} from './messageTree';
import {ApiClientError} from '../../shared/apiClient';
import {createTurnRecovery} from './turnRecovery';
export interface StreamPreview {text:string;images:{url:string;alt:string}[];status:string;ending:{id:string;title:string}|null}
const emptyPreview=():StreamPreview=>({text:'',images:[],status:'',ending:null});
export function useChatSession(api:ReaderApi,id:string){
 const [view,setView]=useState<ChatView|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState<Error|null>(null);const [busy,setBusy]=useState(false);const [preview,setPreview]=useState(emptyPreview);const [notice,setNotice]=useState('');
 const controller=useRef<AbortController|null>(null);const mounted=useRef(true);const lock=useRef(false);const recovery=useRef(createTurnRecovery());const version=useRef(0);
 async function reload(){const current=++version.current;setLoading(true);setError(null);try{const next=await api.getChat(id);getMessageBranch(next.messages,next.chat.activeMessageId);if(mounted.current&&current===version.current){setView(next);recovery.current.reconciled();}}catch(error){if(mounted.current&&current===version.current)setError(asError(error));}finally{if(mounted.current&&current===version.current)setLoading(false);}}
 useEffect(()=>{mounted.current=true;setView(null);recovery.current=createTurnRecovery();void reload();return()=>{mounted.current=false;version.current++;controller.current?.abort();};},[api,id]);
 async function mutate(action:()=>Promise<ChatView>){if(lock.current||recovery.current.locked)return false;lock.current=true;setBusy(true);setError(null);try{const next=await action();getMessageBranch(next.messages,next.chat.activeMessageId);if(mounted.current){setView(next);setPreview(emptyPreview());}return true;}catch(error){if(mounted.current)setError(asError(error));return false;}finally{lock.current=false;if(mounted.current)setBusy(false);}}
 async function send(body:TurnRequest,retry=false):Promise<boolean>{
  if(lock.current||(!retry&&recovery.current.locked))return false;lock.current=true;setBusy(true);setError(null);setNotice('');setPreview(emptyPreview());
  const current=recovery.current.begin(body,retry);const abort=new AbortController();controller.current=abort;let completed=false;
  try{
   for await(const event of api.streamTurn(id,current.body,{idempotencyKey:current.key,signal:abort.signal})){
    if(!mounted.current)break;
    if(event.type==='error'){recovery.current.terminal();throw new Error(event.message);}
    if(event.type==='done'){completed=event.status==='completed';setNotice(completed?'응답 완료':'응답을 중단했어요.');recovery.current.terminal();}
    else setPreview(previous=>applyEvent(previous,event));
   }
   if(mounted.current){const next=await api.getChat(id);getMessageBranch(next.messages,next.chat.activeMessageId);setView(next);recovery.current.reconciled();if(completed)setPreview(emptyPreview());}
  }catch(error){if(error instanceof ApiClientError&&[400,401,402,403,404].includes(error.status))recovery.current.rejected();if(mounted.current){setError(asError(error));setNotice(!recovery.current.locked?'입력과 사용 가능한 모델을 확인해 주세요.':recovery.current.needsRefresh?'최신 대화 기록을 다시 불러와 주세요.':abort.signal.aborted?'중단 요청을 보냈어요. 서버 상태를 다시 확인해 주세요.':'응답이 확정되지 않았어요. 같은 요청으로 다시 확인할 수 있어요.');}}
  finally{controller.current=null;lock.current=false;if(mounted.current)setBusy(false);}
  return completed;
 }
 return {view,loading,error,busy,preview,notice,reload,mutate,send,stop:()=>controller.current?.abort(),retry:()=>recovery.current.attempt?send(recovery.current.attempt.body,true):Promise.resolve(false),canRetry:recovery.current.attempt!==null,needsRefresh:recovery.current.needsRefresh,locked:recovery.current.locked};
}
function asError(value:unknown){return value instanceof Error?value:new Error('요청을 처리하지 못했어요.');}
function applyEvent(previous:StreamPreview,event:ChatEvent):StreamPreview{
 switch(event.type){case 'delta':return {...previous,text:previous.text+event.text};case 'image':return {...previous,images:[...previous.images,{url:event.url,alt:event.alt}]};case 'status':return {...previous,status:event.status};case 'ending':return {...previous,ending:{id:event.endingId,title:event.title}};default:return previous;}
}
