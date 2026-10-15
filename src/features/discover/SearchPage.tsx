import {useState,type FormEvent} from 'react';
import {Search} from 'lucide-react';
import {Button,Input} from '../../ui';
import type {RoutePageProps} from '../../routes/paths';
import {ReaderLayout} from './ReaderLayout';
import {useReader} from './ReaderProvider';
import {useResource} from './useResource';
import {ResourceState} from './ResourceState';
import {WorkGrid} from './WorkGrid';
export function SearchForm({initial='',mode='',tag=''}:{initial?:string;mode?:string;tag?:string}){
 const {navigate}=useReader();const [query,setQuery]=useState(initial);
 function submit(event:FormEvent){event.preventDefault();const params=new URLSearchParams();if(query.trim())params.set('q',query.trim());if(mode)params.set('mode',mode);if(tag)params.set('tag',tag);navigate(`/search?${params}`);}
 return <form className="reader-search" onSubmit={submit} role="search"><Search size={20} aria-hidden="true"/><Input label="작품 검색" value={query} onChange={event=>setQuery(event.target.value)} maxLength={200} placeholder="작품 이름, 마음에 드는 이야기"/><Button type="submit">검색</Button></form>;
}
export function SearchResults({query='',tag='',mode=''}:{query?:string;tag?:string;mode?:string}){
 const {api,href}=useReader();const state=useResource(()=>api.listWorks({query,tag,mode}),[api,query,tag,mode]);
 return <><div className="reader-chips" aria-label="작품 유형">{[['','전체'],['story','스토리'],['character','캐릭터']].map(([value,label])=><a key={value} className={mode===value?'is-selected':''} href={href(`/search?${new URLSearchParams({q:query,tag,mode:value})}`)}>{label}</a>)}</div>
 {state.loading||state.error?<ResourceState {...state} retry={state.reload}/>:state.data?.length?<WorkGrid works={state.data}/>:<ResourceState empty="조건에 맞는 작품이 없어요. 다른 검색어나 태그로 찾아보세요."/>}</>;
}
export default function SearchPage(_props:RoutePageProps){const params=new URLSearchParams(typeof window==='undefined'?'':window.location.search);const query=params.get('q')??'',mode=params.get('mode')??'',tag=params.get('tag')??'';
 return <ReaderLayout><div className="reader-content"><h1>작품 검색</h1><SearchForm initial={query} mode={mode} tag={tag}/>{tag&&<p>#{tag}</p>}<SearchResults query={query} mode={mode} tag={tag}/></div></ReaderLayout>;
}
