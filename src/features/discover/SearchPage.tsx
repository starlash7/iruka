import {useEffect,useState,type FormEvent} from 'react';
import {Search} from 'lucide-react';
import {Button,Input} from '../../ui';
import type {RoutePageProps} from '../../routes/paths';
import {ReaderLayout} from './ReaderLayout';
import {useReader} from './ReaderProvider';
import {usePages} from './usePages';
import {CollectionHeading} from './CollectionHeading';
import {WorkPages} from './WorkPages';
export function SearchForm({initial='',mode='',tag=''}:{initial?:string;mode?:string;tag?:string}){
 const {navigate}=useReader();const [query,setQuery]=useState(initial);
 useEffect(()=>setQuery(initial),[initial]);
 function submit(event:FormEvent){event.preventDefault();const params=new URLSearchParams();if(query.trim())params.set('q',query.trim());if(mode)params.set('mode',mode);if(tag)params.set('tag',tag);navigate(`/search?${params}`);}
 return <form className="reader-search" onSubmit={submit} role="search"><Search size={20} aria-hidden="true"/><Input label="작품 검색" value={query} onChange={event=>setQuery(event.target.value)} maxLength={200} placeholder="작품 이름, 마음에 드는 이야기"/><Button type="submit">검색</Button></form>;
}
export function SearchResults({query='',tag='',mode=''}:{query?:string;tag?:string;mode?:string}){
 const {api,href}=useReader();const state=usePages(offset=>api.listWorks({query,tag,mode,offset}),[api,query,tag,mode],60,work=>work.id);
 return <><div className="discovery-filters">{tag&&<a className="discovery-filter-tag" href={href(`/search?${new URLSearchParams({q:query,mode})}`)} aria-label={`${tag} 태그 해제`}>#{tag} ×</a>}<details className="discovery-type-filter" key={mode} open={!!mode}><summary>작품 유형{mode==='story'?' · 스토리':mode==='character'?' · 캐릭터':''}</summary><div className="reader-chips" aria-label="작품 유형">{[['','전체'],['story','스토리'],['character','캐릭터']].map(([value,label])=><a key={value} className={mode===value?'is-selected':''} aria-current={mode===value?'true':undefined} href={href(`/search?${new URLSearchParams({q:query,tag,mode:value})}`)}>{label}</a>)}</div></details></div>
 <WorkPages state={state} artwork="search" empty="조건에 맞는 작품이 없어요. 다른 검색어나 태그로 찾아보세요."/>{!state.loading&&!state.error&&!state.data?.length&&(query||tag||mode)&&<a className="discovery-filter-tag" href={href('/search')}>검색 조건 초기화</a>}</>;
}
export default function SearchPage(_props:RoutePageProps){const params=new URLSearchParams(typeof window==='undefined'?'':window.location.search);const query=params.get('q')??'',mode=params.get('mode')??'',tag=params.get('tag')??'';
 return <ReaderLayout active="search"><div className="reader-content discovery-page"><CollectionHeading title="어떤 이야기를 찾고 있나요?" eyebrow="DISCOVER" description="제목과 태그로 마음에 드는 작품을 찾아보세요."/><SearchForm initial={query} mode={mode} tag={tag}/><SearchResults query={query} mode={mode} tag={tag}/></div></ReaderLayout>;
}
