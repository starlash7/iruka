import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {makeDraft} from '../src/features/studio/draft.ts';
import {validateDraft} from '../server/studio/validate.ts';

test('publish readiness follows required fields and links every omission to its section',async()=>{
 const vite=await createServer({appType:'custom',optimizeDeps:{noDiscovery:true},server:{hmr:false,middlewareMode:true}});
 try {
  const {missingPublishFields,PublishReadiness}=await vite.ssrLoadModule('/src/features/studio/PublishReadiness.tsx');
  const draft=makeDraft();
  assert.deepEqual(missingPublishFields(draft).map(x=>x.section),['basic','basic','openings']);
  draft.title='작품';draft.privateConfig.systemPrompt='비공개';
  draft.publicSnapshot.openings=[{id:'start',title:'시작',prologue:'본문',firstMessage:'',suggestedReplies:[]}];
  assert.equal(missingPublishFields(draft).length,0);validateDraft(draft,true);
  draft.mode='character';
  assert.deepEqual(missingPublishFields(draft),[{section:'examples',field:'examples.add',label:'예시 대화 1개 이상 (사용자·답변)'}]);
  assert.throws(()=>validateDraft(draft,true),/예시 대화/);
  draft.privateConfig.examples=[{user:' ',assistant:''}];
  assert.equal(missingPublishFields(draft).length,2);
  draft.privateConfig.examples=[{user:'안녕',assistant:'반가워'}];
  assert.equal(missingPublishFields(draft).length,0);validateDraft(draft,true);
  draft.publicSnapshot.characters=[{id:'c',name:'',imageUrl:null}];
  draft.publicSnapshot.openings[0].title='';draft.publicSnapshot.openings[0].prologue='';
  draft.privateConfig.lorebook=[{id:'l',category:'',content:'',keywords:[],hidden:true,priority:0,alwaysOn:false}];
  draft.privateConfig.endings=[{id:'e',title:'',condition:'',text:'',imageUrl:null}];
  const missing=missingPublishFields(draft);
  assert.deepEqual(missing.map(x=>x.section),['characters','openings','openings','lorebook','lorebook','endings','endings','endings']);
  const selected=[];
  const tree=PublishReadiness({draft,onSelect:section=>selected.push(section),disabled:false});
  function clickButtons(node) {
   if(Array.isArray(node)){node.forEach(clickButtons);return;}
   if(!node?.props)return;
   node.props.onClick?.();clickButtons(node.props.children);
  }
  clickButtons(tree);assert.deepEqual(selected,missing);
  const html=renderToStaticMarkup(createElement(PublishReadiness,{draft,onSelect(){},disabled:true}));
  for(const item of missing)assert.ok(html.includes(item.label));
  assert.equal((html.match(/disabled=""/g)||[]).length,missing.length);
  assert.doesNotMatch(html,/비공개/);
 }finally{await vite.close();}
});

test('readiness targets exact controls including fifth opening and empty-row add buttons',async()=>{
 const vite=await createServer({appType:'custom',optimizeDeps:{noDiscovery:true},server:{hmr:false,middlewareMode:true}});
 try {
  const {missingPublishFields,focusPublishField}=await vite.ssrLoadModule('/src/features/studio/PublishReadiness.tsx');
  const {EditorFields}=await vite.ssrLoadModule('/src/features/studio/EditorFields.tsx');
  const draft=makeDraft();draft.mode='character';
  const check=()=>{
   for(const item of missingPublishFields(draft)){
    assert.equal(typeof item.field,'string');
    const html=renderToStaticMarkup(createElement(EditorFields,{tab:item.section,draft,change(){}}));
    assert.ok(html.match(/<(input|textarea|button)\b[^>]*>/g)?.some(tag=>tag.includes(`data-editor-field="${item.field}"`)),item.field);
   }
  };
  check();
  assert.deepEqual(missingPublishFields(draft).filter(x=>x.field.endsWith('.add')).map(x=>x.field),['openings.add','examples.add']);
  draft.publicSnapshot.openings=Array.from({length:5},(_,i)=>({id:`o${i}`,title:'',prologue:'',firstMessage:'',suggestedReplies:[]}));
  draft.publicSnapshot.characters=[{id:'c',name:'',imageUrl:null}];
  draft.privateConfig.examples=[{user:'',assistant:''},{user:'',assistant:''}];
  draft.privateConfig.lorebook=[{id:'l',category:'',content:'',keywords:[],hidden:true,priority:0,alwaysOn:false}];
  draft.privateConfig.endings=[{id:'e',title:'',condition:'',text:'',imageUrl:null}];
  check();
  const target=missingPublishFields(draft).find(x=>x.label==='시작 5 프롤로그');
  assert.equal(target.field,'openings.4.prologue');
  const details={open:false};const events=[];
  const control={closest:()=>details,focus(){assert.equal(details.open,true);events.push('focus');},scrollIntoView(){events.push('scroll');}};
  const root={querySelector(selector){assert.equal(selector,'[data-editor-field="openings.4.prologue"]');return control;}};
  focusPublishField(root,target);assert.deepEqual(events,['focus','scroll']);
  draft.publicSnapshot.openings.shift();check();
  assert.equal(missingPublishFields(draft).some(x=>x.field==='openings.4.prologue'),false);
 }finally{await vite.close();}
});

test('publication status distinguishes current draft from the confirmed public snapshot',async()=>{
 const vite=await createServer({appType:'custom',optimizeDeps:{noDiscovery:true},server:{hmr:false,middlewareMode:true}});
 try {
  const {PublicationStatus}=await vite.ssrLoadModule('/src/features/studio/PublishReadiness.tsx');
  const work={work:{id:'work',publishedVersionId:null},versions:[]};
  const render=()=>renderToStaticMarkup(createElement(PublicationStatus,{work}));
  assert.match(render(),/아직 발행하지/);assert.doesNotMatch(render(),/href=/);
  work.work.publishedVersionId='v2';work.versions=[{id:'v1',version:1},{id:'v2',version:2}];
  assert.match(render(),/공개 중인 버전 2/);assert.match(render(),/현재 초안/);
  assert.match(render(),/다시 발행/);assert.match(render(),/href="\/works\/work"/);
 }finally{await vite.close();}
});
