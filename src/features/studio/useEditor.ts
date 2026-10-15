import {useCallback,useEffect,useRef,useState} from 'react';
import type {StudioClient} from './client';
import type {StudioDraft,StudioWork} from './types';
import {readRecovery,recoveryKey,sameDraft,writeRecovery,type DraftRecovery} from './recovery';
import {prepareImage} from './prepareImage';
import type {ImageTarget} from './ImageField';
export function useEditor(client:StudioClient,id:string) {
 const [work,setWork]=useState<StudioWork|null>(null),[draft,setDraft]=useState<StudioDraft|null>(null);
 const [status,setStatus]=useState('불러오는 중…'),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [recovery,setRecovery]=useState<DraftRecovery|null>(null);
 const current=useRef<StudioDraft|null>(null),revision=useRef(0),saved=useRef(''),key=useRef(''),working=useRef(false);
 const queue=useRef<Promise<unknown>>(Promise.resolve());
 const persist=useCallback(()=>{
  if(!current.current||!key.current)return;
  try{writeRecovery(sessionStorage,key.current,{draft:current.current,revision:revision.current,updatedAt:new Date().toISOString()});}
  catch{setError('브라우저 복구본을 저장하지 못했어요. 초안을 다운로드해 주세요.');}
 },[]);
 const clearRecovery=()=>{try{sessionStorage.removeItem(key.current);}catch{/* Memory and download remain available. */}};
 const accept=useCallback((w:StudioWork)=>{setWork(w);setDraft(w.draft);current.current=w.draft;revision.current=w.revision;saved.current=JSON.stringify(w.draft);setStatus('저장됨');},[]);
 useEffect(()=>{let active=true;client.get(id).then(w=>{
  if(!active)return;key.current=recoveryKey(w.work.creatorId,id);accept(w);
  const local=readRecovery(sessionStorage,key.current);
  if(local&&!sameDraft(local.draft,w.draft))setRecovery(local);else clearRecovery();
 }).catch(e=>{if(active){setError(e.message);setStatus('불러오기 실패');}});return()=>{active=false;};},[client,id,accept]);
 const save=useCallback(()=>{
  const operation=queue.current.catch(()=>{}).then(async()=>{
   const input=current.current;if(!input)throw new Error('작품을 먼저 불러와 주세요.');
   const signature=JSON.stringify(input);if(signature===saved.current)return revision.current;
   setStatus('저장 중…');setError('');persist();
   const body=structuredClone(input);body.tags=body.tags.map(t=>t.trim()).filter(Boolean);
   body.privateConfig.lorebook.forEach(l=>{l.keywords=l.keywords.map(k=>k.trim()).filter(Boolean);});
   try {
    let result:StudioWork;
    try{result=await client.save({...body,revision:revision.current});}
    catch(original){
     // A lost response must not force a second write or discard newer local edits.
     const remote=await client.get(id).catch(()=>null);
     if(!remote||!sameDraft(remote.draft,body))throw original;result=remote;
    }
    revision.current=result.revision;saved.current=signature;setWork(result);
    if(JSON.stringify(current.current)===signature){clearRecovery();setStatus('저장됨');}else{persist();setStatus('저장 대기');}
    return result.revision;
   }catch(e){setStatus('저장 실패');setError((e as Error).message);persist();throw e;}
  });queue.current=operation;return operation;
 },[client,id,persist]);
 useEffect(()=>{if(!draft||recovery||JSON.stringify(draft)===saved.current)return;const timer=setTimeout(()=>{void save().catch(()=>{});},700);return()=>clearTimeout(timer);},[draft,recovery,save]);
 useEffect(()=>{const leave=(e:BeforeUnloadEvent)=>{if(current.current&&JSON.stringify(current.current)!==saved.current){persist();e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',leave);return()=>window.removeEventListener('beforeunload',leave);},[persist]);
 const change=(fn:(d:StudioDraft)=>void)=>{if(!current.current)return;const next=structuredClone(current.current);fn(next);current.current=next;setDraft(next);setStatus('저장 대기');persist();};
 function restoreRecovery(){if(!recovery)return;current.current=recovery.draft;revision.current=recovery.revision;setDraft(recovery.draft);setRecovery(null);setStatus('복구본 편집 중');}
 function discardRecovery(){clearRecovery();setRecovery(null);}
 async function reload(){setError('');try{const remote=await client.get(id);if(current.current&&!sameDraft(current.current,remote.draft)){persist();setRecovery({draft:current.current,revision:revision.current,updatedAt:new Date().toISOString()});}accept(remote);}catch(e){setError((e as Error).message);}}
 function download(){const content=recovery?.draft??current.current;if(!content)return;const url=URL.createObjectURL(new Blob([JSON.stringify(content,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='iruka-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 async function publish(){
  if(working.current)return;working.current=true;setBusy(true);setError('');
  try{const rev=await save();await client.publish(id,rev);accept(await client.get(id));clearRecovery();setStatus('발행됨');}
  catch(e){setError((e as Error).message);persist();}finally{working.current=false;setBusy(false);}
 }
 async function uploadImage(file:File,target:ImageTarget){
  if(working.current)throw new Error('진행 중인 작업이 끝난 뒤 다시 시도해 주세요.');working.current=true;setBusy(true);setError('');
  try {
   const blob=await prepareImage(file);const asset=await client.upload(id,blob);
   setWork(w=>w?{...w,assets:[...w.assets.filter(a=>a.id!==asset.id),asset]}:w);
   change(d=>{d.assets=[...(d.assets??[]).filter(a=>a.id!==asset.id),{id:asset.id,code:asset.code}];if(target.kind==='cover')d.coverUrl=asset.url;else{const c=d.publicSnapshot.characters.find(c=>c.id===target.id);if(c)c.imageUrl=asset.url;}});
   await save();
  }catch(e){setError((e as Error).message);persist();throw e;}finally{working.current=false;setBusy(false);}
 }
 async function addAsset(code:string,label:string){if(working.current)return;working.current=true;setBusy(true);setError('');try{await save();const asset=await client.asset(id,code,label);setWork(w=>w?{...w,assets:[...w.assets,asset]}:w);change(d=>{d.assets??=[];d.assets.push({id:asset.id,code:asset.code});});await save();}catch(e){setError((e as Error).message);persist();}finally{working.current=false;setBusy(false);}}
 return {work,draft,status,error,busy,recovery,change,save,publish,addAsset,uploadImage,restoreRecovery,discardRecovery,reload,download};
}
