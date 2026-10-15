import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
test('reader renders accessible search and escaped narrative without private or HTML execution',async()=>{
 const server=await createServer({appType:'custom',optimizeDeps:{noDiscovery:true},server:{hmr:false,middlewareMode:true}});
 try{
  const {Narrative}=await server.ssrLoadModule('/src/features/chat/MessageList.tsx');
  const output=renderToStaticMarkup(createElement(Narrative,{content:'@서하@ <script>alert(1)</script>\n*풍경*'}));
  assert.match(output,/&lt;script&gt;/);assert.doesNotMatch(output,/<script>/);assert.match(output,/<em>풍경/);
  const {SearchForm}=await server.ssrLoadModule('/src/features/discover/SearchPage.tsx');
  const form=renderToStaticMarkup(createElement(SearchForm));assert.match(form,/role="search"/);assert.match(form,/<label/);assert.match(form,/type="submit"/);
 }finally{await server.close();}
});
test('explicit development adapter preserves branches, memo, images and endings; aborted turns do not debit',async()=>{
 const server=await createServer({appType:'custom',optimizeDeps:{noDiscovery:true},server:{hmr:false,middlewareMode:true}});
 try{
  const {createDevelopmentApi}=await server.ssrLoadModule('/src/features/discover/__fixtures__/createDevelopmentApi.ts');
  const api=createDevelopmentApi({delay:1});assert.deepEqual(await api.listChats(),[]);
  const chat=await api.startChat({workId:'work-1',openingId:'return',personaId:'persona-1',model:'test'});
  assert.match((await api.getChat(chat.id)).messages[0].content,/다시/);
  const body={content:'이미지 엔딩',parentMessageId:chat.activeMessageId,model:'test'};
  const collect=async(stream)=>{const result=[];for await(const event of stream)result.push(event);return result;};
  const events=await collect(api.streamTurn(chat.id,body,{idempotencyKey:'first'}));
  assert.equal(events.at(-1).status,'completed');assert.ok(events.some(e=>e.type==='image'));assert.ok(events.some(e=>e.type==='ending'));
  assert.equal((await api.getBalance()).available,29);
  await collect(api.streamTurn(chat.id,body,{idempotencyKey:'first'}));assert.equal((await api.getBalance()).available,29);
  const user=(await api.getChat(chat.id)).messages.find(m=>m.role==='user');
  await collect(api.streamTurn(chat.id,{...body,parentMessageId:user.id},{idempotencyKey:'regenerate'}));
  const view=await api.getChat(chat.id);assert.equal(view.messages.filter(m=>m.role==='user').length,1);
  const siblings=view.messages.filter(m=>m.parentMessageId===view.messages[1].id);assert.equal(siblings.length,2);
  assert.equal(siblings[0].images.length,1);assert.ok(siblings[0].ending);
  await api.selectBranch(chat.id,siblings[0].id);assert.equal((await api.getChat(chat.id)).chat.activeMessageId,siblings[0].id);
  const branch=await api.branchChat(chat.id,siblings[0].id);assert.notEqual(branch.chat.id,chat.id);assert.equal(branch.messages.length,3);
  assert.ok(branch.messages.every(message=>message.chatId===branch.chat.id));
  await api.editMessage(chat.id,siblings[0].id,'수정된 응답');assert.equal((await api.getChat(chat.id)).messages.find(m=>m.id===siblings[0].id).content,'수정된 응답');
  await api.saveMemo(chat.id,'별을 기억한다');assert.equal((await api.getChat(chat.id)).memo,'별을 기억한다');
  await api.deleteMessage(chat.id,view.messages[1].id);assert.equal((await api.getChat(chat.id)).messages.length,1);
  const before=await api.getBalance(),controller=new AbortController();controller.abort();
  await assert.rejects(collect(api.streamTurn(chat.id,body,{idempotencyKey:'abort',signal:controller.signal})),{name:'AbortError'});
  assert.deepEqual(await api.getBalance(),before);
 }finally{await server.close();}
});
test('restored profile uses stable original avatar, escapes identity and offers wallet linking only without a wallet',async()=>{
 const server=await createServer({appType:'custom',optimizeDeps:{noDiscovery:true},server:{hmr:false,middlewareMode:true}});
 try{
  const {ReaderProfileMenu}=await server.ssrLoadModule('/src/features/discover/ReaderAccountMenu.tsx');
  const props={identity:'did:privy:test',name:'<script>bad</script>',onLinkWallet(){},onLogout(){}};
  const html=renderToStaticMarkup(createElement(ReaderProfileMenu,props));
  assert.match(html,/profile-idol-sprite|reader-profile-avatar-/);
  assert.match(html,/지갑 연결/);assert.match(html,/aria-expanded="false"/);assert.doesNotMatch(html,/<script>/);
  const linked=renderToStaticMarkup(createElement(ReaderProfileMenu,{...props,address:'0x1234'}));
  assert.match(linked,/연결된 지갑/);assert.match(linked,/0x1234/);assert.doesNotMatch(linked,/>지갑 연결</);
  assert.equal(html.match(/reader-profile-avatar-\d/)[0],linked.match(/reader-profile-avatar-\d/)[0]);
 }finally{await server.close();}
});
