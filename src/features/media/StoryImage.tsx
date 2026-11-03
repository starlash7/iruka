import {useEffect,useRef,useState} from 'react';
import {Button,Modal} from '../../ui';
import {useReader} from '../discover/ReaderProvider';
import {useImageVisibility} from './useImageVisibility';
import './story-media.css';
export function isImageUrl(url:string){return /^(https?:\/\/|\/[^/])/.test(url);}
export function StoryImage({url,alt,zoomable=true,className='',loadImage}:{url:string;alt:string;zoomable?:boolean;className?:string;loadImage?:(url:string,signal?:AbortSignal)=>Promise<Blob>}){
 const {api}=useReader();const loader=loadImage??api.loadImage;
 const [result,setResult]=useState<{url:string;src:string}|null>(null),[failed,setFailed]=useState(false),[revision,setRevision]=useState(0),[open,setOpen]=useState(false),[actual,setActual]=useState(false);const trigger=useRef<HTMLButtonElement>(null);
 const protectedMedia=url.startsWith('/api/studio/media/'),safe=isImageUrl(url);
 const visibility=useImageVisibility<HTMLElement>(url,!protectedMedia);
 useEffect(()=>{let active=true,objectUrl='';const controller=new AbortController();setFailed(false);setResult(null);
  if(!safe){setFailed(true);return;}
  if(!protectedMedia){setResult({url,src:url});return;}
  if(!visibility.visible)return;
  if(!loader){setFailed(true);return;}
  loader(url,controller.signal).then(blob=>{if(active){objectUrl=URL.createObjectURL(blob);setResult({url,src:objectUrl});}}).catch(()=>{if(active)setFailed(true);});
  return()=>{active=false;controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[url,loader,protectedMedia,safe,revision,visibility.visible]);
 const source=result?.url===url?result.src:!protectedMedia&&safe?url:null;
 function close(){setOpen(false);setActual(false);requestAnimationFrame(()=>trigger.current?.focus());}
 return <figure ref={visibility.ref} className={`story-image ${className}`}>
  {failed?<div className="story-image-state" role="status"><span>{alt} · 이미지를 불러오지 못했어요.</span>{safe&&<Button variant="ghost" onClick={()=>setRevision(value=>value+1)}>이미지 다시 불러오기</Button>}</div>:source?zoomable?<button type="button" className="story-image-trigger" ref={trigger} aria-label={`${alt} 크게 보기`} onClick={event=>{event.currentTarget.focus();setOpen(true);}}><img src={source} alt={alt} loading="lazy" onError={()=>setFailed(true)}/><span className="story-image-hint">확대 보기</span></button>:<img src={source} alt={alt} loading="lazy" onError={()=>setFailed(true)}/>:<div className="story-image-state" role="status">이미지 불러오는 중…</div>}
  <Modal open={open} title={alt} onClose={close}>{open&&source&&<div className="story-lightbox"><Button variant="secondary" aria-pressed={actual} onClick={()=>setActual(value=>!value)}>{actual?'화면에 맞추기':'원본 크기'}</Button><div className="story-lightbox-scroll" tabIndex={0} aria-label="확대 이미지"><img className={actual?'is-actual':''} src={source} alt={alt}/></div></div>}</Modal>
 </figure>;
}
