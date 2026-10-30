import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'vite';
test('library derives unique works from actual chats without altering chat history',async()=>{
 const server=await createServer({appType:'custom',cacheDir:'.context/library-test',optimizeDeps:{noDiscovery:true},server:{hmr:false,middlewareMode:true}});
 try{
  const {getLibraryWorks}=await server.ssrLoadModule('/src/features/discover/account/AccountLibrary.tsx');
  const chats=[{chat:{id:'1',workId:'a'},title:'작품 A'},{chat:{id:'2',workId:'a'},title:'작품 A'},{chat:{id:'3',workId:'b'},title:'작품 B'}];
  assert.deepEqual(getLibraryWorks(chats).map(item=>item.chat.workId),['a','b']);
  assert.equal(chats.length,3);
  assert.deepEqual(getLibraryWorks([]),[]);
 }finally{await server.close();}
});
