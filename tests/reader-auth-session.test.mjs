import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'vite';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

test('restoring a Privy session does not reload; a new login refreshes private view data once',async()=>{
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
  const {ReaderAccountMenu}=await server.ssrLoadModule('/src/features/discover/ReaderAccountMenu.tsx');
  assert.match(renderToStaticMarkup(createElement(ReaderAccountMenu)),/내 계정/);
  const {onComplete}=globalThis.__readerAuthTest.callbacks;
  onComplete({wasAlreadyAuthenticated:true});
  onComplete({wasAlreadyAuthenticated:true});
  assert.equal(reloads,0,'restoration must never restart SDK initialization');
  onComplete({wasAlreadyAuthenticated:false});
  assert.equal(reloads,1,'new login clears the previous user view');
  onComplete({wasAlreadyAuthenticated:true});
  assert.equal(reloads,1,'restoring after that refresh must stop');
 }finally{await server.close();delete globalThis.__readerAuthTest;if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;}
});
