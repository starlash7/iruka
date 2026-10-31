import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {createServer} from 'vite';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
let server,modules={};
const work=(mode,id)=>({id,mode,title:`${mode} 제목`,description:'긴 소개 '.repeat(80),tags:['판타지','아주긴태그'.repeat(10)],coverUrl:null,publishedVersionId:'v',snapshot:{tagline:'한 줄 소개',characters:[{id:'c',name:'등장인물',imageUrl:null}],openings:[{id:'o',title:'첫 만남',prologue:'공개 프롤로그'}],playGuide:'안내'}});
before(async()=>{
 server=await createServer({appType:'custom',cacheDir:'.context/discovery-ui-test',define:{'import.meta.env.VITE_PRIVY_APP_ID':JSON.stringify('')},optimizeDeps:{noDiscovery:true},server:{hmr:false,middlewareMode:true},plugins:[{name:'discovery-resource-test',enforce:'pre',resolveId(source){if(source==='./usePages')return '\0discovery-pages';if(source==='./useResource')return '\0discovery-resource';if(source==='../chat/ChatList')return '\0discovery-chat-list';if(source==='../chat/StartChatSheet')return '\0discovery-start';},load(id){if(id==='\0discovery-pages')return 'export const usePages=()=>({...globalThis.__discoveryState,loadingMore:false,moreError:null,hasMore:false});';if(id==='\0discovery-resource')return 'export const useResource=()=>globalThis.__discoveryState;';if(id==='\0discovery-chat-list')return 'export const ChatList=()=>null;';if(id==='\0discovery-start')return 'export const StartChatSheet=()=>null;';}}]});
 for(const name of ['HomePage','SearchPage','TagPage','RankingPage','WorkPage','WorkGrid','HomeMasthead'])modules[name]=await server.ssrLoadModule(`/src/features/discover/${name}.tsx`);
});
after(async()=>{await server.close();delete globalThis.__discoveryState;});
function render(name,props={},data=[]){globalThis.__discoveryState={data,error:null,loading:false,reload(){}};return renderToStaticMarkup(createElement(modules[name].default,props));}
test('home keeps both modes discoverable without mode badges or duplicate recommendations',()=>{
 const html=render('HomePage',{},[work('story','story'),work('character','character')]);
 assert.match(html,/\/works\/story/);assert.match(html,/\/works\/character/);
 assert.match(html,/aria-label="작품 탐색"/);assert.doesNotMatch(html,/reader-work-type|태그별 추천|작품 유형/);
 assert.equal((html.match(/class="reader-work"/g)||[]).length,2);
});
test('home uses one header search, branded masthead and public work collection',()=>{
 const html=render('HomePage',{},[work('story','story')]);
 assert.match(html,/home-masthead/);assert.match(html,/iruka-x-banner-ocean-formation/);
 assert.equal((html.match(/role="search"/g)||[]).length,1);
 assert.ok(html.indexOf('role="search"')<html.indexOf('home-masthead'));
 assert.match(html,/home-work-collection/);assert.doesNotMatch(html,/인기 급상승|만 회|맞춤 추천/);
});
test('masthead only features actual usable covers and never adds unavailable work slides',()=>{
 const html=renderToStaticMarkup(createElement(modules.HomeMasthead.HomeMasthead,{works:[work('story','none'),{...work('story','cover'),coverUrl:'/brand/iruka-logomark.png'},{...work('story','unsafe'),coverUrl:'javascript:alert(1)'}]}));
 assert.match(html,/aria-label="2번째 배너"/);assert.doesNotMatch(html,/3번째 배너/);
 assert.match(html,/aria-label="다음 배너"/);assert.doesNotMatch(html,/javascript:/);
});
test('discovery restores one brand footer using only current product destinations',()=>{
 const html=render('HomePage',{},[]);
 assert.equal((html.match(/<footer/g)||[]).length,1);
 for(const link of ['/studio','/chats','/#brand-kit','https://docs.playiruka.space/overview','mailto:hello@playiruka.space'])assert.ok(html.includes(`href="${link}"`));
 assert.doesNotMatch(html,/href="(?:\/vending|\/marketplace|\/vault)/);
 assert.match(html,/2026 Iruka Labs, Inc. All rights reserved/);
});
test('legacy mode filters preserve query and tag; removing tag preserves mode and query',()=>{
 globalThis.__discoveryState={data:[],error:null,loading:false};
 const html=renderToStaticMarkup(createElement(modules.SearchPage.SearchResults,{query:'달빛 & 별',tag:'판타지',mode:'character'}));
 const links=[...html.matchAll(/href="([^"]+)"/g)].map(match=>new URL(match[1].replaceAll('&amp;','&'),'https://local'));
 assert.equal(links.length,5);
 for(const link of links.slice(0,4))assert.equal(link.searchParams.get('q'),'달빛 & 별');
 assert.equal(links[0].searchParams.get('mode'),'character');assert.equal(links[0].searchParams.has('tag'),false);
 assert.deepEqual(links.slice(1,4).map(link=>link.searchParams.get('mode')),['','story','character']);
 assert(links.slice(1,4).every(link=>link.searchParams.get('tag')==='판타지'));
 assert.equal(links[4].pathname,'/search');assert.equal(links[4].search,'');
 assert.match(html,/<details[^>]*open/);assert.match(html,/조건에 맞는 작품이 없어요/);
});
test('unpublished work explains why starting a conversation is unavailable',()=>{
 const html=render('WorkPage',{params:{id:'draft'}},{...work('story','draft'),publishedVersionId:null});
 assert.match(html,/아직 발행되지 않은 작품이에요/);
 assert.match(html,/aria-describedby="work-start-unavailable"/);
});
test('search loading keeps a noninteractive cover grid and accessible status',()=>{
 globalThis.__discoveryState={data:null,loading:true,error:null,reload(){}};
 const html=renderToStaticMarkup(createElement(modules.SearchPage.SearchResults));
 assert.match(html,/role="status"/);assert.match(html,/작품을 불러오는 중/);
 assert.match(html,/reader-work-skeleton/);assert.doesNotMatch(html,/href="\/works\//);
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
