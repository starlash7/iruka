import {randomUUID} from 'node:crypto';
import type {Database} from '../db/index.ts';
import {authenticateRequest,type TokenVerifier} from '../core/auth.ts';
import {getOrCreateUser} from '../core/accounts.ts';
import {ApiError} from '../core/errors.ts';
import {jsonResponse,errorResponse,readJson,requireId} from '../core/http.ts';
import {createChatLibrary} from '../chat/library.ts';
import {createFavoritesService} from './favorites.ts';

export function createLibraryHandler({db,verifyToken}:{db:Database;verifyToken:TokenVerifier}){
 const library=createChatLibrary(db),favorites=createFavoritesService(db);
 return async(request:Request)=>{
  const requestId=randomUUID();
  try{
   const url=new URL(request.url),path=url.pathname.replace(/\/$/,''),method=request.method;
   const match=/^\/api\/me\/(chat-folders|favorites)(?:\/([^/]+))?$/.exec(path);
   if(!match)throw new ApiError('NOT_FOUND','경로를 찾을 수 없어요.');
   const identity=await authenticateRequest(request,verifyToken),user=await getOrCreateUser(db,identity.privyDid);
   const id=match[2]?requireId(match[2]):undefined;
   if(match[1]==='chat-folders'){
    if(!id&&method==='GET')return jsonResponse(await library.listFolders(user.id),requestId);
    if((!id&&method==='POST')||(id&&method==='PATCH'))return jsonResponse(await library.saveFolder(user.id,await readJson(request),id),requestId,id?200:201);
    if(id&&method==='DELETE'){await library.deleteFolder(user.id,id);return jsonResponse(null,requestId);}
   }else{
    if(id&&method==='GET')return jsonResponse(await favorites.get(user.id,id),requestId);
    if(id&&method==='PUT')return jsonResponse(await favorites.set(user.id,id,await readJson(request)),requestId);
    if(!id&&method==='GET'){
     const offset=Number(url.searchParams.get('offset')??0);
     if(!Number.isSafeInteger(offset)||offset<0||offset>10000)throw new ApiError('INVALID_REQUEST','목록 범위를 확인해 주세요.');
     return jsonResponse(await favorites.list(user.id,offset),requestId);
    }
   }
   throw new ApiError('NOT_FOUND','경로를 찾을 수 없어요.');
  }catch(error){return errorResponse(error,requestId);}
 };
}
