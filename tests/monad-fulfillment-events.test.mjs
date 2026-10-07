import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, test } from 'node:test';
import { createServer as createHttpServer } from 'node:http';
import { createServer } from 'vite';
import { decodeFunctionData, encodeAbiParameters, encodeEventTopics, encodeFunctionResult } from 'viem';
import { giwaPackBatchAbi } from '../src/giwaPackBatch.ts';

const collector = '0x0000000000000000000000000000000000000001';
const contract = '0x0000000000000000000000000000000000000002';
const otherAddress = '0x0000000000000000000000000000000000000003';
const batchId = `0x${'11'.repeat(32)}`;
const inventoryId = `0x${'22'.repeat(32)}`;
const otherId = `0x${'33'.repeat(32)}`;
const fulfillmentHash = `0x${'44'.repeat(32)}`;
const receipt = {
  collector, contractAddress: contract, batchId, drawIndex: 7,
  requestId: 9007199254740993n, requestBlockNumber: 10n,
  requestTransactionHash: `0x${'55'.repeat(32)}`
};
let rpc, vite, readFulfillment, waitForFulfillment, state, calls, rpcFailures;
let requestSequence = 0;

function createLog(overrides = {}) {
  const args = { requestId: receipt.requestId, batchId, collector, inventoryId, inventoryIndex: 4, ...overrides };
  return {
    address: contract, blockHash: otherId, blockNumber: `0x${(overrides.blockNumber ?? 10n).toString(16)}`,
    transactionHash: fulfillmentHash, transactionIndex: '0x0', logIndex: '0x0', removed: false,
    topics: encodeEventTopics({ abi: giwaPackBatchAbi, eventName: 'PullFulfilled', args }),
    data: encodeAbiParameters([{ type: 'bytes32' }, { type: 'uint32' }, { type: 'uint32' }], [args.inventoryId, args.inventoryIndex, 99])
  };
}

function getWindows() {
  return calls.filter(call => call.method === 'eth_getLogs')
    .map(call => [BigInt(call.params[0].fromBlock), BigInt(call.params[0].toBlock)]);
}

before(async () => {
  rpc = createHttpServer(async (request, response) => {
    let payload;
    response.setHeader('content-type', 'application/json');
    try {
      let body = '';
      for await (const chunk of request) body += chunk;
      payload = JSON.parse(body);
      calls.push(payload);
      if (payload.method === state.rpcErrorMethod) {
        response.end(JSON.stringify({ jsonrpc: '2.0', id: payload.id, error: { code: -32602, message: 'RPC unavailable for this method' } }));
        return;
      }
      let result;
      if (payload.method === 'eth_call') {
        assert.equal(payload.params[0].to.toLowerCase(), contract);
        const decoded = decodeFunctionData({ abi: giwaPackBatchAbi, data: payload.params[0].data });
        assert.equal(decoded.functionName, 'getPull');
        assert.deepEqual(decoded.args, [receipt.requestId]);
        result = encodeFunctionResult({ abi: giwaPackBatchAbi, functionName: 'getPull', result: [
          state.collector, state.batchId, otherId, state.drawIndex,
          state.inventoryId, state.inventoryIndex, state.fulfilled
        ] });
      } else if (payload.method === 'eth_blockNumber') {
        result = `0x${state.latestBlock.toString(16)}`;
      } else if (payload.method === 'eth_getLogs') {
        const filter = payload.params[0];
        assert.equal(filter.address.toLowerCase(), contract);
        assert.deepEqual(filter.topics, encodeEventTopics({ abi: giwaPackBatchAbi, eventName: 'PullFulfilled', args: { requestId: receipt.requestId } }));
        const from = BigInt(filter.fromBlock), to = BigInt(filter.toBlock);
        assert.ok(to >= from && to - from + 1n <= 100n, 'RPC accepts at most 100 inclusive blocks');
        assert.ok(to <= state.latestBlock, 'scan does not exceed the known chain head');
        if (from === state.failFromBlock) {
          response.end(JSON.stringify({ jsonrpc: '2.0', id: payload.id, error: { code: -32602, message: 'Late page unavailable' } }));
          return;
        }
        if (from === state.hangFromBlock) {
          state.hangingResponse = response;
          response.on('close', () => { state.requestAborted = true; state.onClose?.(); });
          state.onHang?.();
          return;
        }
        // Deliberately leave mismatched request topics in the response to test viem decoding/filtering too.
        result = state.logs.filter(log => BigInt(log.blockNumber) >= from && BigInt(log.blockNumber) <= to);
      } else {
        throw new Error(`Unexpected RPC method ${payload.method}`);
      }
      response.end(JSON.stringify({ jsonrpc: '2.0', id: payload.id, result }));
    } catch (error) {
      rpcFailures.push(error);
      response.end(JSON.stringify({ jsonrpc: '2.0', id: payload?.id, error: { code: -32602, message: error.message } }));
    }
  });
  await new Promise(resolve => rpc.listen(0, '127.0.0.1', resolve));
  vite = await createServer({ appType: 'custom', optimizeDeps: { noDiscovery: true }, define: {
    'import.meta.env.VITE_IRUKA_DEPLOYMENT': JSON.stringify('monad'),
    'import.meta.env.VITE_MONAD_PACK_BATCH_ADDRESS': JSON.stringify(contract),
    'import.meta.env.VITE_MONAD_RPC_URL': JSON.stringify(`http://127.0.0.1:${rpc.address().port}`)
  }, server: { hmr: false, middlewareMode: true } });
  ({ readGiwaPullFulfillment: readFulfillment, waitForGiwaPullFulfillment: waitForFulfillment } = await vite.ssrLoadModule('/src/giwaFulfillment.ts'));
});

