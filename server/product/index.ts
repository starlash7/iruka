import {randomUUID} from 'node:crypto';
import type {Database} from '../db/index.ts';
import {authenticateRequest,type TokenVerifier} from '../core/auth.ts';
import {getOrCreateUser} from '../core/accounts.ts';
import {jsonResponse,errorResponse} from '../core/http.ts';
import {createApiHandler} from '../app.ts';
import {createChatDatabase} from '../chat/database.ts';
import {createChatService,type ChatOptions} from '../chat/index.ts';
import {createCreditsService} from '../credits/index.ts';
import {createCreditsHandler} from '../credits/http.ts';
import {createDiscoveryService} from '../discover/index.ts';
import {createDiscoverHandler} from '../../api/discover/index.ts';
import {createStudioHandler} from '../../api/studio/handler.ts';
import {createChatApiHandler} from '../../api/chats/handler.ts';
import {createUnavailableServices,type ModelService} from '../core/interfaces.ts';
import {recoverExpiredTurns} from '../chat/recovery.ts';
import {runSummaryJobs} from '../chat/summarize.ts';
import type {ImageStorage} from '../media/storage.ts';
import {createLibraryHandler} from '../library/http.ts';

export interface ProductOptions extends ChatOptions {
 db:Database;verifyToken:TokenVerifier;model?:ModelService;
 imageStorage?:ImageStorage;
 /** Summary model calls need separate operator approval; lease recovery is always enabled. */
 runSummaries?:boolean;
 /** Explicit local/test fixture policy. Never read grant values from a request. */
 testGrant?:{amount:number;key:string};
}
export function createProduct(options:ProductOptions) {
 const db=createChatDatabase(options.db),credits=createCreditsService({db});
 const assets=async(versionId:string)=>{
  const {rows}=await db.query<{assets:Array<{code:string;url:string|null;label:string}>}>("SELECT private_config->'assets' AS assets FROM work_versions WHERE id=$1",[versionId]);
  return (rows[0]?.assets??[]).flatMap(asset=>asset.url?[{code:asset.code,url:asset.url,alt:asset.label}]:[]);
 };
 const stream=options.model?createChatService({db,credits,model:options.model},{...options,assets}):createUnavailableServices().stream;
 const discovery=createDiscoveryService({db});
 const shared={db,verifyToken:options.verifyToken};
 const chat=createChatApiHandler({...shared,stream,safety:options.safety});
 const studio=createStudioHandler({...shared,imageStorage:options.imageStorage}),discover=createDiscoverHandler(discovery);
 const creditHandler=createCreditsHandler({...shared,credits});
 const core=createApiHandler({...shared,stream,credits,discovery});
 const library=createLibraryHandler(shared);
 return {db,credits,async handler(request:Request):Promise<Response>{
  const path=new URL(request.url).pathname.replace(/\/$/,'');
  try{
   if(path==='/api/models'&&request.method==='GET')return jsonResponse(Object.entries(options.models??{}).map(([id,policy])=>({id,name:id==='test'?'테스트 모델':id,credits:policy.reservedCredits,available:!!options.model&&!!options.safety})),randomUUID());
   // Local integration grants are idempotent, independent of repeated balance reads.
   if(options.testGrant&&request.headers.has('authorization')){
    const identity=await authenticateRequest(request,options.verifyToken);
    const user=await getOrCreateUser(db,identity.privyDid);
    await credits.grantFreeCredits({userId:user.id,credits:options.testGrant.amount,grantKey:options.testGrant.key});
   }
   if(path==='/api/chats'||path.startsWith('/api/chats/'))return chat(request);
   if(path.startsWith('/api/studio/'))return studio(request);
   if(path==='/api/works'||path.startsWith('/api/works/')||path.startsWith('/api/discover/'))return discover(request);
   if(path.startsWith('/api/credits/'))return creditHandler(request);
   if(/^\/api\/me\/(chat-folders|favorites)(\/|$)/.test(path))return library(request);
   return core(request);
  }catch(error){return errorResponse(error,randomUUID());}
 },async maintain(){
  await recoverExpiredTurns(db,credits);
  if(options.runSummaries&&options.model&&options.safety)await runSummaryJobs({db,model:options.model,safety:options.safety});
 }};
}
