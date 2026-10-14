import {useMemo,useState} from 'react';
import {Page,Button,Tabs} from '../../ui';
import type {RoutePageProps} from '../../routes/paths';
import {createStudioClient} from './client';
import {useEditor} from './useEditor';
import {EditorFields} from './EditorFields';
import {AssetFields} from './AssetFields';
import {Preview} from './Preview';
import './studio.css';
import {StudioSession} from './StudioSession';
const sections=[['basic','기본 정보'],['prompt','프롬프트'],['characters','등장인물'],['openings','시작 상황'],['examples','예시 대화'],['lorebook','설정집'],['assets','이미지'],['status','상태창·출력'],['endings','엔딩'],['preview','미리보기']];
export default function EditorPage({params,authEnabled=false}:RoutePageProps) {
 return <StudioSession enabled={authEnabled}>{identity=><Editor key={`${identity}:${params.workId}`} params={params} authEnabled={authEnabled}/>}</StudioSession>;
}
function Editor({params,authEnabled=false}:RoutePageProps) {
 const client=useMemo(()=>createStudioClient(authEnabled),[authEnabled]);
 const editor=useEditor(client,params.workId);const [tab,setTab]=useState('basic');
 return <Page title="작품 편집" description="작품의 설정과 이야기를 다듬는 곳이에요.">
  <div className="studio-toolbar"><a href="/studio">내 작품</a><span role="status">{editor.status}</span><Button variant="secondary" disabled={!editor.draft||editor.busy} onClick={()=>void editor.save().catch(()=>{})}>저장</Button><Button disabled={!editor.draft||editor.busy} onClick={()=>void editor.publish()}>발행</Button></div>
  {editor.error&&<p role="alert">{editor.error}</p>}
  {editor.draft&&editor.work&&<fieldset className="studio-editor" disabled={editor.busy}><Tabs label="작품 설정" value={tab} onChange={setTab} items={sections.map(([id,label])=>({id,label,content:id==='preview'?<Preview draft={editor.draft!} assets={editor.work!.assets}/>:id==='assets'?<AssetFields assets={editor.work!.assets} draft={editor.draft!} add={editor.addAsset} change={editor.change}/>:<EditorFields tab={id} draft={editor.draft!} change={editor.change}/>}))}/></fieldset>}
 </Page>;
}
