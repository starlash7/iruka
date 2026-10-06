import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';
import { existsSync } from 'node:fs';

test('provides the active deployment descriptor', () => {
  assert.equal(existsSync(new URL('../src/activeDeployment.ts', import.meta.url)), true);
});

const address = '0x0000000000000000000000000000000000000002';
async function loadModules(deployment, configured = address) {
  const server = await createServer({
    appType: 'custom', optimizeDeps: { noDiscovery: true },
    define: { 'import.meta.env.VITE_IRUKA_DEPLOYMENT': JSON.stringify(deployment),
      'import.meta.env.VITE_MONAD_PACK_BATCH_ADDRESS': JSON.stringify(configured) },
    server: { hmr: false, middlewareMode: true }
  });
  try {
    return await Promise.all(['/src/activeDeployment.ts', '/src/giwaPull.ts', '/src/giwaBalance.ts', '/src/vendingData.ts', '/src/giwaPendingPull.ts', '/src/giwaPendingTransfer.ts', '/src/cardCollectionStorage.ts', '/src/giwaFulfillment.ts'].map(path => server.ssrLoadModule(path)));
  } finally { await server.close(); }
}
function storage() {
  const values = new Map();
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
const wallet = '0x0000000000000000000000000000000000000001';
const hash = `0x${'11'.repeat(32)}`;

test('selects Monad explicitly and rejects unknown deployment', async () => {
  const [descriptor] = await loadModules('monad');
  assert.equal(descriptor.activeDeployment.id, 'monad');
  assert.equal(descriptor.activeDeployment.chain.id, 10143);
  assert.equal(descriptor.activeDeployment.chain.nativeCurrency.symbol, 'MON');
  assert.equal(descriptor.activeDeployment.rpcUrl, 'https://testnet-rpc.monad.xyz');
  assert.equal(descriptor.activeDeployment.chain.blockExplorers.default.url, 'https://testnet.monadvision.com');
  assert.throws(() => descriptor.getDeployment({ VITE_IRUKA_DEPLOYMENT: 'wrong' }), /Unknown/);
  assert.equal(descriptor.getDeployment({}).id, 'giwa');
  assert.equal(descriptor.getDeployment({ VITE_IRUKA_DEPLOYMENT: 'monad', VITE_GIWA_PACK_BATCH_ADDRESS: address }).contractAddress, undefined);
});

test('Monad uses its configured contract even in DEV and refuses fixtures', async () => {
  const [descriptor, pull, balance, data] = await loadModules('monad');
  assert.equal(pull.getGiwaPackBatchAddress(address, true), address);
  assert.equal(descriptor.activeDeployment.allowFixturePull, false);
  assert.equal(balance.formatGiwaNativeBalance(0n), '0 MON');
  assert.equal(pull.getGiwaExplorerTransactionUrl(hash), `https://testnet.monadvision.com/tx/${hash}`);
  await assert.rejects(data.pullPack('debut'), /onchain/i);
  assert.equal((await data.getPackDetail('debut')).batchId, 'IRK-MON-2026-001');
  const inventory = await data.getPackInventory('debut', { limit: 100 });
  assert.equal(inventory.items.length, 100);
  assert.deepEqual(inventory.items.map(card => card.id), Array.from({ length: 100 }, (_, i) => `debut-inventory-${String(i + 1).padStart(3, '0')}`));
});

test('Monad routes keeper and rejects a pending contract or batch mismatch', async () => {
  const [descriptor, , , , pending, transfer, collection, fulfill] = await loadModules('monad');
  const { keccak256, stringToHex } = await import('viem');
  const batchId = keccak256(stringToHex(descriptor.activeDeployment.batchLabel));
  const store = storage();
  const record = pending.createPendingGiwaPull({ batchId, contractAddress: address, packId: 'debut', requestTransactionHash: hash, walletAddress: wallet });
  pending.savePendingGiwaPull(store, record);
  assert.deepEqual(pending.getPendingGiwaPull(store, wallet), record);
  assert.ok([...store.values.keys()][0].includes('monad-pull:10143'));
  pending.savePendingGiwaPull(store, { ...record, contractAddress: wallet });
  assert.equal(pending.getPendingGiwaPull(store, wallet), undefined);
  pending.savePendingGiwaPull(store, { ...record, batchId: hash });
  assert.equal(pending.getPendingGiwaPull(store, wallet), undefined);
  const transaction = transfer.createPendingGiwaTransfer({ direction: 'withdraw', transactionHash: hash, walletAddress: wallet });
  transfer.savePendingGiwaTransfer(store, transaction);
  assert.deepEqual(transfer.getPendingGiwaTransfer(store, wallet), transaction);
  assert.ok([...store.values.keys()].some(key => key.includes('monad-transfer:10143')));
  collection.saveWalletCardCollection(store, wallet, []);
  assert.ok([...store.values.keys()].some(key => key.includes('collection:monad:10143')));
  let url, body;
  await fulfill.triggerGiwaPullFulfillment({ requestId: 1n }, async (input, init) => { url = input; body = init.body; return { ok: true, status: 202 }; });
  assert.equal(url, '/api/monad/fulfill');
  assert.deepEqual(JSON.parse(body), { requestId: '1' });
});

test('keeps exact GIWA inventory order and legacy storage namespaces', async () => {
  const [giwa, , , giwaData, giwaPending, giwaTransfer, giwaCollection] = await loadModules('giwa');
  const [, , , monadData] = await loadModules('monad');
  assert.equal(giwa.activeDeployment.chain.id, 91342);
  assert.equal(giwa.activeDeployment.allowFixturePull, true);
  assert.deepEqual((await giwaData.getPackInventory('debut', { limit: 100 })).items, (await monadData.getPackInventory('debut', { limit: 100 })).items);
  const store = storage();
  giwaPending.savePendingGiwaPull(store, giwaPending.createPendingGiwaPull({ batchId: hash, contractAddress: address, packId: 'debut', requestTransactionHash: hash, walletAddress: wallet }));
  giwaTransfer.savePendingGiwaTransfer(store, giwaTransfer.createPendingGiwaTransfer({ direction: 'deposit', transactionHash: hash, walletAddress: wallet }));
  giwaCollection.saveWalletCardCollection(store, wallet, []);
  assert.deepEqual([...store.values.keys()], [`iruka:giwa-pull:91342:${wallet}`, `iruka:giwa-transfer:91342:${wallet}`, `iruka:collection:91342:${wallet}`]);
});

test('persisted card provenance survives JSON round-trip without custody claims', async () => {
  const server = await createServer({ appType: 'custom', optimizeDeps: { noDiscovery: true }, server: { hmr: false, middlewareMode: true } });
  try {
    const { createGiwaVendingPull } = await server.ssrLoadModule('/src/giwaInventory.ts');
    const { createVendingCardPull } = await server.ssrLoadModule('/src/cardFlow.tsx');
    const { getPackInventory } = await server.ssrLoadModule('/src/vendingData.ts');
    const { getInventoryCommitmentId } = await server.ssrLoadModule('/src/giwaPackBatch.ts');
    const { saveWalletCardCollection, getWalletCardCollection } = await server.ssrLoadModule('/src/cardCollectionStorage.ts');
    const inventory = (await getPackInventory('debut', { limit: 1 })).items[0];
    const fulfillment = { explorerUrl: `https://sepolia-explorer.giwa.io/tx/${hash}`, fulfillmentTransactionHash: hash, inventoryId: getInventoryCommitmentId(inventory.id), inventoryIndex: 0 };
    const receipt = { collector: wallet, batchId: getInventoryCommitmentId('IRK-GG-2026-001'), contractAddress: address, drawIndex: 0, explorerUrl: fulfillment.explorerUrl, requestId: 9007199254740993n, requestBlockNumber: 123456n, requestTransactionHash: hash };
    const pull = await createGiwaVendingPull('debut', fulfillment, receipt);
    const card = createVendingCardPull(pull, 'Debut');
    assert.equal(card.onchainReceipt.requestId, '9007199254740993');
    assert.equal(card.onchainReceipt.requestBlockNumber, '123456');
    assert.equal(card.onchainReceipt.requestTransactionHash, hash);
    assert.equal(card.onchainReceipt.fulfillmentTransactionHash, hash);
    assert.equal(card.onchainReceipt.chainId, 91342);
    assert.equal(card.onchainReceipt.deployment, 'giwa');
    assert.equal(card.onchainReceipt.inventoryId, fulfillment.inventoryId);
    assert.equal(card.vaultStatus, 'Pulled');
    assert.deepEqual(card.redemption, { eligible: false, shipmentAvailable: false });
    const { getStoredRevealReceipt } = await server.ssrLoadModule('/src/pullReceiptStorage.ts');
    assert.deepEqual(getStoredRevealReceipt(card.onchainReceipt, wallet), { explorerUrl: fulfillment.explorerUrl, requestId: receipt.requestId });
    assert.equal(getStoredRevealReceipt(card.onchainReceipt, address), undefined);
    assert.equal(getStoredRevealReceipt({ ...card.onchainReceipt, deployment: 'monad', chainId: 10143 }, wallet), undefined);
    const store = storage();
    saveWalletCardCollection(store, address, [card]);
    assert.deepEqual(getWalletCardCollection(store, address), []);
    saveWalletCardCollection(store, wallet, [card]);
    assert.deepEqual(getWalletCardCollection(store, wallet), JSON.parse(JSON.stringify([card])));
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { PackRevealOverlay } = await server.ssrLoadModule('/src/features/pack-reveal/PackRevealOverlay.tsx');
    const { createRevealCard } = await server.ssrLoadModule('/src/cardFlow.tsx');
    const { copy } = await server.ssrLoadModule('/src/appCopy.ts');
    const restoredCard = getWalletCardCollection(store, wallet)[0];
    const markup = renderToStaticMarkup(React.createElement(PackRevealOverlay, {
      cards: [createRevealCard(restoredCard, 'Common')], labels: copy.en.revealOverlay,
      packTier: 'Debut', summaryOnly: true, onComplete: () => {},
      receipt: getStoredRevealReceipt(restoredCard.onchainReceipt, wallet)
    }));
    assert.ok(markup.includes('data-scene="summary"'));
    assert.ok(markup.includes(`href="${fulfillment.explorerUrl}"`));
    assert.ok(markup.includes('#9007199254740993'));
    assert.ok(!markup.includes('pack-reveal-skip'));

    const legacy = { ...card }; delete legacy.onchainReceipt;
    saveWalletCardCollection(store, wallet, [legacy]);
    assert.deepEqual(getWalletCardCollection(store, wallet), JSON.parse(JSON.stringify([legacy])));
    await assert.rejects(createGiwaVendingPull('debut', { ...fulfillment, inventoryId: hash }, receipt), /commitment/);
  } finally { await server.close(); }
});

test('stores completed receipt evidence before removing pending recovery state', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const completion = source.slice(source.indexOf('  function completePendingReveal()'), source.indexOf('  function updateCardStatus('));
  assert.ok(completion.includes('saveWalletCardCollection('));
  assert.ok(completion.indexOf('saveWalletCardCollection(') < completion.indexOf('clearPendingGiwaPull('));
});


test('collection selection reuses Summary with the stored fulfillment receipt', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(source, /onSelectCard=\{selectCollectedCard\}/);
  assert.match(source, /summaryOnly/);
  assert.match(source, /getStoredRevealReceipt\(/);
});

test('Monad missing configuration cannot inherit GIWA or request a fixture pull', async () => {
  const [descriptor, pull, , data] = await loadModules('monad', '');
  assert.equal(descriptor.activeDeployment.contractAddress, undefined);
  assert.equal(pull.getGiwaPackBatchAddress(), undefined);
  let switched = false;
  await assert.rejects(pull.requestGiwaPull({ address: wallet, switchChain: async () => { switched = true; } }, { batchId: 'IRK-MON-2026-001' }), /not configured/);
  assert.equal(switched, false);
  await assert.rejects(data.pullPack('debut'), /onchain/);
});
