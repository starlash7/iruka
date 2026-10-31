import {ReaderSession} from './ReaderSession';
import {SignInNotice} from './SignInNotice';
import {useReader} from './ReaderProvider';
import {usePages} from './usePages';
import {WorkPages} from './WorkPages';
export default function FavoritesPage(){
 return <section className="discovery-page"><h1>찜한 작품</h1><ReaderSession>{session=>session.identity?<Favorites key={session.identity}/>:<SignInNotice {...session}/>}</ReaderSession></section>;
}
function Favorites(){const {api}=useReader();const state=usePages(offset=>api.listFavorites(offset),[api],60,work=>work.id);return <WorkPages state={state} empty="아직 찜한 작품이 없어요. 작품 상세에서 하트를 눌러 보세요."/>;}
