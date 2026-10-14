import { Page, EmptyState } from '../../ui';
import type { RoutePageProps } from '../../routes/paths';

export default function EditorPage(_props: RoutePageProps) {
  return <Page title="작품 편집" description="작품의 설정과 이야기를 다듬는 곳이에요.">
    <EmptyState title="편집 화면을 준비하고 있어요" description="아직 작품을 저장하거나 발행하지 않아요." />
  </Page>;
}
