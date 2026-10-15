import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {createServer} from 'vite';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
let server,modules={};
const work=(mode,id)=>({id,mode,title:`${mode} 제목`,description:'긴 소개 '.repeat(80),tags:['판타지','아주긴태그'.repeat(10)],coverUrl:null,publishedVersionId:'v',snapshot:{tagline:'한 줄 소개',characters:[{id:'c',name:'등장인물',imageUrl:null}],openings:[{id:'o',title:'첫 만남',prologue:'공개 프롤로그'}],playGuide:'안내'}});
before(async()=>{
 server=await createServer({appType:'custom',cacheDir:'.context/discovery-ui-test',define:{'import.meta.env.VITE_PRIVY_APP_ID':JSON.stringify('')},optimizeDeps:{noDiscovery:true},server:{hmr:false,middlewareMode:true},plugins:[{name:'discovery-resource-test',enforce:'pre',resolveId(source){if(source==='./useResource')return '\0discovery-resource';if(source==='../chat/ChatList')return '\0discovery-chat-list';if(source==='../chat/StartChatSheet')return '\0discovery-start';},load(id){if(id==='\0discovery-resource')return 'export const useResource=()=>globalThis.__discoveryState;';if(id==='\0discovery-chat-list')return 'export const ChatList=()=>null;';if(id==='\0discovery-start')return 'export const StartChatSheet=()=>null;';}}]});
 for(const name of ['HomePage','SearchPage','TagPage','RankingPage','WorkPage','WorkGrid'])modules[name]=await server.ssrLoadModule(`/src/features/discover/${name}.tsx`);
});
after(async()=>{await server.close();delete globalThis.__discoveryState;});
function render(name,props={},data=[]){globalThis.__discoveryState={data,error:null,loading:false,reload(){}};return renderToStaticMarkup(createElement(modules[name].default,props));}
test('home keeps both modes discoverable without mode badges or duplicate recommendations',()=>{
 const html=render('HomePage',{},[work('story','story'),work('character','character')]);
 assert.match(html,/\/works\/story/);assert.match(html,/\/works\/character/);
 assert.match(html,/aria-label="작품 탐색"/);assert.doesNotMatch(html,/reader-work-type|태그별 추천|작품 유형/);
 assert.equal((html.match(/class="reader-work"/g)||[]).length,2);
});
test('legacy mode filters preserve query and tag; removing tag preserves mode and query',()=>{
 globalThis.__discoveryState={data:[],error:null,loading:false};
 const html=renderToStaticMarkup(createElement(modules.SearchPage.SearchResults,{query:'달빛 & 별',tag:'판타지',mode:'character'}));
 const links=[...html.matchAll(/href="([^"]+)"/g)].map(match=>new URL(match[1].replaceAll('&amp;','&'),'https://local'));
 assert.equal(links.length,4);
 for(const link of links)assert.equal(link.searchParams.get('q'),'달빛 & 별');
 assert.equal(links[0].searchParams.get('mode'),'character');assert.equal(links[0].searchParams.has('tag'),false);
 assert.deepEqual(links.slice(1).map(link=>link.searchParams.get('mode')),['','story','character']);
 assert(links.slice(1).every(link=>link.searchParams.get('tag')==='판타지'));
 assert.match(html,/<details[^>]*open/);assert.match(html,/조건에 맞는 작품이 없어요/);
});
test('detail presents public introduction and first opening for either mode',()=>{
 for(const mode of ['story','character']){
  const html=render('WorkPage',{params:{id:mode}},work(mode,mode));
  assert.match(html,/작품 소개/);assert.match(html,/등장인물/);assert.match(html,/<details open=""><summary>첫 만남/);assert.match(html,/대화 시작/);
  assert.doesNotMatch(html,/reader-eyebrow/);
 }
});
test('ranking preserves server order and describes successful user criterion',()=>{
 const html=render('RankingPage',{},[work('character','second'),work('story','first')]);
 assert(html.indexOf('/works/second')<html.indexOf('/works/first'));
 assert.match(html,/최근 7일 · 대화 생성에 성공한 이용자 수 기준/);
});
test('error and loading states never render fixture works',()=>{
 for(const state of [{loading:true,error:null},{loading:false,error:new Error('서버 연결 실패')}]){
  globalThis.__discoveryState={...state,data:null,reload(){}};
  const html=renderToStaticMarkup(createElement(modules.HomePage.default));
  assert.doesNotMatch(html,/class="reader-work"/);
  assert.match(html,state.error?/서버 연결 실패/:/불러오는 중/);
 }
});
test('missing or unsafe images have a labelled fallback, arbitrary titles are escaped',()=>{
 const {WorkCover,WorkGrid}=modules.WorkGrid;
 for(const url of [null,'javascript:alert(1)','//untrusted.test/x']){
  const html=renderToStaticMarkup(createElement(WorkCover,{url,title:'표지'}));
  assert.match(html,/role="img" aria-label="표지 표지 없음"/);assert.doesNotMatch(html,/<img/);
 }
 const html=renderToStaticMarkup(createElement(WorkGrid,{works:[{...work('character','a/b'),title:'<script>긴 제목</script>'}]}));
 assert.match(html,/&lt;script&gt;/);assert.match(html,/\/works\/a%2Fb/);
});
