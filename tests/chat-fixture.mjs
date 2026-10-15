import {openDatabase,migrateDatabase} from '../server/db/index.ts';
import {createChatDatabase} from '../server/chat/database.ts';
import {migrateChatDatabase} from '../server/chat/migrate.ts';
import {createChat} from '../server/core/chats.ts';
import {getOrCreateUser} from '../server/core/accounts.ts';
export async function fixture(privateOverrides={}){
 const db=createChatDatabase(await openDatabase());await migrateDatabase(db);await migrateChatDatabase(db);
 const user=await getOrCreateUser(db,'did:privy:chat-test'),other=await getOrCreateUser(db,'did:privy:other');
 const work=(await db.query("INSERT INTO works(owner_id,mode,title,visibility) VALUES($1,'character','Harbor','public') RETURNING id",[user.id])).rows[0];
 const config={systemPrompt:'PRIVATE_SYSTEM_DO_NOT_EXPOSE',openingContexts:[{openingId:'port',hiddenContext:'HIDDEN_START_CONTEXT'}],lorebook:[],endings:[{id:'arrival',title:'Arrival',condition:'PRIVATE_ENDING_CONDITION',text:'Welcome',imageUrl:null}],...privateOverrides};
 const snapshot={characters:[{id:'sol',name:'Sol',imageUrl:null}],openings:[{id:'port',title:'Port',prologue:'Dawn',firstMessage:'Hello {{user}}',suggestedReplies:[]}]};
 await db.query('INSERT INTO work_versions(work_id,version,private_config,public_snapshot,published_at) VALUES($1,1,$2,$3,now())',[work.id,JSON.stringify(config),JSON.stringify(snapshot)]);
 const chat=await createChat(db,user.id,{workId:work.id});
 const calls=[];
 // Test credit adapter uses ONLY the existing shared ledger, within the injected DB scope.
 const credits={
  async getBalance(){return {available:100,reserved:0};},
  async reserveTurn({userId,turnId,credits}){calls.push('reserve');await db.query("INSERT INTO credit_ledger(user_id,turn_request_id,kind,amount,idempotency_key) VALUES($1,$2,'reserve',$3,$4)",[userId,turnId,-credits,`reserve:${turnId}`]);return {turnId,reserved:credits,state:'reserved'};},
  async completeTurn({userId,turnId}){calls.push('complete');await db.query("INSERT INTO credit_ledger(user_id,turn_request_id,kind,amount,idempotency_key) VALUES($1,$2,'charge',0,$3)",[userId,turnId,`complete:${turnId}`]);return {turnId,reserved:1,state:'completed'};},
  async releaseTurn({userId,turnId}){calls.push('release');await db.query("INSERT INTO credit_ledger(user_id,turn_request_id,kind,amount,idempotency_key) SELECT $1,$2,'release',-amount,$3 FROM credit_ledger WHERE turn_request_id=$2 AND kind='reserve'",[userId,turnId,`release:${turnId}`]);return {turnId,reserved:1,state:'released'};},
 };
 const safety={async check(text){return !text.includes('UNSAFE');}};
 const options={safety,models:{test:{maxContextTokens:4000,maxOutputCharacters:8000,reservedCredits:1,actualCredits:()=>1}},leaseMilliseconds:5000,generationMilliseconds:2000};
 const input=(key='one',content='hello',parentMessageId=null)=>({userId:user.id,chatId:chat.id,requestId:`request:${key}`,idempotencyKey:key,body:{content,parentMessageId,model:'test'},signal:new AbortController().signal});
 return {db,user,other,work,chat,calls,credits,safety,options,input,config};
}
export const collect=async iterable=>{const events=[];for await(const e of iterable)events.push(e);return events;};
