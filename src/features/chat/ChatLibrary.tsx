import {useEffect,useRef,useState} from 'react';
import {Button} from '../../ui';
import {useReader} from '../discover/ReaderProvider';
import {useResource} from '../discover/useResource';
import {usePages} from '../discover/usePages';
import {ResourceState} from '../discover/ResourceState';
import {LibraryDialog,type LibraryAction} from './LibraryDialog';
import {libraryChanged,notifyLibrary} from './libraryEvents';
import './chat-library.css';

export function ChatLibrary(){
 const {api,href}=useReader();const [folderId,setFolderId]=useState(''),[revision,setRevision]=useState(0),[action,setAction]=useState<LibraryAction|null>(null);
 const folders=useResource(()=>api.listFolders(),[api,revision]);
 const chats=usePages(offset=>api.listChats({folderId:folderId||undefined,offset,limit:50}),[api,folderId,revision],50,item=>item.chat.id);
 useEffect(()=>{const update=()=>setRevision(value=>value+1);window.addEventListener(libraryChanged,update);return()=>window.removeEventListener(libraryChanged,update);},[]);
 const heading=useRef<HTMLHeadingElement>(null),trigger=useRef<HTMLButtonElement|null>(null);
 function open(action:LibraryAction,button:HTMLButtonElement){trigger.current=button;button.focus();setAction(action);}
 const selected=folders.data?.find(folder=>folder.id===folderId);
 return <section className="chat-library" aria-label="대화 보관함"><div className="library-heading"><h2 ref={heading} tabIndex={-1}>대화 보관함</h2><Button variant="secondary" onClick={event=>open({kind:'folder-create'},event.currentTarget)}>새 폴더</Button></div>
 <nav className="library-folders" aria-label="대화 폴더">{[{id:'',name:'전체'},{id:'unfiled',name:'미분류'},...(folders.data??[])].map(folder=><Button key={folder.id} variant="ghost" aria-pressed={folderId===folder.id} onClick={()=>setFolderId(folder.id)}>{folder.name}</Button>)}</nav>
 {folders.loading&&<p role="status">폴더를 불러오는 중…</p>}{folders.error&&<ResourceState error={folders.error} retry={folders.reload}/>}
 {selected&&<div className="library-folder-tools"><span>{selected.name}</span><Button variant="ghost" onClick={event=>open({kind:'folder-edit',folder:selected},event.currentTarget)}>폴더 이름 변경</Button><Button variant="ghost" onClick={event=>open({kind:'folder-delete',folder:selected},event.currentTarget)}>폴더 삭제</Button></div>}
 {chats.loading||chats.error?<ResourceState {...chats} retry={chats.reload}/>:!chats.data?.length?<ResourceState empty="이 폴더에 대화가 없어요."/>:<ul className="library-chats">{chats.data.map(item=><li key={item.chat.id}><a className="library-chat-link" href={href(`/chat/${encodeURIComponent(item.chat.id)}`)}><strong>{item.title}</strong><p>{item.preview||'대화를 이어가세요.'}</p><span>이어하기 →</span></a><div className="library-chat-tools"><Button variant="ghost" disabled={folders.loading||!!folders.error} aria-label={`${item.title} 이름·폴더 변경`} onClick={event=>open({kind:'chat-edit',chat:item},event.currentTarget)}>이름·폴더</Button><Button variant="ghost" aria-label={`${item.title} 대화 삭제`} onClick={event=>open({kind:'chat-delete',chat:item},event.currentTarget)}>삭제</Button></div></li>)}</ul>}
 {chats.moreError&&<p role="alert">{chats.moreError.message}</p>}{chats.hasMore&&<Button variant="secondary" disabled={chats.loadingMore} onClick={()=>void chats.loadMore()}>{chats.loadingMore?'불러오는 중…':chats.moreError?'추가 불러오기 다시 시도':'대화 더 보기'}</Button>}
 {action&&<LibraryDialog action={action} api={api} folders={folders.data??[]} onClose={()=>{setAction(null);requestAnimationFrame(()=>trigger.current?.focus());}} onSaved={()=>{if(action.kind==='folder-delete'&&action.folder.id===folderId)setFolderId('');setAction(null);notifyLibrary();requestAnimationFrame(()=>heading.current?.focus());}}/>}
 </section>;
}
