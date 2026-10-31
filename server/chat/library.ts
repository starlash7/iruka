import type {Database} from '../db/index.ts';
import {ApiError} from '../core/errors.ts';
import {requireId} from '../core/http.ts';
import {loadChat} from './repository.ts';
import type {ChatFolderDto} from '../../src/shared/contracts.ts';

export interface ChatListQuery {workId?:string;folderId?:string;offset?:number;limit?:number}
export function parseChatQuery(params:URLSearchParams):ChatListQuery {
 const offset=Number(params.get('offset')??0),limit=Number(params.get('limit')??50);
 if(!Number.isSafeInteger(offset)||offset<0||offset>10000||!Number.isSafeInteger(limit)||limit<1||limit>100)throw new ApiError('INVALID_REQUEST','목록 범위를 확인해 주세요.');
 const workId=params.get('workId')||undefined,folderId=params.get('folderId')||undefined;
 if(workId)requireId(workId);if(folderId&&folderId!=='unfiled')requireId(folderId);
 return {offset,limit,workId,folderId};
}
function parseName(value:unknown,max:number){
 if(typeof value!=='string'||!value.trim()||value.length>max)throw new ApiError('INVALID_REQUEST',`이름은 1~${max}자로 입력해 주세요.`);
 return value.trim();
}
async function requireFolder(db:Database,userId:string,id:string,lock=false){
 requireId(id);
 const row=(await db.query<ChatFolderDto>(`SELECT id,name FROM chat_folders WHERE id=$1 AND user_id=$2${lock?' FOR UPDATE':' FOR KEY SHARE'}`,[id,userId])).rows[0];
 if(!row)throw new ApiError('NOT_FOUND','폴더를 찾을 수 없어요.');return row;
}
export function createChatLibrary(db:Database){
 return {
  async listFolders(userId:string){return (await db.query<ChatFolderDto>('SELECT id,name FROM chat_folders WHERE user_id=$1 ORDER BY created_at,id',[userId])).rows;},
  async saveFolder(userId:string,input:Record<string,unknown>,id?:string){
   if(Object.keys(input).some(key=>key!=='name'))throw new ApiError('INVALID_REQUEST','폴더 항목을 확인해 주세요.');
   const name=parseName(input.name,50);
   try{return await db.transaction(async tx=>{
    if(id){await requireFolder(tx,userId,id,true);return (await tx.query<ChatFolderDto>('UPDATE chat_folders SET name=$3 WHERE id=$1 AND user_id=$2 RETURNING id,name',[id,userId,name])).rows[0];}
    return (await tx.query<ChatFolderDto>('INSERT INTO chat_folders(user_id,name) VALUES($1,$2) RETURNING id,name',[userId,name])).rows[0];
   });}catch(error){if((error as {code?:string}).code==='23505')throw new ApiError('CONFLICT','같은 이름의 폴더가 있어요.');throw error;}
  },
  async deleteFolder(userId:string,id:string){
   await db.transaction(async tx=>{await requireFolder(tx,userId,id,true);await tx.query('UPDATE chats SET folder_id=NULL WHERE user_id=$1 AND folder_id=$2',[userId,id]);await tx.query('DELETE FROM chat_folders WHERE id=$1 AND user_id=$2',[id,userId]);});
  },
  async updateChat(userId:string,id:string,input:Record<string,unknown>){
   if(!Object.keys(input).length||Object.keys(input).some(key=>!['title','folderId'].includes(key)))throw new ApiError('INVALID_REQUEST','대화 항목을 확인해 주세요.');
   const title=input.title===undefined?undefined:input.title===null?null:parseName(input.title,80);
   if(input.folderId!==undefined&&input.folderId!==null)requireId(input.folderId);
   await db.transaction(async tx=>{
    if(typeof input.folderId==='string')await requireFolder(tx,userId,input.folderId);
    await loadChat(tx,userId,id,true);
    if(title!==undefined)await tx.query('UPDATE chats SET title=$3 WHERE id=$1 AND user_id=$2',[id,userId,title]);
    if(input.folderId!==undefined)await tx.query('UPDATE chats SET folder_id=$3 WHERE id=$1 AND user_id=$2',[id,userId,input.folderId]);
   });
  }
 };
}
