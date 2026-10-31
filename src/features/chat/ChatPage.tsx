import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {Button} from '../../ui';
import type {RoutePageProps} from '../../routes/paths';
import type {MessageDto} from '../../shared/contracts';
import {ReaderLayout} from '../discover/ReaderLayout';
import {useReader} from '../discover/ReaderProvider';
import {useResource} from '../discover/useResource';
import {ResourceState} from '../discover/ResourceState';
import {useChatSession} from './useChatSession';
import {MessageList} from './MessageList';
import {MemoPanel,MessageDialog} from './ChatPanels';
import {MessageSearch} from './MessageSearch';
import {ReadingSettings} from './ReadingSettings';
import {defaultReading,readReading,findMessages} from './reading';
import {getMessageBranch} from './messageTree';
import {ReaderSession} from '../discover/ReaderSession';
import {SignInNotice} from '../discover/SignInNotice';
import './chat.css';
export default function ChatPage(props:RoutePageProps){return <ReaderSession enabled={props.authEnabled}>{session=>session.identity?<ChatRoom key={`${session.identity}:${props.params.chatId}`} {...props}/>:<ReaderLayout active="chats" chat><div className="reader-content"><h1>대화</h1><SignInNotice {...session}/></div></ReaderLayout>}</ReaderSession>;}
export function ChatRoom({params}:RoutePageProps){
 const {api,href,navigate}=useReader();const session=useChatSession(api,params.chatId);const models=useResource(()=>api.getModels(),[api]);const balance=useResource(()=>api.getBalance(),[api]);
 const [model,setModel]=useState('');const [draft,setDraft]=useState('');const [panel,setPanel]=useState(false);const [action,setAction]=useState<{kind:'edit'|'delete';message:MessageDto}|null>(null);const composer=useRef<HTMLTextAreaElement>(null);
 const [mutationError,setMutationError]=useState<Error|null>(null);
 const [reading,setReading]=useState(()=>{try{return readReading(window.localStorage);}catch{return {...defaultReading};}});
 const [searchOpen,setSearchOpen]=useState(false),[query,setQuery]=useState(''),[hit,setHit]=useState(0);const searchButton=useRef<HTMLButtonElement>(null);
 const hits=session.view?findMessages(getMessageBranch(session.view.messages,session.view.chat.activeMessageId),query):[];
 const hitIndex=hits.length?hit%hits.length:0;
 function closeSearch(){setSearchOpen(false);setQuery('');setHit(0);searchButton.current?.focus();}
 const selected=models.data?.find(item=>item.id===(model||models.data?.find(item=>item.available)?.id));
 const insufficient=selected?.credits!==null&&selected?.credits!==undefined&&balance.data!==null&&balance.data.available<selected.credits;
 const pendingId=session.view?.pendingTurn?.id;
 const generationDisabledReason=session.busy?'요청을 처리하고 있어요.':pendingId?'이전 응답을 처리하고 있어요. 상태를 자동으로 확인하고 있어요.':session.locked?'이전 응답을 먼저 확인해 주세요.':models.loading?'모델을 확인하고 있어요.':models.error?'모델을 불러오지 못했어요.':!selected?.available?'지금 사용할 수 있는 모델이 없어요.':balance.loading?'테스트 크레딧을 확인하고 있어요.':balance.error?'테스트 크레딧을 불러오지 못했어요.':insufficient?'테스트 크레딧이 부족해요.':null;
 const disabled=!!generationDisabledReason;
 const previousPending=useRef(pendingId);
 useEffect(()=>{if(previousPending.current&&!pendingId)balance.reload();previousPending.current=pendingId;},[pendingId]);
 useEffect(()=>{const viewport=window.visualViewport;const update=()=>document.documentElement.style.setProperty('--reader-viewport',`${viewport?.height??window.innerHeight}px`);update();viewport?.addEventListener('resize',update);return()=>{viewport?.removeEventListener('resize',update);document.documentElement.style.removeProperty('--reader-viewport');};},[]);
 async function send(){if(disabled||!draft.trim())return;const content=draft;const done=await session.send({content,parentMessageId:session.view?.chat.activeMessageId??null,model:selected!.id});if(done)setDraft('');balance.reload();requestAnimationFrame(()=>composer.current?.focus());}
 function onAction(kind:'edit'|'delete'|'regenerate'|'branch',message:MessageDto){
  if(kind==='edit'||kind==='delete'){setMutationError(null);setAction({kind,message});return;}
  if(kind==='branch'){if(api.branchChat)void session.mutate(async()=>{const view=await api.branchChat!(params.chatId,message.id);navigate(`/chat/${view.chat.id}`);return view;});return;}
  const parent=session.view?.messages.find(item=>item.id===message.parentMessageId);
  if(parent?.role==='user'&&selected&&!disabled)void session.send({content:parent.content,parentMessageId:parent.id,model:selected.id}).finally(balance.reload);
 }
 return <ReaderLayout active="chats" chat><div className="chat-room" style={{'--chat-font-size':`${reading.fontSize}px`,'--chat-line-height':reading.lineHeight} as CSSProperties}>
  <header className="chat-header"><a href={href('/chats')} aria-label="내 대화 목록">←</a><h1>{session.view?.title??'대화'}</h1><button ref={searchButton} type="button" className="ui-button ui-button--ghost" aria-expanded={searchOpen} onClick={()=>searchOpen?closeSearch():setSearchOpen(true)}>검색</button><Button variant="ghost" onClick={()=>setPanel(value=>!value)} aria-expanded={panel}>대화 설정</Button></header>
  {session.loading&&!session.view?<ResourceState loading loadingText="대화 준비 중"/>:!session.view?<ResourceState error={session.error} retry={session.reload}/>:<>
  {panel&&<aside className="chat-settings"><h2>대화 설정</h2><ReadingSettings value={reading} onChange={setReading}/><MemoPanel key={session.view.chat.id} api={api} view={session.view}/><details><summary>플레이 가이드</summary><p className="reader-prose">{session.view.guide||'등록된 가이드가 없어요.'}</p></details></aside>}
  {searchOpen&&<MessageSearch query={query} onQuery={value=>{setQuery(value);setHit(0);}} index={hitIndex} count={hits.length} onStep={step=>{if(hits.length)setHit((hitIndex+step+hits.length)%hits.length);}} onClose={closeSearch}/>}
  <MessageList characters={session.view.characters} messages={session.view.messages} activeId={session.view.chat.activeMessageId} preview={session.preview} busy={session.busy} actionsDisabled={session.locked} regenerateDisabledReason={generationDisabledReason} onAction={onAction} onSelect={id=>void session.mutate(()=>api.selectBranch(params.chatId,id))} search={searchOpen?query:''} searchId={searchOpen?hits[hitIndex]??null:null}/>
  <div className="chat-composer"><div className="chat-model-row"><label>모델 <select aria-label="대화 모델" value={selected?.id??''} disabled={session.busy||models.loading} onChange={event=>setModel(event.target.value)}>{models.data?.map(item=><option key={item.id} value={item.id} disabled={!item.available}>{item.name}{item.credits!==null?` · ${item.credits}`:''}</option>)}</select></label>{balance.data&&<span className="reader-balance">테스트 크레딧 {balance.data.available.toLocaleString()} 남음</span>}</div>
  {(models.error||balance.error)&&<ResourceState error={models.error||balance.error} retry={()=>{models.reload();balance.reload();}}/>}
  {generationDisabledReason&&<p id="chat-generation-status" role="status">{generationDisabledReason}{insufficient&&<> <a href={href('/credits')}>크레딧 확인</a></>}</p>}
  {(session.error||session.canRetry||session.needsRefresh)&&!session.busy&&<div className="chat-inline-error" role="alert"><p>{session.error?.message??'이전 응답을 먼저 확인해 주세요.'}</p>{session.canRetry&&<Button variant="secondary" disabled={session.busy} onClick={()=>void session.retry().then(done=>{if(done)setDraft('');balance.reload();})}>같은 요청 다시 확인</Button>}<Button variant="ghost" disabled={session.busy} onClick={session.reload}>대화 새로고침</Button></div>}
  <span className="chat-announcement" role="status" aria-live="polite">{session.notice}</span>
  {session.view.messages.length<=1&&<div className="reader-chips chat-suggestions">{session.view.suggestedReplies.map(reply=><Button key={reply} variant="secondary" disabled={session.busy} onClick={()=>{setDraft(reply);composer.current?.focus();}}>{reply}</Button>)}</div>}
  <form onSubmit={event=>{event.preventDefault();void send();}}><textarea ref={composer} aria-label="메시지" placeholder="이야기를 이어가세요" value={draft} onChange={event=>setDraft(event.target.value)} maxLength={8000} rows={2} disabled={session.busy} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing&&event.keyCode!==229){event.preventDefault();void send();}}}/>{session.busy?<Button onClick={session.stop}>중단</Button>:<Button type="submit" disabled={disabled||!draft.trim()}>보내기</Button>}</form>
  </div></>}
  <MessageDialog action={action} busy={session.busy} error={mutationError} onClose={()=>setAction(null)} onConfirm={async content=>{if(!action)return;setMutationError(null);const saved=await session.mutate(async()=>{try{return await (action.kind==='edit'?api.editMessage(params.chatId,action.message.id,content):api.deleteMessage(params.chatId,action.message.id));}catch(error){setMutationError(error instanceof Error?error:new Error('요청을 처리하지 못했어요.'));throw error;}});if(saved)setAction(null);}}/>
 </div></ReaderLayout>;
}
