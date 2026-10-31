import {useRef,useState} from 'react';
import {MessageCircle} from 'lucide-react';
import {Button} from '../../ui';
import type {RoutePageProps} from '../../routes/paths';
import {ReaderLayout} from './ReaderLayout';
import {useReader} from './ReaderProvider';
import {useResource} from './useResource';
import {ResourceState} from './ResourceState';
import {WorkCover} from './WorkGrid';
import {StartChatSheet} from '../chat/StartChatSheet';
import './work-detail.css';

export default function WorkPage({params,authEnabled=false}:RoutePageProps){
 const {api,href}=useReader();
 const state=useResource(()=>api.getWork(params.id),[api,params.id]);
 const [starting,setStarting]=useState(false);
 const startButton=useRef<HTMLButtonElement|null>(null);
 function closeStart(){setStarting(false);requestAnimationFrame(()=>startButton.current?.focus());}
 const work=state.data;
 const sections=[
  {id:'work-introduction',label:'작품 소개',visible:true},
  {id:'work-characters',label:'등장인물',visible:!!work?.snapshot?.characters.length},
  {id:'work-openings',label:'시작 상황',visible:!!work?.snapshot?.openings.length},
  {id:'work-guide',label:'플레이 가이드',visible:!!work?.snapshot?.playGuide}
 ].filter(section=>section.visible);

 return <ReaderLayout active="work">
  <div className="reader-content discovery-page work-page">
   <a className="reader-back" href={href('/')}>← 작품 탐색</a>
   {state.loading||state.error?<><h1>작품 상세</h1><ResourceState {...state} retry={state.reload}/></>:work&&<>
    <section className="reader-work-detail">
     <div className="reader-detail-cover"><WorkCover key={work.coverUrl} url={work.coverUrl} title={work.title}/></div>
     <div className="work-overview">
      <h1>{work.title}</h1>
      {work.snapshot?.tagline&&<p className="reader-tagline">{work.snapshot.tagline}</p>}
      <div className="reader-chips">{work.tags.map(tag=><a key={tag} href={href(`/tags/${encodeURIComponent(tag)}`)}>#{tag}</a>)}</div>
      <div className="work-start-action">
       <Button onClick={event=>{startButton.current=event.currentTarget;event.currentTarget.focus();setStarting(true);}} disabled={!work.publishedVersionId} aria-describedby={!work.publishedVersionId?'work-start-unavailable':undefined}><MessageCircle size={18} aria-hidden="true"/>대화 시작</Button>
       {!work.publishedVersionId&&<p id="work-start-unavailable" className="reader-start-note">아직 발행되지 않은 작품이에요.</p>}
      </div>
     </div>
    </section>

    <nav className="work-section-nav" aria-label="작품 정보">{sections.map(section=><a key={section.id} href={`#${section.id}`}>{section.label}</a>)}</nav>
    <section className="reader-detail-section" id="work-introduction"><h2>작품 소개</h2><p className="reader-prose">{work.description}</p></section>
    {!!work.snapshot?.characters.length&&<section className="reader-detail-section" id="work-characters"><h2>등장인물</h2><div className="reader-characters">{work.snapshot.characters.map(character=><div key={character.id}><div className="reader-character-cover"><WorkCover url={character.imageUrl} title={character.name}/></div><strong>{character.name}</strong></div>)}</div></section>}
    {!!work.snapshot?.openings.length&&<section className="reader-detail-section" id="work-openings"><h2>시작 상황</h2>{work.snapshot.openings.map(opening=><details key={opening.id} open={opening===work.snapshot?.openings[0]||undefined}><summary>{opening.title}</summary><p className="reader-prose">{opening.prologue}</p></details>)}</section>}
    {work.snapshot?.playGuide&&<details className="reader-detail-section" id="work-guide"><summary>플레이 가이드</summary><p className="reader-prose">{work.snapshot.playGuide}</p></details>}
    <StartChatSheet open={starting} onClose={closeStart} work={work} authEnabled={authEnabled}/>
   </>}
  </div>
 </ReaderLayout>;
}
