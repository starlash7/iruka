import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../server/db/index.ts';
import {migrateProductDatabase} from '../server/product/migrate.ts';
import {createProduct} from '../server/product/index.ts';
import {makeDraft} from '../src/features/studio/draft.ts';

async function setup(){
 const db=await openDatabase();await migrateProductDatabase(db);
 const product=createProduct({db,verifyToken:async token=>({privyDid:`did:privy:${token}`}),safety:{check:async()=>true}});
 const call=(path,method='GET',body,token='alice')=>product.handler(new Request(`http://local${path}`,{method,headers:{...(token?{authorization:`Bearer ${token}`} :{}),'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}));
 const data=async(...args)=>{const response=await call(...args);assert.ok(response.ok,await response.clone().text());return (await response.json()).data;};
 const draft=makeDraft();draft.title='도서관';draft.privateConfig.systemPrompt='비공개 원본';draft.publicSnapshot.openings=[{id:'first',title:'첫 만남',prologue:'창가',firstMessage:'환영해요.',suggestedReplies:[]}];
 const saved=await data('/api/studio/works','POST',draft);await data(`/api/studio/works/${saved.work.id}/publish`,'POST',{revision:saved.revision});
 return {db,call,data,workId:saved.work.id};
}

test('chat folders, metadata, filtered continue and deletion remain owner scoped',async()=>{
 const {db,call,data,workId}=await setup();try{
  const first=(await data('/api/chats','POST',{workId})).chat;
  const second=(await data('/api/chats','POST',{workId})).chat;
  const folder=await data('/api/me/chat-folders','POST',{name:'이야기'});
  for(const input of [{name:''},{name:' '.repeat(3)},{name:'가'.repeat(51)},{name:'이름',userId:first.id}])assert.equal((await call('/api/me/chat-folders','POST',input)).status,400);
  assert.equal((await call('/api/me/chat-folders','POST',{name:'이야기'})).status,409);
  for(const input of [{title:''},{title:'가'.repeat(81)},{userId:first.id},{folderId:'bad'}])assert.equal((await call(`/api/chats/${first.id}`,'PATCH',input)).status,400);
  assert.equal((await call('/api/me/chat-folders','GET',undefined,null)).status,401);
  assert.deepEqual(await data('/api/me/chat-folders','GET',undefined,'bob'),[]);
  assert.equal((await call(`/api/me/chat-folders/${folder.id}`,'PATCH',{name:'침범'},'bob')).status,404);
  assert.equal((await call(`/api/chats/${first.id}`,'PATCH',{title:'침범'},'bob')).status,404);
  await data(`/api/chats/${first.id}`,'PATCH',{title:'내 첫 대화',folderId:folder.id});
  const filtered=await data(`/api/chats?folderId=${folder.id}`);
  assert.equal(filtered.length,1);assert.equal(filtered[0].title,'내 첫 대화');
  const bobFolder=await data('/api/me/chat-folders','POST',{name:'다른 계정'},'bob');
  assert.equal((await call(`/api/chats/${first.id}`,'PATCH',{folderId:bobFolder.id})).status,404);
  assert.equal((await data(`/api/chats?workId=${workId}&limit=1`))[0].chat.id,second.id);
  const message=(await db.query("INSERT INTO messages(chat_id,parent_id,role,content) VALUES($1,$2,'user','최근 활동') RETURNING id",[first.id,first.activeMessageId])).rows[0];
  await db.query('UPDATE chat_state SET active_message_id=$2 WHERE chat_id=$1',[first.id,message.id]);
  assert.equal((await data(`/api/chats?workId=${workId}&limit=1`))[0].chat.id,first.id,'activity takes precedence over conversation creation');
  assert.equal((await data(`/api/chats/${first.id}/view`)).chat.workVersionId,first.workVersionId);
  await data(`/api/me/chat-folders/${folder.id}`,'PATCH',{name:'모아보기'});
  assert.equal((await data('/api/me/chat-folders'))[0].name,'모아보기');
  await data(`/api/me/chat-folders/${folder.id}`,'DELETE');
  assert.equal((await data('/api/chats')).find(row=>row.chat.id===first.id).folderId,null);
  assert.equal((await data(`/api/chats/${first.id}/view`)).title,'내 첫 대화');
  const turn=(await db.query("INSERT INTO turn_requests(user_id,chat_id,idempotency_key,payload_hash) VALUES($1,$2,'pending-delete',$3) RETURNING id",[first.userId,first.id,'a'.repeat(64)])).rows[0];
  await db.query("INSERT INTO chat_turn_leases(turn_id,chat_id,expires_at) VALUES($1,$2,now()+interval '1 minute')",[turn.id,first.id]);
  assert.equal((await call(`/api/chats/${first.id}`,'DELETE')).status,409);
  await db.query('DELETE FROM chat_turn_leases WHERE turn_id=$1',[turn.id]);
  await data(`/api/chats/${first.id}`,'DELETE');
  assert.equal((await data('/api/chats')).length,1);
  assert.equal((await call(`/api/chats/${first.id}`,'PATCH',{title:'복원'})).status,404);
  for(const path of ['/api/chats?offset=-1','/api/chats?limit=101','/api/chats?workId=bad'])assert.equal((await call(path)).status,400);
  const otherDraft=makeDraft();otherDraft.title='다른 작품';otherDraft.privateConfig.systemPrompt='다른 숨김';otherDraft.publicSnapshot.openings=[{id:'first',title:'시작',prologue:'시작',firstMessage:'안녕',suggestedReplies:[]}];
  const other=await data('/api/studio/works','POST',otherDraft);await data(`/api/studio/works/${other.work.id}/publish`,'POST',{revision:other.revision});
  await data('/api/chats','POST',{workId:other.work.id});
  assert.deepEqual((await data(`/api/chats?workId=${workId}`)).map(item=>item.chat.id),[second.id]);
 }finally{await db.close();}
});

test('favorites are private and idempotent, and creator names require publishing consent',async()=>{
 const {db,call,data,workId}=await setup();try{
  await data('/api/me/profile','PUT',{nickname:'공개할 별명',bio:'PRIVATE_BIO',avatar:null});
  assert.equal((await data(`/api/works/${workId}`)).creatorName,undefined);
  assert.equal((await call(`/api/me/favorites/${workId}`,'PUT',{saved:true},null)).status,401);
  await data(`/api/me/favorites/${workId}`,'PUT',{saved:true});
  await data(`/api/me/favorites/${workId}`,'PUT',{saved:true});
  assert.equal((await data('/api/me/favorites')).length,1);
  assert.deepEqual(await data('/api/me/favorites','GET',undefined,'bob'),[]);
  assert.deepEqual(await data(`/api/me/favorites/${workId}`),{saved:true});
  let owned=await data(`/api/studio/works/${workId}`);
  owned=await data(`/api/studio/works/${workId}`,'PUT',{...owned.draft,revision:owned.revision,showCreator:true});
  await data(`/api/studio/works/${workId}/publish`,'POST',{revision:owned.revision});
  const publicWork=await data(`/api/works/${workId}`);
  assert.equal(publicWork.creatorName,'공개할 별명');assert.doesNotMatch(JSON.stringify(publicWork),/PRIVATE_BIO|privyDid|avatar|systemPrompt/);
  assert.equal((await data('/api/discover/works'))[0].creatorName,'공개할 별명');
  owned=await data(`/api/studio/works/${workId}`);
  owned=await data(`/api/studio/works/${workId}`,'PUT',{...owned.draft,revision:owned.revision,showCreator:false});
  await data(`/api/studio/works/${workId}/publish`,'POST',{revision:owned.revision});
  assert.equal((await data(`/api/works/${workId}`)).creatorName,undefined);
  assert.equal((await data('/api/discover/works'))[0].creatorName,undefined);
  await db.query("UPDATE works SET visibility='private' WHERE id=$1",[workId]);
  assert.deepEqual(await data('/api/me/favorites'),[]);
  assert.equal((await call(`/api/me/favorites/${workId}`,'PUT',{saved:true})).status,404);
  await data(`/api/me/favorites/${workId}`,'PUT',{saved:false});
  assert.equal((await db.query('SELECT * FROM work_favorites')).rows.length,0);
 }finally{await db.close();}
});

test('discovery and private favorites page all results with exact tag filtering',async()=>{
 const {db,data,call,workId}=await setup();try{
  await db.query("INSERT INTO works(owner_id,mode,title,description,tags,visibility) SELECT owner_id,mode,'추가 작품 '||n,'소개',ARRAY['장르'],'public' FROM works CROSS JOIN generate_series(1,65) n WHERE id=$1",[workId]);
  await db.query('INSERT INTO work_versions(work_id,version,public_snapshot,private_config,published_at) SELECT w.id,1,v.public_snapshot,v.private_config,now() FROM works w CROSS JOIN work_versions v WHERE w.id<>$1 AND v.work_id=$1',[workId]);
  const first=await data('/api/discover/works?tag=장르'),next=await data('/api/discover/works?tag=장르&offset=60');
  assert.equal(first.length,60);assert.equal(next.length,5);assert.equal(new Set([...first,...next].map(work=>work.id)).size,65);
  assert.deepEqual(await data('/api/discover/works?tag=장르&offset=120'),[]);
  await db.query('INSERT INTO work_favorites(user_id,work_id) SELECT u.id,w.id FROM users u CROSS JOIN works w WHERE u.privy_did=$1',[ 'did:privy:alice']);
  assert.equal((await data('/api/me/favorites')).length,60);assert.equal((await data('/api/me/favorites?offset=60')).length,6);
  assert.equal((await call('/api/me/favorites?offset=-1')).status,400);
 }finally{await db.close();}
});
