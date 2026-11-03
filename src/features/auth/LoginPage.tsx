import type {RoutePageProps} from '../../routes/paths';
import {Page} from '../../ui';
import {LoginAccess} from './LoginAccess';
export default function LoginPage({authEnabled=false}:RoutePageProps){
 return <Page title="로그인" className="login-page"><LoginAccess enabled={authEnabled}/></Page>;
}
