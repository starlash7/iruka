import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../server/db/index.ts';
import {migrateProductDatabase} from '../server/product/migrate.ts';
import {createStudioService} from '../server/studio/index.ts';
import {createMediaService} from '../server/media/index.ts';
import {makeDraft} from '../src/features/studio/draft.ts';
import {createChat} from '../server/core/chats.ts';
import {createProduct} from '../server/product/index.ts';
import {deflateSync,crc32} from 'node:zlib';
function png(red){const part=(type,data)=>{const b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);b.write(type,4);data.copy(b,8);b.writeUInt32BE(crc32(b.subarray(4,-4)),b.length-4);return b;};const h=Buffer.alloc(13);h.writeUInt32BE(1);h.writeUInt32BE(1,4);h[8]=8;h[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),part('IHDR',h),part('IDAT',deflateSync(Buffer.from([0,red,40,50,255]))),part('IEND',Buffer.alloc(0))]);}
test('named code uploads are immutable, retry-safe and preserve published and pinned images',async()=>{
 const db=await openDatabase();try{
  await migrateProductDatabase(db);await migrateProductDatabase(db);
  const [owner,other]=(await db.query("INSERT INTO users(privy_did) VALUES('did:privy:code-owner'),('did:privy:code-other') RETURNING id")).rows.map(row=>row.id);
  const files=new Map();const media=createMediaService({db,storage:{async put(key,value){files.set(key,value);},async get(key){return files.get(key)??null;}}}),studio=createStudioService({db});
  const draft=makeDraft();draft.title='코드 이미지';draft.privateConfig.systemPrompt='비공개';draft.publicSnapshot.openings=[{id:'first',title:'첫 장면',prologue:'시작',firstMessage:'',suggestedReplies:[]}];
  let work=await studio.saveDraft(owner,draft);const id=work.work.id,slot=await studio.createAsset(owner,id,{code:'SCENE',label:'장면'});
  await assert.rejects(media.uploadAssetImage(other,id,slot.id,png(1)),{code:'FORBIDDEN'});
  const first=await media.uploadAssetImage(owner,id,slot.id,png(1));assert.equal(first.code,'SCENE');assert.notEqual(first.id,slot.id);
  assert.equal((await media.uploadAssetImage(owner,id,slot.id,png(1))).id,first.id);
  work=await studio.saveDraft(owner,{...work.draft,revision:work.revision,assets:[{id:first.id,code:first.code}]});
  const v1=await studio.publishVersion(owner,id,work.revision);await createChat(db,other,{workId:id});
  const second=await media.uploadAssetImage(owner,id,first.id,png(2));assert.notEqual(second.id,first.id);
  await assert.rejects(media.uploadAssetImage(owner,id,first.id,png(3)),{code:'CONFLICT'});
  assert.ok((await media.readImage(other,id,first.url.split('/').at(-1))).length);
  await assert.rejects(media.readImage(other,id,second.url.split('/').at(-1)),{code:'FORBIDDEN'});
  work=await studio.getWork(owner,id);
  assert.equal(work.draft.assets[0].id,first.id,'upload does not silently rebind the saved draft');
  work=await studio.saveDraft(owner,{...work.draft,revision:work.revision,assets:[{id:second.id,code:second.code}]});
  const v2=await studio.publishVersion(owner,id,work.revision);
  assert.equal(v1.hiddenSettings.assets[0].url,first.url);assert.equal(v2.hiddenSettings.assets[0].url,second.url);
  assert.ok((await media.readImage(other,id,first.url.split('/').at(-1))).length);
  await assert.rejects(media.readImage(null,id,second.url.split('/').at(-1)),{code:'UNAUTHORIZED'});
  const shared=await studio.createAsset(owner,id,{code:'SHARED',label:'같은 파일'});
  const alias=await media.uploadAssetImage(owner,id,shared.id,png(2));
  work=await studio.getWork(owner,id);
  work=await studio.saveDraft(owner,{...work.draft,revision:work.revision,publicSnapshot:{...work.draft.publicSnapshot,openings:[{...work.draft.publicSnapshot.openings[0],prologue:'{{img:SHARED}}'}]},assets:[{id:alias.id,code:alias.code}]});
  await studio.publishVersion(owner,id,work.revision);
  assert.ok((await media.readImage(null,id,alias.url.split('/').at(-1))).length,'identical bytes in a second slot retain the public binding');
  const product=createProduct({db,verifyToken:async token=>({privyDid:`did:privy:code-${token}`}),imageStorage:{async put(key,value){files.set(key,value);},async get(key){return files.get(key)??null;}}});
  const path=`http://local/api/studio/works/${id}/assets/${alias.id}/image`;
  const upload=(token,body=png(4),type='image/png')=>product.handler(new Request(path,{method:'POST',headers:{...(token?{authorization:`Bearer ${token}`} :{}),'content-type':type},body}));
  assert.equal((await upload(null)).status,401);assert.equal((await upload('other')).status,403);
  assert.equal((await upload('owner',Buffer.from('broken'))).status,400);assert.equal((await upload('owner',Buffer.from([255,216,255]),'image/jpeg')).status,400);
  const uploaded=await upload('owner');assert.equal(uploaded.status,201);assert.equal((await uploaded.json()).data.code,'SHARED');
 }finally{await db.close();}
});
