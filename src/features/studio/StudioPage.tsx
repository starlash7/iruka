import { Page, EmptyState } from '../../ui';
import type { RoutePageProps } from '../../routes/paths';

export default function StudioPage(_props: RoutePageProps) {
  return <Page title="내 작품" description="캐릭터와 스토리를 만드는 공간이에요.">
    <EmptyState title="작품 제작을 준비하고 있어요" description="제작 기능이 연결되면 내 작품을 관리할 수 있어요." />
  </Page>;
}
