import type {RoutePageProps} from '../../routes/paths';
import {ReaderLayout} from './ReaderLayout';
import {useReader} from './ReaderProvider';
import {useResource} from './useResource';
import {ResourceState} from './ResourceState';
import {CollectionHeading} from './CollectionHeading';
import {WorkGrid} from './WorkGrid';
export default function RankingPage(_props:RoutePageProps){const {api}=useReader();const state=useResource(()=>api.getRanking(),[api]);return <ReaderLayout active="ranking"><div className="reader-content discovery-page"><CollectionHeading title="지금, 많이 만나는 이야기" eyebrow="RANKING" description="최근 7일 · 대화 생성에 성공한 이용자 수 기준"/>{state.loading||state.error?<ResourceState {...state} retry={state.reload}/>:state.data?.length?<WorkGrid works={state.data} ranked/>:<ResourceState empty="아직 집계된 랭킹이 없어요."/>}</div></ReaderLayout>;}
