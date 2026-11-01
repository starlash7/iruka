import assert from 'node:assert/strict';
import {after, before, test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';

let server, ChatPage, MessageDialog;
const messages=[{id:'user',role:'user',parentMessageId:null,content:'안녕'},{id:'assistant',role:'assistant',parentMessageId:'user',content:'반가워요'}];
const resource=data=>({data,loading:false,error:null,reload(){}});
function reset(){
 globalThis.__chatUx={
  session:{view:{chat:{id:'chat',activeMessageId:'assistant'},messages,title:'대화',suggestedReplies:[]},preview:{text:'',images:[],status:'',ending:null},busy:false,locked:false,loading:false,notice:'',reload(){},mutate(){},send(){}},
  models:resource([{id:'test',name:'테스트',credits:3,available:true}]),balance:resource({available:5}),
 };
 return globalThis.__chatUx;
}
before(async()=>{
 server=await createServer({appType:'custom',optimizeDeps:{noDiscovery:true},server:{hmr:false,middlewareMode:true},plugins:[{
  name:'chat-ux-state-fixtures',enforce:'pre',transform(_code,id){
   if(id.endsWith('/chat/useChatSession.ts'))return 'export const useChatSession=()=>globalThis.__chatUx.session;';
   if(id.endsWith('/discover/useResource.ts'))return 'export const useResource=load=>load();';
   if(id.endsWith('/discover/ReaderProvider.tsx'))return 'export const useReader=()=>({api:{getModels:()=>globalThis.__chatUx.models,getBalance:()=>globalThis.__chatUx.balance},href:path=>path,navigate(){}});';
   if(id.endsWith('/discover/ReaderLayout.tsx'))return 'export const ReaderLayout=({children})=>children;';
  },
 }]});
 ({ChatRoom:ChatPage}=await server.ssrLoadModule('/src/features/chat/ChatPage.tsx'));
 ({MessageDialog}=await server.ssrLoadModule('/src/features/chat/ChatPanels.tsx'));
});
after(async()=>{delete globalThis.__chatUx;await server?.close();});
const renderPage=()=>renderToStaticMarkup(createElement(ChatPage,{params:{chatId:'chat'}}));
function regenerate(html){return html.match(/<button\b[^>]*>재생성<\/button>/)?.[0]??assert.fail('Missing regenerate action');}

for(const [name,change,reason] of [
 ['pending turn',s=>{s.session.locked=true;s.session.view.pendingTurn={id:'pending',status:'running'};},'이전 응답을 처리하고 있어요. 상태를 자동으로 확인하고 있어요.'],
 ['no available model',s=>{s.models.data[0].available=false;},'지금 사용할 수 있는 모델이 없어요.'],
 ['empty model list',s=>{s.models.data=[];},'지금 사용할 수 있는 모델이 없어요.'],
 ['model loading',s=>{s.models.loading=true;s.models.data=null;},'모델을 확인하고 있어요.'],
 ['model error',s=>{s.models.error=new Error('모델 조회 실패');s.models.data=null;},'모델을 불러오지 못했어요.'],
 ['insufficient credits',s=>{s.balance.data.available=2;},'테스트 크레딧이 부족해요.'],
 ['balance loading',s=>{s.balance.loading=true;},'테스트 크레딧을 확인하고 있어요.'],
 ['balance error',s=>{s.balance.error=new Error('잔액 조회 실패');},'테스트 크레딧을 불러오지 못했어요.'],
 ['recovery lock',s=>{s.session.locked=true;},'이전 응답을 먼저 확인해 주세요.'],
 ['busy',s=>{s.session.busy=true;},'요청을 처리하고 있어요.'],
])test(`generation explains and disables ${name}`,()=>{
 const state=reset();change(state);const html=renderPage();
 assert.match(regenerate(html),/disabled=""/);
 assert.match(regenerate(html),/aria-describedby="chat-generation-status"/);
 assert.ok(html.includes(reason),`Missing reason: ${reason}`);
 assert.match(html,/<[^>]+id="chat-generation-status"[^>]*role="status"/);
});
test('eligible regeneration stays enabled at the exact credit cost',()=>{
 const state=reset();state.balance.data.available=3;
 assert.doesNotMatch(regenerate(renderPage()),/disabled=/);
});
test('no model does not disable edit, delete or branch actions',()=>{
 reset().models.data=[];const html=renderPage();
 for(const label of ['수정','삭제','여기서 분기'])assert.doesNotMatch(html.match(new RegExp(`<button\\b[^>]*>${label}</button>`))[0],/disabled=/);
});
for(const kind of ['edit','delete'])test(`${kind} error is visible inside the active dialog`,()=>{
 const html=renderToStaticMarkup(createElement(MessageDialog,{action:{kind,message:messages[0]},busy:false,error:new Error('변경하지 못했어요.'),onClose(){},async onConfirm(){}}));
 assert.match(html,/<dialog\b[\s\S]*role="alert"[^>]*>변경하지 못했어요\.[\s\S]*<\/dialog>/);
 assert.doesNotMatch(html,/<button[^>]*disabled/);
 if(kind==='edit')assert.match(html,/<textarea[^>]*>안녕<\/textarea>/);
});
test('page shares generation eligibility and scopes mutation errors to the dialog attempt',async()=>{
 const source=await readFile(new URL('../src/features/chat/ChatPage.tsx',import.meta.url),'utf8');
 assert.match(source,/const disabled=!!generationDisabledReason/);
 assert.match(source,/selected&&!disabled/);
 assert.match(source,/regenerateDisabledReason=\{generationDisabledReason\}/);
 assert.match(source,/setMutationError\(null\);setAction\(\{kind,message\}\)/);
 assert.match(source,/catch\(error\)\{setMutationError\([\s\S]*?throw error;/);
 assert.match(source,/<MessageDialog[^>]*error=\{mutationError\}/);
});
