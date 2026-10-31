import {MessageCircle} from 'lucide-react';
import {Button} from '../../ui';
import {ReaderSession} from './ReaderSession';
import {useReader} from './ReaderProvider';
import {useResource} from './useResource';

type Props={workId:string;published:boolean;authEnabled:boolean;onStart:(button:HTMLButtonElement)=>void};
export function WorkConversationActions(props:Props){
 return <ReaderSession enabled={props.authEnabled}>{({identity})=>identity?<ConversationButtons key={`${identity}:${props.workId}`} {...props}/>:<NewConversation {...props}/>}</ReaderSession>;
}
function NewConversation({published,onStart,hasPrevious=false}:Props&{hasPrevious?:boolean}){
 return <Button variant={hasPrevious?'secondary':'primary'} onClick={event=>{event.currentTarget.focus();onStart(event.currentTarget);}} disabled={!published} aria-describedby={!published?'work-start-unavailable':undefined}><MessageCircle size={18} aria-hidden="true"/>{hasPrevious?'새 대화':'대화 시작'}</Button>;
}
function ConversationButtons(props:Props){
 const {api,href}=useReader();const state=useResource(()=>api.listChats({workId:props.workId,limit:1}),[api,props.workId]);
 const previous=state.data?.[0];
 return <><div className="work-conversation-buttons">
  {previous&&<a className="ui-button" href={href(`/chat/${encodeURIComponent(previous.chat.id)}`)}>이어하기</a>}
  <NewConversation {...props} hasPrevious={!!previous}/>
 </div>{state.error&&<div className="work-action-error" role="alert"><span>이전 대화를 확인하지 못했어요.</span><button type="button" onClick={state.reload}>다시 확인</button></div>}</>;
}
