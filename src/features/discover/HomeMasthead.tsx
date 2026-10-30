import {useState} from 'react';
import {ArrowRight,ChevronLeft,ChevronRight} from 'lucide-react';
import type {PublicWorkDto} from '../../shared/contracts';
import {useReader} from './ReaderProvider';
export function HomeMasthead({works}:{works:PublicWorkDto[]}){
 const {href}=useReader();const [index,setIndex]=useState(0);const [failed,setFailed]=useState<string[]>([]);
 const featured=works.filter(work=>work.publishedVersionId&&work.coverUrl&&/^(https?:\/\/|\/[^/])/.test(work.coverUrl)&&!failed.includes(work.coverUrl)).slice(0,3);
 const count=featured.length+1;const current=index<count?index:0;const work=current?featured[current-1]:null;
 function move(direction:number){setIndex((current+direction+count)%count);}
 return <section className={`home-masthead ${work?'home-masthead--work':''}`} aria-label="Iruka와 작품 둘러보기" aria-roledescription="캐러셀">
  <img className="home-masthead-art" src={work?.coverUrl??'/brand/iruka-x-banner-ocean-formation.png'} alt="" key={work?.coverUrl??'brand'} onError={()=>{if(work?.coverUrl){setFailed(items=>[...items,work.coverUrl!]);setIndex(0);}}}/>
  <div className="home-masthead-shade"/>
  <div className="home-masthead-copy" aria-live="polite">
   <span className="home-masthead-label">{work?work.tags.slice(0,2).join(' · '):'IRUKA'}</span>
   {work?<h1 title={work.title}>{work.title}</h1>:<h1>어떤 이야기를<br/>시작할까요?</h1>}
   {work&&<p>{work.description}</p>}
   <a className="home-masthead-link" href={work?href(`/works/${encodeURIComponent(work.id)}`):'#home-works'}>{work?'작품 보기':'이야기 둘러보기'}<ArrowRight size={18} aria-hidden="true"/></a>
  </div>
  {count>1&&<div className="home-masthead-controls"><div className="home-masthead-dots">{Array.from({length:count},(_,i)=><button key={i} aria-label={`${i+1}번째 배너`} aria-pressed={current===i} onClick={()=>setIndex(i)}><span/></button>)}</div><span className="home-masthead-count">{current+1} / {count}</span><button onClick={()=>move(-1)} aria-label="이전 배너"><ChevronLeft size={18}/></button><button onClick={()=>move(1)} aria-label="다음 배너"><ChevronRight size={18}/></button></div>}
 </section>;
}
