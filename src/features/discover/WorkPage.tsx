import {useState} from 'react';
import {Button} from '../../ui';
import type {RoutePageProps} from '../../routes/paths';
import {ReaderLayout} from './ReaderLayout';
import {useReader} from './ReaderProvider';
import {useResource} from './useResource';
import {ResourceState} from './ResourceState';
import {WorkCover} from './WorkGrid';
import {StartChatSheet} from '../chat/StartChatSheet';
export default function WorkPage({params}:RoutePageProps){
 const {api,href}=useReader();const state=useResource(()=>api.getWork(params.id),[api,params.id]);const [starting,setStarting]=useState(false);const work=state.data;
 return <ReaderLayout active="work"><div className="reader-content discovery-page"><a className="reader-back" href={href('/')}>← 작품 탐색</a>
 {state.loading||state.error?<><h1>작품 상세</h1><ResourceState {...state} retry={state.reload}/></>:work&&<>
 <section className="reader-work-detail"><div className="reader-detail-cover"><WorkCover key={work.coverUrl} url={work.coverUrl} title={work.title}/></div><div><h1>{work.title}</h1>{work.snapshot?.tagline&&<p className="reader-tagline">{work.snapshot.tagline}</p>}<div className="reader-chips">{work.tags.map(tag=><a key={tag} href={href(`/tags/${encodeURIComponent(tag)}`)}>#{tag}</a>)}</div><Button onClick={event=>{event.currentTarget.focus();setStarting(true);}} disabled={!work.publishedVersionId}>대화 시작</Button></div></section>
 <section className="reader-detail-section"><h2>작품 소개</h2><p className="reader-prose">{work.description}</p></section>
 {!!work.snapshot?.characters.length&&<section className="reader-detail-section"><h2>등장인물</h2><div className="reader-characters">{work.snapshot.characters.map(character=><div key={character.id}><div className="reader-character-cover"><WorkCover url={character.imageUrl} title={character.name}/></div><strong>{character.name}</strong></div>)}</div></section>}
 {!!work.snapshot?.openings.length&&<section className="reader-detail-section"><h2>시작 상황</h2>{work.snapshot.openings.map(opening=><details key={opening.id} open={opening===work.snapshot?.openings[0]||undefined}><summary>{opening.title}</summary><p className="reader-prose">{opening.prologue}</p></details>)}</section>}
 {work.snapshot?.playGuide&&<details className="reader-detail-section"><summary>플레이 가이드</summary><p className="reader-prose">{work.snapshot.playGuide}</p></details>}
 <StartChatSheet open={starting} onClose={()=>setStarting(false)} work={work}/></>}
 </div></ReaderLayout>;
}
