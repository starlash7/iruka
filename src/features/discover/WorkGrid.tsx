import {BookOpen} from 'lucide-react';
import type {PublicWorkDto} from '../../shared/contracts';
import {useReader} from './ReaderProvider';
import {useState} from 'react';
export function WorkCover({url,title}:{url:string|null;title:string}){
 const [failed,setFailed]=useState(false);
 const safe=!!url&&(/^(https?:\/\/|\/[^/])/.test(url));
 return safe&&!failed?<img src={url} alt="" loading="lazy" onError={()=>setFailed(true)}/>:<div className="reader-cover-fallback" aria-label={`${title} 표지 없음`}><BookOpen size={30}/></div>;
}
export function WorkGrid({works,ranked=false}:{works:PublicWorkDto[];ranked?:boolean}){
 const {href}=useReader();return <div className="reader-work-grid">{works.map((work,index)=><article className="reader-work" key={work.id}>
  <a className="reader-cover" href={href(`/works/${encodeURIComponent(work.id)}`)} aria-label={work.title}><WorkCover key={work.coverUrl} url={work.coverUrl} title={work.title}/>{ranked&&<span className="reader-rank">{index+1}</span>}</a>
  <div className="reader-work-type">{work.mode==='story'?'스토리':'캐릭터'}</div><h3><a href={href(`/works/${encodeURIComponent(work.id)}`)}>{work.title}</a></h3><p>{work.description}</p>
  <div className="reader-card-tags">{work.tags.slice(0,2).map(tag=><a key={tag} href={href(`/tags/${encodeURIComponent(tag)}`)}>#{tag}</a>)}</div>
 </article>)}</div>;
}
