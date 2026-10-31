import assert from 'node:assert/strict';
import {after,before,test} from 'node:test';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {createServer} from 'vite';

let server,MyProfile,WorkPage,StartChatSheet,AccountView,ReaderProvider,WorkConversationActions,StudioSession;
const work={id:'work-test',title:'테스트 작품',description:'공개 소개',tags:['판타지'],coverUrl:null,publishedVersionId:'version-test',snapshot:{tagline:'짧은 소개',characters:[{id:'character',name:'안내자',imageUrl:null}],openings:[{id:'opening',title:'첫 만남',prologue:'공개 프롤로그',firstMessage:'어서 오세요.',suggestedReplies:[]}],playGuide:'공개 가이드'}};

before(async()=>{
 globalThis.__accountWorkTest={profile:{data:null,error:'프로필 조회 실패',loading:false},resource:{data:work,error:null,loading:false,reload(){}},session:{ready:true,authenticated:false,user:null},resourceReads:0};
 server=await createServer({appType:'custom',cacheDir:'.context/account-work-test',ssr:{noExternal:['@privy-io/react-auth']},define:{'import.meta.env.VITE_PRIVY_APP_ID':JSON.stringify('')},optimizeDeps:{noDiscovery:true},server:{hmr:false,middlewareMode:true},plugins:[{
  name:'account-work-controlled-state',enforce:'pre',
  resolveId(source){
   if(source==='./useProfile')return '\0test-profile';
   if(source==='./useResource'||source==='../discover/useResource')return '\0test-resource';
   if(source==='../chat/ChatList')return '\0test-chat-list';
   if(source==='@privy-io/react-auth')return '\0test-privy';
  },
  load(id){
   if(id==='\0test-profile')return 'export function useProfile(){return {...globalThis.__accountWorkTest.profile,reload(){},save:async()=>{}};}';
   if(id==='\0test-resource')return 'export function useResource(load){globalThis.__accountWorkTest.resourceReads++;globalThis.__accountWorkTest.resourceLoads?.push(load);return globalThis.__accountWorkTest.resource;}';
   if(id==='\0test-chat-list')return 'export function ChatList(){return null;}';
   if(id==='\0test-privy')return 'export const getAccessToken=async()=>null;export const usePrivy=()=>globalThis.__accountWorkTest.session;export const useLogin=callbacks=>{globalThis.__accountWorkTest.loginCallbacks=callbacks;return {login(){globalThis.__accountWorkTest.loginCalls=(globalThis.__accountWorkTest.loginCalls||0)+1;}}};';
  }
 }]});
 ({MyProfile}=await server.ssrLoadModule('/src/features/user/profile/MyProfile.tsx'));
 ({default:WorkPage}=await server.ssrLoadModule('/src/features/discover/WorkPage.tsx'));
 ({StartChatSheet}=await server.ssrLoadModule('/src/features/chat/StartChatSheet.tsx'));
 ({AccountView}=await server.ssrLoadModule('/src/AccountView.tsx'));
 ({ReaderProvider}=await server.ssrLoadModule('/src/features/discover/ReaderProvider.tsx'));
 ({WorkConversationActions}=await server.ssrLoadModule('/src/features/discover/WorkConversationActions.tsx'));
 ({StudioSession}=await server.ssrLoadModule('/src/features/studio/StudioSession.tsx'));
});
after(async()=>{await server?.close();delete globalThis.__accountWorkTest;});

test('profile errors and loading never hide real activity destinations',()=>{
 for(const state of [{error:'프로필 조회 실패',loading:false},{error:'',loading:true}]){
  globalThis.__accountWorkTest.profile={data:null,...state};
  const html=render(h(MyProfile,{identity:'did:privy:test'}));
  for(const path of ['/studio','/chats','/personas','/credits'])assert.ok(html.includes(`href="${path}"`),path);
  assert.match(html,state.error?/프로필 조회 실패/:/불러오는 중/);
 }
});

test('saved profile values render without turning auth identity into the nickname',()=>{
 globalThis.__accountWorkTest.profile={data:{nickname:'저장한 별명',bio:'나의 소개',avatar:null},error:'',loading:false};
 const html=render(h(MyProfile,{identity:'did:privy:test'}));
 assert.match(html,/저장한 별명/);assert.match(html,/나의 소개/);assert.match(html,/프로필 수정/);
 assert.doesNotMatch(html,/팔로워|팔로잉|did:privy:test/);
 const settings=render(h(AccountView,{ready:true,authenticated:true,user:{id:'did:privy:test',google:{name:'로그인 계정',email:'login@example.test'}},walletPanel:h('div',null,'선택적 지갑'),onLogin(){},onLogout(){}}));
 assert.match(settings,/로그인 정보/);assert.match(settings,/로그인 계정/);assert.match(settings,/선택적 지갑/);
 assert.doesNotMatch(settings,/account-profile-hero|reader-account-art/);
});

