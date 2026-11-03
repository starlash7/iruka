import {PrivyAuthActions} from './PrivyAuthActions';
import {LoginAccess} from './features/auth/LoginAccess';
export function AuthActions({enabled}:{enabled:boolean}){
 return enabled?<PrivyAuthActions/>:<LoginAccess enabled={false}/>;
}
