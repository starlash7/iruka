import type {RoutePageProps} from '../../routes/paths';
import {ArrowRight,Compass,Search,Trophy} from 'lucide-react';
import {ReaderLayout} from './ReaderLayout';
import {useReader} from './ReaderProvider';
import {usePages} from './usePages';
import {WorkPages} from './WorkPages';
import {ChatList} from '../chat/ChatList';
import {HomeSearch} from './HomeSearch';
import {HomeMasthead} from './HomeMasthead';
import './home-discovery.css';
export default function HomePage(_props:RoutePageProps){
 const {api,href}=useReader();const works=usePages(offset=>api.listWorks({offset}),[api],60,work=>work.id);const tags=[...new Set(works.data?.flatMap(work=>work.tags)??[])].slice(0,12);
 return <ReaderLayout headerSearch={<HomeSearch/>}><div className="reader-content discovery-page home-discovery">
  <HomeMasthead works={works.data??[]}/>
  <nav className="home-browse-nav" aria-label="작품 탐색"><a href={href('/')} aria-current="page"><Compass size={18}/>발견</a><a href={href('/ranking')}><Trophy size={18}/>랭킹</a><a href={href('/search')}><Search size={18}/>전체 작품</a></nav>
  <div className="home-tags" aria-label="장르와 태그"><a aria-current="page" href={href('/')}>전체</a>{tags.map(tag=><a key={tag} href={href(`/tags/${encodeURIComponent(tag)}`)}>{tag}</a>)}</div>
  <section className="home-work-collection" id="home-works" aria-labelledby="home-works-title"><div className="reader-section-heading"><h2 id="home-works-title">이야기 둘러보기</h2><a href={href('/search')}>전체 보기<ArrowRight size={16} aria-hidden="true"/></a></div>
   <WorkPages state={works} empty="공개된 작품이 아직 없어요."/>
  </section>
  <div className="reader-mobile-continue home-continue"><ChatList/></div>
 </div></ReaderLayout>;
}
