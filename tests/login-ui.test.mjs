import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {createServer} from 'vite';
let server,PrivyLogin,LoginAccess;
before(async()=>{
 server=await createServer({appType:'custom',ssr:{noExternal:['@privy-io/react-auth']},cacheDir:'.context/login-ui-test-cache',optimizeDeps:{noDiscovery:true},server:{hmr:false,middlewareMode:true},plugins:[{name:'login-sdk-boundary',enforce:'pre',resolveId(source,importer){
  if(source==='@privy-io/react-auth')return '\0login-sdk';
  if(source==='./LoginCard'&&importer?.endsWith('/PrivyLogin.tsx'))return '\0login-capture';
 },load(id){
  if(id==='\0login-sdk')return `
   export const getAccessToken=async()=>null;
   export const usePrivy=()=>globalThis.__loginTest.session;
   export const useLoginWithOAuth=callbacks=>({loading:false,initOAuth:options=>{globalThis.__loginTest.oauth.push(options);return globalThis.__loginTest.oauthPromise??Promise.resolve();}});
   export const useLoginWithEmail=()=>({sendCode:async()=>{},loginWithCode:async()=>{}});
   export const useLogin=callbacks=>{globalThis.__loginTest.callbacks=callbacks;return {login:options=>globalThis.__loginTest.wallet.push(options)};};`;
  if(id==='\0login-capture')return 'export function LoginCard(props){globalThis.__loginTest.card=props;return null;}';
 }}]});
 ({PrivyLogin}=await server.ssrLoadModule('/src/features/auth/PrivyLogin.tsx'));
 ({LoginAccess}=await server.ssrLoadModule('/src/features/auth/LoginAccess.tsx'));
});
after(async()=>{await server?.close();delete globalThis.__loginTest;});
function mount(session={ready:true,authenticated:false,user:null},oauthPromise){
 const state=globalThis.__loginTest={session,oauth:[],wallet:[],oauthPromise};render(h(PrivyLogin));return state;
}
test('unconfigured login shows truthful disabled choices without mounting SDK hooks',()=>{
 delete globalThis.__loginTest;
 const html=render(h(LoginAccess,{enabled:false}));
 assert.match(html,/로그인 설정이 필요해요/);assert.match(html,/Google로 계속하기/);assert.match(html,/이메일로 계속하기/);assert.match(html,/다른 방법으로 로그인/);
 assert.equal((html.match(/disabled=""/g)||[]).length,3);assert.doesNotMatch(html,/비밀번호|테스트 크레딧/);
});
test('restoring or already authenticated sessions cannot initiate another provider login',()=>{
 for(const session of [{ready:false,authenticated:false,user:null},{ready:true,authenticated:true,user:{id:'did:privy:test'}},{ready:true,authenticated:true,user:null}]){
  const state=mount(session);assert.equal(state.card.disabled,true);state.card.onGoogle();state.card.onWallet();assert.equal(state.oauth.length+state.wallet.length,0);
 }
});
test('Google starts the headless Google flow once while a request is pending',async()=>{
 let complete;const state=mount(undefined,new Promise(resolve=>complete=resolve));
 state.card.onGoogle();state.card.onGoogle();state.card.onWallet();assert.deepEqual(state.oauth,[{provider:'google'}]);assert.equal(state.wallet.length,0);complete();await Promise.resolve();
});
test('optional wallet opens only wallet methods and duplicate requests are locked',()=>{
 const state=mount();state.card.onWallet();state.card.onWallet();state.card.onGoogle();assert.deepEqual(state.wallet,[{loginMethods:['wallet']}]);assert.equal(state.oauth.length,0);
 state.callbacks.onError('exited_auth_flow');state.card.onWallet();assert.equal(state.wallet.length,2,'cancel permits an intentional retry');
});
