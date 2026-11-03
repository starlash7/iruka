import {PrivyLogin} from './PrivyLogin';
import {LoginCard} from './LoginCard';
export function LoginAccess({enabled}:{enabled:boolean}){
 return enabled?<PrivyLogin/>:<LoginCard disabled message="로그인 설정이 필요해요."/>;
}
