import { Page, EmptyState } from '../../ui';
import type { RoutePageProps } from '../../routes/paths';

export default function CreditsPage(_props: RoutePageProps) {
  return <Page title="무료 테스트 크레딧" description="대화에 사용할 테스트 크레딧을 확인하는 곳이에요.">
    <EmptyState title="크레딧 내역을 준비하고 있어요" description="실제 잔액과 이용 내역이 연결되면 표시해요. 구매·양도·환전·출금은 제공하지 않아요." />
  </Page>;
}
