import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createTestDatabase, seedChat} from './helpers/db.ts';
import {createDiscoveryService} from '../server/discover/index.ts';
import {createDiscoverHandler} from '../api/discover/index.ts';
test('public discovery excludes private, unlisted and unpublished works and strips nested secrets', async()=>{
 const db=await createTestDatabase();
 try {
  const seed=await seedChat(db);
  await db.query("UPDATE works SET visibility='public',title='달빛 도서관',tags=ARRAY['판타지'] WHERE id=$1",[seed.workId]);
  const draft=await db.query("INSERT INTO works(owner_id,mode,title,visibility) VALUES ($1,'story','미발행','public') RETURNING id",[seed.userId]);
  await db.query("INSERT INTO work_versions(work_id,version,public_snapshot,private_config,published_at) VALUES ($1,2,$2,$3,now())",[seed.workId,JSON.stringify({tagline:'공개',systemPrompt:'SECRET',characters:[{id:'c',name:'서하',imageUrl:null,description:'SECRET'}],openings:[{id:'o',title:'첫 만남',prologue:'밤',firstMessage:'안녕',suggestedReplies:['안녕'],hiddenContext:'SECRET'}]}),JSON.stringify({systemPrompt:'SECRET'})]);
  const service=createDiscoveryService({db});
  assert.equal((await service.listWorks()).length,1);
  assert.equal((await service.searchWorks({query:'달빛',tag:'판타지'})).length,1);
  assert.equal((await service.searchWorks({query:"' OR true --"})).length,0);
  assert.equal(await service.getWork(draft.rows[0].id),null);
  assert.ok(!JSON.stringify(await service.getWork(seed.workId)).includes('SECRET'));
  for(const visibility of ['private','unlisted']) {
   await db.query('UPDATE works SET visibility=$1 WHERE id=$2',[visibility,seed.workId]);
   assert.deepEqual(await service.listWorks(),[]);
   assert.equal(await service.getWork(seed.workId),null);
   const response=await createDiscoverHandler(service)(new Request(`http://local/api/works/${seed.workId}`));
   assert.equal(response.status,404);
  }
 } finally {await db.close();}
});
