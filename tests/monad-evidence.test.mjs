import assert from 'node:assert/strict';
import test from 'node:test';
import { encodeAbiParameters, encodeEventTopics, parseAbiItem } from 'viem';
import { giwaPackBatchAbi as pullAbi } from '../src/giwaPackBatch.ts';
import { verifyLiveEvidence } from '../scripts/monad/verify-live-evidence.mjs';

const abi = [...pullAbi,
 parseAbiItem('event OperatorUpdated(address indexed previousOperator, address indexed newOperator)'),
 parseAbiItem('event BatchCommitted(bytes32 indexed batchId, uint32 totalSupply, uint256 priceWei, bytes32 inventoryRoot, bytes32 oddsCommitment, bytes32 drawSeedRoot)')];

function createFixture() {
  const contract='0x0000000000000000000000000000000000000001';
  const collector='0x0000000000000000000000000000000000000002';
  const id=`0x${'11'.repeat(32)}`, inventoryId=`0x${'22'.repeat(32)}`;
  const hash=(n)=>`0x${n.repeat(64)}`;
  const record={requestId:'1',drawIndex:0,collector,inventoryId,inventoryIndex:7,
    requestTransactionHash:hash('3'),fulfillmentTransactionHash:hash('4'),requestBlock:'10',fulfillmentBlock:'12'};
  const evidence={chainId:10143,contract,setupTransactions:{deployment:hash('5'),operator:hash('6'),commitBatch:hash('7')},
    batch:{id,initialSupply:100,priceWei:'10000000000000',inventoryRoot:hash('8'),drawSeedRoot:hash('9')},pulls:[record],
    batchSnapshot:{blockNumber:'12',available:99,remaining:99,nextDrawIndex:1,nextFulfillIndex:1}};
  const log=(eventName,data)=>({address:contract,topics:encodeEventTopics({abi,eventName,args:{requestId:1n,batchId:id,collector}}),data});
  const receipts=new Map([
    [hash('3'),{status:'success',transactionHash:hash('3'),blockNumber:10n,logs:[log('PullRequested',encodeAbiParameters([{type:'uint32'}],[0]))]}],
    [hash('4'),{status:'success',transactionHash:hash('4'),blockNumber:12n,logs:[log('PullFulfilled',encodeAbiParameters([{type:'bytes32'},{type:'uint32'},{type:'uint32'}],[inventoryId,7,99]))]}],
    [hash('5'),{status:'success',transactionHash:hash('5'),contractAddress:contract}],
    [hash('6'),{status:'success',to:contract,transactionHash:hash('6'),logs:[{address:contract,topics:encodeEventTopics({abi,eventName:'OperatorUpdated',args:{previousOperator:contract,newOperator:collector}}),data:'0x'}]}],
    [hash('7'),{status:'success',to:contract,transactionHash:hash('7'),logs:[log('BatchCommitted',encodeAbiParameters([{type:'uint32'},{type:'uint256'},{type:'bytes32'},{type:'bytes32'},{type:'bytes32'}],[100,10000000000000n,hash('8'),hash('b'),hash('9')]))]}]
  ]);
  const pull=[collector,id,hash('a'),0,inventoryId,7,true];
  const batches=new Map([
    [11n,[100,99,100,10000000000000n,hash('8'),hash('b'),hash('9'),1,0]],
    [12n,[100,99,99,10000000000000n,hash('8'),hash('b'),hash('9'),1,1]],
    [20n,[100,99,99,10000000000000n,hash('8'),hash('b'),hash('9'),1,1]]
  ]);
  const batchReads=[];
  const client={getChainId:async()=>10143,getBytecode:async()=>'0x6000',getBlockNumber:async()=>20n,
    getTransactionReceipt:async({hash})=>receipts.get(hash),
    readContract:async({functionName,blockNumber})=>{
      if(functionName!=='getBatch')return pull;
      batchReads.push(blockNumber);return batches.get(blockNumber??20n);
    }};
  return {evidence,client,receipts,pull,batches,batchReads};
}

test('recorded batch checkpoints are read at their exact block',async()=>{
 const {evidence,client,batchReads}=createFixture();
 const result=await verifyLiveEvidence(client,evidence);
 assert.ok(batchReads.includes(12n));
 assert.equal(result.blockNumber,'20');
});

for(const field of ['available','remaining','nextDrawIndex','nextFulfillIndex']){
 test(`rejects a changed recorded batch ${field}`,async()=>{
  const {evidence,client}=createFixture();evidence.batchSnapshot[field]--;
  await assert.rejects(verifyLiveEvidence(client,evidence),/snapshot|checkpoint/i);
 });
}

for(const anchor of [undefined,'latest','0','1.5']){
 test(`rejects a missing or invalid checkpoint anchor: ${anchor}`,async()=>{
  const {evidence,client}=createFixture();evidence.batchSnapshot.blockNumber=anchor;
  await assert.rejects(verifyLiveEvidence(client,evidence),/block|anchor/i);
 });
}

