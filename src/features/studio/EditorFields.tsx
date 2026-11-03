import type {ReactNode} from 'react';
import type {ImageTarget} from './ImageField';
import {Button} from '../../ui';
import {Text,Line,Group,Check} from './Fields';
import type {StudioDraft} from './types';
export function EditorFields({tab,draft:d,change,renderImage}:{tab:string;draft:StudioDraft;change:(fn:(d:StudioDraft)=>void)=>void;renderImage?:(target:ImageTarget,label:string,url:string|null)=>ReactNode}) {
 const s=d.publicSnapshot,p=d.privateConfig;
 const edit=(fn:(d:StudioDraft)=>void)=>change(fn);
 if(tab==='basic')return <>
  <Line field="title" label="작품 이름" value={d.title} max={30} onChange={v=>edit(d=>{d.title=v;})}/>
  {renderImage?.({kind:'cover'},'표지 이미지',d.coverUrl)}
  <label className="studio-field">이야기 구성<select value={d.mode} onChange={e=>edit(d=>{d.mode=e.target.value as StudioDraft['mode'];})}><option value="story">스토리</option><option value="character">한 인물과 대화</option></select></label>
  <Text field="systemPrompt" label="이야기 방향 (비공개)" value={p.systemPrompt} max={8000} onChange={v=>edit(d=>{d.privateConfig.systemPrompt=v;})}/>
  <Line label="한 줄 소개" value={s.tagline} onChange={v=>edit(d=>{d.publicSnapshot.tagline=v;})}/>
  <Text label="상세 소개" value={d.description} max={2000} onChange={v=>edit(d=>{d.description=v;})}/>
  <Line label="태그 (쉼표로 구분)" value={d.tags.join(',')} max={500} onChange={v=>edit(d=>{d.tags=v.split(',');})}/>
  <Check label="작품에 내 프로필 닉네임 표시" value={d.showCreator===true} onChange={value=>edit(d=>{d.showCreator=value;})}/>
  <Text label="플레이 가이드" value={s.playGuide} max={1500} onChange={v=>edit(d=>{d.publicSnapshot.playGuide=v;})}/>
 </>;
 if(tab==='prompt')return <Text label="메인 프롬프트" value={p.systemPrompt} max={8000} onChange={v=>edit(d=>{d.privateConfig.systemPrompt=v;})}/>;
 if(tab==='characters')return <>
  {s.characters.map((c,i)=>{const cfg=p.characterSettings.find(x=>x.characterId===c.id)??{description:'',speechStyle:''};return <Group key={c.id} title={`인물 ${i+1}`} onRemove={()=>edit(d=>{d.publicSnapshot.characters.splice(i,1);d.privateConfig.characterSettings=d.privateConfig.characterSettings.filter(x=>x.characterId!==c.id);})}>
   <Line field={`characters.${i}.name`} label="이름" value={c.name} max={50} onChange={v=>edit(d=>{d.publicSnapshot.characters[i].name=v;})}/>
   {renderImage?.({kind:'character',id:c.id},`${c.name||'등장인물'} 이미지`,c.imageUrl)}
   <Line label="한 줄 소개 (공개)" value={c.caption??''} max={200} onChange={value=>edit(d=>{d.publicSnapshot.characters[i].caption=value;})}/>
   <Text label="소개 (비공개)" value={cfg.description} max={1500} onChange={v=>edit(d=>{const settings=d.privateConfig.characterSettings;let row=settings.find(x=>x.characterId===c.id);if(!row){row={characterId:c.id,description:'',speechStyle:''};settings.push(row);}row.description=v;})}/>
   <Text label="말투" value={cfg.speechStyle} max={1500} onChange={v=>edit(d=>{const settings=d.privateConfig.characterSettings;let row=settings.find(x=>x.characterId===c.id);if(!row){row={characterId:c.id,description:'',speechStyle:''};settings.push(row);}row.speechStyle=v;})}/>
  </Group>;})}<Button disabled={s.characters.length>=50} onClick={()=>edit(d=>{const id=crypto.randomUUID();d.publicSnapshot.characters.push({id,name:'',imageUrl:null});d.privateConfig.characterSettings.push({characterId:id,description:'',speechStyle:''});})}>인물 추가</Button>
 </>;
 if(tab==='openings')return <>{s.openings.map((o,i)=><Group key={o.id} title={`시작 ${i+1}`} onRemove={()=>edit(d=>{d.publicSnapshot.openings.splice(i,1);d.privateConfig.openingContexts=d.privateConfig.openingContexts.filter(x=>x.openingId!==o.id);})}>
  <Line field={`openings.${i}.title`} label="시작 이름" value={o.title} onChange={v=>edit(d=>{d.publicSnapshot.openings[i].title=v;})}/>
  {renderImage?.({kind:'opening',id:o.id},`${o.title||'시작 상황'} 이미지`,o.imageUrl??null)}
  <Text field={`openings.${i}.prologue`} label="프롤로그 (공개)" value={o.prologue} max={1500} onChange={v=>edit(d=>{d.publicSnapshot.openings[i].prologue=v;})}/>
  <Text label="숨김 시작 상황" value={p.openingContexts.find(x=>x.openingId===o.id)?.hiddenContext??''} max={2000} onChange={v=>edit(d=>{const existing=d.privateConfig.openingContexts.find(x=>x.openingId===o.id);if(existing)existing.hiddenContext=v;else d.privateConfig.openingContexts.push({openingId:o.id,hiddenContext:v});})}/>
  <Text label="첫 대사" value={o.firstMessage} max={500} onChange={v=>edit(d=>{d.publicSnapshot.openings[i].firstMessage=v;})}/>
  {[0,1,2].map(n=><Line key={n} label={`추천 답변 ${n+1}`} value={o.suggestedReplies[n]??''} max={200} onChange={v=>edit(d=>{const replies=d.publicSnapshot.openings[i].suggestedReplies;while(replies.length<3)replies.push('');replies[n]=v;})}/>)}
 </Group>)}<Button data-editor-field="openings.add" disabled={s.openings.length>=5} onClick={()=>edit(d=>{d.publicSnapshot.openings.push({id:crypto.randomUUID(),title:'',prologue:'',firstMessage:'',suggestedReplies:[]});})}>시작 추가</Button></>;
 if(tab==='examples')return <>{p.examples.map((e,i)=><Group key={i} title={`예시 ${i+1}`} onRemove={()=>edit(d=>{d.privateConfig.examples.splice(i,1);})}><Text field={`examples.${i}.user`} label="사용자" value={e.user} max={1000-e.assistant.length} onChange={v=>edit(d=>{d.privateConfig.examples[i].user=v;})}/><Text field={`examples.${i}.assistant`} label="답변" value={e.assistant} max={1000-e.user.length} onChange={v=>edit(d=>{d.privateConfig.examples[i].assistant=v;})}/></Group>)}<Button data-editor-field="examples.add" disabled={p.examples.length>=10} onClick={()=>edit(d=>{d.privateConfig.examples.push({user:'',assistant:''});})}>예시 추가</Button></>;
 if(tab==='lorebook')return <>{p.lorebook.map((l,i)=><Group key={l.id} title={`설정 ${i+1}`} onRemove={()=>edit(d=>{d.privateConfig.lorebook.splice(i,1);})}>
  <Line field={`lorebook.${i}.category`} label="카테고리" value={l.category} onChange={v=>edit(d=>{d.privateConfig.lorebook[i].category=v;})}/>
  <Line label="키워드 (쉼표로 구분)" value={l.keywords.join(',')} max={1000} onChange={v=>edit(d=>{d.privateConfig.lorebook[i].keywords=v.split(',');})}/>
  <Text field={`lorebook.${i}.content`} label="내용" value={l.content} onChange={v=>edit(d=>{d.privateConfig.lorebook[i].content=v;})}/>
  <label className="studio-field">우선순위<input type="number" min={0} max={100} value={l.priority} onChange={e=>edit(d=>{d.privateConfig.lorebook[i].priority=Number(e.target.value);})}/></label>
  <Check label="숨김" value={l.hidden} onChange={v=>edit(d=>{d.privateConfig.lorebook[i].hidden=v;})}/><Check label="상시" value={l.alwaysOn} onChange={v=>edit(d=>{d.privateConfig.lorebook[i].alwaysOn=v;})}/>
 </Group>)}<Button disabled={p.lorebook.length>=100} onClick={()=>edit(d=>{d.privateConfig.lorebook.push({id:crypto.randomUUID(),category:'',keywords:[],content:'',hidden:true,priority:0,alwaysOn:false});})}>설정 추가</Button></>;
 if(tab==='status')return <><Text label="상태창 템플릿" value={p.statusTemplate} onChange={v=>edit(d=>{d.privateConfig.statusTemplate=v;})}/><Text label="출력 규칙" value={p.outputRules} onChange={v=>edit(d=>{d.privateConfig.outputRules=v;})}/></>;
 if(tab==='endings')return <>{p.endings.map((e,i)=><Group key={e.id} title={`엔딩 ${i+1}`} onRemove={()=>edit(d=>{d.privateConfig.endings.splice(i,1);})}>
  <Line field={`endings.${i}.title`} label="엔딩 이름" value={e.title} onChange={v=>edit(d=>{d.privateConfig.endings[i].title=v;})}/><Text field={`endings.${i}.condition`} label="조건 (비공개)" max={2000} value={e.condition} onChange={v=>edit(d=>{d.privateConfig.endings[i].condition=v;})}/><Text field={`endings.${i}.text`} label="엔딩 내용" max={2000} value={e.text} onChange={v=>edit(d=>{d.privateConfig.endings[i].text=v;})}/>
 </Group>)}<Button disabled={p.endings.length>=10} onClick={()=>edit(d=>{d.privateConfig.endings.push({id:crypto.randomUUID(),title:'',condition:'',text:'',imageUrl:null});})}>엔딩 추가</Button></>;
 return null;
}
