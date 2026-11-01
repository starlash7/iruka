import {useState} from 'react';
import {Button,Modal} from '../../ui';
import type {PublicWorkDetailDto} from '../../shared/contracts';
import {useReader} from '../discover/ReaderProvider';
import {useResource} from '../discover/useResource';
import {ResourceState} from '../discover/ResourceState';
import {StartChatAccess} from './StartChatAccess';
import {plainStoryText,StoryText,hasInlineStoryImage} from '../media/StoryText';
import {StoryImage} from '../media/StoryImage';
export function StartChatSheet({open,onClose,work,authEnabled=false}:{open:boolean;onClose:()=>void;work:PublicWorkDetailDto;authEnabled?:boolean}){
 const [loginPending,setLoginPending]=useState(false);
 return <Modal open={open&&!loginPending} title="이야기 시작하기" onClose={onClose}>{open&&<StartChatAccess authEnabled={authEnabled} onLoginPending={setLoginPending}><StartChatForm work={work}/></StartChatAccess>}</Modal>;
}
function StartChatForm({work}:{work:PublicWorkDetailDto}){
 const {api,navigate}=useReader();const options=useResource(async()=>{const [personas,models,balance]=await Promise.all([api.listPersonas(),api.getModels(),api.getBalance()]);return {personas,models,balance};},[api]);
 const [opening,setOpening]=useState(work.snapshot?.openings[0]?.id??'');const [persona,setPersona]=useState('');const [model,setModel]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState<Error|null>(null);
 const models=options.data?.models.filter(item=>item.available)??[];const selected=models.find(item=>item.id===(model||models[0]?.id));
 const insufficient=!!selected&&selected.credits!==null&&!!options.data&&options.data.balance.available<selected.credits;
 async function start(){if(!selected||busy)return;setBusy(true);setError(null);try{const chat=await api.startChat({workId:work.id,openingId:opening,personaId:persona||null,model:selected.id});navigate(`/chat/${encodeURIComponent(chat.id)}`);}catch(error){setError(error instanceof Error?error:new Error('대화를 시작하지 못했어요.'));setBusy(false);}}
 const chosen=work.snapshot?.openings.find(item=>item.id===opening);
 return <div className="reader reader-start"><p>{work.title}</p><fieldset disabled={busy}><legend>시작 상황</legend>{work.snapshot?.openings.map(item=><label className="reader-opening" key={item.id}><input type="radio" name="opening" value={item.id} checked={opening===item.id} onChange={()=>setOpening(item.id)}/><span><strong>{item.title}</strong><small>{plainStoryText(item.prologue).slice(0,120)}</small></span></label>)}</fieldset>
 {chosen&&<details className="reader-opening-preview"><summary>첫 장면 미리보기</summary>{chosen.imageUrl&&!hasInlineStoryImage(chosen.prologue,chosen.imageUrl,work.snapshot?.images)&&<StoryImage url={chosen.imageUrl} alt={`${chosen.title} 장면`}/>}<StoryText text={chosen.prologue} images={work.snapshot?.images}/></details>}
 {options.loading||options.error?<ResourceState {...options} retry={options.reload}/>:<>
 <label className="reader-field">페르소나<select value={persona} onChange={event=>setPersona(event.target.value)} disabled={busy}><option value="">기본 페르소나</option>{options.data?.personas.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
 <label className="reader-field">모델<select value={selected?.id??''} onChange={event=>setModel(event.target.value)} disabled={busy||!models.length}>{!models.length&&<option value="">사용 가능한 모델 없음</option>}{models.map(item=><option key={item.id} value={item.id}>{item.name}{item.credits!==null?` · ${item.credits} 크레딧`:''}</option>)}</select></label>
 {!models.length&&<p role="status">사용할 수 있는 모델이 없어요.</p>}<p className="reader-balance">테스트 크레딧 {options.data?.balance.available.toLocaleString()} 남음</p>
 {insufficient&&<p className="reader-error" role="alert">테스트 크레딧이 부족해요.</p>}</>}
 {error&&<ResourceState error={error}/>}<Button disabled={busy||options.loading||!!options.error||!selected||insufficient||!opening} onClick={start}>{busy?'시작하는 중…':'이 상황으로 시작'}</Button></div>;
}
