import type { Database } from '../db/index.ts';
import type { PublicWorkDto, PublicWorkDetailDto, CreatorWorkDto, PublicWorkSnapshot } from '../../src/shared/contracts.ts';
import {ApiError} from './errors.ts';
import {projectPublicSnapshot} from './publicSnapshot.ts';
type WorkRow={id:string;owner_id:string;mode:'character'|'story';title:string;description:string;cover_url:string|null;tags:string[];created_at:Date};
export async function getPublicWork(db:Database,id:string):Promise<PublicWorkDetailDto> {
 const {rows}=await db.query<WorkRow>(`SELECT id,owner_id,mode,title,description,cover_url,tags,created_at FROM works WHERE id=$1 AND visibility='public'`,[id]);
 if(!rows[0]) throw new ApiError('NOT_FOUND','작품을 찾을 수 없어요.');
 const work=await mapWork(db,rows[0]);
 const version=work.publishedVersionId?await db.query<{public_snapshot:Record<string,unknown>}>("SELECT public_snapshot FROM work_versions WHERE id=$1",[work.publishedVersionId]):null;
 return {...work,snapshot:version?.rows[0]?projectPublicSnapshot(version.rows[0].public_snapshot):null};
}
async function mapWork(db:Database,row:WorkRow):Promise<PublicWorkDto> {
 const versions=await db.query<{id:string}>(`SELECT id FROM work_versions WHERE work_id=$1 AND published_at IS NOT NULL ORDER BY version DESC LIMIT 1`,[row.id]);
 return {id:row.id,creatorId:row.owner_id,mode:row.mode,title:row.title,description:row.description,coverUrl:row.cover_url,tags:row.tags,publishedVersionId:versions.rows[0]?.id??null,createdAt:new Date(row.created_at).toISOString()};
}
export async function getCreatorWork(db:Database,id:string,userId:string):Promise<CreatorWorkDto> {
 const {rows}=await db.query<WorkRow>(`SELECT id,owner_id,mode,title,description,cover_url,tags,created_at FROM works WHERE id=$1 AND owner_id=$2`,[id,userId]);
 if(!rows[0]) throw new ApiError('NOT_FOUND','작품을 찾을 수 없어요.');
 const versions=await db.query<{id:string;version:number;private_config:Record<string,unknown>;public_snapshot:Partial<PublicWorkSnapshot>;created_at:Date}>(`SELECT id,version,private_config,public_snapshot,created_at FROM work_versions WHERE work_id=$1 ORDER BY version DESC`,[id]);
 return {work:await mapWork(db,rows[0]),versions:versions.rows.map(v=>({id:v.id,workId:id,version:v.version,systemPrompt:typeof v.private_config.systemPrompt==='string'?v.private_config.systemPrompt:'',hiddenSettings:v.private_config,publicSnapshot:v.public_snapshot,createdAt:new Date(v.created_at).toISOString()}))};
}

/** Runtime projection: injected implementations may carry extra private columns. */
export function projectPublicWork(work:PublicWorkDto):PublicWorkDto {
 return {id:work.id,creatorId:work.creatorId,mode:work.mode,title:work.title,description:work.description,
  coverUrl:work.coverUrl,tags:work.tags.filter((tag):tag is string=>typeof tag==='string'),
  publishedVersionId:work.publishedVersionId,createdAt:work.createdAt};
}
