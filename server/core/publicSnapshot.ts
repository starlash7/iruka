import type {PublicWorkSnapshot} from '../../src/shared/contracts.ts';
const text=(value:unknown)=>typeof value==='string'?value:'';
const records=(value:unknown):Record<string,unknown>[]=>Array.isArray(value)?value.filter((item):item is Record<string,unknown>=>Boolean(item)&&typeof item==='object'&&!Array.isArray(item)):[];
/** Explicit nested whitelist; stored JSON may contain author-only keys. */
export function projectPublicSnapshot(value:Record<string,unknown>,assets:Array<{code:string;label:string;url:string|null}>=[]):PublicWorkSnapshot {
 const publicText=records(value.openings).flatMap(o=>[text(o.prologue),text(o.firstMessage)]).join('\n');
 const codes=new Set([...publicText.matchAll(/\{\{img:([A-Za-z0-9_-]{1,64})\}\}/g)].map(match=>match[1]));
 const images=assets.filter(asset=>asset.url&&codes.has(asset.code)).map(asset=>({code:asset.code,label:text(records(value.gallery).find(item=>item.imageUrl===asset.url)?.title)||'장면 이미지',url:asset.url!}));
 return {
  ...(value.gallery!==undefined?{gallery:records(value.gallery).slice(0,20).filter(item=>typeof item.imageUrl==='string').map(item=>({id:text(item.id),title:text(item.title),imageUrl:text(item.imageUrl),introduction:item.introduction===true}))}:{}),
  ...(images.length?{images}:{}),
  tagline:text(value.tagline),playGuide:text(value.playGuide),
  characters:records(value.characters).map(c=>({id:text(c.id),name:text(c.name),imageUrl:typeof c.imageUrl==='string'?c.imageUrl:null,...(typeof c.caption==='string'?{caption:c.caption}:{})})),
  openings:records(value.openings).map(o=>({id:text(o.id),title:text(o.title),prologue:text(o.prologue),firstMessage:text(o.firstMessage),...(o.imageUrl!==undefined?{imageUrl:typeof o.imageUrl==='string'?o.imageUrl:null}:{}),suggestedReplies:Array.isArray(o.suggestedReplies)?o.suggestedReplies.filter((reply):reply is string=>typeof reply==='string'):[]})),
 };
}
