import type {ReactNode} from 'react';
import {Compass,MessageCircle,PenLine,Search,Trophy,UserRound} from 'lucide-react';
import {useReader} from './ReaderProvider';
import {ChatList} from '../chat/ChatList';
import './reader.css';
export function ReaderLayout({children,active='discover',chat=false}:{children:ReactNode;active?:string;chat?:boolean}){
 const {href,development}=useReader();
 return <div className={`reader ${chat?'reader--chat':''}`}>
  {development&&<div className="reader-dev" role="status">개발 미리보기 · 테스트 응답</div>}
  <div className="reader-layout"><aside className="reader-sidebar"><a className="reader-wordmark" href={href('/')}>Iruka<span>이야기가 이어지는 곳</span></a>
   <nav aria-label="작품 메뉴">{[{id:'discover',path:'/',label:'발견',Icon:Compass},{id:'ranking',path:'/ranking',label:'랭킹',Icon:Trophy},{id:'chats',path:'/chats',label:'내 대화',Icon:MessageCircle},{id:'studio',path:'/studio',label:'작품 만들기',Icon:PenLine}].map(({id,path,label,Icon})=><a key={id} href={href(path)} aria-current={active===id?'page':undefined}><Icon size={20}/>{label}</a>)}</nav>
   <ChatList compact/><a className="reader-account" href={href('/account')}><UserRound size={18}/>내 계정</a></aside>
   <div className="reader-main">{!chat&&<header className="reader-top"><nav aria-label="작품 유형"><a href={href('/')} aria-current={active==='discover'?'page':undefined}>전체</a><a href={href('/search?mode=story')}>스토리</a><a href={href('/search?mode=character')}>캐릭터</a></nav><div className="reader-top-actions"><a aria-label="작품 검색" href={href('/search')}><Search size={21}/></a><a aria-label="내 계정" href={href('/account')}><UserRound size={21}/></a></div></header>}
    {children}</div></div>
  <nav className="reader-mobile-nav" aria-label="모바일 메뉴"><a href={href('/')}><Compass size={20}/>발견</a><a href={href('/ranking')}><Trophy size={20}/>랭킹</a><a href={href('/chats')}><MessageCircle size={20}/>대화</a><a href={href('/studio')}><PenLine size={20}/>만들기</a></nav>
 </div>;
}
