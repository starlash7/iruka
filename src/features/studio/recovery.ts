import type {StudioDraft} from './types.ts';
export interface DraftRecovery {draft:StudioDraft;revision:number;updatedAt:string}
export function recoveryKey(identity:string,id:string){return `iruka:studio-recovery:${encodeURIComponent(identity)}:${id}`;}
export function readRecovery(storage:Pick<Storage,'getItem'>,key:string):DraftRecovery|null {
 try {const v=JSON.parse(storage.getItem(key)??'null');return v&&typeof v.revision==='number'&&v.draft?.publicSnapshot&&v.draft?.privateConfig?v:null;}catch{return null;}
}
export function writeRecovery(storage:Pick<Storage,'setItem'>,key:string,value:DraftRecovery){storage.setItem(key,JSON.stringify(value));}
export function sameDraft(a:StudioDraft,b:StudioDraft){
 const normalize=(d:StudioDraft)=>{const result=structuredClone(d);delete result.revision;result.tags=result.tags.map(t=>t.trim()).filter(Boolean);result.privateConfig.lorebook.forEach(l=>{l.keywords=l.keywords.map(k=>k.trim()).filter(Boolean);});return JSON.stringify(sortKeys(result));};
 return normalize(a)===normalize(b);
}

function sortKeys(value:unknown):unknown {
 if(Array.isArray(value))return value.map(sortKeys);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,sortKeys(v)]));
 return value;
}
