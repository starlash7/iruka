import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {createServer} from 'vite';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {getMessageBranch} from '../src/features/chat/messageTree.ts';
import {findMessages,readReading,saveReading,parseReading,defaultReading} from '../src/features/chat/reading.ts';
let server,Narrative,LibraryDialog;
before(async()=>{server=await createServer({appType:'custom',optimizeDeps:{noDiscovery:true},server:{hmr:false,middlewareMode:true}});({Narrative}=await server.ssrLoadModule('/src/features/chat/MessageList.tsx'));({LibraryDialog}=await server.ssrLoadModule('/src/features/chat/LibraryDialog.tsx'));});
after(async()=>{await server.close();});
test('literal search only returns messages in the selected path',()=>{
 const messages=[{id:'root',parentMessageId:null,content:'@도서관@ 별빛 [A.*] <script>'},{id:'chosen',parentMessageId:'root',content:'*별빛을 따라*'},{id:'other',parentMessageId:'root',content:'다른 분기'}];
 const selected=getMessageBranch(messages,'chosen');
 assert.deepEqual(findMessages(selected,'별빛'),['root','chosen']);assert.deepEqual(findMessages(selected,'[a.*]'),['root']);assert.deepEqual(findMessages(selected,'다른 분기'),[]);assert.deepEqual(findMessages(selected,'  '),[]);
 const html=render(h(Narrative,{content:messages[0].content,search:'<script>'}));
 assert.match(html,/<mark>&lt;script&gt;<\/mark>/);assert.doesNotMatch(html,/<script>/);
 assert.match(render(h(Narrative,{content:'a.* b A.*',search:'a.*'})),/<mark>a\.\*<\/mark> b <mark>A\.\*<\/mark>/);
});
test('reading settings bound stored input and tolerate denied or malformed storage',()=>{
 assert.deepEqual(parseReading({fontSize:99,lineHeight:0}),defaultReading);
 assert.deepEqual(parseReading({fontSize:24,lineHeight:2.1}),{fontSize:24,lineHeight:2.1});
 assert.deepEqual(readReading({getItem(){throw Error('denied');}}),defaultReading);
 assert.deepEqual(readReading({getItem:()=>'{invalid'}),defaultReading);
 assert.equal(saveReading({setItem(){throw Error('denied');}},{fontSize:20,lineHeight:1.6}),false);
 let stored;assert.equal(saveReading({setItem(_key,value){stored=value;}},{fontSize:22,lineHeight:2.1}),true);
 assert.deepEqual(readReading({getItem:()=>stored}),{fontSize:22,lineHeight:2.1});
});
test('library dialog keeps deletion consequence and name bounds inside the modal',()=>{
 const base={api:{},folders:[{id:'f',name:'즐겨찾는 대화'}],onClose(){},onSaved(){}};
 const edit=render(h(LibraryDialog,{...base,action:{kind:'chat-edit',chat:{chat:{id:'c'},title:'내 대화',folderId:'f'}}}));
 assert.match(edit,/<dialog/);assert.match(edit,/maxLength="80"/i);assert.match(edit,/<option value="f" selected="">/);
 const remove=render(h(LibraryDialog,{...base,action:{kind:'folder-delete',folder:{id:'f',name:'폴더'}}}));
 assert.match(remove,/대화는 지워지지 않고 미분류로 옮겨져요/);
});
