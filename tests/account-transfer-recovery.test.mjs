import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let server, AccountView, storageModule, effects, timers, wait, attempts;
const walletAddress = '0x0000000000000000000000000000000000000001';
const hash = `0x${'33'.repeat(32)}`;
before(async () => {
  globalThis.captureRecoveryEffect = effect => effects.push(effect);
  globalThis.waitForRecoveryReceipt = (...args) => { attempts++; return wait(...args); };
  server = await createServer({
    appType: 'custom', optimizeDeps: { noDiscovery: true },
    plugins: [{ name: 'capture-recovery-effects', enforce: 'pre', transform(code, id) {
      if (id.endsWith('/src/AccountView.tsx')) return code.replace(/\buseEffect\(/g, 'globalThis.captureRecoveryEffect(').replace('useState<PendingGiwaTransfer>()', 'useState<PendingGiwaTransfer>(globalThis.initialRecoveryPending)');
      if (id.endsWith('/src/AccountPage.tsx')) return 'export function AccountPage() { return null; }';
      if (id.endsWith('/src/giwaBalance.ts')) return 'export const getGiwaNativeBalance = async () => 0n; export const formatGiwaNativeBalance = () => "0";';
      if (id.endsWith('/src/giwaTransfer.ts')) return `
        export class GiwaTransferRevertedError extends Error {}
        export const waitForGiwaNativeTransfer = (...args) => globalThis.waitForRecoveryReceipt(...args);
        export const sendGiwaNativeTransfer = () => { throw new Error('No signing in this test'); };
      `;
    } }], server: { hmr: false, middlewareMode: true }
  });
  ({ AccountView } = await server.ssrLoadModule('/src/AccountView.tsx'));
  storageModule = await server.ssrLoadModule('/src/giwaPendingTransfer.ts');
});
after(async () => {
  delete globalThis.window;
  delete globalThis.initialRecoveryPending;
  delete globalThis.captureRecoveryEffect;
  delete globalThis.waitForRecoveryReceipt;
  await server?.close();
});
function mountPendingAccount(memoryOnly = false) {
  effects = []; timers = new Map(); attempts = 0;
  const values = new Map();
  globalThis.window = { localStorage: {
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key)
  }, setTimeout: fn => { const id = Symbol(); timers.set(id, fn); return id; },
  clearTimeout: id => timers.delete(id) };
  const transfer = storageModule.createPendingGiwaTransfer({
    direction: 'withdraw', transactionHash: hash, walletAddress
  });
  globalThis.initialRecoveryPending = memoryOnly ? transfer : undefined;
  if (memoryOnly) {
    window.localStorage.getItem = window.localStorage.setItem = () => { throw new Error("Storage denied"); };
  } else storageModule.savePendingGiwaTransfer(undefined, transfer);
  renderToStaticMarkup(React.createElement(AccountView, {
    wallet: { address: walletAddress }, cards: [], copy: {}, inventoryContent: null,
    onConnectExternalWallet: () => {}
  }));
  return effects[1]();
}
const flush = () => new Promise(resolve => setImmediate(resolve));
test('restored transfer retries a transient RPC failure and clears after confirmation', async () => {
  wait = async () => { if (attempts === 1) throw new Error('RPC unavailable'); return { transactionHash: hash }; };
  const cleanup = mountPendingAccount();
  try {
    await flush();
    assert.equal(attempts, 1);
    assert.equal(timers.size, 1, 'transient failure must schedule confirmation retry');
    const [id, retry] = timers.entries().next().value; timers.delete(id); retry();
    await flush();
    assert.equal(attempts, 2);
    assert.equal(storageModule.getPendingGiwaTransfer(undefined, walletAddress), undefined);
    assert.equal(timers.size, 0);
  } finally { cleanup?.(); }
});
test('account cleanup cancels confirmation retries without discarding the pending hash', async () => {
  wait = async () => { throw new Error('RPC unavailable'); };
  const cleanup = mountPendingAccount();
  await flush();
  assert.equal(timers.size, 1);
  cleanup();
  assert.equal(timers.size, 0);
  assert.equal(attempts, 1);
  assert.equal(storageModule.getPendingGiwaTransfer(undefined, walletAddress).transactionHash, hash);
});


test('submitted in-memory transfer keeps recovering when browser storage is denied', async () => {
  wait = async () => { throw new Error('RPC unavailable'); };
  const cleanup = mountPendingAccount(true);
  try {
    await flush();
    assert.equal(attempts, 1, 'memory-only submitted hash must still be confirmed');
    assert.equal(timers.size, 1, 'RPC outage cannot discard memory-only pending state');
  } finally { cleanup?.(); }
});
