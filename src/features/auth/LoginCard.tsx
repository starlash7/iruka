import type {ReactNode} from 'react';
import {ArrowRight,Mail,WalletCards} from 'lucide-react';
import {useReader} from '../discover/ReaderProvider';
import './login.css';

type Props={disabled?:boolean;busy?:string|null;message?:string;error?:string;showMethods?:boolean;onGoogle?:()=>void;onEmail?:()=>void;onWallet?:()=>void;children?:ReactNode};
export function LoginCard({disabled=false,busy,message,error,showMethods=true,onGoogle,onEmail,onWallet,children}:Props){
 const {href}=useReader();
 return <section className="login-card" aria-label="Iruka 로그인">
  <div className="login-story" aria-hidden="true"><img src="/illustrations/story-portal-v1.jpg" alt="" width="1536" height="1024"/><div><span>YOUR NEXT STORY</span><p>이야기의 다음 장에,<br/>당신이 있어요.</p></div></div>
  <div className="login-form-panel">
   <a className="login-brand" href={href('/')} aria-label="Iruka 홈"><img src="/brand/iruka-logomark.svg" alt="" width="38" height="38"/><img src="/brand/iruka-wordmark.png" alt="Iruka" width="112" height="35"/></a>
   <div className="login-intro"><h2>나만의 이야기를 시작해요</h2><p>마음에 든 작품을 만나고,<br/>당신의 선택으로 이야기를 이어가세요.</p></div>
   {message&&<p className="login-notice" role="status">{message}</p>}
   {showMethods&&<div className="login-methods" aria-busy={!!busy}>
    <button className="login-google" disabled={disabled||!!busy} onClick={onGoogle}><span className="login-google-letter" aria-hidden="true">G</span><span>{busy==='google'?'Google로 이동 중…':'Google로 계속하기'}</span><ArrowRight size={18} aria-hidden="true"/></button>
    <div className="login-divider"><span>또는</span></div>
    <button className="login-email" disabled={disabled||!!busy} onClick={onEmail}><Mail size={20} aria-hidden="true"/>이메일로 계속하기</button>
    <details className="login-other"><summary>다른 방법으로 로그인</summary><button disabled={disabled||!!busy} onClick={onWallet}><WalletCards size={18} aria-hidden="true"/>{busy==='wallet'?'지갑 연결 중…':'지갑으로 계속하기'}</button></details>
   </div>}
   {children}
   {error&&<p className="login-error" role="alert">{error}</p>}
   <p className="login-footnote">처음이라면 로그인과 함께 계정이 만들어져요.</p>
   <a className="login-browse" href={href('/')}>먼저 둘러보기 <ArrowRight size={15} aria-hidden="true"/></a>
  </div>
 </section>;
}
