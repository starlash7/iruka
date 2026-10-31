import {useRef,useState} from 'react';
import {Button,Modal} from '../../ui';
import type {ChatFolderDto} from '../../shared/contracts';
import type {ChatSummary,ReaderApi} from '../discover/readerApi';

export type LibraryAction={kind:'chat-edit'|'chat-delete';chat:ChatSummary}|{kind:'folder-create'}|{kind:'folder-edit'|'folder-delete';folder:ChatFolderDto};
export function LibraryDialog({action,folders,api,onClose,onSaved}:{action:LibraryAction;folders:ChatFolderDto[];api:ReaderApi;onClose:()=>void;onSaved:()=>void}){
 const [name,setName]=useState('chat' in action?action.chat.title:'folder' in action?action.folder.name:'');
 const [folderId,setFolderId]=useState('chat' in action?action.chat.folderId??'':'');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');const lock=useRef(false),form=useRef<HTMLFormElement>(null);
 const removing=action.kind.endsWith('delete'),isChat=action.kind.startsWith('chat');
 const title=action.kind==='chat-edit'?'대화 이름·폴더 변경':action.kind==='chat-delete'?'대화 삭제':action.kind==='folder-create'?'새 폴더':action.kind==='folder-edit'?'폴더 이름 변경':'폴더 삭제';
 async function save(){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{
  switch(action.kind){
   case 'chat-edit':await api.updateChat(action.chat.chat.id,{title:name.trim(),folderId:folderId||null});break;
   case 'chat-delete':await api.deleteChat(action.chat.chat.id);break;
   case 'folder-create':await api.saveFolder(name.trim());break;
   case 'folder-edit':await api.saveFolder(name.trim(),action.folder.id);break;
   case 'folder-delete':await api.deleteFolder(action.folder.id);break;
  }form.current?.closest('dialog')?.close();onSaved();
 }catch(error){setError(error instanceof Error?error.message:'저장하지 못했어요.');}finally{lock.current=false;setBusy(false);}}
 return <Modal open title={title} onClose={()=>{if(!lock.current)onClose();}}><form ref={form} className="reader library-dialog" onSubmit={event=>{event.preventDefault();void save();}}>
 {removing?<p>{isChat?'대화를 삭제하면 보관함에서 다시 이어갈 수 없어요. 삭제할까요?':'폴더를 삭제해도 대화는 지워지지 않고 미분류로 옮겨져요.'}</p>:<label className="reader-field">{isChat?'대화 이름':'폴더 이름'}<input autoFocus value={name} maxLength={isChat?80:50} required disabled={busy} onChange={event=>setName(event.target.value)}/></label>}
 {action.kind==='chat-edit'&&<label className="reader-field">폴더<select value={folderId} disabled={busy} onChange={event=>setFolderId(event.target.value)}><option value="">미분류</option>{folders.map(folder=><option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>}
 {error&&<p role="alert" className="reader-error">{error}</p>}
 <Button type="submit" disabled={busy||(!removing&&!name.trim())}>{busy?'처리 중…':removing?'삭제': '저장'}</Button></form></Modal>;
}
