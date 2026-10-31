import type {ReaderApi,ChatView} from '../readerApi';
import type {ChatDto,ChatEvent,ChatFolderDto,MessageDto} from '../../../shared/contracts';
import {fixtureWorks} from './works';
export function createDevelopmentApi({storage,delay=70}:{storage?:Storage;delay?:number}={}):ReaderApi{
 const key='iruka-reader-development-v1';let chats:ChatView[]=[];
 try{chats=JSON.parse(storage?.getItem(key)??'[]');if(!Array.isArray(chats))chats=[];}catch{chats=[];}
 let available=Number(storage?.getItem(`${key}-credits`)??30);if(!Number.isFinite(available)||available<0)available=30;
 const persist=()=>{storage?.setItem(key,JSON.stringify(chats));storage?.setItem(`${key}-credits`,String(available));};
 const copy=<T,>(value:T):T=>structuredClone(value);
 const find=(id:string)=>{const view=chats.find(item=>item.chat.id===id);if(!view)throw new Error('대화를 찾을 수 없어요.');return view;};
 const wait=(signal?:AbortSignal)=>new Promise<void>((resolve,reject)=>{signal?.throwIfAborted();const abort=()=>{clearTimeout(timer);reject(new DOMException('중단됨','AbortError'));};const timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve();},delay);signal?.addEventListener('abort',abort,{once:true});});
 const responses=new Map<string,{body:string;events:ChatEvent[]}>();
 const folders:ChatFolderDto[]=[];const favorites=new Set<string>();
 const titles=new Map<string,string>(),chatFolders=new Map<string,string|null>();
 const libraryKey=`${key}-library`;
 try{const value=JSON.parse(storage?.getItem(libraryKey)??'{}');
  if(Array.isArray(value.folders))folders.push(...value.folders.filter((item:ChatFolderDto)=>typeof item?.id==='string'&&typeof item?.name==='string'));
  if(Array.isArray(value.favorites))for(const id of value.favorites)if(typeof id==='string')favorites.add(id);
  if(Array.isArray(value.titles))for(const entry of value.titles)if(Array.isArray(entry)&&typeof entry[0]==='string'&&typeof entry[1]==='string')titles.set(entry[0],entry[1]);
  if(Array.isArray(value.chatFolders))for(const entry of value.chatFolders)if(Array.isArray(entry)&&typeof entry[0]==='string'&&(typeof entry[1]==='string'||entry[1]===null))chatFolders.set(entry[0],entry[1]);
 }catch{/* Existing development conversation storage remains untouched. */}
 const persistLibrary=()=>storage?.setItem(libraryKey,JSON.stringify({folders,favorites:[...favorites],titles:[...titles],chatFolders:[...chatFolders]}));
 const activity=(view:ChatView)=>view.messages.at(-1)?.createdAt??view.chat.createdAt;
 return {
  async listWorks({query='',tag='',mode='',offset=0}={}){await wait();return copy(fixtureWorks.filter(work=>(!query||`${work.title} ${work.description}`.includes(query))&&(!tag||work.tags.includes(tag))&&(!mode||work.mode===mode)).slice(offset,offset+60));},
  async getWork(id){await wait();const work=fixtureWorks.find(item=>item.id===id);if(!work)throw new Error('작품을 찾을 수 없어요.');return copy(work);},
  async getRanking(){await wait();return [];},
  async listChats({workId,folderId,offset=0,limit=50}={}){await wait();return copy(chats.filter(view=>(!workId||view.chat.workId===workId)&&(!folderId||(folderId==='unfiled'?!chatFolders.get(view.chat.id):chatFolders.get(view.chat.id)===folderId))).sort((a,b)=>Date.parse(activity(b))-Date.parse(activity(a))).slice(offset,offset+limit).map(view=>({chat:view.chat,title:titles.get(view.chat.id)??view.title,folderId:chatFolders.get(view.chat.id)??null,updatedAt:activity(view),preview:view.messages.at(-1)?.content??'',coverUrl:null})));},
  async listFolders(){return copy(folders);},
  async saveFolder(name,id){const folder=id?folders.find(item=>item.id===id):undefined;if(id&&!folder)throw new Error('폴더를 찾을 수 없어요.');if(folder)folder.name=name;else folders.push({id:crypto.randomUUID(),name});persistLibrary();return copy(folder??folders.at(-1)!);},
  async deleteFolder(id){const index=folders.findIndex(item=>item.id===id);if(index>=0)folders.splice(index,1);for(const [chatId,folder] of chatFolders)if(folder===id)chatFolders.set(chatId,null);persistLibrary();},
  async updateChat(id,input){const view=find(id);if(input.title!==undefined){if(input.title===null)titles.delete(id);else titles.set(id,input.title);}if(input.folderId!==undefined)chatFolders.set(id,input.folderId);persistLibrary();return {...copy(view),title:titles.get(id)??view.title};},
  async deleteChat(id){find(id);chats=chats.filter(item=>item.chat.id!==id);titles.delete(id);chatFolders.delete(id);persistLibrary();persist();},
  async listFavorites(offset=0){return copy(fixtureWorks.filter(work=>favorites.has(work.id)).slice(offset,offset+60));},
  async getFavorite(id){return {saved:favorites.has(id)};},
  async setFavorite(id,saved){saved?favorites.add(id):favorites.delete(id);persistLibrary();return {saved};},
  async listPersonas(){return [{id:'persona-1',userId:'fixture-user',name:'여행자',description:'처음 찾아온 여행자',createdAt:new Date().toISOString()}];},
  async getModels(){return [{id:'test',name:'테스트 모델',credits:1,available:true}];},
  async getBalance(){return {available,reserved:0};},
  async startChat(input){const work=fixtureWorks.find(item=>item.id===input.workId);const opening=work?.snapshot?.openings.find(item=>item.id===input.openingId);if(!work||!opening)throw new Error('시작 상황을 확인해 주세요.');
   const chat:ChatDto={id:crypto.randomUUID(),userId:'fixture-user',workId:work.id,workVersionId:work.publishedVersionId!,personaSnapshot:input.personaId?{name:'여행자',description:'처음 찾아온 여행자'}:null,activeMessageId:null,createdAt:new Date().toISOString()};
   const message:MessageDto={id:crypto.randomUUID(),chatId:chat.id,parentMessageId:null,role:'assistant',content:opening.firstMessage,createdAt:chat.createdAt};chat.activeMessageId=message.id;
   chats.unshift({chat,title:work.title,messages:[message],memo:'',guide:work.snapshot?.playGuide??'',suggestedReplies:opening.suggestedReplies});persist();return copy(chat);},
  async getChat(id){await wait();const view=find(id);return {...copy(view),title:titles.get(id)??view.title};},
  async saveMemo(id,memo){find(id).memo=memo;persist();},
  async branchChat(id,messageId){
   const source=find(id),messages:ChatView['messages']=[];let cursor=source.messages.find(item=>item.id===messageId);
   if(!cursor)throw new Error('메시지를 찾을 수 없어요.');
   while(cursor){messages.unshift(copy(cursor));cursor=source.messages.find(item=>item.id===cursor!.parentMessageId);}
   const view=copy(source);view.chat.id=crypto.randomUUID();view.chat.createdAt=new Date().toISOString();
   let parentId:string|null=null;
   view.messages=messages.map(message=>{const next={...message,id:crypto.randomUUID(),chatId:view.chat.id,parentMessageId:parentId};parentId=next.id;return next;});
   view.chat.activeMessageId=parentId;chats.unshift(view);persist();return copy(view);
  },
  async selectBranch(id,messageId){const view=find(id);if(messageId&&!view.messages.some(item=>item.id===messageId))throw new Error('메시지를 찾을 수 없어요.');view.chat.activeMessageId=messageId;persist();return copy(view);},
  async editMessage(id,messageId,content){const view=find(id),message=view.messages.find(item=>item.id===messageId);if(!message)throw new Error('메시지를 찾을 수 없어요.');message.content=content;persist();return copy(view);},
  async deleteMessage(id,messageId){const view=find(id);const parent=view.messages.find(item=>item.id===messageId)?.parentMessageId??null;const removed=new Set([messageId]);let changed=true;while(changed){changed=false;for(const message of view.messages)if(message.parentMessageId&&removed.has(message.parentMessageId)&&!removed.has(message.id)){removed.add(message.id);changed=true;}}
   view.messages=view.messages.filter(item=>!removed.has(item.id));if(view.chat.activeMessageId&&removed.has(view.chat.activeMessageId))view.chat.activeMessageId=parent;persist();return copy(view);},
  async *streamTurn(id,body,{idempotencyKey,signal}){
   const payload=JSON.stringify({id,body});const replay=responses.get(idempotencyKey);if(replay){if(replay.body!==payload)throw new Error('멱등 요청이 달라요.');yield* copy(replay.events);return;}
   if(available<1)throw new Error('테스트 크레딧이 부족해요.');const view=find(id);const turnId=crypto.randomUUID(),requestId=crypto.randomUUID();let sequence=0;
   const events:ChatEvent[]=[];const emit=(event:ChatEvent)=>{events.push(event);return event;};
   yield emit({type:'ready',turnId,requestId,sequence:sequence++});
   const reply='*창문 너머로 조용한 바람이 지나간다.*\n@서하@ '+(body.content.includes('엔딩')?'이 이야기는 여기서 잠시 쉬어 가도 좋겠어요. 다음에 또 만나요.':'그 이야기를 조금 더 들려주실래요? 당신이 발견한 풍경이 궁금해요.');
   for(const text of reply.match(/.{1,7}/gs)??[]){await wait(signal);yield emit({type:'delta',text,requestId,sequence:sequence++});}
   yield emit({type:'status',status:'장소: 창가 · 시간: 저녁',requestId,sequence:sequence++});
   if(body.content.includes('이미지'))yield emit({type:'image',url:fixtureWorks[0].coverUrl!,alt:'밤하늘과 창문',requestId,sequence:sequence++});
   if(body.content.includes('엔딩'))yield emit({type:'ending',endingId:'quiet-evening',title:'다시 만날 저녁',requestId,sequence:sequence++});
   signal?.throwIfAborted();const user=view.messages.find(item=>item.role==='user'&&item.id===body.parentMessageId&&item.content===body.content)??{id:crypto.randomUUID(),chatId:id,parentMessageId:body.parentMessageId,role:'user' as const,content:body.content,createdAt:new Date().toISOString()};
   if(!view.messages.some(item=>item.id===user.id))view.messages.push(user);
   const message={id:crypto.randomUUID(),chatId:id,parentMessageId:user.id,role:'assistant' as const,content:reply,createdAt:new Date().toISOString(),images:body.content.includes('이미지')?[{url:fixtureWorks[0].coverUrl!,alt:'밤하늘과 창문'}]:[],status:'장소: 창가 · 시간: 저녁',ending:body.content.includes('엔딩')?{id:'quiet-evening',title:'다시 만날 저녁'}:null};view.messages.push(message);view.chat.activeMessageId=message.id;available--;persist();
   yield emit({type:'usage',inputTokens:0,outputTokens:0,credits:1,requestId,sequence:sequence++});
   const done:ChatEvent={type:'done',turnId,status:'completed',messageId:message.id,requestId,sequence:sequence++};events.push(done);responses.set(idempotencyKey,{body:payload,events});yield done;
  },
 };
}
