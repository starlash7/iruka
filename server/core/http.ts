import { ApiError, toApiError } from './errors.ts';
export function jsonResponse(data: unknown, requestId: string, status = 200) {
  return new Response(JSON.stringify({data,requestId}),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-request-id':requestId}});
}
export function errorResponse(error: unknown, requestId: string) {
  const safe = toApiError(error);
  return new Response(JSON.stringify({error:{code:safe.code,message:safe.message},requestId}),{status:safe.status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-request-id':requestId}});
}
export async function readJson(request: Request, maxBytes = 32768): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new ApiError('INVALID_REQUEST','JSON 요청이 필요해요.');
  const reader=request.body?.getReader();
  if (!reader) throw new ApiError('INVALID_REQUEST','요청 본문이 필요해요.');
  let size=0; const chunks:Uint8Array[]=[];
  try {
    for (;;) { const {done,value}=await reader.read(); if(done) break; size+=value.length; if(size>maxBytes){await reader.cancel();throw new ApiError('INVALID_REQUEST','요청이 너무 커요.');} chunks.push(value); }
    const bytes=new Uint8Array(size); let offset=0; for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    const value:unknown=JSON.parse(new TextDecoder().decode(bytes));
    if (!value || typeof value!=='object' || Array.isArray(value)) throw new Error('object required');
    return value as Record<string,unknown>;
  } catch(error) { if(error instanceof ApiError) throw error; throw new ApiError('INVALID_REQUEST','올바른 JSON 요청이 필요해요.'); }
  finally {reader.releaseLock();}
}
export function requireText(value: unknown, max: number): string {
  if(typeof value!=='string'||!value.trim()||value.length>max) throw new ApiError('INVALID_REQUEST','입력값을 확인해 주세요.');
  return value.trim();
}
export function requireId(value: unknown): string {
  if(typeof value!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new ApiError('INVALID_REQUEST','식별자를 확인해 주세요.');
  return value;
}
