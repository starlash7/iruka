import {useEffect,useRef,useState,type FormEvent} from 'react';
import {useLogin,useLoginWithEmail,useLoginWithOAuth,usePrivy} from '@privy-io/react-auth';
import {ArrowLeft,Mail} from 'lucide-react';
import {LoginCard} from './LoginCard';
import {safeLoginReturn} from './loginRedirect';

type Phase='methods'|'email'|'code';
type Busy='google'|'send'|'verify'|'wallet'|null;
export function PrivyLogin(){
 const {ready,authenticated,user}=usePrivy();
 const [phase,setPhase]=useState<Phase>('methods');
 const [email,setEmail]=useState(''),[code,setCode]=useState(''),[error,setError]=useState('');
 const [busy,setBusy]=useState<Busy>(null),[attempts,setAttempts]=useState(0),[resendAt,setResendAt]=useState(0),[now,setNow]=useState(Date.now);
 const pending=useRef(false),walletRequested=useRef(false),initiated=useRef(false),returned=useRef(false);
 const input=useRef<HTMLInputElement>(null);
 const oauth=useLoginWithOAuth({onError:()=>{pending.current=false;setBusy(null);setError('Google 로그인이 취소되었거나 연결하지 못했어요. 다시 시도해 주세요.');}});
 const otp=useLoginWithEmail();
 const wallet=useLogin({onComplete:()=>{if(walletRequested.current){walletRequested.current=false;pending.current=false;setBusy(null);}},onError:()=>{if(walletRequested.current){walletRequested.current=false;pending.current=false;setBusy(null);setError('지갑 로그인이 취소되었거나 연결하지 못했어요. 다시 시도해 주세요.');}}});
 useEffect(()=>{if(phase!=='methods'&&!busy)input.current?.focus();},[phase,busy]);
 useEffect(()=>{if(!resendAt)return;const timer=window.setInterval(()=>{const time=Date.now();setNow(time);if(time>=resendAt)window.clearInterval(timer);},1000);return()=>window.clearInterval(timer);},[resendAt]);
 useEffect(()=>{
  if(!ready||!authenticated||!user||returned.current)return;
  if(window.location.pathname!=='/login'&&!initiated.current)return;
  returned.current=true;
  const next=safeLoginReturn(new URLSearchParams(window.location.search).get('next'));
  window.location.replace(next);
 },[ready,authenticated,user]);
 const cooldown=Math.max(0,Math.ceil((resendAt-now)/1000));
 const disabled=!ready||authenticated||!!busy||oauth.loading;
 async function google(){
  if(pending.current||disabled)return;pending.current=true;initiated.current=true;setBusy('google');setError('');
  try{await oauth.initOAuth({provider:'google'});}catch{pending.current=false;setBusy(null);setError('Google에 연결하지 못했어요. 다시 시도해 주세요.');}
 }
 async function send(event?:FormEvent){
  event?.preventDefault();if(pending.current||disabled||cooldown)return;
  const address=email.trim();if(!address)return;
  pending.current=true;initiated.current=true;setBusy('send');setError('');
  try{await otp.sendCode({email:address});setEmail(address);setCode('');setAttempts(0);setPhase('code');setResendAt(Date.now()+60000);setNow(Date.now());}
  catch{setError('인증번호를 보내지 못했어요. 이메일 주소를 확인하고 잠시 후 다시 시도해 주세요.');}
  finally{pending.current=false;setBusy(null);}
 }
 async function verify(event:FormEvent){
  event.preventDefault();if(pending.current||disabled||attempts>=5||!/^\d{6}$/.test(code))return;
  pending.current=true;initiated.current=true;setBusy('verify');setError('');
  try{await otp.loginWithCode({code});}
  catch{setAttempts(value=>value+1);setError('인증번호가 올바르지 않거나 만료되었어요. 다시 확인하거나 새 번호를 받아 주세요.');}
  finally{pending.current=false;setBusy(null);}
 }
 function openWallet(){
  if(pending.current||disabled)return;pending.current=true;initiated.current=true;walletRequested.current=true;setBusy('wallet');setError('');
  try{wallet.login({loginMethods:['wallet']});}catch{walletRequested.current=false;pending.current=false;setBusy(null);setError('지갑에 연결하지 못했어요. 다시 시도해 주세요.');}
 }
 function back(){if(disabled)return;setPhase(phase==='code'?'email':'methods');setCode('');setError('');}
 return <LoginCard disabled={disabled} busy={busy??(oauth.loading?'google':null)} message={!ready?'로그인 준비 중…':authenticated?'내 이야기로 이동 중…':undefined} error={phase==='methods'?error:undefined} showMethods={phase==='methods'} onGoogle={()=>void google()} onEmail={()=>{setPhase('email');setError('');}} onWallet={openWallet}>
  {phase!=='methods'&&<div className="login-email-flow">
   <button className="login-back" disabled={disabled} onClick={back}><ArrowLeft size={16} aria-hidden="true"/>{phase==='code'?'이메일 변경':'로그인 방법 선택'}</button>
   {phase==='email'?<form onSubmit={event=>void send(event)} aria-busy={busy==='send'}>
    <label htmlFor="login-email">이메일 주소</label><input ref={input} id="login-email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254} value={email} onChange={event=>{setEmail(event.target.value);setError('');}} disabled={disabled} aria-invalid={!!error} aria-describedby={`email-help${error?' login-error':''}`}/>
    <p id="email-help" className="login-help">비밀번호 없이 이메일 인증번호로 로그인해요.</p>
    {error&&<p id="login-error" className="login-error" role="alert">{error}</p>}
    <button className="login-submit" disabled={disabled||!email.trim()||cooldown>0} type="submit">{busy==='send'?'인증번호 보내는 중…':cooldown?`${cooldown}초 후 다시 요청`:'인증번호 받기'}</button>
   </form>:<form onSubmit={event=>void verify(event)} aria-busy={busy==='verify'}>
    <p className="login-sent"><Mail size={18} aria-hidden="true"/><span><strong>{email}</strong>으로<br/>인증번호를 보냈어요.</span></p>
    <label htmlFor="login-code">인증번호 6자리</label><input ref={input} className="login-code" id="login-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event=>{setCode(event.target.value.replace(/\D/g,''));setError('');}} disabled={disabled||attempts>=5} aria-invalid={!!error} aria-describedby={`code-help${error?' login-error':''}`}/>
    <p id="code-help" className="login-help">{attempts>=5?'확인 횟수를 초과했어요. 새 인증번호를 받아 주세요.':'메일이 보이지 않으면 스팸함도 확인해 주세요.'}</p>
    {error&&<p id="login-error" className="login-error" role="alert">{error}</p>}
    <button className="login-submit" disabled={disabled||attempts>=5||code.length!==6} type="submit">{busy==='verify'?'확인하는 중…':'확인하고 시작하기'}</button>
    <button className="login-resend" disabled={disabled||cooldown>0} type="button" onClick={()=>void send()}>{busy==='send'?'다시 보내는 중…':cooldown?`인증번호 다시 받기 · ${cooldown}초`:'인증번호 다시 받기'}</button>
   </form>}
  </div>}
 </LoginCard>;
}
