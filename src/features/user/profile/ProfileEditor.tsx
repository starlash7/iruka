import {useRef,useState,type FormEvent} from 'react';
import {Camera,Trash2} from 'lucide-react';
import type {ProfileDto} from '../../../shared/contracts';
import {Button} from '../../../ui';
import {ReaderAvatar} from '../../discover/ReaderIdentity';
import {prepareAvatar} from './prepareAvatar';

export function ProfileEditor({profile,identity,onSave,onCancel}:{profile:ProfileDto;identity:string;onSave:(value:ProfileDto)=>Promise<void>;onCancel:()=>void}){
 const [draft,setDraft]=useState(profile);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 const [preparing,setPreparing]=useState(false);const upload=useRef<HTMLInputElement>(null);const generation=useRef(0);
 async function selectImage(file?:File){
  if(!file)return;const current=++generation.current;setPreparing(true);setError('');
  try{const avatar=await prepareAvatar(file);if(current===generation.current)setDraft(value=>({...value,avatar}));}
  catch(e){if(current===generation.current)setError((e as Error).message);}
  finally{if(current===generation.current)setPreparing(false);}
 }
 async function submit(event:FormEvent){event.preventDefault();if(busy||preparing)return;setBusy(true);setError('');
  try{await onSave(draft);}catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <form className="profile-editor" onSubmit={submit}>
  <h2>프로필 수정</h2>
  <fieldset disabled={busy}>
   <div className="profile-photo-row"><ReaderAvatar identity={identity} image={draft.avatar}/><div>
    <input ref={upload} hidden type="file" accept="image/png,image/jpeg,image/webp" aria-label="프로필 이미지" onChange={event=>{void selectImage(event.target.files?.[0]);event.target.value='';}}/>
    <Button variant="secondary" disabled={preparing} onClick={()=>upload.current?.click()}><Camera size={18}/>사진 변경</Button>
    {draft.avatar&&<Button variant="ghost" aria-label="프로필 사진 삭제" title="사진 삭제" onClick={()=>{generation.current++;setPreparing(false);setDraft(value=>({...value,avatar:null}));}}><Trash2 size={18}/></Button>}
    <p>{preparing?'이미지 준비 중…':'PNG, JPG, WebP · 최대 5MB'}</p>
   </div></div>
   <label className="profile-field">닉네임<input autoFocus required maxLength={30} value={draft.nickname} onChange={event=>setDraft({...draft,nickname:event.target.value})}/><small>{draft.nickname.length}/30</small></label>
   <label className="profile-field">자기소개<textarea rows={4} maxLength={300} value={draft.bio} onChange={event=>setDraft({...draft,bio:event.target.value})}/><small>{draft.bio.length}/300</small></label>
  </fieldset>
  {error&&<p role="alert">{error}</p>}
  <div className="profile-actions"><Button variant="secondary" disabled={busy} onClick={onCancel}>취소</Button><Button type="submit" disabled={busy||preparing||!draft.nickname.trim()}>{busy?'저장 중…':'저장'}</Button></div>
 </form>;
}
