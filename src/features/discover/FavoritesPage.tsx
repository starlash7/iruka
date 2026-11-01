import {CollectionHeading} from './CollectionHeading';
import {ReaderSession} from './ReaderSession';
import {SignInNotice} from './SignInNotice';
import {useReader} from './ReaderProvider';
import {usePages} from './usePages';
import {WorkPages} from './WorkPages';
export default function FavoritesPage(){
 return <section className="discovery-page"><CollectionHeading title="찜한 작품" eyebrow="MY COLLECTION" description="다시 만나고 싶은 이야기를 모아두었어요."/><ReaderSession>{session=>session.identity?<Favorites key={session.identity}/>:<SignInNotice {...session}/>}</ReaderSession></section>;
}
function Favorites(){const {api,href}=useReader();const state=usePages(offset=>api.listFavorites(offset),[api],60,work=>work.id);return <WorkPages state={state} emptyAction={{href:href('/'),label:'이야기 둘러보기'}} empty="아직 찜한 작품이 없어요. 작품 상세에서 하트를 눌러 보세요."/>;}
