import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {generateKeyPair,exportSPKI,SignJWT} from 'jose';
import {openDatabase} from '../server/db/index.ts';
import {migrateProductDatabase} from '../server/product/migrate.ts';
import {createProduct} from '../server/product/index.ts';
import {createTokenVerifier} from '../server/core/auth.ts';

test('verified DID maps back to the same persisted profile after database restart; another DID stays isolated',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'iruka-account-restart-'));
 const keys=await generateKeyPair('ES256');
 const verifyToken=createTokenVerifier({appId:'persistence-test',verificationKey:await exportSPKI(keys.publicKey)});
 const token=async did=>new SignJWT({}).setSubject(did).setIssuer('privy.io').setAudience('persistence-test').setIssuedAt().setExpirationTime('2m').setProtectedHeader({alg:'ES256'}).sign(keys.privateKey);
 const request=async(product,did,method='GET',profile)=>product.handler(new Request('http://local/api/me/profile',{method,headers:{authorization:`Bearer ${await token(did)}`,'content-type':'application/json'},...(profile?{body:JSON.stringify(profile)}:{})}));
 let db=await openDatabase({dataDir:directory});
 try{
  await migrateProductDatabase(db);let product=createProduct({db,verifyToken});
  const profile={nickname:'저장한 이름',bio:'재접속 후에도 남는 소개',avatar:null};
  assert.equal((await request(product,'did:privy:persistent','PUT',profile)).status,200);
  const first=(await db.query("SELECT id FROM users WHERE privy_did='did:privy:persistent'")).rows[0].id;
  await db.close();db=await openDatabase({dataDir:directory});await migrateProductDatabase(db);product=createProduct({db,verifyToken});
  const restored=await request(product,'did:privy:persistent');assert.equal(restored.status,200);assert.deepEqual((await restored.json()).data,profile);
  assert.equal((await db.query("SELECT id FROM users WHERE privy_did='did:privy:persistent'")).rows[0].id,first);
  assert.equal((await db.query("SELECT count(*)::int AS n FROM users WHERE privy_did='did:privy:persistent'")).rows[0].n,1);
  const other=(await (await request(product,'did:privy:another')).json()).data;assert.equal(other.nickname,'Iruka 사용자');assert.notEqual(other.bio,profile.bio);
  assert.equal((await product.handler(new Request('http://local/api/me/profile'))).status,401);
 }finally{await db.close();await rm(directory,{recursive:true,force:true});}
});
