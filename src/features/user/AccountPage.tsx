import { AuthActions } from '../../AuthActions';
import { Page } from '../../ui';
import type { RoutePageProps } from '../../routes/paths';
import {usePrivy} from '@privy-io/react-auth';
import {MyProfile} from './profile/MyProfile';

export default function AccountPage({ authEnabled = false }: RoutePageProps) {
  return <Page title="마이페이지">{authEnabled?<AuthenticatedAccount/>:<AuthActions enabled={false}/>}</Page>;
}
function AuthenticatedAccount(){
 const {ready,authenticated,user}=usePrivy();
 if(!ready||!authenticated||!user)return <AuthActions enabled/>;
 return <><MyProfile key={user.id} identity={user.id}/><details className="profile-account-settings"><summary>계정 설정</summary><AuthActions enabled/></details></>;
}
