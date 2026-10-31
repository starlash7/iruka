import {useRef} from 'react';
import {useLogin} from '@privy-io/react-auth';
import {privyConfig} from '../../privyConfig';

export function useReaderLogin({reloadOnLogin=false,onComplete,onError}:{reloadOnLogin?:boolean;onComplete?:()=>void;onError:()=>void}){
 const requested=useRef(false);
 const {login}=useLogin({
  onComplete:({wasAlreadyAuthenticated})=>{
   // SDK events reach every subscriber; only the initiating surface may reload.
   if(!requested.current)return;
   requested.current=false;
   onComplete?.();
   if(reloadOnLogin&&!wasAlreadyAuthenticated)window.location.reload();
  },
  onError:()=>{if(requested.current){requested.current=false;onError();}}
 });
 return ()=>{
  requested.current=true;
  try{login({loginMethods:privyConfig.loginMethods});}
  catch{requested.current=false;onError();}
 };
}
