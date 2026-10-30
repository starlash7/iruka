import { Page, EmptyState } from '../../ui';
import type { RoutePageProps } from '../../routes/paths';
import { AuthActions } from '../../AuthActions';

export default function HomePage({ authEnabled = false }: RoutePageProps) {
  return <Page title="Iruka" description="한국어 AI 캐릭터·스토리 채팅">
    <EmptyState title="이야기를 만날 공간" description="작품 탐색을 준비하고 있어요." /><AuthActions enabled={authEnabled} />
  </Page>;
}
