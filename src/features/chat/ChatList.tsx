import {ChevronRight} from 'lucide-react';
import {WorkCover} from '../discover/WorkGrid';
import {CollectionHeading} from '../discover/CollectionHeading';
import {useEffect,useState} from 'react';
import {useReader} from '../discover/ReaderProvider';
import {useResource} from '../discover/useResource';
import {ResourceState} from '../discover/ResourceState';
import {ReaderLayout} from '../discover/ReaderLayout';
import {ReaderSession} from '../discover/ReaderSession';
import {SignInNotice} from '../discover/SignInNotice';
import {ChatLibrary} from './ChatLibrary';
import {libraryChanged} from './libraryEvents';
export function ChatList({compact=false,hideWhenSignedOut=false}:{compact?:boolean;hideWhenSignedOut?:boolean}){
 return <ReaderSession>{session=>session.identity?<RecentChats key={session.identity} compact={compact}/>:compact||hideWhenSignedOut?null:<SignInNotice {...session}/>}</ReaderSession>;
}
function RecentChats({compact}:{compact:boolean}){
 const {api,href}=useReader();const [revision,setRevision]=useState(0);const state=useResource(()=>api.listChats({limit:compact?8:20}),[api,revision,compact]);
 useEffect(()=>{const update=()=>setRevision(value=>value+1);window.addEventListener(libraryChanged,update);return()=>window.removeEventListener(libraryChanged,update);},[]);
 return <section className="reader-chat-list" aria-label="이어하기"><h2>{compact?'최근 대화':'이어하기'}</h2>
  {state.loading||state.error?<ResourceState {...state} retry={state.reload}/>:!state.data?.length?<ResourceState empty="아직 시작한 대화가 없어요." artwork={compact?false:"conversations"}/>:
   <ul>{state.data.map(({chat,title,preview,coverUrl})=><li key={chat.id}><a href={href(`/chat/${encodeURIComponent(chat.id)}`)}><span className="reader-recent-cover" aria-hidden="true"><WorkCover url={coverUrl??null} title={title}/></span><span><strong>{title}</strong><small>{preview||'대화를 이어가세요'}</small></span><ChevronRight size={16} className="reader-recent-arrow" aria-hidden="true"/></a></li>)}</ul>}
 </section>;
}
export default function ChatListPage(){return <ReaderLayout active="chats"><div className="reader-content"><CollectionHeading title="내 대화" eyebrow="MY STORIES" description="함께 만든 이야기, 멈췄던 장면에서 이어가세요."/><ReaderSession>{session=>session.identity?<ChatLibrary key={session.identity}/>:<SignInNotice {...session}/>}</ReaderSession></div></ReaderLayout>;}
