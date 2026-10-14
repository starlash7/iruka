import {useEffect,useMemo,useState} from 'react';
import {Page,Button,EmptyState} from '../../ui';
import {AuthActions} from '../../AuthActions';
import type {RoutePageProps} from '../../routes/paths';
import {createStudioClient} from './client';
import {makeDraft} from './draft';
import './studio.css';
import {StudioSession} from './StudioSession';
export default function StudioPage({authEnabled=false}:RoutePageProps) {
 return <StudioSession enabled={authEnabled}>{identity=><StudioList key={identity} authEnabled={authEnabled}/>}</StudioSession>;
}
function StudioList({authEnabled}:{authEnabled:boolean}) {
 const client=useMemo(()=>createStudioClient(authEnabled),[authEnabled]);
 const [works,setWorks]=useState<Awaited<ReturnType<typeof client.list>>>([]);
 const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [creating,setCreating]=useState(false);
 useEffect(()=>{let active=true;client.list().then(v=>{if(active)setWorks(v);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[client]);
 async function createWork(){setCreating(true);setError('');try{const work=await client.save(makeDraft());window.location.assign(`/studio/${work.work.id}`);}catch(e){setError((e as Error).message);setCreating(false);}}
 return <Page title="내 작품" description="캐릭터와 스토리를 만드는 공간이에요.">
  <div className="studio-toolbar"><Button disabled={!authEnabled||creating||loading} onClick={createWork}>{creating?'만드는 중…':'새 작품'}</Button><AuthActions enabled={authEnabled}/></div>
  {error&&<p role="alert">{error}</p>}{loading&&<p role="status">불러오는 중…</p>}
  {!loading&&!error&&!works.length&&<EmptyState title="첫 작품을 만들어 보세요" description="캐릭터 또는 스토리로 시작할 수 있어요."/>}
  <div className="studio-list">{works.map(w=><a className="studio-work" key={w.id} href={`/studio/${w.id}`}><span>{w.mode==='story'?'스토리':'캐릭터'} · {w.published?'발행됨':'초안'}</span><h2>{w.title||'제목 없는 작품'}</h2><span>편집하기 →</span></a>)}</div>
 </Page>;
}
