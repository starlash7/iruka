import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase,migrateDatabase} from '../server/db/index.ts';
import {createApiHandler} from '../server/app.ts';
import {crc32,deflateSync} from 'node:zlib';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';

function avatarPng(width=1){
 const chunk=(type,body)=>{const b=Buffer.alloc(body.length+12);b.writeUInt32BE(body.length);b.write(type,4);body.copy(b,8);b.writeUInt32BE(crc32(b.subarray(4,-4)),b.length-4);return b;};
 const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(1,4);header[8]=8;header[9]=6;
 return 'data:image/png;base64,'+Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(Buffer.alloc(width*4+1))),chunk('IEND',Buffer.alloc(0))]).toString('base64');
}

test('profile saves persist, isolate accounts and reject invalid or privileged inputs',async()=>{
 const db=await openDatabase();await migrateDatabase(db);
 const handler=createApiHandler({db,verifyToken:async token=>({privyDid:`did:privy:${token}`})});
 const call=(method='GET',body,token='alice')=>handler(new Request('http://local/api/me/profile',{method,headers:{...(token?{authorization:`Bearer ${token}`} :{}),'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}));
 try{
  assert.equal((await call('GET',undefined,null)).status,401);
  const input={nickname:' 별 ',bio:'안녕하세요',avatar:null};
  const saved=await call('PUT',input);assert.equal(saved.status,200);
  assert.deepEqual((await saved.json()).data,{nickname:'별',bio:'안녕하세요',avatar:null});
  assert.deepEqual((await (await call()).json()).data,{nickname:'별',bio:'안녕하세요',avatar:null});
  assert.equal((await (await call('GET',undefined,'bob')).json()).data.nickname,'Iruka 사용자');
  for(const patch of [{nickname:''},{nickname:'x'.repeat(31)},{bio:'x'.repeat(301)},{avatar:'https://example.com/a.png'},{avatar:'data:image/svg+xml;base64,PHN2Zz4='},{userId:'forged'}]){
   assert.equal((await call('PUT',{...input,...patch})).status,400);
  }
  assert.equal((await call('PUT',input,null)).status,401);
  assert.equal((await (await call()).json()).data.nickname,'별');
  const avatar=avatarPng();assert.equal((await call('PUT',{...input,avatar})).status,200);
  assert.equal((await (await call()).json()).data.avatar,avatar);
  assert.equal((await (await call('GET',undefined,'bob')).json()).data.avatar,null);
  for(const image of [avatarPng(513),'data:image/png;base64,YmFk', 'data:image/png;base64,'+'A'.repeat(1510000)])assert.equal((await call('PUT',{...input,avatar:image})).status,400);
  assert.equal((await call('PUT',input)).status,200);
  assert.equal((await (await call()).json()).data.avatar,null);
 }finally{await db.close();}
});

test('profile editor has labeled bounded fields, save/cancel and header uses saved avatar',async()=>{
 const server=await createServer({appType:'custom',optimizeDeps:{noDiscovery:true},server:{hmr:false,middlewareMode:true}});
 try{
  const {ProfileEditor}=await server.ssrLoadModule('/src/features/user/profile/ProfileEditor.tsx');
  const html=renderToStaticMarkup(createElement(ProfileEditor,{identity:'test',profile:{nickname:'별',bio:'소개',avatar:avatarPng()},onSave:async()=>{},onCancel(){}}));
  assert.match(html,/닉네임<input[^>]+maxLength="30"/);assert.match(html,/자기소개<textarea[^>]+maxLength="300"/);
  assert.match(html,/프로필 사진 삭제/);assert.match(html,/>취소</);assert.match(html,/>저장</);
  const {ReaderProfileMenu}=await server.ssrLoadModule('/src/features/discover/ReaderAccountMenu.tsx');
  const menu=renderToStaticMarkup(createElement(ReaderProfileMenu,{identity:'test',name:'별',image:avatarPng(),onLinkWallet(){},onLogout(){}}));
  assert.match(menu,/내 계정: 별/);assert.match(menu,/reader-profile-avatar-custom/);assert.match(menu,/마이페이지/);
 }finally{await server.close();}
});
