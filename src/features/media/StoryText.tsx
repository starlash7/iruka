import {StoryImage} from './StoryImage';
export type StoryMedia={code:string;label:string;url:string|null};
export function plainStoryText(text:string){return text.replace(/\{\{img:[^}]+\}\}/g,'').trim();}
export function hasInlineStoryImage(text:string,url:string,images:StoryMedia[]=[]){return images.some(image=>image.url===url&&text.includes(`{{img:${image.code}}}`));}
export function StoryText({text,images=[],loadImage}:{text:string;images?:StoryMedia[];loadImage?:(url:string,signal?:AbortSignal)=>Promise<Blob>}){
 return <div className="story-text">{text.split(/(\{\{img:[A-Za-z0-9_-]{1,64}\}\})/g).map((part,index)=>{
  const match=/^\{\{img:([^}]+)\}\}$/.exec(part);if(!match)return <span key={index}>{part.split('\n').map((line,i)=>{const dialogue=/^@([^@\n]{1,50})@\s*(.*)$/.exec(line);return <span className="story-line" key={i}>{dialogue?<><strong className="story-speaker">{dialogue[1]}</strong>{dialogue[2]}</>:line.startsWith('*')&&line.endsWith('*')?<em>{line.slice(1,-1)}</em>:line||'\u00a0'}</span>;})}</span>;
  const image=images.find(item=>item.code===match[1]);return image?.url?<StoryImage key={index} url={image.url} alt={image.label||'장면 이미지'} loadImage={loadImage}/>:<span key={index} className="story-image-state">장면 이미지 · 미등록 또는 미업로드</span>;
 })}</div>;
}
