import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'vite';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';

test('reader login navigates once requested and never reacts to restored SDK sessions',async()=>{
 const originalWindow=globalThis.window;
 globalThis.window={location:{pathname:'/works/work-1',search:'?network=giwa',hash:'#work-openings'}};
 const server=await createServer({appType:'custom',cacheDir:'.context/reader-auth-test-cache',optimizeDeps:{noDiscovery:true},server:{hmr:false,middlewareMode:true}});
 try{
  const {useReaderLogin}=await server.ssrLoadModule('/src/features/discover/useReaderLogin.ts');
  const {ReaderProvider}=await server.ssrLoadModule('/src/features/discover/ReaderProvider.tsx');
  const {safeLoginReturn,loginHref}=await server.ssrLoadModule('/src/features/auth/loginRedirect.ts');
  let beginLogin;const navigations=[];
  function Entry(){beginLogin=useReaderLogin({onError(){assert.fail('navigation should work');}});return null;}
  render(h(ReaderProvider,{api:{},navigate:path=>navigations.push(path)},h(Entry)));
  assert.equal(navigations.length,0,'render/session restoration cannot initiate login');
  beginLogin();assert.equal(navigations[0],loginHref('/works/work-1?network=giwa#work-openings'));
  for(const unsafe of ['https://attacker.test','//attacker.test','/\\attacker.test','/login?next=/login','/unknown','/works/a%2Fb','/\n/attacker.test','/login/',null])assert.equal(safeLoginReturn(unsafe),'/account',String(unsafe));
  assert.equal(safeLoginReturn('/works/work-1?start=1&opening=first&network=giwa&access_token=secret#work-openings'),'/works/work-1?network=giwa&start=1&opening=first#work-openings');
  assert.equal(safeLoginReturn('/search?q=꽃&sort=new'),'/search?q=%EA%BD%83&sort=new');
  let errors=0;
  function Failing(){beginLogin=useReaderLogin({onError(){errors++;}});return null;}
  render(h(ReaderProvider,{api:{},navigate(){throw Error('blocked');}},h(Failing)));
  beginLogin();assert.equal(errors,1);
 }finally{await server.close();if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;}
});
