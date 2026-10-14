import { Page, EmptyState } from '../../ui';
import type { RoutePageProps } from '../../routes/paths';

export default function ChatPage(_props: RoutePageProps) {
  return <Page title="대화" description="선택한 작품과 이야기를 이어가는 곳이에요.">
    <EmptyState title="대화 화면을 준비하고 있어요" description="아직 메시지를 보내거나 크레딧을 사용하지 않아요." />
  </Page>;
}
