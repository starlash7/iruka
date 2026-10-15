import {useMemo} from 'react';
import {getAccessToken, usePrivy} from '@privy-io/react-auth';
import {Page} from '../../ui';
import {AuthActions} from '../../AuthActions';
import type {RoutePageProps} from '../../routes/paths';
import {createPersonaClient} from './personas/client';
import {PersonaManager} from './personas/PersonaManager';

export default function PersonasPage({authEnabled = false}: RoutePageProps) {
  return <Page title="내 페르소나" description="이야기 속 나의 모습을 관리하는 곳이에요.">
    {authEnabled ? <AuthenticatedPersonas /> : <AuthActions enabled={false} />}
  </Page>;
}
function AuthenticatedPersonas() {
  const {ready, authenticated, user} = usePrivy();
  const client = useMemo(() => createPersonaClient({getAccessToken}), []);
  if (!ready) return <p role="status">로그인 확인 중…</p>;
  if (!authenticated || !user) return <AuthActions enabled />;
  return <PersonaManager key={user.id} client={client} />;
}
