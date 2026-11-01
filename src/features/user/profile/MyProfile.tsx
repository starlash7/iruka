import {useRef,useState} from 'react';
import {BookOpen,MessageCircle,Users,Coins,Heart,ChevronRight,Pencil} from 'lucide-react';
import {Button} from '../../../ui';
import {ReaderAvatar} from '../../discover/ReaderIdentity';
import {useReader} from '../../discover/ReaderProvider';
import {useProfile} from './useProfile';
import {ProfileEditor} from './ProfileEditor';
import './profile.css';

export function MyProfile({identity}:{identity:string}){
 const {data,error,loading,save,reload}=useProfile(identity);const {href}=useReader();
 const [editing,setEditing]=useState(false);const [saved,setSaved]=useState(false);const editButton=useRef<HTMLButtonElement>(null);
 function closeEditor(){setEditing(false);requestAnimationFrame(()=>editButton.current?.focus());}
 return <>
  <section className="my-profile" aria-label="내 프로필">
   {!data?<div className="profile-load-state"><p role={error?'alert':'status'}>{error||'프로필을 불러오는 중…'}</p>{error&&<Button variant="secondary" onClick={reload}>다시 시도</Button>}</div>:editing?<ProfileEditor profile={data} identity={identity} onCancel={closeEditor} onSave={async value=>{await save(value);setSaved(true);closeEditor();}}/>:<>
    <div className="profile-heading"><ReaderAvatar identity={identity} image={data.avatar}/><div className="profile-copy"><h2>{data.nickname}</h2><p>{data.bio||'자기소개를 추가해 보세요.'}</p></div><button ref={editButton} className="ui-button ui-button--secondary" onClick={()=>{setEditing(true);setSaved(false);}}><Pencil size={16}/>프로필 수정</button></div>
    {saved&&<p role="status">프로필을 저장했어요.</p>}
   </>}
   {data&&error&&<div className="profile-load-state"><p role="alert">{error}</p><Button variant="secondary" onClick={reload}>다시 시도</Button></div>}
   {loading&&data&&<span className="profile-refresh" role="status">프로필 동기화 중…</span>}
  </section>
  <section className="profile-activity" aria-labelledby="profile-activity-title"><h2 id="profile-activity-title">내 활동</h2><div className="profile-links">
   {[{path:'/studio',label:'내 작품',Icon:BookOpen},{path:'/chats',label:'최근 대화',Icon:MessageCircle},{path:'/favorites',label:'찜한 작품',Icon:Heart},{path:'/personas',label:'페르소나',Icon:Users},{path:'/credits',label:'테스트 크레딧',Icon:Coins}].map(({path,label,Icon})=><a key={path} href={href(path)}><Icon size={20}/><span>{label}</span><ChevronRight size={18}/></a>)}
  </div></section>
 </>;
}
