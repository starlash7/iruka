import type {PublicWorkSnapshot} from '../../src/shared/contracts.ts';
const text=(value:unknown)=>typeof value==='string'?value:'';
const records=(value:unknown):Record<string,unknown>[]=>Array.isArray(value)?value.filter((item):item is Record<string,unknown>=>Boolean(item)&&typeof item==='object'&&!Array.isArray(item)):[];
/** Explicit nested whitelist; stored JSON may contain author-only keys. */
export function projectPublicSnapshot(value:Record<string,unknown>):PublicWorkSnapshot {
 return {
  tagline:text(value.tagline),playGuide:text(value.playGuide),
  characters:records(value.characters).map(c=>({id:text(c.id),name:text(c.name),imageUrl:typeof c.imageUrl==='string'?c.imageUrl:null})),
  openings:records(value.openings).map(o=>({id:text(o.id),title:text(o.title),prologue:text(o.prologue),firstMessage:text(o.firstMessage),suggestedReplies:Array.isArray(o.suggestedReplies)?o.suggestedReplies.filter((reply):reply is string=>typeof reply==='string'):[]})),
 };
}
