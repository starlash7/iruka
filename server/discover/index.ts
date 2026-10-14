import type {DiscoveryService, DiscoveryServiceDependencies} from '../core/interfaces.ts';
import type {PublicWorkDetailDto, PublicWorkDto} from '../../src/shared/contracts.ts';
import {projectPublicSnapshot} from '../core/publicSnapshot.ts';
export interface DiscoverQuery {query?: string; tag?: string; mode?: 'character'|'story'; offset?: number}
type Row = {id:string;owner_id:string;mode:'character'|'story';title:string;description:string;cover_url:string|null;tags:string[];created_at:Date;version_id:string;public_snapshot:Record<string,unknown>};
const selectPublic = `SELECT w.id,w.owner_id,w.mode,w.title,w.description,w.cover_url,w.tags,w.created_at,
 v.id AS version_id,v.public_snapshot FROM works w JOIN LATERAL
 (SELECT id,public_snapshot FROM work_versions WHERE work_id=w.id AND published_at IS NOT NULL ORDER BY version DESC LIMIT 1) v ON true
 WHERE w.visibility='public'`;
function mapPublic(row:Row):PublicWorkDto {
 return {id:row.id,creatorId:row.owner_id,mode:row.mode,title:row.title,description:row.description,coverUrl:row.cover_url,tags:row.tags,
  publishedVersionId:row.version_id,createdAt:new Date(row.created_at).toISOString()};
}
export function createDiscoveryService({db}:DiscoveryServiceDependencies):DiscoveryService & {searchWorks(query:DiscoverQuery):Promise<PublicWorkDto[]>} {
 const searchWorks=async ({query='',tag='',mode,offset=0}:DiscoverQuery={})=>{
  // Literal substring search: user '%' and '_' must not become wildcard operators.
  const needle=query.trim().slice(0,200).replace(/[\\%_]/g,'\\$&');
  const {rows}=await db.query<Row>(`${selectPublic}
   AND ($1='' OR w.title ILIKE $1 ESCAPE '\\' OR w.description ILIKE $1 ESCAPE '\\')
   AND ($2='' OR $2=ANY(w.tags)) AND ($3::text IS NULL OR w.mode=$3)
   ORDER BY w.created_at DESC,w.id LIMIT 60 OFFSET $4`,[needle?`%${needle}%`:'',tag.slice(0,80),mode??null,Math.max(0,Math.min(10000,Math.floor(offset)))]);
  return rows.map(mapPublic);
 };
 return {listWorks:()=>searchWorks(),searchWorks,async getWork(id):Promise<PublicWorkDetailDto|null>{
  const {rows}=await db.query<Row>(`${selectPublic} AND w.id=$1`,[id]);
  return rows[0]?{...mapPublic(rows[0]),snapshot:projectPublicSnapshot(rows[0].public_snapshot)}:null;
 }};
}
