import type { CreatorWorkDto, WorkDraftInput } from '../../shared/contracts.ts';
export interface StudioAsset { id:string; code:string; label:string; url:string|null }
export interface StudioDraft extends WorkDraftInput { revision?:number; assets?:Array<{id:string;code:string}> }
export interface StudioWork extends CreatorWorkDto { draft:StudioDraft; revision:number; assets:StudioAsset[] }
