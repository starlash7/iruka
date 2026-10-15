import {BookOpen} from 'lucide-react';
import type {PublicWorkDto} from '../../shared/contracts';
import {useReader} from './ReaderProvider';
import {useState} from 'react';
export function WorkCover({url,title}:{url:string|null;title:string}){
 const [failedUrl,setFailedUrl]=useState<string|null>(null);
 const safe=!!url&&(/^(https?:\/\/|\/[^/])/.test(url));
 return safe&&failedUrl!==url?<img src={url} alt="" loading="lazy" onError={()=>setFailedUrl(url)}/>:<div className="reader-cover-fallback" role="img" aria-label={`${title} 표지 없음`}><BookOpen size={30}/></div>;
}
export function WorkGrid({works,ranked=false}:{works:PublicWorkDto[];ranked?:boolean}){
 const {href}=useReader();return <div className="reader-work-grid discovery-grid">{works.map((work,index)=><article className="reader-work" key={work.id}>
  <a className="reader-cover" href={href(`/works/${encodeURIComponent(work.id)}`)} aria-label={work.title}><WorkCover key={work.coverUrl} url={work.coverUrl} title={work.title}/>{ranked&&<span className="reader-rank">{index+1}</span>}</a>
  <h3><a href={href(`/works/${encodeURIComponent(work.id)}`)}>{work.title}</a></h3><p>{work.description}</p>
  <div className="reader-card-tags">{work.tags.slice(0,2).map(tag=><a key={tag} href={href(`/tags/${encodeURIComponent(tag)}`)}>#{tag}</a>)}</div>
 </article>)}</div>;
}
