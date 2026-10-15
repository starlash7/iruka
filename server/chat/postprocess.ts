import type {PrivateWorkConfig} from '../../src/shared/contracts.ts';
export interface ChatAsset {code:string;url:string;alt:string}
export function isSafeImageUrl(value:string):boolean {
  if(/^\/api\/studio\/media\/[0-9a-f-]{36}\/[0-9a-f]{64}$/.test(value))return true;
  try {const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}
}
export function postprocessOutput(raw:string, options:{personaName?:string;characterName?:string;assets?:ChatAsset[];endings?:PrivateWorkConfig['endings']}={}) {
  const images:Array<{url:string;alt:string}>=[],statuses:string[]=[],endings:Array<{endingId:string;title:string}>=[];
  let text=raw.replace(/\{\{img:([^{}]*)\}\}/g,(_,code:string)=>{
    const asset=options.assets?.find(a=>a.code===code);
    if(asset&&isSafeImageUrl(asset.url))images.push({url:asset.url,alt:asset.alt}); return '';
  }).replace(/```status\s*\n?([\s\S]*?)```/g,(_,status:string)=>{statuses.push(status.trim());return '';})
    .replace(/\{\{ending:([^{}]*)\}\}/g,(_,key:string)=>{
      const ending=options.endings?.find(e=>e.id===key);if(ending)endings.push({endingId:ending.id,title:ending.title});return '';
    }).replaceAll('{{user}}',options.personaName??'사용자').replaceAll('{{char}}',options.characterName??'등장인물');
  // Never expose incomplete/unknown control markers, including a truncated status block.
  text=text.replace(/\{\{[\s\S]*?(?:\}\}|$)/g,'').replace(/```status[\s\S]*$/g,'').trim();
  return {text,images,statuses,endings};
}
