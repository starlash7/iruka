import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer as createHttpServer } from 'node:http';
import { createServer } from 'vite';
import { encodeAbiParameters, encodeEventTopics, encodeFunctionResult, keccak256, stringToHex } from 'viem';
import { giwaPackBatchAbi } from '../src/giwaPackBatch.ts';

const collector = '0x0000000000000000000000000000000000000001';
const contract = '0x0000000000000000000000000000000000000002';
const requestHash = `0x${'11'.repeat(32)}`;
const fulfilledHash = `0x${'22'.repeat(32)}`;
const blockHash = `0x${'33'.repeat(32)}`;
const batchId = keccak256(stringToHex('IRK-MON-2026-001'));
const inventoryId = keccak256(stringToHex('debut-inventory-001'));
const seed = `0x${'44'.repeat(32)}`;

function createEvent(eventName, args, data, hash) {
  return { address: contract, blockHash, blockNumber: '0x10', transactionHash: hash, transactionIndex: '0x0', logIndex: '0x0', removed: false, topics: encodeEventTopics({ abi: giwaPackBatchAbi, eventName, args }), data };
}

test('Monad EVM clients confirm request and canonical fulfillment on the configured RPC before reveal', async () => {
  let fulfilled = false;
  let eventCollector = collector;
  let eventRequestId = 1n;
  let latestBlock = 16n;
  let fulfillmentBlock = 16n;
  let permitWideRange = false;
  const methods = [];
  const pullEvent = createEvent('PullRequested', { requestId: 1n, batchId, collector }, encodeAbiParameters([{ type: 'uint32' }], [0]), requestHash);
  const rpc = createHttpServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    const payload = JSON.parse(body);
    methods.push(payload);
    let result;
    if (payload.method === 'eth_getBalance') result = '0xde0b6b3a7640000';
    else if (payload.method === 'eth_blockNumber') result = `0x${latestBlock.toString(16)}`;
    else if (payload.method === 'eth_call') {
      assert.equal(payload.params[0].to.toLowerCase(), contract);
      result = encodeFunctionResult({ abi: giwaPackBatchAbi, functionName: 'getPull', result: [collector, batchId, seed, 0, inventoryId, 0, fulfilled] });
    } else if (payload.method === 'eth_getLogs') {
      assert.equal(payload.params[0].address.toLowerCase(), contract);
      const fromBlock = BigInt(payload.params[0].fromBlock);
      const toBlock = payload.params[0].toBlock === 'latest' ? latestBlock : BigInt(payload.params[0].toBlock);
      if (!permitWideRange && toBlock - fromBlock + 1n > 100n) {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ jsonrpc: '2.0', id: payload.id, error: { code: -32614, message: 'eth_getLogs is limited to a 100 block range' } }));
        return;
      }
      result = fulfillmentBlock >= fromBlock && fulfillmentBlock <= toBlock
        ? [{ ...createEvent('PullFulfilled', { requestId: eventRequestId, batchId, collector: eventCollector }, encodeAbiParameters([{ type: 'bytes32' }, { type: 'uint32' }, { type: 'uint32' }], [inventoryId, 0, 99]), fulfilledHash), blockNumber: `0x${fulfillmentBlock.toString(16)}` }]
        : [];
    } else if (payload.method === 'eth_getTransactionReceipt') {
      result = { transactionHash: payload.params[0], transactionIndex: '0x0', blockHash, blockNumber: '0x10', from: collector, to: contract, cumulativeGasUsed: '0x5208', gasUsed: '0x5208', effectiveGasPrice: '0x1', contractAddress: null, logs: [pullEvent], logsBloom: `0x${'00'.repeat(256)}`, status: '0x1', type: '0x2' };
    } else { response.writeHead(500); response.end(`Unexpected method ${payload.method}`); return; }
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ jsonrpc: '2.0', id: payload.id, result }));
  });
  await new Promise(resolve => rpc.listen(0, '127.0.0.1', resolve));
  const rpcUrl = `http://127.0.0.1:${rpc.address().port}`;
  const server = await createServer({ appType: 'custom', optimizeDeps: { noDiscovery: true }, define: {
    'import.meta.env.VITE_IRUKA_DEPLOYMENT': JSON.stringify('monad'),
    'import.meta.env.VITE_MONAD_PACK_BATCH_ADDRESS': JSON.stringify(contract),
    'import.meta.env.VITE_MONAD_RPC_URL': JSON.stringify(rpcUrl)
  }, server: { hmr: false, middlewareMode: true } });
  try {
    const pull = await server.ssrLoadModule('/src/giwaPull.ts');
    const fulfillment = await server.ssrLoadModule('/src/giwaFulfillment.ts');
    const balance = await server.ssrLoadModule('/src/giwaBalance.ts');
    const transfer = await server.ssrLoadModule('/src/giwaTransfer.ts');
    const receipt = await pull.confirmGiwaPullRequest({ batchId, contractAddress: contract, requestTransactionHash: requestHash });
    assert.equal(receipt.collector, collector);
    assert.equal(receipt.requestId, 1n);
    assert.equal(receipt.explorerUrl, `https://testnet.monadvision.com/tx/${requestHash}`);
    assert.equal(await fulfillment.readGiwaPullFulfillment(receipt), undefined);
    fulfilled = true;
    eventRequestId = 2n;
    assert.equal(await fulfillment.readGiwaPullFulfillment(receipt), undefined);
    eventRequestId = 1n;
    eventCollector = contract;
    assert.equal(await fulfillment.readGiwaPullFulfillment(receipt), undefined);
    eventCollector = collector;
    assert.deepEqual(await fulfillment.readGiwaPullFulfillment(receipt), {
      explorerUrl: `https://testnet.monadvision.com/tx/${fulfilledHash}`,
      fulfillmentTransactionHash: fulfilledHash, fulfillmentBlockNumber: 16n, inventoryId, inventoryIndex: 0
    });
    await assert.rejects(fulfillment.readGiwaPullFulfillment({ ...receipt, collector: contract }), /match/);
    await assert.rejects(fulfillment.readGiwaPullFulfillment({ ...receipt, batchId: seed }), /match/);
    await assert.rejects(pull.confirmGiwaPullRequest({ batchId: seed, contractAddress: contract, requestTransactionHash: requestHash }), /batch/);
    assert.equal(balance.formatGiwaNativeBalance(await balance.getGiwaNativeBalance(collector)), '1.0000 MON');
    let switchedChain, sentTransaction;
    const transferReceipt = await transfer.sendGiwaNativeTransfer({ address: collector,
      switchChain: async chainId => { switchedChain = chainId; },
      getEthereumProvider: async () => ({ request: async ({ method, params }) => { assert.equal(method, 'eth_sendTransaction'); sentTransaction = params[0]; return requestHash; } })
    }, contract, '0.01');
    assert.equal(switchedChain, 10143);
    assert.equal(sentTransaction.value, '0x2386f26fc10000');
    assert.equal(transferReceipt.explorerUrl, `https://testnet.monadvision.com/tx/${requestHash}`);
    assert.ok(methods.some(call => call.method === 'eth_getLogs'));
    // Restored request is thousands of blocks old; its fulfillment is in the third window.
    latestBlock = 5000n;
    fulfillmentBlock = 250n;
    const scanStart = methods.length;
    assert.deepEqual(await fulfillment.readGiwaPullFulfillment(receipt), {
      explorerUrl: `https://testnet.monadvision.com/tx/${fulfilledHash}`,
      fulfillmentTransactionHash: fulfilledHash, fulfillmentBlockNumber: 250n, inventoryId, inventoryIndex: 0
    });
    const windows = methods.slice(scanStart).filter(call => call.method === 'eth_getLogs').map(call => [BigInt(call.params[0].fromBlock), BigInt(call.params[0].toBlock)]);
    assert.deepEqual(windows, [[16n, 115n], [116n, 215n], [216n, 315n]]);
    assert.ok(windows.every(([from, to]) => to - from + 1n <= 100n));
    await server.close();
    const giwaServer = await createServer({ appType: 'custom', optimizeDeps: { noDiscovery: true }, define: {
      'import.meta.env.VITE_IRUKA_DEPLOYMENT': JSON.stringify('giwa'),
      'import.meta.env.VITE_GIWA_RPC_URL': JSON.stringify(rpcUrl)
    }, server: { hmr: false, middlewareMode: true } });
    try {
      permitWideRange = true;
      const giwaFulfillment = await giwaServer.ssrLoadModule('/src/giwaFulfillment.ts');
      const giwaScanStart = methods.length;
      const result = await giwaFulfillment.readGiwaPullFulfillment(receipt);
      assert.equal(result.explorerUrl, `https://sepolia-explorer.giwa.io/tx/${fulfilledHash}`);
      const giwaLogs = methods.slice(giwaScanStart).filter(call => call.method === 'eth_getLogs');
      assert.equal(giwaLogs.length, 1);
      assert.equal(giwaLogs[0].params[0].toBlock, 'latest');
      assert.equal(methods.slice(giwaScanStart).some(call => call.method === 'eth_blockNumber'), false);
    } finally { await giwaServer.close(); }


  } finally { await server.close(); await new Promise(resolve => rpc.close(resolve)); }
});
