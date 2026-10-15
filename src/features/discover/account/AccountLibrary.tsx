import {useState} from 'react';
import {useReader} from '../ReaderProvider';
import {useResource} from '../useResource';
import {ResourceState} from '../ResourceState';
import {WorkCover} from '../WorkGrid';
import type {ChatSummary} from '../readerApi';

export function getLibraryWorks(chats:ChatSummary[]){
 return [...new Map(chats.map(item=>[item.chat.workId,item])).values()];
}
export function AccountLibrary(){
 const {api,href}=useReader();const state=useResource(()=>api.listChats(),[api]);
 const [tab,setTab]=useState<'works'|'chats'>('works');
 const items=state.data??[];
 return <section className="restored-collection" id="account-inventory">
  <h2><img src="/assets/iruka-icon-inventory.png" alt=""/>작품·대화 보관함</h2>
  <div className="account-library-tabs" role="group" aria-label="보관함 보기">
   <button type="button" aria-pressed={tab==='works'} onClick={()=>setTab('works')}>대화한 작품</button>
   <button type="button" aria-pressed={tab==='chats'} onClick={()=>setTab('chats')}>내 대화</button>
  </div>
  {state.loading||state.error?<ResourceState {...state} retry={state.reload}/>:!items.length?<><ResourceState empty="아직 시작한 대화가 없어요."/><a href={href('/')}>작품 둘러보기</a></>:tab==='works'?
   <div className="reader-work-grid">{getLibraryWorks(items).map(({chat,title,coverUrl})=><article key={chat.workId}><a href={href(`/works/${encodeURIComponent(chat.workId)}`)}><div className="reader-cover"><WorkCover url={coverUrl} title={title}/></div><h3>{title}</h3></a></article>)}</div>:
   <ul className="account-library-chats">{items.map(({chat,title,preview,coverUrl})=><li key={chat.id}><a href={href(`/chat/${encodeURIComponent(chat.id)}`)}><div className="reader-cover"><WorkCover url={coverUrl} title={title}/></div><span><strong>{title}</strong><small>{preview||'대화 이어하기'}</small></span></a></li>)}</ul>}
 </section>;
}
