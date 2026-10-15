import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase,migrateDatabase} from '../server/db/index.ts';
import {createApiHandler} from '../server/app.ts';
test('persona mutations isolate owners, preserve pinned chats and prevent deleted selection',async()=>{
 const db=await openDatabase();await migrateDatabase(db);
 const handler=createApiHandler({db,verifyToken:async token=>({privyDid:`did:privy:${token}`})});
 const call=(path,method='GET',body,token='alice')=>handler(new Request(`http://local/api${path}`,{method,headers:{...(token?{authorization:`Bearer ${token}`} :{}),'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}));
 try{
 const persona=(await (await call('/me/personas','POST',{name:'별',description:'여행자'})).json()).data;
 const path=`/me/personas/${persona.id}`;
 assert.equal((await call(path,'PATCH',{name:'달',description:''},null)).status,401);
 assert.equal((await call(path,'PATCH',{name:'달',description:''},'bob')).status,404);
 assert.equal((await call(path,'DELETE',undefined,'bob')).status,404);
 const work=(await db.query("INSERT INTO works(owner_id,mode,title,visibility) VALUES($1,'story','test','public') RETURNING id",[persona.userId])).rows[0].id;
 await db.query('INSERT INTO work_versions(work_id,version,published_at) VALUES($1,1,now())',[work]);
 const chat=(await (await call('/chats','POST',{workId:work,personaId:persona.id})).json()).data;
 const updated=await call(path,'PATCH',{name:' 달 ',description:'새 소개',userId:'forged'});
 assert.equal(updated.status,200);assert.equal((await updated.json()).data.name,'달');
 assert.equal((await call(path,'PATCH',{name:' ',description:''})).status,400);
 assert.equal((await call('/me/personas/invalid','DELETE')).status,400);
 assert.equal((await call(path,'DELETE')).status,200);
 assert.deepEqual((await (await call('/me/personas')).json()).data,[]);
 assert.equal((await call('/chats','POST',{workId:work,personaId:persona.id})).status,404);
 assert.equal((await call(path,'DELETE')).status,404);
 assert.equal((await call(path,'PATCH',{name:'복구',description:''})).status,404);
 assert.deepEqual((await (await call(`/chats/${chat.id}`)).json()).data.personaSnapshot,{name:'별',description:'여행자'});
 const second=(await (await call('/me/personas','POST',{name:'둘',description:''})).json()).data;
 const [start,remove]=await Promise.all([call('/chats','POST',{workId:work,personaId:second.id}),call(`/me/personas/${second.id}`,'DELETE')]);
 assert.ok([201,404].includes(start.status));assert.equal(remove.status,200);
 assert.equal((await call('/chats','POST',{workId:work,personaId:second.id})).status,404);
 }finally{await db.close();}
});
