import {createServer} from 'node:http';
import {Readable} from 'node:stream';
import {once} from 'node:events';
import {randomUUID} from 'node:crypto';
import {ApiError} from './core/errors.ts';
import {errorResponse} from './core/http.ts';
import {apiSecurityHeaders} from './security/headers.ts';
import {createRequestGuard,type RequestLimits} from './security/requestGuard.ts';
export interface HttpSecurityOptions {allowedOrigins?:readonly string[];limits?:Partial<RequestLimits>}

/** Bridge Node streaming requests/responses without buffering SSE. */
export function createNodeServer(handler:(request:Request)=>Promise<Response>,options:HttpSecurityOptions={}) {
 const guard=createRequestGuard(options.limits);
 const allowedOrigins=new Set(options.allowedOrigins??[]);
 for(const origin of allowedOrigins)if(new URL(origin).origin!==origin||!/^https?:/.test(origin))throw new Error('Invalid allowed origin');
 const server=createServer({requestTimeout:30000,headersTimeout:10000,connectionsCheckingInterval:1000,maxHeaderSize:16384},async(req,res)=>{
  for(const [name,value] of Object.entries(apiSecurityHeaders))res.setHeader(name,value);
  const reject=async(error:ApiError,retryAfter?:number)=>{
   const response=errorResponse(error,randomUUID());
   res.setHeader('Connection','close');if(retryAfter)res.setHeader('Retry-After',retryAfter);
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());req.resume();
  };
  // Browser origins must be explicitly allowed. Bearer clients without Origin still authenticate normally.
  if(req.headers.origin&&!allowedOrigins.has(req.headers.origin)){await reject(new ApiError('FORBIDDEN','허용되지 않은 요청 출처예요.'));return;}
  const length=req.headers['content-length'];
  if(length&&(!/^\d+$/.test(length)||Number(length)>5*1024*1024)){await reject(new ApiError('PAYLOAD_TOO_LARGE','요청이 너무 커요.'));return;}
  const admission=guard.acquire(req.socket.remoteAddress??'unknown',req.method??'GET');
  if(!admission.allowed){await reject(new ApiError('RATE_LIMITED','요청이 많아요. 잠시 후 다시 시도해 주세요.'),admission.retryAfter);return;}
  const controller=new AbortController();
  res.on('close',()=>{if(!res.writableEnded)controller.abort();});
  try{
   const headers=new Headers();for(const [name,value] of Object.entries(req.headers)){if(value)headers.set(name,Array.isArray(value)?value.join(','):value);}
   const init:RequestInit & {duplex?:'half'}={method:req.method,headers,signal:controller.signal};
   if(req.method!=='GET'&&req.method!=='HEAD'){init.body=Readable.toWeb(req) as ReadableStream<Uint8Array>;init.duplex='half';}
   const response=await handler(new Request(`http://127.0.0.1${req.url}`,init));
   if(controller.signal.aborted||res.destroyed){await response.body?.cancel().catch(()=>{});return;}
   res.writeHead(response.status,Object.fromEntries(response.headers));
   if(response.body){
    const reader=response.body.getReader();
    const cancel=()=>void reader.cancel().catch(()=>{});controller.signal.addEventListener('abort',cancel,{once:true});
    let finished=false;
    try {for(;;){const {done,value}=await reader.read();if(done){finished=true;break;}if(res.destroyed)break;if(!res.write(value))await once(res,'drain',{signal:controller.signal});}}
    finally{controller.signal.removeEventListener('abort',cancel);if(!finished)await reader.cancel().catch(()=>{});reader.releaseLock();}
   }
   res.end();
  }catch{if(!res.headersSent){const response=errorResponse(new ApiError('INTERNAL_ERROR','요청을 처리하지 못했어요.'),randomUUID());res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());}else res.end();}
  finally{admission.release();}
 });
 server.maxConnections=128;
 server.maxHeadersCount=64;
 server.maxRequestsPerSocket=100;
 server.keepAliveTimeout=5000;
 return server;
}