test('work detail links only to existing public sections and keeps one start action',()=>{
 globalThis.__accountWorkTest.resource={data:work,error:null,loading:false,reload(){}};
 const html=render(h(WorkPage,{params:{id:work.id}}));
 for(const id of ['work-introduction','work-characters','work-openings','work-guide']){
  assert.ok(html.includes(`href="#${id}"`),id);assert.ok(html.includes(`id="${id}"`),id);
 }
 assert.equal((html.match(/>대화 시작</g)||[]).length,1);
 assert.doesNotMatch(html,/팔로워|좋아요|누적 대화/);
});

test('restoring or signed-out sessions do not mount private start-sheet requests',()=>{
 for(const session of [{ready:false,authenticated:false,user:null},{ready:true,authenticated:false,user:null},{ready:true,authenticated:true,user:null}]){
  globalThis.__accountWorkTest.session=session;globalThis.__accountWorkTest.resourceReads=0;
  const html=render(h(StartChatSheet,{open:true,authEnabled:true,work,onClose(){}}));
  assert.equal(globalThis.__accountWorkTest.resourceReads,0);
  assert.match(html,!session.ready||session.authenticated?/로그인 확인 중/:/>로그인</);
 }
});

test('authenticated and explicit development sessions can open start options',()=>{
 globalThis.__accountWorkTest.resource={data:{personas:[],models:[{id:'test',name:'테스트 모델',credits:1,available:true}],balance:{available:10}},error:null,loading:false,reload(){}};
 globalThis.__accountWorkTest.session={ready:true,authenticated:true,user:{id:'did:privy:test'}};
 assert.match(render(h(StartChatSheet,{open:true,authEnabled:true,work,onClose(){}})),/이 상황으로 시작/);
 globalThis.__accountWorkTest.session={ready:true,authenticated:false,user:null};
 assert.match(render(h(ReaderProvider,{api:{},development:true},h(StartChatSheet,{open:true,work,onClose(){}}))),/이 상황으로 시작/);
});

test('missing production auth configuration fails closed before private options',()=>{
 globalThis.__accountWorkTest.resourceReads=0;
 const html=render(h(StartChatSheet,{open:true,authEnabled:false,work,onClose(){}}));
 assert.equal(globalThis.__accountWorkTest.resourceReads,0);assert.match(html,/로그인 설정/);
});

test('continue uses an exact-work latest-chat query and leaves new-conversation available',async()=>{
 const state=globalThis.__accountWorkTest;state.session={ready:true,authenticated:true,user:{id:'did:privy:test'}};
 state.resource={data:[{chat:{id:'latest-chat'}}],loading:false,error:null};state.resourceLoads=[];
 let query;const html=render(h(ReaderProvider,{api:{listChats:async value=>{query=value;return [];}}},h(WorkConversationActions,{workId:'exact-work',published:true,authEnabled:true,onStart(){}})));
 assert.match(html,/href="\/chat\/latest-chat"[^>]*>이어하기/);assert.match(html,/>새 대화</);
 await state.resourceLoads[0]();assert.deepEqual(query,{workId:'exact-work',limit:1});
 for(const session of [{ready:false,authenticated:true,user:{id:'did:privy:old'}},{ready:true,authenticated:false,user:null}]){
  state.session=session;state.resourceReads=0;
  const signedOut=render(h(WorkConversationActions,{workId:'exact-work',published:true,authEnabled:true,onStart(){}}));
  assert.equal(state.resourceReads,0);assert.doesNotMatch(signedOut,/이어하기/);assert.match(signedOut,/대화 시작/);
 }
});

test('studio presents compact sign-in guidance without mounting anonymous private children',()=>{
 const state=globalThis.__accountWorkTest;
 for(const session of [{ready:false,authenticated:true,user:{id:'did:privy:old'}},{ready:true,authenticated:false,user:null}]){
  state.session=session;let mounted=0;const html=render(h(StudioSession,{enabled:true,children:()=>{mounted++;return h('div',null,'private');}}));
  assert.equal(mounted,0);assert.doesNotMatch(html,/private|지갑|출금/);assert.match(html,/작품 만들기/);
 }
});
