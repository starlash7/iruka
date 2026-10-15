import {useCallback,useEffect,useState} from 'react';
import {getAccessToken} from '@privy-io/react-auth';
import {createApiClient} from '../../../shared/apiClient';
import type {ProfileDto} from '../../../shared/contracts';

const client=createApiClient({getAccessToken});
const eventName='iruka:profile-saved';
export function useProfile(identity?:string){
 const [state,setState]=useState<{identity?:string;data:ProfileDto|null;error:string;loading:boolean}>({data:null,error:'',loading:true});
 const [revision,setRevision]=useState(0);
 const reload=useCallback(()=>setRevision(value=>value+1),[]);
 useEffect(()=>{
  const updated=(event:Event)=>{if((event as CustomEvent<string>).detail===identity)reload();};
  window.addEventListener(eventName,updated);return()=>window.removeEventListener(eventName,updated);
 },[identity,reload]);
 useEffect(()=>{
  if(!identity)return;
  const controller=new AbortController();
  setState(previous=>({identity,data:previous.identity===identity?previous.data:null,error:'',loading:true}));
  client.request<ProfileDto>('/api/me/profile',{signal:controller.signal}).then(({data})=>{
   if(!controller.signal.aborted)setState({identity,data,error:'',loading:false});
  }).catch(error=>{if(!controller.signal.aborted)setState({identity,data:null,error:error.message,loading:false});});
  return()=>controller.abort();
 },[identity,revision]);
 async function save(profile:ProfileDto){
  if(!identity)throw new Error('로그인이 필요해요.');
  const {data}=await client.request<ProfileDto>('/api/me/profile',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(profile)});
  setState({identity,data,error:'',loading:false});
  window.dispatchEvent(new CustomEvent(eventName,{detail:identity}));
 }
 return {...(state.identity===identity?state:{data:null,error:'',loading:!!identity}),save,reload};
}
