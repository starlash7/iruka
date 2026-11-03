import {StateArtwork} from '../../ui/StateArtwork';
import {Button} from '../../ui';
export function SignInNotice({ready,login,error,message='로그인 후 내 보관함을 확인할 수 있어요.'}:{ready:boolean;login?:()=>void;error?:string;message?:string}){
 return <div className="reader-state reader-state--signin"><StateArtwork kind="conversations"/><p>{ready?message:'로그인 상태를 확인하고 있어요.'}</p>{login&&<Button disabled={!ready} onClick={login}>로그인</Button>}{error&&<p role="alert">{error}</p>}</div>;
}
