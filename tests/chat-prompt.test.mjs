import test from 'node:test';
import assert from 'node:assert/strict';
import {assemblePrompt} from '../server/chat/promptAssembler.ts';
import {selectLorebook} from '../server/chat/lorebook.ts';
import {postprocessOutput} from '../server/chat/postprocess.ts';
const config={systemPrompt:'private system',outputRules:'short',statusTemplate:'mood',characterSettings:[{characterId:'c',description:'kind',speechStyle:'gentle'}],examples:[{user:'hi',assistant:'hello'}],openingContexts:[{openingId:'o',hiddenContext:'hidden start'}],lorebook:[],endings:[{id:'e',title:'Arrival',condition:'arrived',text:'The end',imageUrl:null}]};
const snapshot={characters:[{id:'c',name:'Sol',imageUrl:null}],openings:[{id:'o',title:'Port',prologue:'Dawn',firstMessage:'Welcome',suggestedReplies:[]}],playGuide:'NEVER IN MODEL',tagline:''};
for(const mode of ['character','story'])test(`${mode} prompt order and cache boundary`,()=>{
 const result=assemblePrompt({mode,config,snapshot,openingId:'o',persona:{name:'Kai',description:'traveler'},memories:['remember'],history:[{role:'assistant',content:'earlier'}],content:'now',maxTokens:4000});
 assert.deepEqual(result.sections.map(x=>x.name),['platform','system','characters','alwaysLore','output','examples','opening','persona','memory','triggeredLore','history','input']);
 assert.equal(result.cacheBoundary,6); assert.equal(result.messages.at(-1).content,'now');
 const text=JSON.stringify(result.messages); assert.match(text,/hidden start/);assert.match(text,/Kai/);assert.ok(!text.includes('NEVER IN MODEL'));assert.match(text,new RegExp(mode));
});
test('budget keeps newest history and rejects oversized fixed prompt',()=>{
 const r=assemblePrompt({mode:'story',config:{},snapshot:{},history:[{role:'user',content:'x'.repeat(2000)},{role:'assistant',content:'latest'}],content:'go',memories:[],maxTokens:400});
 assert.equal(r.omitted.length,1);assert.match(JSON.stringify(r.messages),/latest/);
 assert.throws(()=>assemblePrompt({mode:'story',config:{systemPrompt:'x'.repeat(5000)},snapshot:{},history:[],content:'go',memories:[],maxTokens:400}));
});
test('lore matches normalized recent text, priority, always-on and budget',()=>{
 const entries=[{id:'a',keywords:['Blue Port'],content:'A',priority:1},{id:'b',keywords:['BLUEPORT'],content:'B',priority:9},{id:'c',keywords:[],content:'C',alwaysOn:true}];
 assert.deepEqual(selectLorebook(entries,['blue port'],2).map(x=>x.id),['b','a']);
});
test('postprocess only emits registered images/endings and separates status',()=>{
 const result=postprocessOutput('Hi {{user}} {{img:OK}} {{img:NO}}\n```status\ncalm\n``` {{ending:e}} {{ending:no}}',{personaName:'Kai',characterName:'Sol',assets:[{code:'OK',url:'https://example.org/a.png',alt:'Harbor'}],endings:config.endings});
 assert.equal(result.text,'Hi Kai');assert.equal(result.images.length,1);assert.deepEqual(result.statuses,['calm']);assert.deepEqual(result.endings,[{endingId:'e',title:'Arrival'}]);
 assert.ok(!JSON.stringify(result).includes('condition'));
 assert.equal(postprocessOutput('{{img:BAD}} <script>x</script>',{assets:[{code:'BAD',url:'javascript:alert(1)',alt:'x'}]}).images.length,0);
});
