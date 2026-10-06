import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyNativeTransferEvidence } from '../scripts/monad/verify-live-evidence.mjs';
const hash=`0x${'ab'.repeat(32)}`;
const evidence={chainId:10143,transactionHash:hash,blockNumber:'21',from:`0x${'11'.repeat(20)}`,to:`0x${'22'.repeat(20)}`,valueWei:'1000000000000000'};
function fixture(){
 const tx={hash,from:evidence.from,to:evidence.to,value:1000000000000000n};
 const receipt={status:'success',transactionHash:hash,blockNumber:21n};
 return {tx,receipt,client:{getChainId:async()=>10143,getTransaction:async()=>tx,getTransactionReceipt:async()=>receipt}};
}
test('native evidence verifies successful exact-value testnet transfer',async()=>{
 const {client}=fixture();assert.equal(await verifyNativeTransferEvidence(client,evidence),hash);
});
test('native evidence rejects a different recipient or value',async()=>{
 const {client,tx}=fixture();tx.to=evidence.from;
 await assert.rejects(verifyNativeTransferEvidence(client,evidence),/recipient/i);
 tx.to=evidence.to;tx.value=1n;
 await assert.rejects(verifyNativeTransferEvidence(client,evidence),/value/i);
});
test('native evidence rejects reverted receipt and wrong chain',async()=>{
 const {client,receipt}=fixture();receipt.status='reverted';
 await assert.rejects(verifyNativeTransferEvidence(client,evidence),/receipt/i);
 receipt.status='success';client.getChainId=async()=>1;
 await assert.rejects(verifyNativeTransferEvidence(client,evidence),/chain/i);
});
