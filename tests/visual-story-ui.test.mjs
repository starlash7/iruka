import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {createServer} from 'vite';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {makeDraft} from '../src/features/studio/draft.ts';
let vite,StoryText,hasInlineStoryImage,StoryImage,Narrative,StatusPanel,parseStatus,bindDraftAsset,getAssetSlots;
before(async()=>{vite=await createServer({appType:'custom',cacheDir:'.context/visual-story-test-cache',optimizeDeps:{noDiscovery:true},server:{hmr:false,middlewareMode:true}});({StoryText,hasInlineStoryImage}=await vite.ssrLoadModule('/src/features/media/StoryText.tsx'));({StoryImage}=await vite.ssrLoadModule('/src/features/media/StoryImage.tsx'));({Narrative}=await vite.ssrLoadModule('/src/features/chat/MessageList.tsx'));({StatusPanel,parseStatus}=await vite.ssrLoadModule('/src/features/chat/StatusPanel.tsx'));({bindDraftAsset,getAssetSlots}=await vite.ssrLoadModule('/src/features/studio/assetSlots.ts'));});
after(async()=>{await vite.close();});
test('public opening images render safely, unknown codes do not leak and enlargement has a named control',()=>{
 const html=render(h(StoryText,{text:'<script>x</script>\n{{img:SCENE}}\n{{img:UNKNOWN}}',images:[{code:'SCENE',label:'첫 장면',url:'/stories/office-romance/opening.png'}]}));
 assert.equal(hasInlineStoryImage('{{img:SCENE}}','/stories/office-romance/opening.png',[{code:'SCENE',url:'/stories/office-romance/opening.png',label:''}]),true);
 assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>|\{\{img:/);assert.match(html,/aria-label="첫 장면 크게 보기"/);assert.match(html,/미등록 또는 미업로드/);
 assert.doesNotMatch(render(h(StoryImage,{url:'javascript:alert(1)',alt:'잘못된 이미지'})),/<img/);
});
test('speaker portraits require an exact unambiguous pinned name and preserve escaped dialogue',()=>{
 const props={content:'@서유나@ <b>안녕</b>',characters:[{name:'서유나',imageUrl:'/stories/office-romance/profile-yuna.png'}]};
 const html=render(h(Narrative,props));assert.match(html,/chat-character-portrait/);assert.match(html,/&lt;b&gt;/);assert.doesNotMatch(html,/<b>/);
 assert.doesNotMatch(render(h(Narrative,{...props,characters:[...props.characters,...props.characters]})),/chat-character-portrait/);
});
test('status values use native text and preserve unstructured content',()=>{
 assert.deepEqual(parseStatus('장소: 도서관 · 시간: 저녁'),[{label:'장소',value:'도서관'},{label:'시간',value:'저녁'}]);assert.equal(parseStatus('상태 설명\n장소: 도서관'),null);
 assert.match(render(h(StatusPanel,{text:'장소: <script>x</script>'})),/<dd>&lt;script&gt;x&lt;\/script&gt;<\/dd>/);
 assert.match(render(h(StatusPanel,{text:'자유로운 상태 설명'})),/<p>자유로운 상태 설명<\/p>/);
});
test('asset replacement updates current public references while keeping earlier snapshots untouched',()=>{
 const draft=makeDraft();draft.coverUrl='/old';draft.assets=[{id:'old',code:'SCENE'}];draft.publicSnapshot.gallery=[{id:'intro',title:'장면',imageUrl:'/old'}];draft.publicSnapshot.openings=[{id:'o',title:'시작',prologue:'시작',firstMessage:'',suggestedReplies:[],imageUrl:'/old'}];const earlier=structuredClone(draft);
 const asset={id:'new',code:'SCENE',url:'/new',label:'장면',revision:2};bindDraftAsset(draft,asset,'/old');
 assert.equal(draft.coverUrl,'/new');assert.equal(draft.publicSnapshot.gallery[0].imageUrl,'/new');assert.equal(draft.publicSnapshot.openings[0].imageUrl,'/new');assert.equal(earlier.coverUrl,'/old');
 assert.equal(getAssetSlots([{...asset,id:'old',revision:1},asset],earlier)[0].asset.id,'old');
});
