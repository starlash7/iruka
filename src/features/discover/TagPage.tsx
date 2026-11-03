import type {RoutePageProps} from '../../routes/paths';
import {ReaderLayout} from './ReaderLayout';
import {CollectionHeading} from './CollectionHeading';
import {SearchForm,SearchResults} from './SearchPage';
export default function TagPage({params}:RoutePageProps){
 const search=new URLSearchParams(typeof window==='undefined'?'':window.location.search);
 const only=params.tag==='Iruka ONLY';
 const query=search.get('q')??'',mode=search.get('mode')??'';
 return <ReaderLayout active={only?'only':'search'}><div className="reader-content discovery-page"><CollectionHeading title={only?'Iruka ONLY':`#${params.tag}`} eyebrow="COLLECTION" description={only?'Iruka ONLY로 분류된 작품을 만나보세요.':'좋아하는 분위기로 이야기를 골라보세요.'}/><SearchForm initial={query} mode={mode} tag={params.tag}/><SearchResults query={query} tag={params.tag} mode={mode}/></div></ReaderLayout>;
}
