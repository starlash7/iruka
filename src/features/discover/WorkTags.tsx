import {useState} from 'react';
import {useReader} from './ReaderProvider';
export function WorkTags({tags}:{tags:string[]}){const {href}=useReader();const [expanded,setExpanded]=useState(false);return <div className="reader-chips">{(expanded?tags:tags.slice(0,4)).map(tag=><a key={tag} href={href(`/tags/${encodeURIComponent(tag)}`)}>#{tag}</a>)}{tags.length>4&&<button type="button" aria-expanded={expanded} onClick={()=>setExpanded(value=>!value)}>{expanded?'태그 접기':`+${tags.length-4}`}</button>}</div>;}
