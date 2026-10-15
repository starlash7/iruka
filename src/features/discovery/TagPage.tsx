import { Page, EmptyState } from '../../ui';
import type { RoutePageProps } from '../../routes/paths';

export default function TagPage(_props: RoutePageProps) {
  return <Page title="태그별 작품" description="관심 있는 주제로 이야기를 만나보세요.">
    <EmptyState title="태그 탐색을 준비하고 있어요" description="연결된 작품 목록은 아직 제공되지 않아요." />
  </Page>;
}
