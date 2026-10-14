import {randomUUID} from 'node:crypto';
import type {Database} from '../../server/db/index.ts';
import {authenticateRequest,type TokenVerifier} from '../../server/core/auth.ts';
import {getOrCreateUser} from '../../server/core/accounts.ts';
import {ApiError} from '../../server/core/errors.ts';
import {jsonResponse,errorResponse,readJson,requireText,requireId} from '../../server/core/http.ts';
import {createEventResponse} from '../../server/core/sse.ts';
import type {StreamService} from '../../server/core/interfaces.ts';
import {createConversationService} from '../../server/chat/conversations.ts';
import {createMemoryService} from '../../server/chat/memory.ts';
import type {SafetyService} from '../../server/chat/safety.ts';
interface Dependencies {db:Database;verifyToken:TokenVerifier;stream:StreamService;safety?:SafetyService}
/** Opt-in handler; shared router/dev composition is owned by the integration task. */
export function createChatApiHandler({db,verifyToken,stream,safety}:Dependencies) {
  const conversations=createConversationService(db,safety),memory=createMemoryService(db,safety);
  return async (request:Request):Promise<Response>=>{
    const requestId=randomUUID();
    try{
      const path=new URL(request.url).pathname.replace(/\/$/,''),method=request.method;
      const match=/^\/api\/chats(?:\/([^/]+))?(?:\/(turns|messages|memories|branch|select|summaries))?(?:\/([^/]+))?$/.exec(path);
      if(!match)throw new ApiError('NOT_FOUND','경로를 찾을 수 없어요.');
      const identity=await authenticateRequest(request,verifyToken),user=await getOrCreateUser(db,identity.privyDid);
      if(!match[1]&&method==='POST')return jsonResponse(await conversations.startChat(user.id,await readJson(request)),requestId,201);
      const chatId=requireId(match[1]),resource=match[2],id=match[3]?requireId(match[3]):undefined;
      // Authenticate and verify ownership before validating any child resource.
      await conversations.getChat(user.id,chatId);
      if(!resource){
        if(method==='GET')return jsonResponse(await conversations.getChat(user.id,chatId),requestId);
        if(method==='DELETE'){await conversations.deleteChat(user.id,chatId);return jsonResponse({deleted:true},requestId);}
      }
      if(resource==='turns'){
        if(method==='GET'&&id)return jsonResponse(await conversations.getTurn(user.id,chatId,id),requestId);
        if(method==='POST'&&!id){
          const body=await readJson(request),content=requireText(body.content,8000),model=requireText(body.model,50);
          const parentMessageId=body.parentMessageId==null?null:requireId(body.parentMessageId);
          return await createEventResponse(stream,{userId:user.id,chatId,requestId,idempotencyKey:requireText(request.headers.get('idempotency-key'),200),body:{content,model,parentMessageId},signal:request.signal});
        }
      }
      if(resource==='messages'&&id){
        if(method==='PATCH'){const body=await readJson(request);return jsonResponse(await conversations.editMessage(user.id,chatId,id,requireText(body.content,8000)),requestId);}
        if(method==='DELETE')return jsonResponse(await conversations.deleteMessage(user.id,chatId,id),requestId);
      }
      if((resource==='branch'||resource==='select')&&method==='POST'&&!id){
        const body=await readJson(request),messageId=requireId(body.messageId);
        return jsonResponse(resource==='branch'?await conversations.branchChat(user.id,chatId,messageId):await conversations.selectMessage(user.id,chatId,messageId),requestId,resource==='branch'?201:200);
      }
      if(resource==='memories'){
        if(method==='GET'&&!id)return jsonResponse(await memory.listMemories(user.id,chatId),requestId);
        if((method==='POST'&&!id)||(method==='PATCH'&&id)){
          const body=await readJson(request);return jsonResponse(await memory.savePinned(user.id,chatId,requireText(body.content,4000),id),requestId,id?200:201);
        }
        if(method==='DELETE'&&id){await memory.deletePinned(user.id,chatId,id);return jsonResponse({deleted:true},requestId);}
      }
      if(resource==='summaries'&&method==='POST'&&!id){const body=await readJson(request);return jsonResponse(await memory.enqueueSummary(user.id,chatId,requireId(body.messageId)),requestId,202);}
      throw new ApiError('NOT_FOUND','경로를 찾을 수 없어요.');
    }catch(error){return errorResponse(error,requestId);}
  };
}
