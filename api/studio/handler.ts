import {randomUUID} from 'node:crypto';
import type {Database} from '../../server/db/index.ts';
import {authenticateRequest,type TokenVerifier} from '../../server/core/auth.ts';
import {getOrCreateUser} from '../../server/core/accounts.ts';
import {ApiError} from '../../server/core/errors.ts';
import {jsonResponse,errorResponse,requireId} from '../../server/core/http.ts';
import {createStudioService} from '../../server/studio/index.ts';
import type {ImageStorage} from '../../server/media/storage.ts';
import {createMediaService} from '../../server/media/index.ts';
import {readImageBody} from '../../server/media/png.ts';
import {validateDraft} from '../../server/studio/validate.ts';
/** Mount before the common handler for /api/studio/* only. Not a deployment adapter. */
export function createStudioHandler({db,verifyToken,imageStorage}:{db:Database;verifyToken:TokenVerifier;imageStorage?:ImageStorage}) {
 const service=createStudioService({db});
 const media=imageStorage?createMediaService({db,storage:imageStorage}):null;
 return async(request:Request)=>{
  const requestId=randomUUID();
  try {
   const path=new URL(request.url).pathname.replace(/\/$/,'');
   const imageMatch=/^\/api\/studio\/media\/([^/]+)\/([a-f0-9]{64})$/.exec(path);
   if(imageMatch&&request.method==='GET'){
    if(!media)throw new ApiError('SERVICE_UNAVAILABLE','이미지 저장소가 연결되지 않았어요.');
    const identity=request.headers.has('authorization')?await authenticateRequest(request,verifyToken):null;
    const user=identity?await getOrCreateUser(db,identity.privyDid):null;
    const bytes=await media.readImage(user?.id??null,imageMatch[1],imageMatch[2]);
    return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});
   }
   const slotMatch=/^\/api\/studio\/works\/([^/]+)\/assets\/([^/]+)\/image$/.exec(path);
   if(slotMatch&&request.method==='POST'){
    const identity=await authenticateRequest(request,verifyToken),user=await getOrCreateUser(db,identity.privyDid);
    const workId=requireId(slotMatch[1]),assetId=requireId(slotMatch[2]);
    await service.getWork(user.id,workId);
    if(!media)throw new ApiError('SERVICE_UNAVAILABLE','이미지 저장소가 연결되지 않았어요. 작성한 내용은 유지돼요.');
    return jsonResponse(await media.uploadAssetImage(user.id,workId,assetId,await readImageBody(request)),requestId,201);
   }
   const match=/^\/api\/studio\/works(?:\/([^/]+)(?:\/(publish|assets|images))?)?$/.exec(path);
   if(!match)throw new ApiError('NOT_FOUND','경로를 찾을 수 없어요.');
   const identity=await authenticateRequest(request,verifyToken);
   const user=await getOrCreateUser(db,identity.privyDid);
   const id=match[1]?requireId(match[1]):undefined;const action=match[2];
   if(request.method==='GET'&&!action)return jsonResponse(id?await service.getWork(user.id,id):await service.listWorks(user.id),requestId);
   if(!['POST','PUT'].includes(request.method))throw new ApiError('NOT_FOUND','경로를 찾을 수 없어요.');
   if(id&&action==='images'&&request.method==='POST'){
    await service.getWork(user.id,id);
    if(!media)throw new ApiError('SERVICE_UNAVAILABLE','이미지 저장소가 연결되지 않았어요. 작성한 내용은 유지돼요.');
    return jsonResponse(await media.uploadImage(user.id,id,await readImageBody(request)),requestId,201);
   }
   const body=await readStudioJson(request);
   if(!id&&request.method==='POST'){
    if('id' in body||'revision' in body)throw new ApiError('INVALID_REQUEST','새 작품 요청을 확인해 주세요.');
    return jsonResponse(await service.saveDraft(user.id,validateDraft(body)),requestId,201);
   }
   if(id&&!action&&request.method==='PUT'){
    if(!Number.isSafeInteger(body.revision)||Number(body.revision)<1)throw new ApiError('INVALID_REQUEST','저장 버전을 확인해 주세요.');
    if(body.id!==id)throw new ApiError('INVALID_REQUEST','작품 ID가 일치하지 않아요.');
    return jsonResponse(await service.saveDraft(user.id,validateDraft(body)),requestId);
   }
   if(id&&action==='publish'&&request.method==='POST'){
    if(Object.keys(body).some(k=>k!=='revision')||!Number.isSafeInteger(body.revision)||Number(body.revision)<1)throw new ApiError('INVALID_REQUEST','저장 버전을 확인해 주세요.');
    return jsonResponse(await service.publishVersion(user.id,id,Number(body.revision)),requestId,201);
   }
   if(id&&action==='assets'&&request.method==='POST'){
    if(Object.keys(body).some(k=>!['code','label'].includes(k)))throw new ApiError('INVALID_REQUEST','자산 입력을 확인해 주세요.');
    return jsonResponse(await service.createAsset(user.id,id,body as {code:string;label:string}),requestId,201);
   }
   throw new ApiError('NOT_FOUND','경로를 찾을 수 없어요.');
  } catch(error){return errorResponse(error,requestId);}
 };
}
// A full 100-entry work exceeds the common chat-sized 32 KiB limit.
async function readStudioJson(request:Request):Promise<Record<string,unknown>> {
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new ApiError('INVALID_REQUEST','JSON 요청이 필요해요.');
 const reader=request.body?.getReader();if(!reader)throw new ApiError('INVALID_REQUEST','본문이 필요해요.');
 const chunks:Uint8Array[]=[];let size=0;
 try {
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1048576){await reader.cancel();throw new Error('size');}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const body:unknown=JSON.parse(new TextDecoder().decode(bytes));
  if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('object');return body as Record<string,unknown>;
 }catch{throw new ApiError('INVALID_REQUEST','본문은 1 MiB 이내 JSON 객체여야 해요.');}finally{reader.releaseLock();}
}
