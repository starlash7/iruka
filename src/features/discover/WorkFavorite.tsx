import {useEffect,useRef,useState} from 'react';
import {Heart} from 'lucide-react';
import {Button} from '../../ui';
import {ReaderSession} from './ReaderSession';
import {useReader} from './ReaderProvider';
import {useResource} from './useResource';

export function WorkFavorite({workId,authEnabled}:{workId:string;authEnabled:boolean}){
 return <ReaderSession enabled={authEnabled}>{({identity,ready,login,error})=>identity?<FavoriteControl key={`${identity}:${workId}`} workId={workId}/>:<div><Button variant="secondary" disabled={!ready||!login} onClick={login} title="로그인 후 찜할 수 있어요."><Heart size={18}/>찜하기</Button>{error&&<p role="alert">{error}</p>}</div>}</ReaderSession>;
}
function FavoriteControl({workId}:{workId:string}){
 const {api}=useReader();const state=useResource(()=>api.getFavorite(workId),[api,workId]);
 const [saved,setSaved]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');const lock=useRef(false),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{if(state.data)setSaved(state.data.saved);},[state.data]);
 async function toggle(){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{const next=await api.setFavorite(workId,!saved);if(mounted.current)setSaved(next.saved);}catch(error){if(mounted.current)setError(error instanceof Error?error.message:'찜 상태를 저장하지 못했어요.');}finally{lock.current=false;if(mounted.current)setBusy(false);}}
 return <div className="work-favorite"><Button variant="secondary" aria-pressed={saved} disabled={state.loading||busy||!!state.error} onClick={()=>void toggle()}><Heart size={18} fill={saved?'currentColor':'none'}/>{saved?'찜한 작품':'찜하기'}</Button>
 {(error||state.error)&&<p role="alert">{error||state.error?.message}{state.error&&<button onClick={state.reload}>다시 확인</button>}</p>}</div>;
}
