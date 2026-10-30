import {useEffect,useState} from 'react';
import {useReader} from '../discover/ReaderProvider';

export function ChatImage({url,alt}:{url:string;alt:string}) {
 const {api}=useReader();
 const [result,setResult]=useState<{url:string;src:string|null;failed:boolean}|null>(null);
 const protectedMedia=url.startsWith('/api/studio/media/');
 const safe=/^(https?:\/\/|\/[^/])/.test(url);
 useEffect(()=>{
  if(!protectedMedia)return;
  const controller=new AbortController();let objectUrl:string|undefined;
  setResult(null);
  if(!api.loadImage){setResult({url,src:null,failed:true});return;}
  void api.loadImage(url,controller.signal).then(blob=>{
   if(controller.signal.aborted)return;
   objectUrl=URL.createObjectURL(blob);setResult({url,src:objectUrl,failed:false});
  }).catch(()=>{if(!controller.signal.aborted)setResult({url,src:null,failed:true});});
  return ()=>{controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[api,url,protectedMedia]);
 const current=result?.url===url?result:null;
 if(!safe||current?.failed)return <p role="status">이미지를 불러오지 못했어요.</p>;
 const src=protectedMedia?current?.src:url;
 return src?<img className="chat-image" src={src} alt={alt} onError={()=>setResult({url,src:null,failed:true})}/>:<p role="status">이미지를 불러오는 중…</p>;
}
