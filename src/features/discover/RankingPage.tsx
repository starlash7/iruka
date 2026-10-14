import type {RoutePageProps} from '../../routes/paths';
import {ReaderLayout} from './ReaderLayout';
import {useReader} from './ReaderProvider';
import {useResource} from './useResource';
import {ResourceState} from './ResourceState';
import {WorkGrid} from './WorkGrid';
export default function RankingPage(_props:RoutePageProps){const {api}=useReader();const state=useResource(()=>api.getRanking(),[api]);return <ReaderLayout active="ranking"><div className="reader-content"><h1>랭킹</h1><p>실제 대화 기록으로 만나는 작품</p>{state.loading||state.error?<ResourceState {...state} retry={state.reload}/>:state.data?.length?<WorkGrid works={state.data} ranked/>:<ResourceState empty="아직 집계된 랭킹이 없어요."/>}</div></ReaderLayout>;}
