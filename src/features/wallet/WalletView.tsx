import {Coins,Clock3,RefreshCw} from 'lucide-react'
import {StateArtwork} from '../../ui/StateArtwork'
import {Button, Page} from '../../ui'
import type {CreditBalanceDto} from '../../shared/contracts'
import type {CreditHistoryEntry} from '../../../server/credits/index'
import './wallet.css'

const labels={grant:'무료 지급',reserve:'대화 예약',charge:'사용 확정',release:'크레딧 복구'}
export interface WalletViewProps {
 balance?:CreditBalanceDto; entries:CreditHistoryEntry[];busy:boolean;error?:string;nextCursor?:string|null;
 onRefresh:()=>void;onMore:()=>void;
}
export function WalletView({balance,entries,busy,error,nextCursor,onRefresh,onMore}:WalletViewProps) {
 return <Page className="credit-page" title="무료 테스트 크레딧" description="이야기를 이어가는 데 사용한 크레딧을 확인하세요." actions={<Button variant="secondary" disabled={busy} onClick={onRefresh}><RefreshCw size={16}/>새로고침</Button>}>
  {busy&&<p role="status">불러오는 중…</p>}
  {error&&<p role="alert">{error}</p>}
  {balance&&<>
   <dl className="credit-balance"><div><dt><Coins size={18}/>사용 가능</dt><dd>{balance.available.toLocaleString('ko-KR')}</dd></div>
    <div><dt><Clock3 size={18}/>예약 중</dt><dd>{balance.reserved.toLocaleString('ko-KR')}</dd></div></dl>
   <section aria-labelledby="credit-history-title"><h2 id="credit-history-title">사용 내역</h2>
    {entries.length===0?<div className="reader-state reader-state--empty"><StateArtwork/><p>아직 내역이 없어요.</p></div>:<ul className="credit-history">{entries.map(entry=><li key={entry.id}>
     <div><strong>{labels[entry.kind]}</strong><time dateTime={entry.createdAt}>{new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Seoul'}).format(new Date(entry.createdAt))}</time></div>
     <div className="credit-entry-value"><strong>{entry.amount>0?'+':''}{entry.amount.toLocaleString('ko-KR')}</strong><span className="ui-chip">미검증</span></div>
    </li>)}</ul>}
    {nextCursor&&<Button variant="secondary" disabled={busy} onClick={onMore}>더 보기</Button>}
   </section>
  </>}
 </Page>
}
