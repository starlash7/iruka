import type {PublicWorkDetailDto} from '../../shared/contracts';
import {StoryImage} from '../media/StoryImage';
import {StoryText,hasInlineStoryImage} from '../media/StoryText';
import {WorkCover} from './WorkGrid';
import {loadPublicImage} from '../media/publicImages';
import './work-detail.css';
export function WorkPresentation({work,loadImage}:{work:PublicWorkDetailDto;loadImage?:(url:string,signal?:AbortSignal)=>Promise<Blob>}){
 const snapshot=work.snapshot,gallery=snapshot?.gallery??[],imageLoader=loadImage??loadPublicImage;
 return <>
 <section className="reader-detail-section" id="work-introduction"><h2>작품 소개</h2><p className="reader-prose">{work.description}</p><div className="work-introduction-images">{gallery.filter(item=>item.introduction).map(item=><StoryImage loadImage={imageLoader} key={item.id} url={item.imageUrl} alt={item.title||work.title}/>)}</div></section>
 {!!snapshot?.characters.length&&<section className="reader-detail-section" id="work-characters"><h2>등장인물</h2><div className="work-cast">{snapshot.characters.map(character=><article key={character.id}>
 <div className="work-cast-portrait">{character.imageUrl?<StoryImage loadImage={imageLoader} url={character.imageUrl} alt={character.name}/>:<WorkCover url={null} title={character.name}/>}</div><strong>{character.name}</strong>{character.caption&&<p>{character.caption}</p>}</article>)}</div></section>}
 {gallery.some(item=>!item.introduction)&&<section className="reader-detail-section" id="work-gallery"><h2>작품 이미지</h2><div className="work-gallery">{gallery.filter(item=>!item.introduction).map(item=><div key={item.id}><StoryImage loadImage={imageLoader} url={item.imageUrl} alt={item.title||work.title}/><p>{item.title}</p></div>)}</div></section>}
 {!!snapshot?.openings.length&&<section className="reader-detail-section" id="work-openings"><h2>시작 상황</h2>{snapshot.openings.map((opening,index)=><details key={opening.id} open={index===0||undefined}><summary>{opening.title}</summary>{opening.imageUrl&&!hasInlineStoryImage(`${opening.prologue}\n${opening.firstMessage}`,opening.imageUrl,snapshot.images)&&<StoryImage loadImage={imageLoader} url={opening.imageUrl} alt={`${opening.title} 장면`}/>}<StoryText loadImage={imageLoader} text={opening.prologue} images={snapshot.images}/>{opening.firstMessage&&<blockquote><StoryText loadImage={imageLoader} text={opening.firstMessage} images={snapshot.images}/></blockquote>}</details>)}</section>}
 {snapshot?.playGuide&&<details className="reader-detail-section" id="work-guide"><summary>플레이 가이드</summary><p className="reader-prose">{snapshot.playGuide}</p></details>}
 </>;
}
