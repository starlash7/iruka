import {useEffect,useRef,useState} from 'react';
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
import './chat.css';
export default function ChatPage({params}:RoutePageProps){
 const {api,href,navigate}=useReader();const session=useChatSession(api,params.chatId);const models=useResource(()=>api.getModels(),[api]);const balance=useResource(()=>api.getBalance(),[api]);
 const [model,setModel]=useState('');const [draft,setDraft]=useState('');const [panel,setPanel]=useState(false);const [action,setAction]=useState<{kind:'edit'|'delete';message:MessageDto}|null>(null);const composer=useRef<HTMLTextAreaElement>(null);
 const selected=models.data?.find(item=>item.id===(model||models.data?.find(item=>item.available)?.id));
 const insufficient=selected?.credits!==null&&selected?.credits!==undefined&&balance.data!==null&&balance.data.available<selected.credits;
 const disabled=session.busy||session.locked||!selected?.available||balance.loading||!!balance.error||insufficient;
 const pendingId=session.view?.pendingTurn?.id;
 const previousPending=useRef(pendingId);
 useEffect(()=>{if(previousPending.current&&!pendingId)balance.reload();previousPending.current=pendingId;},[pendingId]);
 useEffect(()=>{const viewport=window.visualViewport;const update=()=>document.documentElement.style.setProperty('--reader-viewport',`${viewport?.height??window.innerHeight}px`);update();viewport?.addEventListener('resize',update);return()=>{viewport?.removeEventListener('resize',update);document.documentElement.style.removeProperty('--reader-viewport');};},[]);
 async function send(){if(disabled||!draft.trim())return;const content=draft;const done=await session.send({content,parentMessageId:session.view?.chat.activeMessageId??null,model:selected!.id});if(done)setDraft('');balance.reload();requestAnimationFrame(()=>composer.current?.focus());}
 function onAction(kind:'edit'|'delete'|'regenerate'|'branch',message:MessageDto){
  if(kind==='edit'||kind==='delete'){setAction({kind,message});return;}
  if(kind==='branch'){if(api.branchChat)void session.mutate(async()=>{const view=await api.branchChat!(params.chatId,message.id);navigate(`/chat/${view.chat.id}`);return view;});return;}
  const parent=session.view?.messages.find(item=>item.id===message.parentMessageId);
  if(parent?.role==='user'&&selected&&!disabled)void session.send({content:parent.content,parentMessageId:parent.id,model:selected.id}).finally(balance.reload);
 }
 return <ReaderLayout active="chats" chat><div className="chat-room">
  <header className="chat-header"><a href={href('/chats')} aria-label="내 대화 목록">←</a><h1>{session.view?.title??'대화'}</h1><Button variant="ghost" onClick={()=>setPanel(value=>!value)} aria-expanded={panel}>대화 설정</Button></header>
  {session.loading&&!session.view?<ResourceState loading loadingText="대화 준비 중"/>:!session.view?<ResourceState error={session.error} retry={session.reload}/>:<>
  {panel&&<aside className="chat-settings"><h2>대화 설정</h2><MemoPanel key={session.view.chat.id} api={api} view={session.view}/><details><summary>플레이 가이드</summary><p className="reader-prose">{session.view.guide||'등록된 가이드가 없어요.'}</p></details></aside>}
  <MessageList messages={session.view.messages} activeId={session.view.chat.activeMessageId} preview={session.preview} busy={session.busy} actionsDisabled={session.locked} onAction={onAction} onSelect={id=>void session.mutate(()=>api.selectBranch(params.chatId,id))}/>
  <div className="chat-composer"><div className="chat-model-row"><label>모델 <select aria-label="대화 모델" value={selected?.id??''} disabled={session.busy||models.loading} onChange={event=>setModel(event.target.value)}>{models.data?.map(item=><option key={item.id} value={item.id} disabled={!item.available}>{item.name}{item.credits!==null?` · ${item.credits}`:''}</option>)}</select></label>{balance.data&&<span className="reader-balance">테스트 크레딧 {balance.data.available.toLocaleString()} 남음</span>}</div>
  {(models.error||balance.error)&&<ResourceState error={models.error||balance.error} retry={()=>{models.reload();balance.reload();}}/>}
  {insufficient&&<p role="alert" className="reader-error">테스트 크레딧이 부족해요. <a href={href('/credits')}>크레딧 확인</a></p>}
  {(session.error||session.canRetry||session.needsRefresh)&&!session.busy&&<div className="chat-inline-error" role="alert"><p>{session.error?.message??'이전 응답을 먼저 확인해 주세요.'}</p>{session.canRetry&&<Button variant="secondary" disabled={session.busy} onClick={()=>void session.retry().then(done=>{if(done)setDraft('');balance.reload();})}>같은 요청 다시 확인</Button>}<Button variant="ghost" disabled={session.busy} onClick={session.reload}>대화 새로고침</Button></div>}
  <span className="chat-announcement" role="status" aria-live="polite">{session.notice}</span>
  {session.view.messages.length<=1&&<div className="reader-chips chat-suggestions">{session.view.suggestedReplies.map(reply=><Button key={reply} variant="secondary" disabled={session.busy} onClick={()=>{setDraft(reply);composer.current?.focus();}}>{reply}</Button>)}</div>}
  <form onSubmit={event=>{event.preventDefault();void send();}}><textarea ref={composer} aria-label="메시지" placeholder="이야기를 이어가세요" value={draft} onChange={event=>setDraft(event.target.value)} maxLength={8000} rows={2} disabled={session.busy} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing&&event.keyCode!==229){event.preventDefault();void send();}}}/>{session.busy?<Button onClick={session.stop}>중단</Button>:<Button type="submit" disabled={disabled||!draft.trim()}>보내기</Button>}</form>
  </div></>}
  <MessageDialog action={action} busy={session.busy} onClose={()=>setAction(null)} onConfirm={async content=>{if(!action)return;const saved=await session.mutate(()=>action.kind==='edit'?api.editMessage(params.chatId,action.message.id,content):api.deleteMessage(params.chatId,action.message.id));if(saved)setAction(null);}}/>
 </div></ReaderLayout>;
}
