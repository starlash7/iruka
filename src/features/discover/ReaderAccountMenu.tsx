import {useEffect,useId,useRef,useState} from 'react';
import {usePrivy,useLogin,useLinkAccount} from '@privy-io/react-auth';
import {LogOut,ChevronDown} from 'lucide-react';
import {NetworkSelector} from './account/NetworkSelector';
import {activeDeployment} from './account/activeDeployment';
import {useTransferBusy} from './account/transferActivity';
import {privyConfig} from '../../privyConfig';
import {useReader} from './ReaderProvider';
import {ReaderAvatar} from './ReaderIdentity';
import {useProfile} from '../user/profile/useProfile';
import accountIcon from './assets/iruka-icon-account.png';
import walletIcon from './assets/iruka-icon-wallet.png';

export function ReaderAccountMenu(){
 const {href}=useReader();const transferBusy=useTransferBusy();
 return <><NetworkSelector disabled={transferBusy} locale="ko"/>{import.meta.env.VITE_PRIVY_APP_ID?.trim()?<PrivyReaderAccount/>:<a className="reader-login" href={href('/account')}>로그인</a>}</>;
}
function PrivyReaderAccount(){
 const {href}=useReader();
 const {ready,authenticated,user,logout}=usePrivy();
 const {data:profile}=useProfile(authenticated?user?.id:undefined);
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 // Privy also fires onComplete when restoring an existing session. Reloading then loops forever.
 const {login}=useLogin({onComplete:({wasAlreadyAuthenticated})=>{setError('');if(!wasAlreadyAuthenticated)window.location.reload();},onError:()=>setError('로그인하지 못했어요. 다시 시도해 주세요.')});
 const {linkWallet}=useLinkAccount({onSuccess:()=>setError(''),onError:()=>setError('지갑을 연결하지 못했어요. 다시 시도해 주세요.')});
 async function signOut(){setBusy(true);setError('');try{await logout();window.location.assign(href('/account'));}catch{setError('로그아웃하지 못했어요. 다시 시도해 주세요.');}finally{setBusy(false);}}
 if(!ready||(authenticated&&!user))return <button className="reader-login" disabled>확인 중</button>;
 if(!authenticated||!user)return <div><button className="reader-login" onClick={()=>login({loginMethods:privyConfig.loginMethods})}>로그인</button>{error&&<span role="alert">{error}</span>}</div>;
 return <ReaderProfileMenu identity={user.id} name={profile?.nickname||'Iruka 사용자'} image={profile?.avatar} address={user.wallet?.address} error={error} busy={busy} onLinkWallet={()=>{setError('');linkWallet();}} onLogout={()=>void signOut()}/>;
}
export function ReaderProfileMenu({identity,name,image,address,error,busy,onLinkWallet,onLogout}:{identity:string;name:string;image?:string|null;address?:string;error?:string;busy?:boolean;onLinkWallet:()=>void;onLogout:()=>void}){
 const {href}=useReader();const [open,setOpen]=useState(false);const root=useRef<HTMLDivElement>(null);const trigger=useRef<HTMLButtonElement>(null);const id=useId();const [settings,setSettings]=useState(false);const transferBusy=useTransferBusy();
 useEffect(()=>{if(!open)return;
 const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
 const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);trigger.current?.focus();}};
 window.addEventListener('pointerdown',outside);window.addEventListener('keydown',escape);
 return()=>{window.removeEventListener('pointerdown',outside);window.removeEventListener('keydown',escape);};
 },[open]);
 return <div className="reader-profile" ref={root} onBlur={event=>{if(event.relatedTarget&&!event.currentTarget.contains(event.relatedTarget))setOpen(false);}}>
  <button ref={trigger} className="reader-profile-trigger" aria-label={`내 계정: ${name}`} aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}><ReaderAvatar identity={identity} image={image}/></button>
  <div className="reader-profile-popover" id={id} hidden={!open}>
   <div className="reader-profile-identity"><ReaderAvatar identity={identity} image={image}/><span><strong>{name}</strong><small className="reader-profile-network">{activeDeployment.chain.name}</small></span></div>
   <a href={href('/account')}><img src={accountIcon} alt=""/>마이페이지</a>
   {address?<div className="reader-profile-wallet"><img src={walletIcon} alt=""/><span>연결된 지갑<small>{address}</small></span></div>:<button disabled={busy} onClick={onLinkWallet}><img src={walletIcon} alt=""/>지갑 연결</button>}
   <button aria-expanded={settings} onClick={()=>setSettings(!settings)}><img src="/assets/iruka-icon-settings.png" alt=""/>설정<ChevronDown size={16}/></button>
   {settings&&<div className="reader-profile-settings"><a href={href('/personas')}>페르소나 관리</a><a href={href('/credits')}>테스트 크레딧</a></div>}
   <button disabled={busy||transferBusy} onClick={onLogout}><LogOut size={20}/>{busy?'로그아웃 중…':'로그아웃'}</button>
   {error&&<p role="alert">{error}</p>}
  </div>
 </div>;
}
