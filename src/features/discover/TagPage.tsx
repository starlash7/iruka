import type {RoutePageProps} from '../../routes/paths';
import {ReaderLayout} from './ReaderLayout';
import {SearchForm,SearchResults} from './SearchPage';
export default function TagPage({params}:RoutePageProps){
 const search=new URLSearchParams(typeof window==='undefined'?'':window.location.search);
 const query=search.get('q')??'',mode=search.get('mode')??'';
 return <ReaderLayout active="search"><div className="reader-content discovery-page"><h1>#{params.tag}</h1><SearchForm initial={query} mode={mode} tag={params.tag}/><SearchResults query={query} tag={params.tag} mode={mode}/></div></ReaderLayout>;
}
