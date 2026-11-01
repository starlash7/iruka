import {useEffect,useMemo,useState} from 'react';
import {Page,Button} from '../../ui';
import type {RoutePageProps} from '../../routes/paths';
import {createStudioClient} from './client';
import {makeDraft} from './draft';
import './studio.css';
import {StudioSession} from './StudioSession';
import {StoredImage} from './ImageField';
import {BookOpen,Plus,ArrowUpRight} from 'lucide-react';
import {StateArtwork} from '../../ui/StateArtwork';
export default function StudioPage({authEnabled=false}:RoutePageProps) {
 return <StudioSession enabled={authEnabled}>{identity=><StudioList key={identity} authEnabled={authEnabled}/>}</StudioSession>;
}
function StudioList({authEnabled}:{authEnabled:boolean}) {
 const client=useMemo(()=>createStudioClient(authEnabled),[authEnabled]);
 const [works,setWorks]=useState<Awaited<ReturnType<typeof client.list>>>([]);
 const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [creating,setCreating]=useState(false);
 const [filter,setFilter]=useState('all'),[query,setQuery]=useState('');
 const visible=works.filter(work=>(filter==='all'||(filter==='published'?work.published:!work.published))&&work.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
 useEffect(()=>{let active=true;client.list().then(v=>{if(active)setWorks(v);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[client]);
 async function createWork(){setCreating(true);setError('');try{const work=await client.save(makeDraft());window.location.assign(`/studio/${work.work.id}`);}catch(e){setError((e as Error).message);setCreating(false);}}
 return <Page className="studio-list-page" title="내 작품" description="상상한 세계를 한 장면씩 완성해 보세요." actions={<Button disabled={!authEnabled||creating||loading} onClick={createWork}><Plus size={18}/>{creating?'만드는 중…':'새 작품'}</Button>}>
  {error&&<p role="alert">{error}</p>}{loading&&<p role="status">불러오는 중…</p>}
  {!loading&&!error&&!works.length&&<StudioEmpty title="첫 작품을 만들어 보세요" description="캐릭터 또는 스토리로 시작할 수 있어요."/>}
  <div className="studio-list-controls"><div className="studio-status-filter" aria-label="작품 상태">{[['all','전체'],['published','발행됨'],['draft','초안']].map(([value,label])=><Button key={value} variant="ghost" aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}</Button>)}</div><label className="studio-field">내 작품 검색<input type="search" value={query} maxLength={100} placeholder="작품 이름" onChange={event=>setQuery(event.target.value)}/></label></div>
  {!loading&&!error&&!!works.length&&!visible.length&&<StudioEmpty title="조건에 맞는 작품이 없어요" description="검색어나 작품 상태를 바꿔 보세요."/>}
  <div className="studio-work-list">{visible.map(w=><a className="studio-work" key={w.id} href={`/studio/${encodeURIComponent(w.id)}`}><div className="studio-work-cover">{w.coverUrl?<StoredImage url={w.coverUrl} alt="" client={client}/>:<span><BookOpen size={26}/>표지 없음</span>}</div><div className="studio-work-copy"><span className="studio-work-state">{w.published?'발행됨':'초안'}</span><h2>{w.title||'제목 없는 작품'}</h2>{w.updatedAt&&<time dateTime={w.updatedAt}>{new Date(w.updatedAt).toLocaleDateString('ko-KR')} 수정</time>}<span className="studio-work-edit">편집하기<ArrowUpRight size={16}/></span></div></a>)}</div>
 </Page>;
}

function StudioEmpty({title,description}:{title:string;description:string}){return <div className="studio-empty" role="status"><StateArtwork/><h2>{title}</h2><p>{description}</p></div>;}
