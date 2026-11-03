import type { CreatorWorkDto, WorkDraftInput } from '../../shared/contracts.ts';
export interface StudioAsset { id:string; code:string; label:string; url:string|null; revision?:number }
export interface StudioDraft extends WorkDraftInput { revision?:number; assets?:Array<{id:string;code:string}> }
export interface StudioWork extends CreatorWorkDto { draft:StudioDraft; revision:number; assets:StudioAsset[] }
export interface StudioListItem {id:string;title:string;mode:string;revision:number;published:boolean;coverUrl:string|null;updatedAt:string}
