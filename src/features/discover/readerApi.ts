import {createApiClient,type ApiClientOptions} from '../../shared/apiClient.ts';
import type {ChatDto,ChatEvent,CreditBalanceDto,MessageDto,PersonaDto,PublicWorkDetailDto,PublicWorkDto,TurnRequest} from '../../shared/contracts.ts';
export interface WorkQuery {query?:string;tag?:string;mode?:string;offset?:number}
export interface ChatSummary {chat:ChatDto;title:string;preview:string;coverUrl:string|null}
export interface ReaderMessage extends MessageDto {images?:{url:string;alt:string}[];status?:string;ending?:{id:string;title:string}|null}
export interface ChatView {chat:ChatDto;title:string;messages:ReaderMessage[];memo:string;guide:string;suggestedReplies:string[];pendingTurn?:{id:string;status:string}|null}
export interface ModelOption {id:string;name:string;credits:number|null;available:boolean}
export interface ReaderApi {
 loadImage?(url:string,signal?:AbortSignal):Promise<Blob>;
 listWorks(query?:WorkQuery):Promise<PublicWorkDto[]>;
 getWork(id:string):Promise<PublicWorkDetailDto>;
 getRanking():Promise<PublicWorkDto[]>;
 listChats():Promise<ChatSummary[]>;
 listPersonas():Promise<PersonaDto[]>;
 getModels():Promise<ModelOption[]>;
 getBalance():Promise<CreditBalanceDto>;
 startChat(input:{workId:string;openingId:string;personaId:string|null;model:string}):Promise<ChatDto>;
 getChat(id:string):Promise<ChatView>;
 saveMemo(id:string,memo:string):Promise<void>;
 editMessage(chatId:string,messageId:string,content:string):Promise<ChatView>;
 deleteMessage(chatId:string,messageId:string):Promise<ChatView>;
 selectBranch(chatId:string,messageId:string|null):Promise<ChatView>;
 branchChat?(chatId:string,messageId:string):Promise<ChatView>;
 streamTurn(id:string,body:TurnRequest,options:{idempotencyKey:string;signal?:AbortSignal}):AsyncIterable<ChatEvent>;
}
/** Unavailable endpoints fail explicitly until A/D and the common owner mount them. */
export function createReaderApi(options:ApiClientOptions):ReaderApi{
 const client=createApiClient(options);
 const publicClient=createApiClient({...options,getAccessToken:async()=>null});
 const read=async<T,>(path:string,init?:RequestInit)=>(await client.request<T>(path,init)).data;
 const readPublic=async<T,>(path:string)=>(await publicClient.request<T>(path)).data;
 const json=(method:string,body:unknown):RequestInit=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const chatPath=(id:string)=>`/api/chats/${encodeURIComponent(id)}`;
 return {
  loadImage:client.image,
  listWorks(query={}){const params=new URLSearchParams();if(query.query)params.set('q',query.query);if(query.tag)params.set('tag',query.tag);if(query.mode)params.set('mode',query.mode);if(query.offset)params.set('offset',String(query.offset));return readPublic(`/api/discover/works?${params}`);},
  getWork:id=>readPublic(`/api/works/${encodeURIComponent(id)}`),getRanking:()=>readPublic('/api/discover/ranking'),
  listChats:()=>read('/api/chats'),listPersonas:()=>read('/api/me/personas'),getModels:()=>read('/api/models'),getBalance:()=>read('/api/me/credits'),
  startChat:async input=>(await read<{chat:ChatDto}>('/api/chats',json('POST',input))).chat,getChat:id=>read(`${chatPath(id)}/view`),
  saveMemo:async(id,memo)=>{await read(`${chatPath(id)}/memo`,json('PUT',{memo}));},
  editMessage:async(id,messageId,content)=>{await read(`${chatPath(id)}/messages/${encodeURIComponent(messageId)}`,json('PATCH',{content}));return read(`${chatPath(id)}/view`);},
  deleteMessage:async(id,messageId)=>{await read(`${chatPath(id)}/messages/${encodeURIComponent(messageId)}`,{method:'DELETE'});return read(`${chatPath(id)}/view`);},
  selectBranch:async(id,messageId)=>{await read(`${chatPath(id)}/select`,json('POST',{messageId}));return read(`${chatPath(id)}/view`);},
  branchChat:async(id,messageId)=>{const result=await read<{chat:ChatDto}>(`${chatPath(id)}/branch`,json('POST',{messageId}));return read(`${chatPath(result.chat.id)}/view`);},streamTurn:client.streamTurn,
 };
}
