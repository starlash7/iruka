import {useEffect,useMemo,useRef,useState} from 'react'
import {usePrivy} from '@privy-io/react-auth'
import {ReaderSession} from '../discover/ReaderSession'
import {SignInNotice} from '../discover/SignInNotice'
import type {RoutePageProps} from '../../routes/paths'
import type {CreditBalanceDto} from '../../shared/contracts'
import {ApiClientError,createApiClient} from '../../shared/apiClient'
import type {CreditHistory} from '../../../server/credits/index'
import {WalletView} from './WalletView'
import {Page} from '../../ui'

export default function WalletPage({authEnabled}:RoutePageProps) {
 if(!authEnabled)return <Page title="무료 테스트 크레딧"><p>로그인 설정이 필요해요.</p></Page>
 return <AuthenticatedWallet/>
}
function AuthenticatedWallet() {
 const {ready,authenticated,user,getAccessToken}=usePrivy()
 if(!ready)return <Page title="무료 테스트 크레딧"><p role="status">로그인을 확인하는 중…</p></Page>
 if(!authenticated||!user)return <Page title="무료 테스트 크레딧"><ReaderSession>{session=><SignInNotice {...session} message="로그인 후 내 테스트 크레딧을 확인할 수 있어요."/>}</ReaderSession></Page>
 // Changing account unmounts the prior account's balance and cancels in-flight requests.
 return <WalletData key={user.id} getAccessToken={getAccessToken}/>
}
export function WalletData({getAccessToken}:{getAccessToken:()=>Promise<string|null>}) {
 const client=useMemo(()=>createApiClient({getAccessToken}),[getAccessToken])
 const [balance,setBalance]=useState<CreditBalanceDto>()
 const [history,setHistory]=useState<CreditHistory>({entries:[],nextCursor:null})
 const [busy,setBusy]=useState(false),[error,setError]=useState<string>()
 const active=useRef<AbortController>()
 async function loadCredits(before?:string) {
  active.current?.abort()
  const controller=new AbortController();active.current=controller
  setBusy(true);setError(undefined)
  try {
   const [balanceResponse,historyResponse]=await Promise.all([
    client.request<CreditBalanceDto>('/api/credits/balance',{signal:controller.signal}),
    client.request<CreditHistory>('/api/credits/history'+(before?'?before='+encodeURIComponent(before):''),{signal:controller.signal}),
   ])
   if(controller.signal.aborted)return
   setBalance(balanceResponse.data)
   setHistory(previous=>({entries:before?[...previous.entries,...historyResponse.data.entries]:historyResponse.data.entries,nextCursor:historyResponse.data.nextCursor}))
  } catch(failure) {
   if(controller.signal.aborted)return
   if(failure instanceof ApiClientError&&failure.status===401){setBalance(undefined);setHistory({entries:[],nextCursor:null})}
   setError(failure instanceof ApiClientError?failure.message:'크레딧을 불러오지 못했어요.')
  } finally {if(!controller.signal.aborted)setBusy(false)}
 }
 useEffect(()=>{void loadCredits();return ()=>active.current?.abort()},[client])
 return <WalletView balance={balance} entries={history.entries} nextCursor={history.nextCursor} busy={busy} error={error}
  onRefresh={()=>void loadCredits()} onMore={()=>{if(history.nextCursor)void loadCredits(history.nextCursor)}}/>
}