test('a latest checkpoint cannot precede one of its recorded fulfillments',async()=>{
 const {evidence,client}=createFixture();
 evidence.batchSnapshot={blockNumber:'11',available:99,remaining:100,nextDrawIndex:1,nextFulfillIndex:0};
 await assert.rejects(verifyLiveEvidence(client,evidence),/checkpoint|fulfillment/i);
});

for(const kind of ['historicalBatchSnapshots','releaseAuditObservation']){
 test(`validates every ${kind} checkpoint`,async()=>{
  const {evidence,client}=createFixture();
  if(kind==='historicalBatchSnapshots')evidence[kind]=[{blockNumber:'11',available:99,remaining:99,nextDrawIndex:1,nextFulfillIndex:0}];
  else evidence[kind]={batch:{...evidence.batchSnapshot,remaining:98}};
  await assert.rejects(verifyLiveEvidence(client,evidence),/snapshot|checkpoint/i);
 });
}

test('later legitimate draws do not invalidate historical evidence',async()=>{
 const {evidence,client,batches}=createFixture();
 evidence.historicalBatchSnapshots=[{blockNumber:'11',available:99,remaining:100,nextDrawIndex:1,nextFulfillIndex:0}];
 evidence.releaseAuditObservation={batch:{...evidence.batchSnapshot}};
 const latest=batches.get(20n);latest[1]=98;latest[2]=98;latest[7]=2;latest[8]=2;
 const result=await verifyLiveEvidence(client,evidence);
 assert.equal(result.verifiedPulls,1);assert.equal(result.nextFulfillIndex,2);
});

test('unavailable historical state remains unverified',async()=>{
 const {evidence,client}=createFixture();const original=client.readContract;
 client.readContract=async(args)=>{if(args.blockNumber===12n)throw new Error('historical RPC unavailable');return original(args);};
 await assert.rejects(verifyLiveEvidence(client,evidence),/historical RPC unavailable/);
});

test('a stale RPC head cannot precede the verified latest checkpoint',async()=>{
 const {evidence,client}=createFixture();client.getBlockNumber=async()=>11n;
 await assert.rejects(verifyLiveEvidence(client,evidence),/RPC|checkpoint|block/i);
});

test('a release checkpoint must follow its stated Pull fulfillment',async()=>{
 const {evidence,client}=createFixture();
 evidence.releaseAuditObservation={requestId:'1',batch:{blockNumber:'11',available:99,remaining:100,nextDrawIndex:1,nextFulfillIndex:0}};
 await assert.rejects(verifyLiveEvidence(client,evidence),/release|fulfillment|checkpoint/i);
});

test('a release checkpoint must reference a recorded Pull',async()=>{
 const {evidence,client}=createFixture();
 evidence.releaseAuditObservation={requestId:'2',batch:{...evidence.batchSnapshot}};
 await assert.rejects(verifyLiveEvidence(client,evidence),/release|recorded|Pull/i);
});

test('read-only verifier proves request, event and canonical contract agree',async()=>{
 const {evidence,client}=createFixture(); const result=await verifyLiveEvidence(client,evidence);
 assert.equal(result.verifiedPulls,1);assert.equal(result.available,99);
});
test('read-only verifier refuses a different chain',async()=>{
 const {evidence,client}=createFixture();client.getChainId=async()=>1;
 await assert.rejects(verifyLiveEvidence(client,evidence),/chain/i);
});
test('read-only verifier rejects changed inventory metadata',async()=>{
 const {evidence,client}=createFixture();evidence.pulls[0].inventoryIndex=8;
 await assert.rejects(verifyLiveEvidence(client,evidence),/inventory/i);
});
test('read-only verifier rejects unsuccessful fulfillment receipt',async()=>{
 const {evidence,client,receipts}=createFixture();receipts.get(evidence.pulls[0].fulfillmentTransactionHash).status='reverted';
 await assert.rejects(verifyLiveEvidence(client,evidence),/receipt/i);
});
test('read-only verifier rejects mismatched live canonical result',async()=>{
 const {evidence,client,pull}=createFixture();pull[4]=`0x${'ff'.repeat(32)}`;
 await assert.rejects(verifyLiveEvidence(client,evidence),/canonical/i);
});

for (const step of ['operator', 'commitBatch']) {
 test(`read-only verifier rejects unrelated successful ${step} receipts`, async () => {
  const {evidence,client,receipts}=createFixture();
  const receipt=receipts.get(evidence.setupTransactions[step]); receipt.to='0x0000000000000000000000000000000000000009'; receipt.logs=[];
  await assert.rejects(verifyLiveEvidence(client,evidence),/setup|contract|event/i);
 });
 test(`read-only verifier requires the ${step} event from the recorded contract`, async () => {
  const {evidence,client,receipts}=createFixture();
  receipts.get(evidence.setupTransactions[step]).logs[0].address='0x0000000000000000000000000000000000000009';
  await assert.rejects(verifyLiveEvidence(client,evidence),/event/i);
 });
}
