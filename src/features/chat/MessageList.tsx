import {useEffect,useRef,useState} from 'react';
import {Button} from '../../ui';
import type {ReaderMessage as MessageDto} from '../discover/readerApi';
import {getMessageBranch,getSiblingMessages} from './messageTree';
import type {StreamPreview} from './useChatSession';
import {ChatImage} from './ChatImage';
export function MessageList({messages,activeId,preview,busy,actionsDisabled=false,onAction,onSelect}:{messages:MessageDto[];activeId:string|null;preview:StreamPreview;busy:boolean;actionsDisabled?:boolean;onAction:(kind:'edit'|'delete'|'regenerate'|'branch',message:MessageDto)=>void;onSelect:(id:string)=>void}){
 const viewport=useRef<HTMLDivElement>(null);const follow=useRef(true);const [below,setBelow]=useState(false);const branch=getMessageBranch(messages,activeId);
 function scrollToLatest(){viewport.current?.scrollTo({top:viewport.current.scrollHeight,behavior:'instant'});follow.current=true;setBelow(false);}
 useEffect(()=>{if(follow.current)scrollToLatest();else setBelow(true);},[activeId,preview.text,preview.images.length]);
 return <div className="chat-scroll-wrap"><div className="chat-messages" ref={viewport} tabIndex={0} aria-label="대화 내용" onScroll={()=>{const el=viewport.current;if(el){follow.current=el.scrollHeight-el.clientHeight-el.scrollTop<90;if(follow.current)setBelow(false);}}}>
  {!branch.length&&!busy&&<div className="reader-state">첫 메시지를 보내 이야기를 시작하세요.</div>}
  {branch.map(message=>{const siblings=getSiblingMessages(messages,message);return <article className={`chat-message chat-message--${message.role}`} key={message.id}>
   <div className="chat-speaker">{message.role==='user'?'나':'이야기'}</div><div className="chat-message-content"><Narrative content={message.content}/></div>
   {message.images?.map((image,index)=><ChatImage key={index} {...image}/>)}{message.status&&<details className="chat-status"><summary>상태창</summary><p>{message.status}</p></details>}{message.ending&&<section className="chat-ending"><span>ENDING</span><h2>{message.ending.title}</h2></section>}
   <div className="chat-message-tools">{message.role==='user'&&<Button variant="ghost" disabled={busy||actionsDisabled} onClick={event=>{event.currentTarget.focus();onAction('edit',message);}}>수정</Button>}<Button variant="ghost" disabled={busy||actionsDisabled} onClick={event=>{event.currentTarget.focus();onAction('delete',message);}}>삭제</Button><Button variant="ghost" disabled={busy||actionsDisabled} onClick={()=>onAction('branch',message)}>여기서 분기</Button>{message.role==='assistant'&&message.id===activeId&&messages.some(item=>item.id===message.parentMessageId&&item.role==='user')&&<Button variant="ghost" disabled={busy||actionsDisabled} onClick={()=>onAction('regenerate',message)}>재생성</Button>}</div>
   {siblings.length>1&&<div className="chat-branches" aria-label="응답 분기"><Button variant="ghost" disabled={busy||actionsDisabled||siblings[0].id===message.id} onClick={()=>onSelect(siblings[siblings.findIndex(item=>item.id===message.id)-1].id)}>이전</Button><span>{siblings.findIndex(item=>item.id===message.id)+1} / {siblings.length}</span><Button variant="ghost" disabled={busy||actionsDisabled||siblings.at(-1)?.id===message.id} onClick={()=>onSelect(siblings[siblings.findIndex(item=>item.id===message.id)+1].id)}>다음</Button></div>}
  </article>;})}
  {(busy||preview.text)&&<article className="chat-message"><div className="chat-speaker">{busy?'응답하는 중…':'미확정 응답'}</div><Narrative content={preview.text}/></article>}
  {preview.images.map((item,index)=><ChatImage key={`${item.url}-${index}`} {...item}/>)}
  {preview.status&&<details className="chat-status" open><summary>상태창</summary><p>{preview.status}</p></details>}
  {preview.ending&&<section className="chat-ending"><span>ENDING</span><h2>{preview.ending.title}</h2></section>}
 </div>{below&&<Button className="chat-latest" variant="secondary" onClick={scrollToLatest}>새 응답 ↓</Button>}</div>;
}
export function Narrative({content}:{content:string}){return <div className="chat-narrative">{content.split('\n').map((line,index)=>{const dialogue=/^@([^@\n]{1,50})@\s*(.*)$/.exec(line);return dialogue?<p key={index}><strong className="chat-character">{dialogue[1]}</strong>{dialogue[2]}</p>:<p key={index}>{line.startsWith('*')&&line.endsWith('*')?<em>{line.slice(1,-1)}</em>:line||'\u00a0'}</p>;})}</div>;}
