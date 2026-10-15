import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {makeDraft} from '../src/features/studio/draft.ts';
test('editor renders valid partial character settings and escapes preview content',async()=>{
 const vite=await createServer({appType:'custom',optimizeDeps:{noDiscovery:true},server:{hmr:false,middlewareMode:true}});
 try {
  const {EditorFields}=await vite.ssrLoadModule('/src/features/studio/EditorFields.tsx');
  const {Preview}=await vite.ssrLoadModule('/src/features/studio/Preview.tsx');
  const draft=makeDraft();draft.publicSnapshot.characters=[{id:'person',name:'기록원',imageUrl:null}];
  assert.match(renderToStaticMarkup(createElement(EditorFields,{tab:'characters',draft,change(){}})),/기록원/);
  draft.publicSnapshot.openings=[{id:'start',title:'시작',prologue:'<script>alert(1)</script>{{img:MISSING}}',firstMessage:'',suggestedReplies:[]}];
  draft.privateConfig.systemPrompt='PRIVATE_SECRET';
  const html=renderToStaticMarkup(createElement(Preview,{draft,assets:[]}));
  assert.match(html,/&lt;script&gt;/);assert.match(html,/미등록/);assert.doesNotMatch(html,/PRIVATE_SECRET|<script>/);
 }finally{await vite.close();}
});
