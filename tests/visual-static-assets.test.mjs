import assert from 'node:assert/strict';
import {test} from 'node:test';
import {writeFile,unlink,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {createServer} from 'vite';
test('Vite serves public artwork and refuses raw private seed files through both static paths',async()=>{
 const server=await createServer({cacheDir:'.context/static-boundary-cache',optimizeDeps:{noDiscovery:true},server:{host:'127.0.0.1',port:0,strictPort:false,hmr:false}});
 try{await server.listen();const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
  assert.equal((await fetch(`${origin}/stories/office-romance/cover.webp`)).status,200);
  for(const path of ['/seed/media/office-romance/chaeri-smile.webp','/seed/works/office-romance/work.json',`/@fs/${resolve('seed/media/office-romance/chaeri-smile.webp')}`])assert.equal((await fetch(origin+path)).status,403,path);
 }finally{await server.close();}
});

test('Vite refuses private local data and environment/key canaries through static, raw and filesystem URLs',async()=>{
 const id=randomUUID(),paths=[`.context/security-${id}.txt`,`docs/internal/security-${id}.txt`,`.env.security-${id}`,`security-${id}.key`];
 const canary=`PRIVATE_SYNTHETIC_${id}`;
 const outside=await mkdtemp(`${tmpdir()}/iruka-vite-boundary-`);await writeFile(`${outside}/canary.txt`,canary);
 const server=await createServer({cacheDir:'.context/static-private-cache',optimizeDeps:{noDiscovery:true},server:{host:'127.0.0.1',port:0,hmr:false}});
 try{
  for(const path of paths){await mkdir(dirname(resolve(path)),{recursive:true});await writeFile(path,canary,{flag:'wx'});}
  await server.listen();const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
  for(const path of paths)for(const route of [`/${path}`,`/${path}?raw`,`/@fs/${resolve(path)}`,`/@fs/${resolve(path)}?raw`]){
   const response=await fetch(origin+route);assert.equal(response.status,403,route);assert.ok(!(await response.text()).includes(canary));
  }
  const external=await fetch(`${origin}/@fs/${outside}/canary.txt`);assert.equal(external.status,403);assert.ok(!(await external.text()).includes(canary));
  const document=await fetch(origin+'/');assert.equal(document.status,200);assert.match(document.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.equal(document.headers.get('referrer-policy'),'no-referrer');
  assert.equal((await fetch(origin+'/src/features/auth/LoginPage.tsx')).status,200,'real application modules remain available');
 }finally{await server.close();for(const path of paths)await unlink(path).catch(()=>{});await rm(outside,{recursive:true,force:true});}
});
