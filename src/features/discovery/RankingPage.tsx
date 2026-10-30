import { Page, EmptyState } from '../../ui';
import type { RoutePageProps } from '../../routes/paths';

export default function RankingPage(_props: RoutePageProps) {
  return <Page title="랭킹" description="새로운 이야기를 발견해 보세요.">
    <EmptyState title="인기 작품을 준비하고 있어요" description="집계된 작품이 연결되면 이곳에서 볼 수 있어요." />
  </Page>;
}
