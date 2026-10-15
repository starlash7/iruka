import {useReader} from '../discover/ReaderProvider';
import {useResource} from '../discover/useResource';
import {ResourceState} from '../discover/ResourceState';
import {ReaderLayout} from '../discover/ReaderLayout';
export function ChatList({compact=false}:{compact?:boolean}){
 const {api,href}=useReader();const state=useResource(()=>api.listChats(),[api]);
 return <section className="reader-chat-list" aria-label="이어하기"><h2>{compact?'최근 대화':'이어하기'}</h2>
  {state.loading||state.error?<ResourceState {...state} retry={state.reload}/>:!state.data?.length?<ResourceState empty="아직 시작한 대화가 없어요."/>:
   <ul>{state.data.map(({chat,title,preview})=><li key={chat.id}><a href={href(`/chat/${encodeURIComponent(chat.id)}`)}><span className="reader-avatar" aria-hidden="true">{title.slice(0,1)}</span><span><strong>{title}</strong><small>{preview||'대화를 이어가세요'}</small></span></a></li>)}</ul>}
 </section>;
}
export default function ChatListPage(){return <ReaderLayout active="chats"><div className="reader-content"><h1>내 대화</h1><ChatList/></div></ReaderLayout>;}
