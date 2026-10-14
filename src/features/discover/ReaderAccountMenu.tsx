import {useEffect,useId,useRef,useState} from 'react';
import {usePrivy,useLogin,useLinkAccount} from '@privy-io/react-auth';
import {LogOut} from 'lucide-react';
import {privyConfig} from '../../privyConfig';
import {useReader} from './ReaderProvider';
import {ReaderAvatar} from './ReaderIdentity';
import accountIcon from './assets/iruka-icon-account.png';
import walletIcon from './assets/iruka-icon-wallet.png';

export function ReaderAccountMenu(){
 const {href}=useReader();
 return import.meta.env.VITE_PRIVY_APP_ID?.trim()?<PrivyReaderAccount/>:<a className="reader-login" href={href('/account')}>로그인</a>;
}
function PrivyReaderAccount(){
 const {href}=useReader();
 const {ready,authenticated,user,logout}=usePrivy();
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 const {login}=useLogin({onComplete:()=>window.location.reload(),onError:()=>setError('로그인하지 못했어요. 다시 시도해 주세요.')});
 const {linkWallet}=useLinkAccount({onSuccess:()=>setError(''),onError:()=>setError('지갑을 연결하지 못했어요. 다시 시도해 주세요.')});
 async function signOut(){setBusy(true);setError('');try{await logout();window.location.assign(href('/account'));}catch{setError('로그아웃하지 못했어요. 다시 시도해 주세요.');}finally{setBusy(false);}}
 if(!ready||(authenticated&&!user))return <button className="reader-login" disabled>확인 중</button>;
 if(!authenticated||!user)return <div><button className="reader-login" onClick={()=>login({loginMethods:privyConfig.loginMethods})}>로그인</button>{error&&<span role="alert">{error}</span>}</div>;
 return <ReaderProfileMenu identity={user.id} name={user.google?.name?.trim()||user.email?.address||user.google?.email||'Iruka 사용자'} address={user.wallet?.address} error={error} busy={busy} onLinkWallet={()=>{setError('');linkWallet();}} onLogout={()=>void signOut()}/>;
}
export function ReaderProfileMenu({identity,name,address,error,busy,onLinkWallet,onLogout}:{identity:string;name:string;address?:string;error?:string;busy?:boolean;onLinkWallet:()=>void;onLogout:()=>void}){
 const {href}=useReader();const [open,setOpen]=useState(false);const root=useRef<HTMLDivElement>(null);const trigger=useRef<HTMLButtonElement>(null);const id=useId();
 useEffect(()=>{if(!open)return;
 const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
 const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);trigger.current?.focus();}};
 window.addEventListener('pointerdown',outside);window.addEventListener('keydown',escape);
 return()=>{window.removeEventListener('pointerdown',outside);window.removeEventListener('keydown',escape);};
 },[open]);
 return <div className="reader-profile" ref={root} onBlur={event=>{if(event.relatedTarget&&!event.currentTarget.contains(event.relatedTarget))setOpen(false);}}>
  <button ref={trigger} className="reader-profile-trigger" aria-label={`내 계정: ${name}`} aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}><ReaderAvatar identity={identity}/></button>
  <div className="reader-profile-popover" id={id} hidden={!open}>
   <div className="reader-profile-identity"><ReaderAvatar identity={identity}/><strong>{name}</strong></div>
   <a href={href('/account')}><img src={accountIcon} alt=""/>내 계정</a>
   {address?<div className="reader-profile-wallet"><img src={walletIcon} alt=""/><span>연결된 지갑<small>{address}</small></span></div>:<button disabled={busy} onClick={onLinkWallet}><img src={walletIcon} alt=""/>지갑 연결</button>}
   <button disabled={busy} onClick={onLogout}><LogOut size={20}/>{busy?'로그아웃 중…':'로그아웃'}</button>
   {error&&<p role="alert">{error}</p>}
  </div>
 </div>;
}
