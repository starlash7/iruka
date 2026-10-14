import {randomUUID} from 'node:crypto';
import {ApiError} from '../../server/core/errors.ts';
import {errorResponse,jsonResponse,requireId} from '../../server/core/http.ts';
import type {createDiscoveryService} from '../../server/discover/index.ts';
/** Mount before the shared router. No provider, auth or deployment configuration here. */
export function createDiscoverHandler(service:ReturnType<typeof createDiscoveryService>) {
 return async (request:Request):Promise<Response>=>{
  const requestId=randomUUID();
  try {
   const url=new URL(request.url);
   if(request.method!=='GET')throw new ApiError('NOT_FOUND','경로를 찾을 수 없어요.');
   if(['/api/works','/api/discover/works'].includes(url.pathname)){
    const mode=url.searchParams.get('mode');
    if(mode&&mode!=='character'&&mode!=='story')throw new ApiError('INVALID_REQUEST','작품 유형을 확인해 주세요.');
    const offset=Number(url.searchParams.get('offset')??0);
    if(!Number.isInteger(offset)||offset<0||offset>10000)throw new ApiError('INVALID_REQUEST','페이지를 확인해 주세요.');
    return jsonResponse(await service.searchWorks({query:url.searchParams.get('q')??'',tag:url.searchParams.get('tag')??'',mode:mode==='character'||mode==='story'?mode:undefined,offset}),requestId);
   }
   const match=/^\/api\/works\/([^/]+)$/.exec(url.pathname);
   if(match){const work=await service.getWork(requireId(match[1]));if(work)return jsonResponse(work,requestId);}
   throw new ApiError('NOT_FOUND','작품을 찾을 수 없어요.');
  }catch(error){return errorResponse(error,requestId);}
 };
}
