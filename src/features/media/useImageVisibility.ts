import {useEffect,useRef,useState} from 'react';
/** Hidden editor tabs and offscreen libraries must not eagerly fetch private files. */
export function useImageVisibility<T extends HTMLElement>(key:string,eager=false){
 const ref=useRef<T>(null);const [visible,setVisible]=useState(eager);
 useEffect(()=>{
  if(eager||visible||typeof IntersectionObserver==='undefined'){setVisible(true);return;}
  const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:'160px'});
  if(ref.current)observer.observe(ref.current);return()=>observer.disconnect();
 },[key,eager,visible]);
 return {ref,visible};
}
