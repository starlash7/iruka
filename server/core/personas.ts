import type {Database} from '../db/index.ts';
import type {PersonaDto} from '../../src/shared/contracts.ts';
import {ApiError} from './errors.ts';
import {requireText} from './http.ts';

export function parsePersonaInput(body:Record<string,unknown>) {
 const name=requireText(body.name,50),description=body.description===undefined?'':body.description;
 if(typeof description!=='string'||description.length>500)throw new ApiError('INVALID_REQUEST','소개는 500자 이내로 입력해 주세요.');
 return {name,description};
}
export async function updatePersona(db:Database,userId:string,id:string,body:Record<string,unknown>):Promise<PersonaDto> {
 const {name,description}=parsePersonaInput(body);
 const {rows}=await db.query<{id:string;created_at:Date}>(`UPDATE personas SET name=$3,profile=$4
  WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL RETURNING id,created_at`,[id,userId,name,JSON.stringify({description})]);
 if(!rows[0])throw new ApiError('NOT_FOUND','페르소나를 찾을 수 없어요.');
 return {id,userId,name,description,createdAt:new Date(rows[0].created_at).toISOString()};
}
export async function deletePersona(db:Database,userId:string,id:string):Promise<void> {
 // Keep the referenced row and pinned snapshots; exclude it from future selection.
 const {rows}=await db.query('UPDATE personas SET deleted_at=now() WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL RETURNING id',[id,userId]);
 if(!rows.length)throw new ApiError('NOT_FOUND','페르소나를 찾을 수 없어요.');
}
