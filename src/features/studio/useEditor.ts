import {useCallback,useEffect,useRef,useState} from 'react';
import type {StudioClient} from './client';
import type {StudioDraft,StudioWork} from './types';
export function useEditor(client:StudioClient,id:string) {
 const [work,setWork]=useState<StudioWork|null>(null),[draft,setDraft]=useState<StudioDraft|null>(null);
 const [status,setStatus]=useState('불러오는 중…'),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const current=useRef<StudioDraft|null>(null),revision=useRef(0),saved=useRef('');
 const queue=useRef<Promise<unknown>>(Promise.resolve());
 const accept=useCallback((w:StudioWork)=>{setWork(w);setDraft(w.draft);current.current=w.draft;revision.current=w.revision;saved.current=JSON.stringify(w.draft);setStatus('저장됨');},[]);
 useEffect(()=>{let active=true;client.get(id).then(w=>{if(active)accept(w);}).catch(e=>{if(active){setError(e.message);setStatus('불러오기 실패');}});return()=>{active=false;};},[client,id,accept]);
 const save=useCallback(()=>{
  const operation=queue.current.catch(()=>{}).then(async()=>{
   const input=current.current;if(!input)throw new Error('작품을 먼저 불러와 주세요.');
   const signature=JSON.stringify(input);if(signature===saved.current)return revision.current;
   setStatus('저장 중…');setError('');
   const body=structuredClone(input);body.tags=body.tags.map(t=>t.trim()).filter(Boolean);
   body.privateConfig.lorebook.forEach(l=>{l.keywords=l.keywords.map(k=>k.trim()).filter(Boolean);});
   try {const result=await client.save({...body,revision:revision.current});revision.current=result.revision;saved.current=signature;setWork(result);setStatus(JSON.stringify(current.current)===signature?'저장됨':'저장 대기');return result.revision;}
   catch(e){setStatus('저장 실패');setError((e as Error).message);throw e;}
  });queue.current=operation;return operation;
 },[client]);
 useEffect(()=>{if(!draft||JSON.stringify(draft)===saved.current)return;const timer=setTimeout(()=>{void save().catch(()=>{});},700);return()=>clearTimeout(timer);},[draft,save]);
 useEffect(()=>{const leave=(e:BeforeUnloadEvent)=>{if(current.current&&JSON.stringify(current.current)!==saved.current){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',leave);return()=>window.removeEventListener('beforeunload',leave);},[]);
 const change=(fn:(d:StudioDraft)=>void)=>{if(!current.current)return;const next=structuredClone(current.current);fn(next);current.current=next;setDraft(next);setStatus('저장 대기');};
 async function publish(){setBusy(true);setError('');try{const rev=await save();await client.publish(id,rev);accept(await client.get(id));setStatus('발행됨');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function addAsset(code:string,label:string){setBusy(true);setError('');try{await save();const asset=await client.asset(id,code,label);setWork(w=>w?{...w,assets:[...w.assets,asset]}:w);change(d=>{d.assets??=[];d.assets.push({id:asset.id,code:asset.code});});await save();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return {work,draft,status,error,busy,change,save,publish,addAsset};
}
