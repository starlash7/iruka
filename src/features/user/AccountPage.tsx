import { AuthActions } from '../../AuthActions';
import { Page } from '../../ui';
import type { RoutePageProps } from '../../routes/paths';

export default function AccountPage({ authEnabled = false }: RoutePageProps) {
  return <Page title="내 계정"><AuthActions enabled={authEnabled} /></Page>;
}
