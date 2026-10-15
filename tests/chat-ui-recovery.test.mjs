import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createTurnRecovery} from '../src/features/chat/turnRecovery.ts';
test('refresh never discards the key of an unresolved turn and blocks history mutation',()=>{
 const recovery=createTurnRecovery();const body={content:'안녕',model:'test',parentMessageId:null};
 const first=recovery.begin(body,false);recovery.reconciled();
 assert.equal(recovery.locked,true);assert.equal(recovery.begin(body,true).key,first.key);
 assert.throws(()=>recovery.begin(body,false));
});
test('terminal response stays locked until updated history is reconciled',()=>{
 const recovery=createTurnRecovery();recovery.begin({content:'안녕',model:'test',parentMessageId:null},false);
 recovery.terminal();assert.equal(recovery.attempt,null);assert.equal(recovery.locked,true);assert.equal(recovery.needsRefresh,true);
 assert.throws(()=>recovery.begin({content:'다음',model:'test',parentMessageId:null},false));
 recovery.reconciled();assert.equal(recovery.locked,false);
});
test('definitive pre-turn rejection allows a corrected request with a new key',()=>{
 const recovery=createTurnRecovery();const first=recovery.begin({content:'bad',model:'old',parentMessageId:null},false);
 recovery.rejected();assert.equal(recovery.locked,false);
 const corrected=recovery.begin({content:'good',model:'new',parentMessageId:null},false);assert.notEqual(corrected.key,first.key);
});
