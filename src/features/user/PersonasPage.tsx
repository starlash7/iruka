import { Page, EmptyState } from '../../ui';
import type { RoutePageProps } from '../../routes/paths';

export default function PersonasPage(_props: RoutePageProps) {
  return <Page title="내 페르소나" description="이야기 속 나의 모습을 관리하는 곳이에요.">
    <EmptyState title="페르소나를 준비하고 있어요" description="대화에 사용할 프로필을 관리할 수 있도록 준비하고 있어요." />
  </Page>;
}
