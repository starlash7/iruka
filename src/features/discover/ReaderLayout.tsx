import type {ReactNode} from 'react';
import {Compass,MessageCircle,PenLine,Search,Trophy,UserRound} from 'lucide-react';
import {useReader} from './ReaderProvider';
import {ChatList} from '../chat/ChatList';
import './reader.css';
import {ReaderAccountMenu} from './ReaderAccountMenu';
export function ReaderLayout({children,active='discover',chat=false}:{children:ReactNode;active?:string;chat?:boolean}){
 const {href,development}=useReader();
 return <div className={`reader ${chat?'reader--chat':''}`}>
  {development&&<div className="reader-dev" role="status">개발 미리보기 · 테스트 응답</div>}
  <div className="reader-layout"><aside className="reader-sidebar"><a className="reader-wordmark" href={href('/')}><img src="/brand/iruka-logomark.svg" alt="" width="42" height="42"/><img className="reader-brand-name" src="/brand/iruka-wordmark.png" alt="Iruka" width="120" height="37"/><span>이야기가 이어지는 곳</span></a>
   <nav aria-label="작품 메뉴">{[{id:'discover',path:'/',label:'발견',Icon:Compass},{id:'ranking',path:'/ranking',label:'랭킹',Icon:Trophy},{id:'chats',path:'/chats',label:'내 대화',Icon:MessageCircle},{id:'studio',path:'/studio',label:'작품 만들기',Icon:PenLine}].map(({id,path,label,Icon})=><a key={id} href={href(path)} aria-current={active===id?'page':undefined}><Icon size={20}/>{label}</a>)}</nav>
   <ChatList compact/><a className="reader-account" href={href('/account')}><UserRound size={18}/>내 계정</a></aside>
   <div className="reader-main">{!chat&&<header className="reader-top"><a className="reader-mobile-brand" href={href('/')} aria-label="Iruka 홈"><img src="/brand/iruka-logomark.svg" alt="" width="32" height="32"/></a><nav aria-label="작품 유형"><a href={href('/')} aria-current={active==='discover'?'page':undefined}>전체</a><a href={href('/search?mode=story')}>스토리</a><a href={href('/search?mode=character')}>캐릭터</a></nav><div className="reader-top-actions"><a aria-label="작품 검색" href={href('/search')}><Search size={21}/></a><ReaderAccountMenu/></div></header>}
    {children}</div></div>
  <nav className="reader-mobile-nav" aria-label="모바일 메뉴"><a href={href('/')} aria-current={active==='discover'?'page':undefined}><Compass size={20}/>발견</a><a href={href('/ranking')} aria-current={active==='ranking'?'page':undefined}><Trophy size={20}/>랭킹</a><a href={href('/chats')} aria-current={active==='chats'?'page':undefined}><MessageCircle size={20}/>대화</a><a href={href('/studio')} aria-current={active==='studio'?'page':undefined}><PenLine size={20}/>만들기</a></nav>
 </div>;
}
