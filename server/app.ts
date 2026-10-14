import {randomUUID} from 'node:crypto';
import type {Database} from './db/index.ts';
import {authenticateRequest,type TokenVerifier} from './core/auth.ts';
import {ApiError} from './core/errors.ts';
import {jsonResponse,errorResponse,readJson,requireText,requireId} from './core/http.ts';
import {getOrCreateUser,listPersonas} from './core/accounts.ts';
import {getPublicWork,getCreatorWork,projectPublicWork} from './core/works.ts';
import {getOwnedChat,createChat} from './core/chats.ts';
import {createEventResponse} from './core/sse.ts';
import type {StreamService,CreditsService,DiscoveryService} from './core/interfaces.ts';
export interface ApiDependencies {db:Database;verifyToken:TokenVerifier;stream?:StreamService;credits?:CreditsService;discovery?:DiscoveryService}
/** A–D inject implementations at construction; no environment-controlled auth bypass. */
export function createApiHandler({db,verifyToken,stream,credits,discovery}:ApiDependencies) {
 return async (request:Request):Promise<Response>=>{
  const requestId=randomUUID();
  try{
   const path=new URL(request.url).pathname.replace(/\/$/,''); const method=request.method;
   if(path==='/api/health'&&method==='GET')return jsonResponse({status:'ok'},requestId);
   if(path==='/api/works'&&method==='GET'){
    if(!discovery)throw new ApiError('SERVICE_UNAVAILABLE','탐색 서비스를 준비 중이에요.');
    return jsonResponse((await discovery.listWorks()).map(projectPublicWork),requestId);
   }
   const publicMatch=/^\/api\/works\/([^/]+)$/.exec(path);
   if(publicMatch&&method==='GET')return jsonResponse(await getPublicWork(db,requireId(publicMatch[1])),requestId);
   const identity=await authenticateRequest(request,verifyToken);
   const user=await getOrCreateUser(db,identity.privyDid);
   if((path==='/api/auth/session'||path==='/api/me')&&method==='GET')return jsonResponse(user,requestId);
   if(path==='/api/me/personas'){
    if(method==='GET')return jsonResponse(await listPersonas(db,user.id),requestId);
    if(method==='POST'){
     const body=await readJson(request);const name=requireText(body.name,50);
     const description=body.description===undefined?'':body.description;
     if(typeof description!=='string'||description.length>500)throw new ApiError('INVALID_REQUEST','소개는 500자 이내로 입력해 주세요.');
     const {rows}=await db.query<{id:string}>('INSERT INTO personas(user_id,name,profile) VALUES($1,$2,$3) RETURNING id',[user.id,name,JSON.stringify({description})]);
     return jsonResponse((await listPersonas(db,user.id)).find(p=>p.id===rows[0].id),requestId,201);
    }
   }
   const creatorMatch=/^\/api\/studio\/works\/([^/]+)$/.exec(path);
   if(creatorMatch&&method==='GET')return jsonResponse(await getCreatorWork(db,requireId(creatorMatch[1]),user.id),requestId);
   if(path==='/api/chats'&&method==='POST')return jsonResponse(await createChat(db,user.id,await readJson(request)),requestId,201);
   const chatMatch=/^\/api\/chats\/([^/]+)(\/turns)?$/.exec(path);
   if(chatMatch){
    const chat=await getOwnedChat(db,requireId(chatMatch[1]),user.id);
    if(!chatMatch[2]&&method==='GET')return jsonResponse(chat,requestId);
    if(chatMatch[2]&&method==='POST'){
     const idempotencyKey=requireText(request.headers.get('idempotency-key'),200);
     const body=await readJson(request),content=requireText(body.content,8000),model=requireText(body.model,50);
     const parentMessageId=body.parentMessageId==null?null:requireId(body.parentMessageId);
     if(parentMessageId){const parent=await db.query('SELECT id FROM messages WHERE id=$1 AND chat_id=$2',[parentMessageId,chat.id]);if(!parent.rows.length)throw new ApiError('NOT_FOUND','메시지를 찾을 수 없어요.');}
     if(!stream)throw new ApiError('SERVICE_UNAVAILABLE','대화 서버를 준비 중이에요.');
     return await createEventResponse(stream,{userId:user.id,chatId:chat.id,requestId,idempotencyKey,body:{content,parentMessageId,model},signal:request.signal});
    }
   }
   if(path==='/api/me/credits'&&method==='GET'){
    if(!credits)throw new ApiError('SERVICE_UNAVAILABLE','크레딧 서비스를 준비 중이에요.');
    return jsonResponse(await credits.getBalance(user.id),requestId);
   }
   throw new ApiError('NOT_FOUND','경로를 찾을 수 없어요.');
  }catch(error){return errorResponse(error,requestId);}
 };
}
