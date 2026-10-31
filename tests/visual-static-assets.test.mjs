import assert from 'node:assert/strict';
import {test} from 'node:test';
import {resolve} from 'node:path';
import {createServer} from 'vite';
test('Vite serves public artwork and refuses raw private seed files through both static paths',async()=>{
 const server=await createServer({cacheDir:'.context/static-boundary-cache',optimizeDeps:{noDiscovery:true},server:{host:'127.0.0.1',port:0,strictPort:false,hmr:false}});
 try{await server.listen();const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
  assert.equal((await fetch(`${origin}/stories/office-romance/cover.webp`)).status,200);
  for(const path of ['/seed/media/office-romance/chaeri-smile.webp','/seed/works/office-romance/work.json',`/@fs/${resolve('seed/media/office-romance/chaeri-smile.webp')}`])assert.equal((await fetch(origin+path)).status,403,path);
 }finally{await server.close();}
});