beforeEach(() => {
  calls = [];
  rpcFailures = [];
  receipt.requestTransactionHash = `0x${(++requestSequence).toString(16).padStart(64, '0')}`;
  state = { collector, batchId, drawIndex: 7, inventoryId, inventoryIndex: 4, fulfilled: true, latestBlock: 10n, logs: [createLog()] };
});
afterEach(() => {
  state.hangingResponse?.destroy();
  assert.deepEqual(rpcFailures, [], 'local RPC contract assertions passed');
});
after(async () => {
  await vite?.close();
  if (rpc) await new Promise(resolve => rpc.close(resolve));
});

test('returns canonical Monad fulfillment evidence with a precise bigint request ID', async () => {
  assert.deepEqual(await readFulfillment(receipt), {
    fulfillmentBlockNumber: 10n, fulfillmentTransactionHash: fulfillmentHash,
    explorerUrl: `https://testnet.monadvision.com/tx/${fulfillmentHash}`, inventoryId, inventoryIndex: 4
  });
  assert.deepEqual(getWindows(), [[10n, 10n]]);
});

test('unfulfilled canonical state returns pending without block or event RPC reads', async () => {
  state.fulfilled = false;
  assert.equal(await readFulfillment(receipt), undefined);
  assert.deepEqual(calls.map(call => call.method), ['eth_call']);
});

for (const [field, value] of [['collector', otherAddress], ['batchId', otherId], ['drawIndex', 8]]) {
  test(`rejects canonical ${field} mismatch before scanning fulfillment events`, async () => {
    state[field] = value;
    await assert.rejects(readFulfillment(receipt), /does not match the reserved draw/);
    assert.deepEqual(calls.map(call => call.method), ['eth_call']);
  });
}

for (const [field, value] of [['collector', otherAddress], ['batchId', otherId], ['inventoryId', otherId], ['inventoryIndex', 5], ['requestId', receipt.requestId + 1n]]) {
  test(`rejects an event with mismatched ${field} despite fulfilled contract state`, async () => {
    state.logs = [createLog({ [field]: value })];
    assert.equal(await readFulfillment(receipt), undefined);
    assert.deepEqual(getWindows(), [[10n, 10n]]);
  });
}

test('skips mismatched candidates and selects the matching fulfillment event', async () => {
  state.logs = [createLog({ inventoryIndex: 5 }), createLog()];
  assert.equal((await readFulfillment(receipt)).fulfillmentTransactionHash, fulfillmentHash);
});

for (const blockNumber of [109n, 110n, 209n, 210n]) {
  test(`includes fulfillment at pagination boundary block ${blockNumber} without gaps`, async () => {
    state.latestBlock = 210n;
    state.logs = [createLog({ blockNumber })];
    assert.equal((await readFulfillment(receipt)).fulfillmentBlockNumber, blockNumber);
    const expected = [[10n, 109n], [110n, 209n], [210n, 210n]];
    assert.deepEqual(getWindows(), expected.slice(0, blockNumber <= 109n ? 1 : blockNumber <= 209n ? 2 : 3));
  });
}

test('exhausts all inclusive windows and a partial final window when no event exists', async () => {
  state.latestBlock = 245n;
  state.logs = [];
  assert.equal(await readFulfillment(receipt), undefined);
  assert.deepEqual(getWindows(), [[10n, 109n], [110n, 209n], [210n, 245n]]);
});

test('does not scan a request ahead of the reported chain head', async () => {
  state.latestBlock = 9n;
  assert.equal(await readFulfillment(receipt), undefined);
  assert.deepEqual(getWindows(), []);
});

test('does not invent receipt evidence for a matching event without a transaction hash', async () => {
  state.logs = [{ ...createLog(), transactionHash: null }];
  assert.equal(await readFulfillment(receipt), undefined);
});

for (const method of ['eth_call', 'eth_blockNumber', 'eth_getLogs']) {
  test(`propagates ${method} RPC failure without returning a result`, async () => {
    state.rpcErrorMethod = method;
    await assert.rejects(readFulfillment(receipt), /RPC unavailable for this method/);
  });
}

