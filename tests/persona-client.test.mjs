import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPersonaClient,validatePersona} from '../src/features/user/personas/client.ts';
import {openDatabase,migrateDatabase} from '../server/db/index.ts';
import {createApiHandler} from '../server/app.ts';

test('persona input boundaries match existing API',()=>{
 for(const name of ['', '   ', 'a'.repeat(51)]) assert.ok(validatePersona({name,description:''}));
 assert.ok(validatePersona({name:'별',description:'x'.repeat(501)}));
 assert.equal(validatePersona({name:'별'.repeat(50),description:'x'.repeat(500)}),'');
});
test('real API mutates owned personas without rewriting chat snapshots',async()=>{
 const db=await openDatabase();await migrateDatabase(db);
 try {
  const handler=createApiHandler({db,verifyToken:async token=>({privyDid:`did:privy:${token}`})});
  const client=token=>createPersonaClient({getAccessToken:async()=>token,fetch:(path,init)=>handler(new Request(`http://local${path}`,init))});
  const alice=client('alice'),bob=client('bob');
  await assert.rejects(client(null).list(),{status:401});
  await assert.rejects(alice.create({name:' ',description:''}));
  const created=await alice.create({name:' 별 ',description:'여행자'});
  assert.equal(created.name,'별');assert.deepEqual(await alice.list(),[created]);assert.deepEqual(await bob.list(),[]);
  await assert.rejects(bob.update(created.id,{name:'달',description:''}),{status:404});
  await assert.rejects(bob.remove(created.id),{status:404});
  assert.deepEqual(await alice.list(),[created]);
  const work=(await db.query("INSERT INTO works(owner_id,mode,title,visibility) VALUES($1,'character','test','public') RETURNING id",[created.userId])).rows[0].id;
  await db.query("INSERT INTO work_versions(work_id,version,published_at) VALUES($1,1,now())",[work]);
  const call=(token,body)=>handler(new Request('http://local/api/chats',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify(body)}));
  assert.equal((await call('bob',{workId:work,personaId:created.id})).status,404);
  const chat=(await (await call('alice',{workId:work,personaId:created.id})).json()).data;
  await alice.update(created.id,{name:'달',description:'변경'});
  await alice.remove(created.id);
  assert.deepEqual(await alice.list(),[]);
  const read=await handler(new Request(`http://local/api/chats/${chat.id}`,{headers:{authorization:'Bearer alice'}}));
  assert.deepEqual((await read.json()).data.personaSnapshot,{name:'별',description:'여행자'});
  await assert.rejects(db.query('DELETE FROM personas WHERE id=$1',[created.id]),/foreign key/i);
 } finally {await db.close();}
});
