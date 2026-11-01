import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import {projectPublicSnapshot} from '../server/core/publicSnapshot.ts';
import {validateDraft} from '../server/studio/validate.ts';
import {makeDraft} from '../src/features/studio/draft.ts';
import {isSafeImageUrl,postprocessOutput} from '../server/chat/postprocess.ts';
import {openDatabase} from '../server/db/index.ts';
import {migrateProductDatabase} from '../server/product/migrate.ts';
import {importSeedWorks} from '../scripts/seed/importWorks.ts';
import {attachSeedArtwork} from '../scripts/seed/attachArtwork.ts';
import {createStudioService} from '../server/studio/index.ts';
import {getPublicWork} from '../server/core/works.ts';
import {createChat} from '../server/core/chats.ts';
import {createReaderService} from '../server/chat/reader.ts';
import {createMediaService} from '../server/media/index.ts';
import {createStudioHandler} from '../api/studio/handler.ts';
import {createApiClient} from '../src/shared/apiClient.ts';

test('adopted public and private images retain exact source hashes and only registered images emit in chat',async()=>{
 const manifest=JSON.parse(await readFile('seed/approved-story-assets.json','utf8'));assert.equal(manifest.assets.length,24);
 for(const asset of manifest.assets){const bytes=await readFile(`public${asset.url}`);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);assert.equal(bytes.length,asset.bytes);}
 const privateManifest=JSON.parse(await readFile('seed/approved-private-assets.json','utf8'));assert.equal(privateManifest.assets.length,5);
 for(const asset of privateManifest.assets){const bytes=await readFile(asset.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);assert.ok(!asset.path.startsWith('public/'));}
 assert.equal(isSafeImageUrl('/stories/office-romance/opening.png'),true);assert.equal(isSafeImageUrl('/stories/unapproved.png'),false);
 assert.equal(postprocessOutput('{{img:OK}} {{img:UNKNOWN}}',{assets:[{code:'OK',url:'/stories/office-romance/opening.png',alt:'첫 장면'}]}).images.length,1);
});
test('public projection resolves public opening codes and rejects unapproved gallery URLs',()=>{
 const draft=makeDraft();draft.publicSnapshot.gallery=[{id:'intro',title:'소개',imageUrl:'/stories/office-romance/synopsis.webp',introduction:true}];draft.publicSnapshot.openings=[{id:'start',title:'첫 장면',prologue:'{{img:PUBLIC}}',firstMessage:'',suggestedReplies:[]}];
 validateDraft(draft);
 const snapshot=projectPublicSnapshot({...draft.publicSnapshot,images:[{code:'SECRET',url:'PRIVATE'}],hiddenContext:'PRIVATE'},[{code:'PUBLIC',label:'PRIVATE_LABEL',url:'/stories/office-romance/opening.png'},{code:'SECRET',label:'비공개',url:'https://private.test/secret.png'}]);
 assert.equal(snapshot.images.length,1);assert.equal(snapshot.images[0].code,'PUBLIC');assert.doesNotMatch(JSON.stringify(snapshot),/PRIVATE|private\.test|SECRET/);
 for(const imageUrl of ['javascript:alert(1)','/stories/unknown.png'])assert.throws(()=>validateDraft({...draft,publicSnapshot:{...draft.publicSnapshot,gallery:[{id:'bad',title:'bad',imageUrl}]}}),{code:'INVALID_REQUEST'});
 assert.throws(()=>validateDraft({...draft,publicSnapshot:{...draft.publicSnapshot,gallery:[{id:'bad',title:'bad',imageUrl:null}]}}),{code:'INVALID_REQUEST'});
});
test('deliberate seed artwork attachment is repeatable and preserves pinned publications',async()=>{
 const db=await openDatabase();try{
  await migrateProductDatabase(db);const seeds=await importSeedWorks(db);
  const owner=(await db.query("SELECT id FROM users WHERE privy_did='did:privy:local-studio-seed'")).rows[0].id;
  const oldChat=await createChat(db,owner,{workId:seeds[0].id});
  const reader=(await db.query("INSERT INTO users(privy_did) VALUES('did:privy:art-reader') RETURNING id")).rows[0].id;
  await createChat(db,reader,{workId:seeds[0].id});
  assert.ok((await attachSeedArtwork(db)).every(item=>item.changed));assert.ok((await attachSeedArtwork(db)).every(item=>!item.changed));
  assert.equal((await db.query('SELECT id FROM work_versions')).rows.length,4);
  const published=await getPublicWork(db,seeds[0].id);assert.equal(published.coverUrl,'/stories/office-romance/cover.webp');assert.equal(published.snapshot.gallery.length,7);assert.ok(published.snapshot.characters.every(c=>c.imageUrl));
  const pinned=await createReaderService(db).getView(owner,oldChat.id);assert.ok(pinned.characters.every(c=>c.imageUrl===null));
  const service=createStudioService({db});let work=await service.getWork(owner,seeds[0].id);
  const reaction=work.assets.find(asset=>asset.code==='XJuxTl'&&asset.url),hash=reaction.url.split('/').at(-1);
  const storage={async put(){assert.fail('Bundled reads must not write storage');},async get(){return null;}};
  const media=createMediaService({db,storage});await assert.rejects(media.readImage(null,seeds[0].id,hash),{code:'UNAUTHORIZED'});await assert.rejects(media.readImage(reader,seeds[0].id,hash),{code:'FORBIDDEN'});
  await createChat(db,reader,{workId:seeds[0].id});assert.equal(Buffer.from((await media.readImage(reader,seeds[0].id,hash)).subarray(0,4)).toString(),'RIFF');
  const handler=createStudioHandler({db,verifyToken:async()=>({privyDid:'did:privy:art-reader'}),imageStorage:storage});
  const api=createApiClient({baseUrl:'http://local',getAccessToken:async()=>'test',fetch:(url,init)=>handler(new Request(url,init))});assert.equal((await api.image(reaction.url)).type,'image/webp');
  assert.ok(!JSON.stringify(published).includes(hash),'private reaction is not promoted to the public gallery');
  await assert.rejects(service.saveDraft(owner,{...work.draft,revision:work.revision,publicSnapshot:{...work.draft.publicSnapshot,gallery:[{id:'foreign',title:'外',imageUrl:`/api/studio/media/${seeds[1].id}/${'a'.repeat(64)}`}]}}),{code:'FORBIDDEN'});
 }finally{await db.close();}
});
test('seed artwork attachment refuses an edited draft without partial publications',async()=>{
 const db=await openDatabase();try{await migrateProductDatabase(db);const seeds=await importSeedWorks(db);const owner=(await db.query("SELECT id FROM users WHERE privy_did='did:privy:local-studio-seed'")).rows[0].id;
  const studio=createStudioService({db}),work=await studio.getWork(owner,seeds[1].id);await studio.saveDraft(owner,{...work.draft,revision:work.revision,title:'내 수정본'});
  await assert.rejects(attachSeedArtwork(db),{code:'CONFLICT'});assert.equal((await db.query('SELECT id FROM work_versions')).rows.length,2);assert.equal((await studio.getWork(owner,seeds[1].id)).draft.title,'내 수정본');
 }finally{await db.close();}
});
