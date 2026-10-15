import { Page, EmptyState } from '../../ui';
import type { RoutePageProps } from '../../routes/paths';

export default function WorkPage(_props: RoutePageProps) {
  return <Page title="작품 상세" description="작품을 살펴보고 이야기를 시작하는 곳이에요.">
    <EmptyState title="작품 정보를 준비하고 있어요" description="실제 작품이 연결되면 소개와 대화 시작을 제공해요." />
  </Page>;
}
