import test from 'node:test';
import assert from 'node:assert/strict';
import {readRecovery,writeRecovery,recoveryKey,sameDraft} from '../src/features/studio/recovery.ts';
import {makeDraft} from '../src/features/studio/draft.ts';
test('recovery is account/work scoped; equality tolerates DB JSON key order and trims only save-normalized fields',()=>{
 const values=new Map();const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const d=makeDraft();d.title='작성 중';const key=recoveryKey('owner','work');
 writeRecovery(storage,key,{draft:d,revision:2,updatedAt:'2026-10-15'});
 assert.equal(readRecovery(storage,key).draft.title,'작성 중');assert.equal(readRecovery(storage,recoveryKey('other','work')),null);
 const reordered=Object.fromEntries(Object.entries(d).reverse());assert.ok(sameDraft(d,reordered));assert.ok(sameDraft({...d,tags:[' a ','']},{...d,tags:['a']}));
 assert.ok(!sameDraft(d,{...d,title:'다른 내용'}));storage.setItem(key,'broken');assert.equal(readRecovery(storage,key),null);
});
