import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync,crc32} from 'node:zlib';
import {normalizePng} from '../server/media/png.ts';
function chunk(type,body){const b=Buffer.alloc(body.length+12);b.writeUInt32BE(body.length);b.write(type,4);body.copy(b,8);b.writeUInt32BE(crc32(b.subarray(4,-4)),b.length-4);return b;}
export function png(red=20){const h=Buffer.alloc(13);h.writeUInt32BE(1);h.writeUInt32BE(1,4);h[8]=8;h[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',h),chunk('IDAT',deflateSync(Buffer.from([0,red,40,50,255]))),chunk('IEND',Buffer.alloc(0))]);}
test('actual PNG validation rejects spoofed, corrupt, oversized and truncated input',()=>{
 assert.ok(normalizePng(png()).length>0);
 for(const input of [Buffer.from('<svg/>'),Buffer.from('not PNG'),png().subarray(0,40),Buffer.alloc(5*1024*1024+1)])assert.throws(()=>normalizePng(input));
 const damaged=png();damaged[damaged.length-1]^=1;assert.throws(()=>normalizePng(damaged));
 assert.throws(()=>normalizePng(Buffer.concat([png(),Buffer.from('<script>bad</script>')])));
});
import {createTestDatabase} from './helpers/db.ts';
import {migrateStudio} from '../server/studio/migrate.ts';
import {createStudioService} from '../server/studio/index.ts';
import {createMediaService} from '../server/media/index.ts';
import {makeDraft} from '../src/features/studio/draft.ts';
import {createChat} from '../server/core/chats.ts';
test('image ownership, publication boundary, duplicate retry, replacement and pinned version',async()=>{
 const db=await createTestDatabase();try{
  await migrateStudio(db);const users=(await db.query("INSERT INTO users(privy_did) VALUES('did:privy:media-a'),('did:privy:media-b') RETURNING id")).rows;
  const [a,b]=users.map(u=>u.id);const studio=createStudioService({db});
  const files=new Map();let fail=false;
  const storage={async put(key,bytes){if(fail)throw new Error('storage offline');files.set(key,bytes);},async get(key){return files.get(key)??null;}};
  const media=createMediaService({db,storage});const d=makeDraft();d.title='이미지 이야기';d.privateConfig.systemPrompt='설정';d.publicSnapshot.openings=[{id:'s',title:'시작',prologue:'창가',firstMessage:'',suggestedReplies:[]}];
  let w=await studio.saveDraft(a,d);const id=w.work.id;
  await assert.rejects(media.uploadImage(b,id,png()),{code:'FORBIDDEN'});
  fail=true;await assert.rejects(media.uploadImage(a,id,png()),/offline/);assert.equal((await studio.getWork(a,id)).assets.length,0);fail=false;
  const image=await media.uploadImage(a,id,png());const hash=image.url.split('/').at(-1);
  const duplicates=await Promise.all([media.uploadImage(a,id,png()),media.uploadImage(a,id,png())]);assert.ok(duplicates.every(x=>x.id===image.id));
  await assert.rejects(media.readImage(null,id,hash),{code:'UNAUTHORIZED'});await assert.rejects(media.readImage(b,id,hash),{code:'FORBIDDEN'});
  assert.ok((await media.readImage(a,id,hash)).length);
  w=await studio.saveDraft(a,{...w.draft,revision:w.revision,coverUrl:image.url,assets:[{id:image.id,code:image.code}]});
  const v1=await studio.publishVersion(a,id,w.revision);const replay=await studio.publishVersion(a,id,w.revision);assert.equal(v1.id,replay.id);
  const reloaded=await studio.getWork(a,id);assert.equal((await studio.publishVersion(a,id,reloaded.revision)).id,v1.id);
  assert.ok((await media.readImage(null,id,hash)).length);const chat=await createChat(db,b,{workId:id});
  w=await studio.getWork(a,id);const replacement=await media.uploadImage(a,id,png(99));
  await assert.rejects(media.readImage(null,id,replacement.url.split('/').at(-1)),{code:'UNAUTHORIZED'});
  w=await studio.saveDraft(a,{...w.draft,revision:w.revision,coverUrl:replacement.url,assets:[{id:replacement.id,code:replacement.code}]});
  const v2=await studio.publishVersion(a,id,w.revision);assert.notEqual(v1.id,v2.id);assert.equal(v1.hiddenSettings.workMetadata.coverUrl,image.url);assert.equal(chat.workVersionId,v1.id);
  assert.ok((await media.readImage(null,id,hash)).length);
  const hidden=await media.uploadImage(a,id,png(101));w=await studio.getWork(a,id);
  w=await studio.saveDraft(a,{...w.draft,revision:w.revision,assets:[...(w.draft.assets??[]),{id:hidden.id,code:hidden.code}]});
  await studio.publishVersion(a,id,w.revision);
  await assert.rejects(media.readImage(null,id,hidden.url.split('/').at(-1)),{code:'UNAUTHORIZED'});
  await assert.rejects(media.readImage(b,id,hidden.url.split('/').at(-1)),{code:'FORBIDDEN'});
  await createChat(db,b,{workId:id});assert.ok((await media.readImage(b,id,hidden.url.split('/').at(-1))).length);
  await db.query("INSERT INTO studio_assets(work_id,owner_id,code,label) SELECT $1,$2,'slot_'||n,'slot' FROM generate_series(1,197) n",[id,a]);
  const before=files.size;await assert.rejects(media.uploadImage(a,id,png(123)),{code:'INVALID_REQUEST'});assert.equal(files.size,before);
 }finally{await db.close();}
});
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createLocalImageStorage} from '../server/media/localStorage.ts';
test('explicit local storage survives reopen, is immutable and rejects traversal',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'iruka-media-'));try{
  const store=createLocalImageStorage(dir),key='11111111-1111-1111-1111-111111111111/'+'a'.repeat(64);
  await Promise.all([store.put(key,png()),store.put(key,png())]);
  assert.deepEqual(await createLocalImageStorage(dir).get(key),png());
  await assert.rejects(store.put(key,png(55)),/mismatch/);
  await assert.rejects(store.get('../../private'),/Invalid/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
import {createStudioHandler} from '../api/studio/handler.ts';
import {ApiError} from '../server/core/errors.ts';
test('HTTP upload is authenticated, bounded and unavailable without explicit storage',async()=>{
 const db=await createTestDatabase();try{
  await migrateStudio(db);const verifyToken=async token=>{if(token!=='media-owner')throw new ApiError('UNAUTHORIZED','로그인 필요');return {privyDid:'did:privy:http-media'};};
  const files=new Map();const imageStorage={async put(k,b){files.set(k,b);},async get(k){return files.get(k)??null;}};
  const handler=createStudioHandler({db,verifyToken,imageStorage});
  const req=(path,method='GET',body,auth=true,contentType='image/png')=>new Request('http://local'+path,{method,headers:{...(auth?{Authorization:'Bearer media-owner'}:{}),'Content-Type':contentType},body});
  const created=await handler(req('/api/studio/works','POST',JSON.stringify(makeDraft()),true,'application/json'));const work=(await created.json()).data;const path=`/api/studio/works/${work.work.id}/images`;
  assert.equal((await handler(req(path,'POST',png(),false))).status,401);
  assert.equal((await createStudioHandler({db,verifyToken})(req(path,'POST',png()))).status,503);
  assert.equal((await handler(req(path,'POST',Buffer.from('<svg/>')))).status,400);
  assert.equal((await handler(req(path,'POST',Buffer.alloc(5*1024*1024+1)))).status,400);
  const uploaded=await handler(req(path,'POST',png()));assert.equal(uploaded.status,201);const asset=(await uploaded.json()).data;
  assert.equal((await handler(req(asset.url,'GET',undefined,false))).status,401);
  const image=await handler(req(asset.url));assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/png');assert.equal(image.headers.get('x-content-type-options'),'nosniff');
  assert.equal((await handler(req(path,'POST',png()))).status,201);
  assert.equal((await db.query('SELECT id FROM studio_assets')).rows.length,1);
 }finally{await db.close();}
});
