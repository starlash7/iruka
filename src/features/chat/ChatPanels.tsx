import {useState} from 'react';
import {Button,Modal} from '../../ui';
import type {MessageDto} from '../../shared/contracts';
import type {ChatView,ReaderApi} from '../discover/readerApi';
export function MemoPanel({api,view}:{api:ReaderApi;view:ChatView}){
 const [memo,setMemo]=useState(view.memo);const [busy,setBusy]=useState(false);const [status,setStatus]=useState('');
 async function save(){setBusy(true);setStatus('');try{await api.saveMemo(view.chat.id,memo);setStatus('저장했어요.');}catch(error){setStatus(error instanceof Error?error.message:'저장하지 못했어요.');}finally{setBusy(false);}}
 return <details className="chat-memo"><summary>고정 메모</summary><label className="reader-field">기억할 내용<textarea maxLength={2000} value={memo} rows={5} disabled={busy} onChange={event=>{setMemo(event.target.value);setStatus('');}}/></label><Button disabled={busy} onClick={save}>{busy?'저장 중…':'메모 저장'}</Button><p role="status">{status}</p></details>;
}
export function MessageDialog({action,onClose,onConfirm,busy}:{action:{kind:'edit'|'delete';message:MessageDto}|null;onClose:()=>void;onConfirm:(content:string)=>Promise<void>;busy:boolean}){
 return <Modal open={!!action} title={action?.kind==='edit'?'메시지 수정':'메시지 삭제'} onClose={()=>{if(!busy)onClose();}}>{action&&<MessageForm key={`${action.kind}-${action.message.id}`} action={action} onConfirm={onConfirm} busy={busy}/>}</Modal>;
}
function MessageForm({action,onConfirm,busy}:{action:{kind:'edit'|'delete';message:MessageDto};onConfirm:(content:string)=>Promise<void>;busy:boolean}){
 const [content,setContent]=useState(action.message.content);return <div className="reader reader-start">{action.kind==='edit'?<label className="reader-field">내용<textarea autoFocus rows={6} value={content} maxLength={8000} onChange={event=>setContent(event.target.value)} disabled={busy}/></label>:<p>이 메시지와 이어지는 분기를 삭제할까요?</p>}<Button disabled={busy||!content.trim()} onClick={()=>void onConfirm(content)}>{busy?'처리 중…':action.kind==='edit'?'수정 저장':'삭제'}</Button></div>;
}
