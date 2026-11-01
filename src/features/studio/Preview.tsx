import {WorkPresentation} from '../discover/WorkPresentation';
import {StoryImage} from '../media/StoryImage';
import type {StudioClient} from './client';
import type {StudioDraft,StudioAsset} from './types';
export function Preview({draft,assets,client}:{draft:StudioDraft;assets:StudioAsset[];client?:StudioClient}){
 const images=assets.filter(asset=>draft.assets?.some(binding=>binding.id===asset.id));
 return <section className="studio-preview"><header className="studio-preview-heading">{draft.coverUrl&&<StoryImage url={draft.coverUrl} alt="작품 표지" loadImage={client?.image}/>}<div><h2>{draft.title||'제목 없는 작품'}</h2><p>{draft.publicSnapshot.tagline}</p></div></header><WorkPresentation loadImage={client?.image} work={{id:draft.id??'preview',creatorId:'',mode:draft.mode,title:draft.title,description:draft.description,coverUrl:draft.coverUrl,tags:draft.tags,publishedVersionId:null,createdAt:'',snapshot:{...draft.publicSnapshot,images:images.flatMap(asset=>asset.url?[{code:asset.code,label:asset.label,url:asset.url}]:[])}}}/></section>;
}
