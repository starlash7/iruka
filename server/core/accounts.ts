import type { Database } from '../db/index.ts';
import type { UserDto,PersonaDto } from '../../src/shared/contracts.ts';
export async function getOrCreateUser(db:Database,privyDid:string):Promise<UserDto> {
 const {rows}=await db.query<{id:string;privy_did:string;created_at:Date}>(`INSERT INTO users(privy_did) VALUES($1) ON CONFLICT(privy_did) DO UPDATE SET privy_did=EXCLUDED.privy_did RETURNING id,privy_did,created_at`,[privyDid]);
 const row=rows[0]; return {id:row.id,privyDid:row.privy_did,displayName:null,createdAt:new Date(row.created_at).toISOString()};
}
export async function listPersonas(db:Database,userId:string):Promise<PersonaDto[]> {
 const {rows}=await db.query<{id:string;name:string;profile:{description?:string};created_at:Date}>(`SELECT id,name,profile,created_at FROM personas WHERE user_id=$1 ORDER BY created_at,id`,[userId]);
 return rows.map(row=>({id:row.id,userId,name:row.name,description:row.profile.description??'',createdAt:new Date(row.created_at).toISOString()}));
}
