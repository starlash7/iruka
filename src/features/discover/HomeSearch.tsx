import {Search} from 'lucide-react';
import {useReader} from './ReaderProvider';
export function HomeSearch(){
 const {navigate}=useReader();
 return <form className="home-header-search" role="search" onSubmit={event=>{event.preventDefault();const query=String(new FormData(event.currentTarget).get('q')??'').trim();navigate(`/search?${new URLSearchParams({q:query})}`);}}>
  <label className="home-sr-only" htmlFor="home-search">작품 검색</label>
  <input id="home-search" name="q" type="search" placeholder="어떤 이야기를 찾고 있나요?" maxLength={200}/>
  <button type="submit" aria-label="작품 검색"><Search size={20} aria-hidden="true"/></button>
 </form>;
}
