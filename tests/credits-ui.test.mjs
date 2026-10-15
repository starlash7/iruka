import test from 'node:test'
import assert from 'node:assert/strict'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createServer} from 'vite'
test('credit view shows only supplied balances, history and unverified status',async()=>{
 const server=await createServer({appType:'custom',optimizeDeps:{noDiscovery:true},server:{hmr:false,middlewareMode:true}})
 try {
  const {WalletView}=await server.ssrLoadModule('/src/features/wallet/WalletView.tsx')
  const render=props=>renderToStaticMarkup(createElement(WalletView,{entries:[],busy:false,onRefresh(){},onMore(){},...props}))
  assert.doesNotMatch(render({}),/사용 가능<\/dt>/)
  assert.match(render({busy:true}),/불러오는 중/)
  assert.match(render({error:'로그인이 필요해요.'}),/role="alert"/)
  const html=render({balance:{available:17,reserved:3},entries:[{id:'entry',sequence:'1',kind:'reserve',amount:-3,turnId:'turn',createdAt:'2026-10-14T00:00:00Z',verification:'unverified'}]})
  assert.match(html,/17/);assert.match(html,/-3/);assert.match(html,/미검증/)
  assert.doesNotMatch(html,/href=.*explorer|지갑 연결|충전|구매|트랜잭션 승인/)
 } finally {await server.close()}
})
