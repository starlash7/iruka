import {useState,type ReactNode} from 'react';
import {flushSync} from 'react-dom';
import {usePrivy} from '@privy-io/react-auth';
import {Button} from '../../ui';
import {useReader} from '../discover/ReaderProvider';
import {useReaderLogin} from '../discover/useReaderLogin';

export function StartChatAccess({authEnabled,children,onLoginPending}:{authEnabled:boolean;children:ReactNode;onLoginPending:(pending:boolean)=>void}){
 const {development}=useReader();
 if(development)return <>{children}</>;
 if(!authEnabled)return <p role="status">로그인 설정이 필요해요.</p>;
 return <AuthenticatedStart onLoginPending={onLoginPending}>{children}</AuthenticatedStart>;
}

function AuthenticatedStart({children,onLoginPending}:{children:ReactNode;onLoginPending:(pending:boolean)=>void}){
 const {ready,authenticated,user}=usePrivy();
 const [error,setError]=useState('');
 const login=useReaderLogin({
  onComplete:()=>{setError('');onLoginPending(false);},
  onError:()=>{setError('로그인하지 못했어요. 다시 시도해 주세요.');onLoginPending(false);}
 });
 if(!ready||(authenticated&&!user))return <p role="status">로그인 확인 중…</p>;
 if(!authenticated)return <div className="reader-start">
  <p>로그인하고 이야기를 시작해 보세요.</p>
  <Button onClick={()=>{
   setError('');
   // Privy's portal must be outside the native dialog's top layer.
   flushSync(()=>onLoginPending(true));
   login();
  }}>로그인</Button>
  {error&&<p role="alert">{error}</p>}
 </div>;
 return <>{children}</>;
}
