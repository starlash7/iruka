import {Button} from '../../ui';
import type {StudioDraft} from './types';
import type {StudioClient} from './client';
import {StoryImage} from '../media/StoryImage';
import {Line,Check} from './Fields';
export function GalleryFields({draft,change,client}:{draft:StudioDraft;change:(fn:(draft:StudioDraft)=>void)=>void;client:StudioClient}){
 const gallery=draft.publicSnapshot.gallery??[];
 function move(index:number,step:number){change(d=>{const items=d.publicSnapshot.gallery!;[items[index],items[index+step]]=[items[index+step],items[index]];});}
 return <details className="studio-public-gallery"><summary>공개 소개·갤러리 ({gallery.length}/20)</summary>{!gallery.length&&<p>등록 이미지에서 공개할 이미지를 선택하면 여기에 표시돼요.</p>}<div className="studio-gallery-edit">{gallery.map((image,index)=><section key={image.id}><StoryImage url={image.imageUrl} alt={image.title||'공개 이미지'} loadImage={client.image}/><Line label="공개 이미지 설명" max={100} value={image.title} onChange={value=>change(d=>{d.publicSnapshot.gallery![index].title=value;})}/><Check label="작품 소개 본문에 배치" value={image.introduction===true} onChange={value=>change(d=>{d.publicSnapshot.gallery![index].introduction=value;})}/><div className="studio-toolbar"><Button variant="ghost" disabled={!index} aria-label={`${image.title||'이미지'} 앞으로 이동`} onClick={()=>move(index,-1)}>앞으로</Button><Button variant="ghost" disabled={index===gallery.length-1} aria-label={`${image.title||'이미지'} 뒤로 이동`} onClick={()=>move(index,1)}>뒤로</Button><Button variant="ghost" onClick={()=>change(d=>{d.publicSnapshot.gallery!.splice(index,1);})}>갤러리에서 빼기</Button></div></section>)}</div></details>;
}
