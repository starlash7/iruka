import {useEffect,useId,useRef,useState} from 'react';
import {Button} from '../../ui';
import type {StudioClient} from './client';
import {useImageVisibility} from '../media/useImageVisibility';
export type ImageTarget={kind:'cover'}|{kind:'character';id:string}|{kind:'opening';id:string}|{kind:'asset';id:string}|{kind:'library'};
export function StoredImage({url,alt,client}:{url:string;alt:string;client:StudioClient}) {
 const [source,setSource]=useState(''),[error,setError]=useState(false);
 const publicImage=/^https:\/\//.test(url)||url.startsWith('/stories/');
 const {ref,visible}=useImageVisibility<HTMLSpanElement>(url,publicImage);
 useEffect(()=>{let active=true,objectUrl='';setSource('');setError(false);
  if(publicImage){setSource(url);return;}
  if(!visible)return;
  client.image(url).then(blob=>{if(active){objectUrl=URL.createObjectURL(blob);setSource(objectUrl);}}).catch(()=>{if(active)setError(true);});
  return()=>{active=false;if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[url,client,visible,publicImage]);
 return <span ref={ref} className="studio-stored-image">{source?<img src={source} alt={alt} loading="lazy"/>:<span role="status">{error?'이미지를 불러오지 못했어요.':'이미지 불러오는 중…'}</span>}</span>;
}
export function ImageField({label,value,client,onUpload,onRemove}:{label:string;value:string|null;client:StudioClient;onUpload:(file:File)=>Promise<void>;onRemove?:()=>void}) {
 const input=useRef<HTMLInputElement>(null);const id=useId();const [file,setFile]=useState<File|null>(null),[preview,setPreview]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{if(!file){setPreview('');return;}const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url);},[file]);
 async function upload(selected:File){if(busy)return;setBusy(true);setError('');try{await onUpload(selected);setFile(null);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <section className="studio-image-field" aria-label={label}><label htmlFor={id}>{label}</label>
  <div className="studio-image-frame">{preview?<img src={preview} alt={`${label} 선택 파일`}/>:value?<StoredImage url={value} alt={label} client={client}/>:<span>이미지 없음</span>}</div>
  <Button variant="secondary" disabled={busy} onClick={()=>input.current?.click()}>{value?'이미지 교체':'이미지 선택'}</Button>
  <input ref={input} hidden id={id} type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} aria-describedby={`${id}-hint`} onChange={e=>{const selected=e.target.files?.[0];if(selected){setFile(selected);void upload(selected);}e.target.value='';}}/>
  <small id={`${id}-hint`}>PNG·JPEG·WebP, 5MB 이하</small>
  {busy&&<p role="status">이미지 등록 중…</p>}{error&&<p role="alert">{error}</p>}
  <div className="studio-toolbar">{file&&!busy&&<Button variant="secondary" onClick={()=>void upload(file)}>업로드 다시 시도</Button>}{value&&!busy&&onRemove&&<Button variant="ghost" onClick={()=>{setFile(null);setError('');onRemove();}}>이미지 빼기</Button>}</div>
 </section>;
}
