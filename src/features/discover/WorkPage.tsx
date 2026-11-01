import {useRef,useState} from 'react';
import type {RoutePageProps} from '../../routes/paths';
import {ReaderLayout} from './ReaderLayout';
import {useReader} from './ReaderProvider';
import {useResource} from './useResource';
import {ResourceState} from './ResourceState';
import {WorkCover} from './WorkGrid';
import {StartChatSheet} from '../chat/StartChatSheet';
import {WorkConversationActions} from './WorkConversationActions';
import {WorkFavorite} from './WorkFavorite';
import {WorkPresentation} from './WorkPresentation';
import {WorkTags} from './WorkTags';
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
  {id:'work-gallery',label:'작품 이미지',visible:!!work?.snapshot?.gallery?.some(item=>!item.introduction)},
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
      {work.creatorName&&<p className="work-creator">제작 · {work.creatorName}</p>}
      {work.snapshot?.tagline&&<p className="reader-tagline">{work.snapshot.tagline}</p>}
      <WorkTags tags={work.tags}/>
      <WorkFavorite workId={work.id} authEnabled={authEnabled}/>
      <div className="work-start-action">
       <WorkConversationActions workId={work.id} published={!!work.publishedVersionId} authEnabled={authEnabled} onStart={button=>{startButton.current=button;setStarting(true);}}/>
       {!work.publishedVersionId&&<p id="work-start-unavailable" className="reader-start-note">아직 발행되지 않은 작품이에요.</p>}
      </div>
     </div>
    </section>

    <nav className="work-section-nav" aria-label="작품 정보">{sections.map(section=><a key={section.id} href={`#${section.id}`}>{section.label}</a>)}</nav>
    <WorkPresentation work={work}/>
    <StartChatSheet open={starting} onClose={closeStart} work={work} authEnabled={authEnabled}/>
   </>}
  </div>
 </ReaderLayout>;
}
