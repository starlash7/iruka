import {createServer} from 'node:http';
import {Readable} from 'node:stream';
import {once} from 'node:events';
/** Bridge Node streaming requests/responses without buffering SSE. */
export function createNodeServer(handler:(request:Request)=>Promise<Response>) {
 return createServer(async(req,res)=>{
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
  }catch{if(!res.headersSent)res.writeHead(500,{'content-type':'application/json'});res.end();}
 });
}
