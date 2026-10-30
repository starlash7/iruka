import {useEffect,useMemo,useRef,useState} from 'react';
import {Page,Button,Tabs} from '../../ui';
import type {RoutePageProps} from '../../routes/paths';
import {createStudioClient} from './client';
import {useEditor} from './useEditor';
import {EditorFields} from './EditorFields';
import {AssetFields} from './AssetFields';
import {Preview} from './Preview';
import {ImageField} from './ImageField';
import {StudioSession} from './StudioSession';
import {PublicationStatus,PublishReadiness,focusPublishField,type PublishField} from './PublishReadiness';
import './studio.css';
const steps=[['basic','1. 기본 소개'],['characters','2. 등장인물'],['openings','3. 시작 상황'],['advanced','고급 설정'],['preview','미리보기']];
const advanced=[['prompt','프롬프트'],['examples','예시 대화'],['lorebook','설정집'],['assets','이미지 코드'],['status','상태창·출력'],['endings','엔딩']];
export default function EditorPage({params,authEnabled=false}:RoutePageProps) {
 return <StudioSession enabled={authEnabled}>{identity=><Editor key={`${identity}:${params.workId}`} params={params} authEnabled={authEnabled}/>}</StudioSession>;
}
function Editor({params,authEnabled=false}:RoutePageProps) {
 const client=useMemo(()=>createStudioClient(authEnabled),[authEnabled]);
 const editor=useEditor(client,params.workId);const [tab,setTab]=useState('basic');
 const sections=useRef<HTMLFieldSetElement>(null);
 const [target,setTarget]=useState<PublishField|null>(null);
 useEffect(()=>{
  if(target&&sections.current)focusPublishField(sections.current,target);
 },[target]);
 const selectSection=(target:PublishField)=>{setTab(advanced.some(([id])=>id===target.section)?'advanced':target.section);setTarget({...target});};
 const fields=(id:string)=><EditorFields tab={id} draft={editor.draft!} change={editor.change} renderImage={(target,label,value)=><ImageField label={label} value={value} client={client} onUpload={file=>editor.uploadImage(file,target)} onRemove={()=>editor.change(d=>{if(target.kind==='cover')d.coverUrl=null;else{const c=d.publicSnapshot.characters.find(c=>c.id===target.id);if(c)c.imageUrl=null;}})}/>}/>;
 return <Page title="작품 만들기" description="소개와 인물, 첫 장면부터 이야기를 완성해 보세요.">
  <div className="studio-toolbar"><a href="/studio">내 작품</a><span role="status">{editor.status}</span><Button variant="secondary" disabled={!editor.draft||editor.busy||!!editor.recovery} onClick={()=>void editor.save().catch(()=>{})}>초안 저장</Button><Button disabled={!editor.draft||editor.busy||!!editor.recovery} onClick={()=>void editor.publish()}>발행</Button></div>
  {editor.error&&<div role="alert"><p>{editor.error}</p><Button variant="secondary" onClick={()=>void editor.reload()}>서버 저장본 확인</Button></div>}
  {editor.recovery&&<section className="studio-recovery"><h2>저장하지 못한 복구본이 있어요</h2><p>서버 저장본과 다릅니다. 다른 저장과 충돌하면 초안을 다운로드해 내용을 비교해 주세요.</p><Button onClick={editor.restoreRecovery}>복구본으로 계속</Button><Button variant="secondary" onClick={editor.discardRecovery}>서버 저장본 사용</Button></section>}
  {editor.draft&&editor.work&&<><PublicationStatus work={editor.work}/><PublishReadiness draft={editor.draft} disabled={editor.busy||!!editor.recovery} onSelect={selectSection}/><fieldset ref={sections} className="studio-editor" disabled={editor.busy||!!editor.recovery}><Tabs label="작품 작성 순서" value={tab} onChange={setTab} items={steps.map(([id,label])=>({id,label,content:id==='preview'?<Preview draft={editor.draft!} assets={editor.work!.assets} client={client}/>:id==='advanced'?<div className="studio-advanced">{advanced.map(([section,title])=><details key={section}><summary>{title}{section==='examples'&&editor.draft!.mode==='character'?' (필수)':''}</summary><div data-editor-section={section} tabIndex={-1}>{section==='assets'?<AssetFields assets={editor.work!.assets} draft={editor.draft!} add={editor.addAsset} change={editor.change}/>:fields(section)}</div></details>)}</div>:<div data-editor-section={id} tabIndex={-1}>{fields(id)}</div>}))}/>
  <div className="studio-step-actions">{tab!=='basic'&&<Button variant="secondary" onClick={()=>setTab(steps[Math.max(0,steps.findIndex(s=>s[0]===tab)-1)][0])}>이전</Button>}{tab!=='preview'&&<Button onClick={()=>setTab(steps[steps.findIndex(s=>s[0]===tab)+1][0])}>다음</Button>}</div>
  </fieldset><div className="studio-toolbar"><Button variant="ghost" onClick={editor.download}>초안 다운로드</Button></div>
  <details className="studio-versions"><summary>발행 이력 ({editor.work.versions.length})</summary>{editor.work.versions.map(v=><p key={v.id}>버전 {v.version} · {new Date(v.createdAt).toLocaleString('ko-KR')}</p>)}</details></>}
 </Page>;
}
