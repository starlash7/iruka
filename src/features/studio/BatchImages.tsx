import {useRef,useState} from 'react';
import {Button} from '../../ui';
type Upload={file:File;status:'waiting'|'uploading'|'done'|'failed';error?:string};
export function BatchImages({upload}:{upload:(file:File)=>Promise<void>}){
 const input=useRef<HTMLInputElement>(null),lock=useRef(false);const [items,setItems]=useState<Upload[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function run(queue:Upload[]){if(lock.current)return;lock.current=true;setBusy(true);setError('');const next=[...queue];setItems(next);
  try{for(let i=0;i<next.length;i++){if(next[i].status==='done')continue;next[i]={...next[i],status:'uploading',error:undefined};setItems([...next]);try{await upload(next[i].file);next[i]={...next[i],status:'done'};}catch(error){next[i]={...next[i],status:'failed',error:error instanceof Error?error.message:'등록하지 못했어요.'};}setItems([...next]);}}
  finally{lock.current=false;setBusy(false);}
 }
 const failed=items.some(item=>item.status==='failed');
 return <section className="studio-batch" aria-label="이미지 여러 장 등록"><div className="studio-toolbar"><Button variant="secondary" disabled={busy} onClick={()=>input.current?.click()}>이미지 여러 장 등록</Button><small>한 번에 20개 · 파일당 5MB 이하</small></div>
 <input ref={input} hidden type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={event=>{const files=Array.from(event.target.files??[]);event.target.value='';if(files.length>20){setError('한 번에 20개까지 선택해 주세요.');return;}if(files.length)void run(files.map(file=>({file,status:'waiting'})));}}/>
 {error&&<p role="alert">{error}</p>}{!!items.length&&<><p role="status">{items.filter(item=>item.status==='done').length} / {items.length}개 등록{busy?' 중…':failed?' · 일부 실패':' 완료'}</p><ul>{items.map((item,index)=><li key={index}><span>{item.file.name}</span><strong>{({waiting:'대기',uploading:'등록 중',done:'등록됨',failed:'실패'})[item.status]}</strong>{item.error&&<p role="alert">{item.error}</p>}</li>)}</ul>{failed&&!busy&&<Button variant="secondary" onClick={()=>void run(items)}>실패한 파일 다시 시도</Button>}</>}
 </section>;
}
