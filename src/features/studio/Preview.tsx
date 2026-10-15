import {StoredImage} from './ImageField';
import type {StudioClient} from './client';
import type {StudioDraft,StudioAsset} from './types';
export function Preview({draft,assets,client}:{draft:StudioDraft;assets:StudioAsset[];client?:StudioClient}) {
 const render=(text:string)=>text.split(/(\{\{img:[A-Za-z0-9_-]+\}\})/g).map((part,i)=>{
  const match=/^\{\{img:([^}]+)\}\}$/.exec(part);if(!match)return <span key={i}>{part}</span>;
  const selected=draft.assets?.find(a=>a.code===match[1]);const asset=assets.find(a=>a.id===selected?.id);
  return asset?.url?(client?<StoredImage key={i} url={asset.url} alt={asset.label} client={client}/>:<img key={i} src={asset.url} alt={asset.label}/>):<span className="studio-image-placeholder" key={i}>이미지 {match[1]} · {asset?'미업로드':'미등록'}</span>;
 });
 return <section className="studio-preview">{draft.coverUrl&&client&&<StoredImage url={draft.coverUrl} alt="표지" client={client}/>}<h2>{draft.title||'제목 없는 작품'}</h2><p>{draft.publicSnapshot.tagline}</p><p>{draft.description}</p><div className="studio-preview-cast">{draft.publicSnapshot.characters.map(c=><figure key={c.id}>{c.imageUrl&&client&&<StoredImage url={c.imageUrl} alt={c.name} client={client}/>}<figcaption>{c.name}</figcaption></figure>)}</div>{draft.publicSnapshot.openings.map(o=><article key={o.id}><h3>{o.title}</h3><div>{render(o.prologue)}</div><p>{render(o.firstMessage)}</p><ul>{o.suggestedReplies.filter(Boolean).map((r,i)=><li key={i}>{r}</li>)}</ul></article>)}</section>;
}
