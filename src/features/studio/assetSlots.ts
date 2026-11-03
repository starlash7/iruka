import type {StudioAsset,StudioDraft} from './types';
export function getAssetSlots(assets:StudioAsset[],draft:StudioDraft){
 return [...new Set(assets.map(asset=>asset.code))].map(code=>{
  const versions=assets.filter(asset=>asset.code===code).sort((a,b)=>(b.revision??1)-(a.revision??1));
  const selected=versions.find(asset=>draft.assets?.some(binding=>binding.id===asset.id));
  return {latest:versions[0],selected,asset:selected??versions[0]};
 });
}
export function isImageReferenced(draft:StudioDraft,url:string|null){return !!url&&[draft.coverUrl,...draft.publicSnapshot.characters.map(item=>item.imageUrl),...draft.publicSnapshot.openings.map(item=>item.imageUrl),...(draft.publicSnapshot.gallery??[]).map(item=>item.imageUrl),...draft.privateConfig.endings.map(item=>item.imageUrl)].includes(url);}
export function bindDraftAsset(draft:StudioDraft,asset:StudioAsset,previousUrl?:string|null){
 draft.assets=[...(draft.assets??[]).filter(item=>item.code!==asset.code),{id:asset.id,code:asset.code}];
 if(!previousUrl||!asset.url||previousUrl===asset.url)return;
 if(draft.coverUrl===previousUrl)draft.coverUrl=asset.url;
 for(const item of [...draft.publicSnapshot.characters,...draft.publicSnapshot.openings,...(draft.publicSnapshot.gallery??[]),...draft.privateConfig.endings])if(item.imageUrl===previousUrl)item.imageUrl=asset.url;
}