test('Resume retries the failed late page without repeating completed empty windows', async () => {
  state.latestBlock = 245n;
  state.failFromBlock = 210n;
  state.logs = [createLog({ blockNumber: 240n })];
  await assert.rejects(readFulfillment(receipt), /Late page unavailable/);
  assert.deepEqual(getWindows(), [[10n, 109n], [110n, 209n], [210n, 245n]]);
  calls = [];
  state.failFromBlock = undefined;
  assert.equal((await readFulfillment(receipt)).fulfillmentBlockNumber, 240n);
  assert.deepEqual(getWindows(), [[210n, 245n]]);
});

test('changed canonical inventory resets retained scan progress', async () => {
  state.latestBlock = 245n;
  state.failFromBlock = 210n;
  state.logs = [];
  await assert.rejects(readFulfillment(receipt), /Late page unavailable/);
  calls = [];
  state.failFromBlock = undefined;
  state.inventoryId = otherId;
  state.logs = [createLog({ inventoryId: otherId, blockNumber: 20n })];
  assert.equal((await readFulfillment(receipt)).inventoryId, otherId);
  assert.deepEqual(getWindows(), [[10n, 109n]]);
});

test('a regressed chain head resets retained scan progress', async () => {
  state.latestBlock = 245n;
  state.failFromBlock = 210n;
  state.logs = [];
  await assert.rejects(readFulfillment(receipt), /Late page unavailable/);
  calls = [];
  state.failFromBlock = undefined;
  state.latestBlock = 150n;
  state.logs = [createLog({ blockNumber: 20n })];
  assert.equal((await readFulfillment(receipt)).fulfillmentBlockNumber, 20n);
  assert.deepEqual(getWindows(), [[10n, 109n]]);
});

test('deadline aborts a real hanging RPC page and Resume continues from that page', async () => {
  state.latestBlock = 245n;
  state.logs = [createLog({ blockNumber: 240n })];
  state.hangFromBlock = 210n;
  const hanging = new Promise(resolve => { state.onHang = resolve; });
  const closed = new Promise(resolve => { state.onClose = resolve; });
  const operation = waitForFulfillment(receipt, {
    timeoutMs: 100, triggerFulfillment: async () => {}
  });
  assert.equal(await Promise.race([hanging.then(() => 'hanging'), operation.then(() => 'settled')]), 'hanging');
  let fallbackTimer;
  const result = await Promise.race([operation, new Promise(resolve => { fallbackTimer = setTimeout(() => resolve('deadline missed'), 350); })]);
  clearTimeout(fallbackTimer);
  assert.equal(result, undefined);
  await Promise.race([closed, new Promise(resolve => { fallbackTimer = setTimeout(resolve, 200); })]);
  clearTimeout(fallbackTimer);
  assert.equal(state.requestAborted, true, 'the actual HTTP request was aborted');
  calls = [];
  state.hangFromBlock = undefined;
  assert.equal((await readFulfillment(receipt)).fulfillmentBlockNumber, 240n);
  assert.deepEqual(getWindows(), [[210n, 245n]]);
});

test('canonical mismatch invalidates a previously retained scan cursor', async () => {
  state.latestBlock = 245n;
  state.failFromBlock = 210n;
  state.logs = [];
  await assert.rejects(readFulfillment(receipt), /Late page unavailable/);
  await assert.rejects(readFulfillment({ ...receipt, drawIndex: 8 }), /does not match/);
  calls = [];
  state.failFromBlock = undefined;
  state.logs = [createLog({ blockNumber: 20n })];
  assert.equal((await readFulfillment(receipt)).fulfillmentBlockNumber, 20n);
  assert.deepEqual(getWindows(), [[10n, 109n]]);
});

test('complete no-event scans reset the cursor so delayed indexing can recover earlier logs', async () => {
  state.latestBlock = 245n;
  state.failFromBlock = 210n;
  state.logs = [];
  await assert.rejects(readFulfillment(receipt), /Late page unavailable/);
  state.failFromBlock = undefined;
  assert.equal(await readFulfillment(receipt), undefined);
  calls = [];
  state.logs = [createLog({ blockNumber: 20n })];
  assert.equal((await readFulfillment(receipt)).fulfillmentBlockNumber, 20n);
  assert.deepEqual(getWindows(), [[10n, 109n]]);
});

test('retained cursor cache evicts older interrupted requests when full', async () => {
  state.latestBlock = 200n;
  state.failFromBlock = 110n;
  state.logs = [];
  const firstReceipt = { ...receipt };
  await assert.rejects(readFulfillment(firstReceipt), /Late page unavailable/);
  for (let index = 0; index < 32; index += 1) {
    await assert.rejects(readFulfillment({ ...receipt, requestTransactionHash: `0x${(10000 + index).toString(16).padStart(64, '0')}` }), /Late page unavailable/);
  }
  calls = [];
  state.failFromBlock = undefined;
  state.logs = [createLog({ blockNumber: 20n })];
  assert.equal((await readFulfillment(firstReceipt)).fulfillmentBlockNumber, 20n);
  assert.deepEqual(getWindows(), [[10n, 109n]]);
});
