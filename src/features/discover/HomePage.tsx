import type {RoutePageProps} from '../../routes/paths';
import {ReaderLayout} from './ReaderLayout';
import {useReader} from './ReaderProvider';
import {useResource} from './useResource';
import {ResourceState} from './ResourceState';
import {WorkGrid} from './WorkGrid';
import {ChatList} from '../chat/ChatList';
import {SearchForm} from './SearchPage';
export default function HomePage(_props:RoutePageProps){
 const {api,href}=useReader();const works=useResource(()=>api.listWorks(),[api]);const tags=[...new Set(works.data?.flatMap(work=>work.tags)??[])];
 return <ReaderLayout><div className="reader-content discovery-page"><div className="reader-title"><h1>어떤 이야기를 시작할까요?</h1></div><SearchForm/>
  <div className="reader-chips" aria-label="장르와 태그"><a className="is-selected" href={href('/')}>전체</a>{tags.map(tag=><a key={tag} href={href(`/tags/${encodeURIComponent(tag)}`)}>{tag}</a>)}</div>
  <div className="reader-mobile-continue"><ChatList/></div>
  <section><div className="reader-section-heading"><h2>공개 작품</h2><a href={href('/search')}>전체 보기 →</a></div>
   {works.loading||works.error?<ResourceState {...works} retry={works.reload}/>:works.data?.length?<WorkGrid works={works.data}/>:<ResourceState empty="공개된 작품이 아직 없어요."/>}
  </section>
 </div></ReaderLayout>;
}
