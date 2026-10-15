import type {StudioDraft,StudioAsset} from './types';
export function Preview({draft,assets}:{draft:StudioDraft;assets:StudioAsset[]}) {
 const render=(text:string)=>text.split(/(\{\{img:[A-Za-z0-9_-]+\}\})/g).map((part,i)=>{
  const match=/^\{\{img:([^}]+)\}\}$/.exec(part);if(!match)return <span key={i}>{part}</span>;
  const selected=draft.assets?.find(a=>a.code===match[1]);const asset=assets.find(a=>a.id===selected?.id);
  return asset?.url?<img key={i} src={asset.url} alt={asset.label}/>:<span className="studio-image-placeholder" key={i}>이미지 {match[1]} · {asset?'미업로드':'미등록'}</span>;
 });
 return <section className="studio-preview"><h2>{draft.title||'제목 없는 작품'}</h2><p>{draft.publicSnapshot.tagline}</p><p>{draft.description}</p>{draft.publicSnapshot.openings.map(o=><article key={o.id}><h3>{o.title}</h3><div>{render(o.prologue)}</div><p>{render(o.firstMessage)}</p><ul>{o.suggestedReplies.filter(Boolean).map((r,i)=><li key={i}>{r}</li>)}</ul></article>)}</section>;
}
