import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createPublicClient, http, parseEventLogs } from 'viem';
import { monadTestnet } from 'viem/chains';
import { giwaPackBatchAbi as abi } from '../../src/giwaPackBatch.ts';

const normalize = (value) => value?.toLowerCase();

export async function verifyLiveEvidence(client, evidence) {
  assert.equal(evidence.chainId, 10143, 'Evidence must describe Monad Testnet');
  assert.equal(await client.getChainId(), evidence.chainId, 'RPC chain does not match evidence');
  const code = await client.getBytecode({ address: evidence.contract });
  assert.ok(code && code !== '0x', 'Contract must have deployed code');
  for (const [step, hash] of Object.entries(evidence.setupTransactions)) {
    const receipt = await client.getTransactionReceipt({ hash });
    assert.equal(receipt.status, 'success', `${step} receipt failed`);
    assert.equal(normalize(receipt.transactionHash), normalize(hash), `${step} receipt hash differs`);
    if (step === 'deployment') {
      assert.equal(normalize(receipt.contractAddress), normalize(evidence.contract), 'Deployment address differs');
    }
  }
  const batch = await client.readContract({ address: evidence.contract, abi, functionName: 'getBatch', args: [evidence.batch.id] });
  assert.equal(batch[0], evidence.batch.initialSupply, 'Batch supply differs');
  assert.equal(batch[3].toString(), evidence.batch.priceWei, 'Batch price differs');
  assert.equal(normalize(batch[4]), normalize(evidence.batch.inventoryRoot), 'Inventory root differs');
  assert.equal(normalize(batch[6]), normalize(evidence.batch.drawSeedRoot), 'Draw-seed root differs');
  assert.ok(batch[1] <= batch[0] && batch[2] <= batch[0], 'Batch counters exceed supply');
  const inventoryIndices = new Set();
  for (const entry of evidence.pulls) {
    const requestId = BigInt(entry.requestId);
    const [requested, fulfilled, pull] = await Promise.all([
      client.getTransactionReceipt({ hash: entry.requestTransactionHash }),
      client.getTransactionReceipt({ hash: entry.fulfillmentTransactionHash }),
      client.readContract({ address: evidence.contract, abi, functionName: 'getPull', args: [requestId] })
    ]);
    for (const [name, receipt, hash, block] of [
      ['Request', requested, entry.requestTransactionHash, entry.requestBlock],
      ['Fulfillment', fulfilled, entry.fulfillmentTransactionHash, entry.fulfillmentBlock]
    ]) {
      assert.equal(receipt.status, 'success', `${name} receipt failed for #${requestId}`);
      assert.equal(normalize(receipt.transactionHash), normalize(hash), `${name} receipt hash differs`);
      assert.equal(receipt.blockNumber.toString(), block, `${name} block differs`);
    }
    const logs = (receipt, eventName) => parseEventLogs({ abi, eventName,
      logs: receipt.logs.filter(log => normalize(log.address) === normalize(evidence.contract)) });
    const request = logs(requested, 'PullRequested').find(log => log.args.requestId === requestId);
    const fulfillment = logs(fulfilled, 'PullFulfilled').find(log => log.args.requestId === requestId);
    assert.ok(request && fulfillment, `Matching events missing for #${requestId}`);
    for (const event of [request, fulfillment]) {
      assert.equal(normalize(event.args.batchId), normalize(evidence.batch.id), 'Event batch differs');
      assert.equal(normalize(event.args.collector), normalize(entry.collector), 'Event collector differs');
    }
    assert.equal(request.args.drawIndex, entry.drawIndex, 'Reserved draw differs');
    assert.equal(normalize(fulfillment.args.inventoryId), normalize(entry.inventoryId), 'Event inventory ID differs');
    assert.equal(fulfillment.args.inventoryIndex, entry.inventoryIndex, 'Event inventory index differs');
    assert.equal(normalize(pull[0]), normalize(entry.collector), 'Canonical collector differs');
    assert.equal(normalize(pull[1]), normalize(evidence.batch.id), 'Canonical batch differs');
    assert.equal(pull[3], entry.drawIndex, 'Canonical draw differs');
    assert.equal(normalize(pull[4]), normalize(entry.inventoryId), 'Canonical inventory ID differs');
    assert.equal(pull[5], entry.inventoryIndex, 'Canonical inventory index differs');
    assert.equal(pull[6], true, 'Canonical Pull is not fulfilled');
    assert.ok(!inventoryIndices.has(entry.inventoryIndex), 'Inventory was assigned twice');
    inventoryIndices.add(entry.inventoryIndex);
  }
  return { chainId: evidence.chainId, contract: evidence.contract, verifiedPulls: evidence.pulls.length,
    available: batch[1], remaining: batch[2], nextDrawIndex: batch[7], nextFulfillIndex: batch[8] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const evidence = JSON.parse(await readFile(new URL('../../docs/evidence/monad-testnet.json', import.meta.url), 'utf8'));
  const client = createPublicClient({ chain: monadTestnet, transport: http(process.env.MONAD_TESTNET_RPC_URL ?? 'https://testnet-rpc.monad.xyz') });
  const result = await verifyLiveEvidence(client, evidence);
  console.log(JSON.stringify({ status: 'verified', observedAt: new Date().toISOString(), ...result }, null, 2));
}
