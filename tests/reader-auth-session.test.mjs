import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'vite';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

test('only an initiated header login reloads; session restore and other surfaces do not',async()=>{
 let reloads=0;
 const originalWindow=globalThis.window;
 globalThis.window={location:{reload(){reloads++;}}};
 globalThis.__readerAuthTest={};
 const server=await createServer({appType:'custom',cacheDir:'.context/reader-auth-test-cache',ssr:{noExternal:['@privy-io/react-auth']},define:{'import.meta.env.VITE_PRIVY_APP_ID':JSON.stringify('test-app')},optimizeDeps:{noDiscovery:true},server:{hmr:false,middlewareMode:true},
  plugins:[{name:'reader-auth-test',enforce:'pre',resolveId(source){if(source==='@privy-io/react-auth')return '\0reader-auth-test';},load(id){if(id==='\0reader-auth-test')return `
   export const getAccessToken=async()=>null;
   export const usePrivy=()=>({ready:true,authenticated:true,user:{id:'did:privy:test'},logout:async()=>{}});
   export const useLogin=callbacks=>{globalThis.__readerAuthTest.callbacks=callbacks;return {login(){}}};
   export const useLinkAccount=()=>({linkWallet(){}});
  `;}}]});
 try{
  const {useReaderLogin}=await server.ssrLoadModule('/src/features/discover/useReaderLogin.ts');
  let beginLogin;
  function HeaderLogin(){beginLogin=useReaderLogin({reloadOnLogin:true,onError(){}});return null;}
  renderToStaticMarkup(createElement(HeaderLogin));
  const {onComplete}=globalThis.__readerAuthTest.callbacks;
  onComplete({wasAlreadyAuthenticated:true});
  onComplete({wasAlreadyAuthenticated:true});
  assert.equal(reloads,0,'restoration must never restart SDK initialization');
  onComplete({wasAlreadyAuthenticated:false});
  assert.equal(reloads,0,'a login initiated in the start sheet must not be reloaded by the header');
  beginLogin();
  onComplete({wasAlreadyAuthenticated:false});
  assert.equal(reloads,1,'new login clears the previous user view');
  onComplete({wasAlreadyAuthenticated:true});
  assert.equal(reloads,1,'restoring after that refresh must stop');
  let complete=0;
  function SheetLogin(){beginLogin=useReaderLogin({onComplete(){complete++;},onError(){}});return null;}
  renderToStaticMarkup(createElement(SheetLogin));
  beginLogin();globalThis.__readerAuthTest.callbacks.onComplete({wasAlreadyAuthenticated:false});
  assert.equal(reloads,1,'the sheet must continue without a page reload');
  assert.equal(complete,1);
 }finally{await server.close();delete globalThis.__readerAuthTest;if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;}
});
