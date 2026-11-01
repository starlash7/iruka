import {useState,type ReactNode} from 'react';
import {usePrivy} from '@privy-io/react-auth';
import {useReader} from './ReaderProvider';
import {useReaderLogin} from './useReaderLogin';

type Session={ready:boolean;identity:string|null;login?:()=>void;error?:string};
type Props={children:(session:Session)=>ReactNode;enabled?:boolean};
export function ReaderSession({children,enabled=!!import.meta.env.VITE_PRIVY_APP_ID?.trim()}:Props){
 const {development}=useReader();
 if(development)return <>{children({ready:true,identity:'development'})}</>;
 if(!enabled)return <>{children({ready:true,identity:null})}</>;
 return <PrivySession>{children}</PrivySession>;
}
function PrivySession({children}:Pick<Props,'children'>){
 const {ready,authenticated,user}=usePrivy();const [error,setError]=useState('');
 const login=useReaderLogin({reloadOnLogin:true,onComplete:()=>setError(''),onError:()=>setError('로그인하지 못했어요. 다시 시도해 주세요.')});
 return <>{children({ready:ready&&(!authenticated||!!user),identity:ready&&authenticated?user?.id??null:null,login,error})}</>;
}
