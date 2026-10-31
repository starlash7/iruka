import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createReaderApi} from '../src/features/discover/readerApi.ts';
import {createTokenVerifier} from '../server/core/auth.ts';
import {createProduct} from '../server/product/index.ts';
import {createTestDatabase,seedChat} from './helpers/db.ts';

const publicReads=[
 ['listWorks',api=>api.listWorks({query:'hello & world',tag:'a/b',mode:'story',offset:60}),'/api/discover/works?q=hello+%26+world&tag=a%2Fb&mode=story&offset=60'],
 ['getRanking',api=>api.getRanking(),'/api/discover/ranking'],
 ['getWork',api=>api.getWork('id/with space'),'/api/works/id%2Fwith%20space'],
];

for(const [name,read,path] of publicReads){
 test(`${name} skips the session token provider and preserves transport options`,async()=>{
  let tokenCalls=0,fetchCalls=0;
  const data={marker:name};
  const api=createReaderApi({baseUrl:'https://reader.test/',getAccessToken:async()=>{
   tokenCalls++;throw new Error('Session token unavailable');
  },fetch:async(url,init)=>{
   fetchCalls++;
   assert.equal(url,`https://reader.test${path}`);
   assert.equal(new Headers(init.headers).has('authorization'),false);
   assert.equal(init.redirect,'error');
   return Response.json({data,requestId:'public'});
  }});
  assert.deepEqual(await read(api),data);
  assert.equal(tokenCalls,0);
  assert.equal(fetchCalls,1);
 });

 test(`${name} preserves API error envelopes`,async()=>{
  const api=createReaderApi({getAccessToken:async()=>'session',fetch:async()=>Response.json({
   error:{code:'SERVICE_UNAVAILABLE',message:'Unavailable'},requestId:'failure',
  },{status:503})});
  await assert.rejects(read(api),{code:'SERVICE_UNAVAILABLE',status:503,requestId:'failure'});
 });
}

test('public reads work with a session and missing server verifier; private reads still fail closed',async()=>{
 const db=await createTestDatabase();
 try{
  const seed=await seedChat(db);
  await db.query("UPDATE works SET visibility='public' WHERE id=$1",[seed.workId]);
  await db.query('INSERT INTO work_versions(public_snapshot,private_config,work_id,version,published_at) VALUES($1,$2,$3,2,now())',[
   JSON.stringify({tagline:'Public',systemPrompt:'SECRET',characters:[{id:'c',name:'Name',description:'SECRET'}],openings:[{id:'o',title:'Start',hiddenContext:'SECRET'}]}),
   JSON.stringify({systemPrompt:'SECRET'}),seed.workId,
  ]);
  const product=createProduct({db,verifyToken:createTokenVerifier({}),testGrant:{amount:20,key:'public-read'}});
  let tokenCalls=0;
  const api=createReaderApi({baseUrl:'http://local',getAccessToken:async()=>{tokenCalls++;return 'session';},
   fetch:async(url,init)=>product.handler(new Request(url,init))});
  assert.equal((await api.listWorks())[0].id,seed.workId);
  assert.deepEqual(await api.getRanking(),[]);
  const work=await api.getWork(seed.workId);
  assert.equal(work.snapshot.tagline,'Public');
  assert.doesNotMatch(JSON.stringify(work),/SECRET|systemPrompt|hiddenContext|private_config/);
  assert.equal(tokenCalls,0);
  for(const read of [()=>api.listChats(),()=>api.listPersonas(),()=>api.getBalance()]){
   await assert.rejects(read(),{code:'SERVICE_UNAVAILABLE',status:503});
  }
  assert.equal(tokenCalls,3);
 }finally{await db.close();}
});

test('non-public reader operations still refresh and send session tokens',async()=>{
 let tokenCalls=0,fetchCalls=0;
 const api=createReaderApi({getAccessToken:async()=>`session-${++tokenCalls}`,fetch:async(_url,init)=>{
  assert.equal(new Headers(init.headers).get('authorization'),`Bearer session-${++fetchCalls}`);
  return Response.json({error:{code:'UNAUTHORIZED',message:'Denied'},requestId:'private'},{status:401});
 }});
 const image=`/api/studio/media/12345678-1234-1234-1234-123456789abc/${'a'.repeat(64)}`;
 const calls=[
  ()=>api.listChats(),()=>api.listPersonas(),()=>api.getModels(),()=>api.getBalance(),
  ()=>api.listFolders(),()=>api.saveFolder('이름'),()=>api.saveFolder('이름','folder'),()=>api.deleteFolder('folder'),
  ()=>api.updateChat('c',{title:'이름',folderId:null}),()=>api.deleteChat('c'),
  ()=>api.listFavorites(),()=>api.getFavorite('w'),()=>api.setFavorite('w',true),
  ()=>api.startChat({workId:'w',openingId:'o',personaId:null,model:'test'}),
  ()=>api.getChat('c'),()=>api.saveMemo('c','memo'),()=>api.editMessage('c','m','text'),
  ()=>api.deleteMessage('c','m'),()=>api.selectBranch('c','m'),()=>api.branchChat('c','m'),
  ()=>api.loadImage(image),
  async()=>{for await(const event of api.streamTurn('c',{content:'text',parentMessageId:null,model:'test'},{idempotencyKey:'turn'}))assert.fail(JSON.stringify(event));},
 ];
 for(const call of calls)await assert.rejects(call(),{code:'UNAUTHORIZED',status:401});
 assert.equal(tokenCalls,calls.length);
 assert.equal(fetchCalls,calls.length);
});
