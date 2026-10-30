import {Button} from '../../ui';
import type {StudioDraft,StudioWork} from './types';
export type PublishField={section:string;field:string;label:string};

export function focusPublishField(root:HTMLElement,target:PublishField) {
 const control=root.querySelector<HTMLElement>(`[data-editor-field="${target.field}"]`);
 if(!control)return;
 const details=control.closest('details');if(details)details.open=true;
 control.focus();control.scrollIntoView({block:'nearest'});
}

// Required-field guidance mirrors server/studio/validate.ts; publishing still validates on the server.
export function missingPublishFields(d:StudioDraft) {
 const missing:PublishField[]=[];
 const require=(value:string,section:string,field:string,label:string)=>{if(!value.trim())missing.push({section,field,label});};
 require(d.title,'basic','title','작품 이름');
 require(d.privateConfig.systemPrompt,'basic','systemPrompt','이야기 방향');
 d.publicSnapshot.characters.forEach((c,i)=>require(c.name,'characters',`characters.${i}.name`,`인물 ${i+1} 이름`));
 if(!d.publicSnapshot.openings.length)missing.push({section:'openings',field:'openings.add',label:'시작 상황 1개 이상'});
 d.publicSnapshot.openings.forEach((o,i)=>{
  require(o.title,'openings',`openings.${i}.title`,`시작 ${i+1} 이름`);require(o.prologue,'openings',`openings.${i}.prologue`,`시작 ${i+1} 프롤로그`);
 });
 if(d.mode==='character'&&!d.privateConfig.examples.length)missing.push({section:'examples',field:'examples.add',label:'예시 대화 1개 이상 (사용자·답변)'});
 d.privateConfig.examples.forEach((e,i)=>{
  require(e.user,'examples',`examples.${i}.user`,`예시 ${i+1} 사용자`);require(e.assistant,'examples',`examples.${i}.assistant`,`예시 ${i+1} 답변`);
 });
 d.privateConfig.lorebook.forEach((l,i)=>{
  require(l.category,'lorebook',`lorebook.${i}.category`,`설정 ${i+1} 카테고리`);require(l.content,'lorebook',`lorebook.${i}.content`,`설정 ${i+1} 내용`);
 });
 d.privateConfig.endings.forEach((e,i)=>{
  require(e.title,'endings',`endings.${i}.title`,`엔딩 ${i+1} 이름`);require(e.condition,'endings',`endings.${i}.condition`,`엔딩 ${i+1} 조건`);require(e.text,'endings',`endings.${i}.text`,`엔딩 ${i+1} 내용`);
 });
 return missing;
}

export function PublishReadiness({draft,onSelect,disabled}:{draft:StudioDraft;onSelect:(target:PublishField)=>void;disabled:boolean}) {
 const missing=missingPublishFields(draft);
 return <section className="studio-readiness" aria-label="발행 준비">
  <h2>발행 준비</h2>
  {missing.length?<><p>필수 입력 {missing.length}개가 남았어요.</p><ul>{missing.map(item=><li key={item.field}><Button variant="ghost" disabled={disabled} onClick={()=>onSelect(item)}>{item.label}</Button></li>)}</ul></>:<p>필수 입력을 채웠어요. 발행 시 입력 형식과 이미지 코드를 최종 확인해요.</p>}
 </section>;
}

export function PublicationStatus({work}:{work:StudioWork}) {
 const published=work.versions.find(v=>v.id===work.work.publishedVersionId);
 return <section className="studio-publication" aria-label="초안과 공개 버전">
  <h2>현재 초안</h2>
  {work.work.publishedVersionId?<><p>{published?`공개 중인 버전 ${published.version}`:'발행된 버전 공개 중'} · 초안 수정은 다시 발행해야 공개 버전에 반영돼요.</p><a href={`/works/${encodeURIComponent(work.work.id)}`}>공개 작품 보기</a></>:<p>아직 발행하지 않은 초안이에요.</p>}
 </section>;
}
