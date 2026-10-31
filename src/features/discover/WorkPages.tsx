import type {PublicWorkDto} from '../../shared/contracts';
import {Button} from '../../ui';
import {ResourceState} from './ResourceState';
import {WorkGrid,WorkGridLoading} from './WorkGrid';
import type {usePages} from './usePages';

export function WorkPages({state,empty}:{state:ReturnType<typeof usePages<PublicWorkDto>>;empty:string}){
 return <>{state.loading?<WorkGridLoading/>:state.error?<ResourceState {...state} retry={state.reload}/>:state.data?.length?<WorkGrid works={state.data}/>:<ResourceState empty={empty}/>}
 {state.moreError&&<p role="alert">{state.moreError.message}</p>}
 {state.hasMore&&<div className="reader-load-more"><Button variant="secondary" disabled={state.loadingMore} onClick={()=>void state.loadMore()}>{state.loadingMore?'불러오는 중…':state.moreError?'추가 불러오기 다시 시도':'작품 더 보기'}</Button></div>}</>;
}
