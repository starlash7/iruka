import type {DiscoveryService, DiscoveryServiceDependencies} from '../core/interfaces.ts';
import type {PublicWorkDetailDto, PublicWorkDto} from '../../src/shared/contracts.ts';
import {projectPublicSnapshot} from '../core/publicSnapshot.ts';
export interface DiscoverQuery {query?: string; tag?: string; mode?: 'character'|'story'; offset?: number;favoriteUserId?:string}
type Row = {id:string;owner_id:string;creator_name:string|null;mode:'character'|'story';title:string;description:string;cover_url:string|null;tags:string[];created_at:Date;version_id:string;public_snapshot:Record<string,unknown>};
const selectPublic = `SELECT w.id,w.owner_id,CASE WHEN w.show_creator THEN p.nickname END AS creator_name,w.mode,w.title,w.description,w.cover_url,w.tags,w.created_at,
 v.id AS version_id,v.public_snapshot FROM works w LEFT JOIN user_profiles p ON p.user_id=w.owner_id JOIN LATERAL
 (SELECT id,public_snapshot FROM work_versions WHERE work_id=w.id AND published_at IS NOT NULL ORDER BY version DESC LIMIT 1) v ON true
 WHERE w.visibility='public'`;
function mapPublic(row:Row):PublicWorkDto {
 return {id:row.id,creatorId:row.owner_id,...(row.creator_name?{creatorName:row.creator_name}:{}),mode:row.mode,title:row.title,description:row.description,coverUrl:row.cover_url,tags:row.tags,
  publishedVersionId:row.version_id,createdAt:new Date(row.created_at).toISOString()};
}
export function createDiscoveryService({db}:DiscoveryServiceDependencies) {
 const searchWorks=async ({query='',tag='',mode,offset=0,favoriteUserId}:DiscoverQuery={})=>{
  // Literal substring search: user '%' and '_' must not become wildcard operators.
  const needle=query.trim().slice(0,200).replace(/[\\%_]/g,'\\$&');
  const {rows}=await db.query<Row>(`${selectPublic}
   AND ($1='' OR w.title ILIKE $1 ESCAPE '\\' OR w.description ILIKE $1 ESCAPE '\\')
   AND ($2='' OR $2=ANY(w.tags)) AND ($3::text IS NULL OR w.mode=$3)
   AND ($5::uuid IS NULL OR EXISTS(SELECT 1 FROM work_favorites f WHERE f.user_id=$5 AND f.work_id=w.id))
   ORDER BY w.created_at DESC,w.id LIMIT 60 OFFSET $4`,[needle?`%${needle}%`:'',tag.slice(0,80),mode??null,Math.max(0,Math.min(10000,Math.floor(offset))),favoriteUserId??null]);
  return rows.map(mapPublic);
 };
 return {listWorks:()=>searchWorks(),searchWorks,async rankWorks():Promise<PublicWorkDto[]>{
  const {rows}=await db.query<Row>(`${selectPublic} AND w.id IN (
   SELECT c.work_id FROM chats c JOIN turn_requests t ON t.chat_id=c.id
   WHERE t.status='succeeded' AND t.created_at>now()-interval '7 days')
   ORDER BY (SELECT COUNT(DISTINCT c.user_id) FROM chats c JOIN turn_requests t ON t.chat_id=c.id
     WHERE c.work_id=w.id AND t.status='succeeded' AND t.created_at>now()-interval '7 days') DESC,w.id LIMIT 60`);
  return rows.map(mapPublic);
 },async getWork(id:string):Promise<PublicWorkDetailDto|null>{
  const {rows}=await db.query<Row>(`${selectPublic} AND w.id=$1`,[id]);
  return rows[0]?{...mapPublic(rows[0]),snapshot:projectPublicSnapshot(rows[0].public_snapshot)}:null;
 }};
}
