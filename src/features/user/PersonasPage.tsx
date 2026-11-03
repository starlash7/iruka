import {useMemo} from 'react';
import {getAccessToken} from '@privy-io/react-auth';
import {Page} from '../../ui';
import {ReaderSession} from '../discover/ReaderSession';
import {SignInNotice} from '../discover/SignInNotice';
import type {RoutePageProps} from '../../routes/paths';
import {createPersonaClient} from './personas/client';
import {PersonaManager} from './personas/PersonaManager';

export default function PersonasPage({authEnabled = false}: RoutePageProps) {
  return <Page title="내 페르소나" description="이야기 속 나의 모습을 관리하는 곳이에요.">
    <ReaderSession enabled={authEnabled}>{session=>session.identity?<AuthenticatedPersonas key={session.identity}/>:<SignInNotice {...session} message="로그인 후 이야기 속 나의 모습을 저장할 수 있어요."/>}</ReaderSession>
  </Page>;
}
function AuthenticatedPersonas() {
  const client = useMemo(() => createPersonaClient({getAccessToken}), []);
  return <PersonaManager client={client} />;
}
