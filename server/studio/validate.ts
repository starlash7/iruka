import {ApiError} from '../core/errors.ts';
import {requireId} from '../core/http.ts';
import type {StudioDraft} from '../../src/features/studio/types.ts';
const fail=(field:string):never=>{throw new ApiError('INVALID_REQUEST',`${field} 입력을 확인해 주세요.`);};
function object(value:unknown, keys:string[], field:string):Record<string,unknown> {
 if(!value||typeof value!=='object'||Array.isArray(value))return fail(field);
 const obj=value as Record<string,unknown>;
 if(Object.keys(obj).some(k=>!keys.includes(k)))fail(field);
 return obj;
}
function text(value:unknown,max:number,field:string,required=false):string {
 if(typeof value!=='string'||value.length>max||(required&&!value.trim()))return fail(field);
 return value;
}
function array(value:unknown,max:number,field:string):unknown[] {
 if(!Array.isArray(value)||value.length>max)return fail(field);return value;
}
function bool(value:unknown,field:string):boolean {if(typeof value!=='boolean')return fail(field);return value;}
function url(value:unknown,field:string):string|null {
 if(value===null)return null; const result=text(value,2048,field);
 if(!/^https:\/\/[^\s]+$/.test(result)&&!/^\/api\/studio\/media\/[0-9a-f-]{36}\/[a-f0-9]{64}$/.test(result))fail(field);return result;
}
function unique(values:string[],field:string){if(new Set(values).size!==values.length)fail(field);}
/** Runtime validation rejects unknown fields, including fields outside the shared contract. */
export function validateDraft(value:unknown,publish=false):StudioDraft {
 const d=object(value,['id','revision','mode','title','description','coverUrl','tags','publicSnapshot','privateConfig','assets','showCreator'],'작품');
 if(d.showCreator!==undefined)bool(d.showCreator,'제작자 표시');
 if(d.id!==undefined)requireId(d.id);
 if(d.revision!==undefined&&(!Number.isSafeInteger(d.revision)||Number(d.revision)<1))fail('저장 버전');
 if(d.mode!=='story'&&d.mode!=='character')fail('모드');
 text(d.title,30,'작품 이름',publish);text(d.description,2000,'소개');url(d.coverUrl,'표지');
 array(d.tags,10,'태그').forEach(v=>text(v,50,'태그',true));
 const s=object(d.publicSnapshot,['tagline','playGuide','characters','openings'],'공개 설정');
 text(s.tagline,60,'한 줄 소개');text(s.playGuide,1500,'플레이 가이드');
 const characters=array(s.characters,50,'등장인물').map(v=>{
  const c=object(v,['id','name','imageUrl'],'등장인물');text(c.id,64,'인물 ID',true);text(c.name,50,'이름',publish);url(c.imageUrl,'인물 이미지');return c;
 });unique(characters.map(c=>String(c.id)),'인물 ID');
 const openings=array(s.openings,5,'시작 상황').map(v=>{
  const o=object(v,['id','title','prologue','firstMessage','suggestedReplies'],'시작 상황');
  text(o.id,64,'시작 ID',true);text(o.title,60,'시작 이름',publish);text(o.prologue,1500,'프롤로그',publish);text(o.firstMessage,500,'첫 대사');
  array(o.suggestedReplies,3,'추천 답변').forEach(v=>text(v,200,'추천 답변'));return o;
 });unique(openings.map(o=>String(o.id)),'시작 ID');if(publish&&!openings.length)fail('시작 상황');
 const p=object(d.privateConfig,['systemPrompt','outputRules','statusTemplate','characterSettings','examples','openingContexts','lorebook','endings'],'비공개 설정');
 text(p.systemPrompt,8000,'프롬프트',publish);text(p.outputRules,1000,'출력 규칙');text(p.statusTemplate,1000,'상태창');
 const settings=array(p.characterSettings,50,'인물 설정').map(v=>{
  const c=object(v,['characterId','description','speechStyle'],'인물 설정');
  if(!characters.some(x=>x.id===c.characterId))fail('인물 연결');text(c.description,1500,'인물 소개');text(c.speechStyle,1500,'말투');return String(c.characterId);
 });unique(settings,'인물 설정');
 const examples=array(p.examples,10,'예시 대화');if(publish&&d.mode==='character'&&!examples.length)fail('예시 대화');
 examples.forEach(v=>{const e=object(v,['user','assistant'],'예시');text(e.user,1000,'사용자 예시',publish);text(e.assistant,1000,'답변 예시',publish);if(String(e.user).length+String(e.assistant).length>1000)fail('예시 1000자');});
 const contexts=array(p.openingContexts,5,'숨김 상황').map(v=>{const c=object(v,['openingId','hiddenContext'],'숨김 상황');if(!openings.some(o=>o.id===c.openingId))fail('시작 연결');text(c.hiddenContext,2000,'숨김 상황');return String(c.openingId);});unique(contexts,'숨김 상황');
 const lore=array(p.lorebook,100,'설정집').map(v=>{
  const l=object(v,['id','category','keywords','content','hidden','priority','alwaysOn'],'설정집');
  text(l.id,64,'설정 ID',true);text(l.category,60,'카테고리',publish);text(l.content,1000,'설정 내용',publish);
  array(l.keywords,30,'키워드').forEach(v=>text(v,60,'키워드',true));bool(l.hidden,'숨김');bool(l.alwaysOn,'상시');
  if(!Number.isSafeInteger(l.priority)||Number(l.priority)<0||Number(l.priority)>100)fail('우선순위');return String(l.id);
 });unique(lore,'설정 ID');
 const endings=array(p.endings,10,'엔딩').map(v=>{
  const e=object(v,['id','title','condition','text','imageUrl'],'엔딩');text(e.id,64,'엔딩 ID',true);text(e.title,60,'엔딩 이름',publish);text(e.condition,2000,'엔딩 조건',publish);text(e.text,2000,'엔딩 내용',publish);url(e.imageUrl,'엔딩 이미지');return String(e.id);
 });unique(endings,'엔딩 ID');
 const assets=array(d.assets??[],200,'이미지').map(v=>{const a=object(v,['id','code'],'이미지');requireId(a.id);if(typeof a.code!=='string'||! /^[A-Za-z0-9_-]{1,64}$/.test(a.code))fail('이미지 코드');return a;});
 unique(assets.map(a=>String(a.code)),'이미지 코드');unique(assets.map(a=>String(a.id)),'이미지 자산');
 if(publish){
  const source=JSON.stringify([s,p]);
  for(const match of source.matchAll(/\{\{img:([^}]+)\}\}/g))if(!assets.some(a=>a.code===match[1]))fail(`이미지 ${match[1]}`);
  if(/\{\{img::|\{\{image:|\{\{[iu]*url\}\}|img:\[|\{bg::|(?<!\{)\{user\}(?!\})/.test(source))fail('미변환 코드');
 }
 return structuredClone({...d,assets}) as unknown as StudioDraft;
}
