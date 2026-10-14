import { Page, EmptyState } from '../../ui';
import type { RoutePageProps } from '../../routes/paths';

export default function SearchPage(_props: RoutePageProps) {
  return <Page title="검색" description="마음에 드는 작품을 찾아보세요.">
    <EmptyState title="작품 검색을 준비하고 있어요" description="검색 기능이 연결되면 작품과 태그를 찾을 수 있어요." />
  </Page>;
}
