import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let server, AccountView, accountProps;
before(async () => {
  globalThis.captureTransferAccountProps = props => { accountProps = props; };
  server = await createServer({
    appType: 'custom', optimizeDeps: { noDiscovery: true },
    plugins: [{ name: 'capture-account-page-props', enforce: 'pre', transform(_code, id) {
      if (id.endsWith('/src/AccountPage.tsx')) {
        return 'export function AccountPage(props) { globalThis.captureTransferAccountProps(props); return null; }';
      }
    } }],
    server: { hmr: false, middlewareMode: true }
  });
  ({ AccountView } = await server.ssrLoadModule('/src/AccountView.tsx'));
});
after(async () => {
  delete globalThis.captureTransferAccountProps;
  await server?.close();
});

function renderDeferredAccount(transferLock) {
  let switchCount = 0, rejectSwitch;
  const busyChanges = [];
  const wallet = {
    address: '0x0000000000000000000000000000000000000001',
    switchChain: () => {
      switchCount += 1;
      if (switchCount > 1) return Promise.reject(new Error('unexpected additional wallet prompt'));
      return new Promise((_resolve, reject) => { rejectSwitch = reject; });
    },
    getEthereumProvider: async () => { throw new Error('test must stop before provider access'); }
  };
  renderToStaticMarkup(React.createElement(AccountView, {
    wallet, transferLock, externalWallet: { ...wallet, address: '0x0000000000000000000000000000000000000002' },
    cards: [], copy: {}, inventoryContent: null, onConnectExternalWallet: () => {},
    onTransferBusyChange: busy => busyChanges.push(busy)
  }));
  return { props: accountProps, busyChanges, getSwitchCount: () => switchCount,
    cancelApproval: () => rejectSwitch(new Error('approval cancelled')) };
}

for (const direction of ['withdraw', 'deposit']) {
  test(`rejects overlapping ${direction} before the first transfer has a transaction hash`, async () => {
    const account = renderDeferredAccount();
    const first = account.props.onWithdrawTransfer('0x0000000000000000000000000000000000000003', '0.001');
    first.catch(() => {});
    try {
      assert.deepEqual(account.busyChanges, [true]);
      const overlap = direction === 'withdraw'
        ? account.props.onWithdrawTransfer('0x0000000000000000000000000000000000000004', '0.002')
        : account.props.onAddFundsTransfer('0.002');
      await assert.rejects(overlap, /already confirming/);
      assert.equal(account.getSwitchCount(), 1);
      assert.deepEqual(account.busyChanges, [true], 'rejected overlap cannot release the first transfer lock');
    } finally {
      account.cancelApproval();
      await assert.rejects(first, /approval cancelled/);
    }
    assert.deepEqual(account.busyChanges, [true, false]);
  });
}

test('approval rejection releases the guard so a later attempt reaches the wallet', async () => {
  const account = renderDeferredAccount();
  const first = account.props.onWithdrawTransfer('0x0000000000000000000000000000000000000003', '0.001');
  account.cancelApproval();
  await assert.rejects(first, /approval cancelled/);
  await assert.rejects(account.props.onWithdrawTransfer('0x0000000000000000000000000000000000000003', '0.001'), /unexpected additional wallet prompt/);
  assert.equal(account.getSwitchCount(), 2);
  assert.deepEqual(account.busyChanges, [true, false, true, false]);
});

for (const direction of ['withdraw', 'deposit']) {
  test(`keeps the ${direction} lock when Account remounts before a hash`, async () => {
    const transferLock = { current: false };
    const firstAccount = renderDeferredAccount(transferLock);
    const first = firstAccount.props.onWithdrawTransfer('0x0000000000000000000000000000000000000003', '0.001');
    first.catch(() => {});
    const remounted = renderDeferredAccount(transferLock);
    let overlap;
    try {
      overlap = direction === 'withdraw'
        ? remounted.props.onWithdrawTransfer('0x0000000000000000000000000000000000000004', '0.002')
        : remounted.props.onAddFundsTransfer('0.002');
      overlap.catch(() => {});
      assert.equal(remounted.getSwitchCount(), 0, 'remount cannot issue a second wallet approval');
      await assert.rejects(overlap, /already confirming/);
      assert.equal(remounted.props.transferPending, true);
      assert.deepEqual(remounted.busyChanges, []);
      assert.equal(transferLock.current, true);
    } finally {
      if (remounted.getSwitchCount()) remounted.cancelApproval();
      firstAccount.cancelApproval();
      await assert.rejects(first, /approval cancelled/);
      if (overlap) await overlap.catch(() => {});
    }
    assert.equal(transferLock.current, false);
    assert.deepEqual(firstAccount.busyChanges, [true, false]);
  });
}


test('blocks a pending hash saved after Account remounts even if the shared approval lock cleared', async () => {
  const account = renderDeferredAccount({ current: false });
  const values = new Map();
  const previousWindow = globalThis.window;
  globalThis.window = { localStorage: { getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) } };
  const { createPendingGiwaTransfer, savePendingGiwaTransfer } = await server.ssrLoadModule('/src/giwaPendingTransfer.ts');
  savePendingGiwaTransfer(undefined, createPendingGiwaTransfer({ direction: 'withdraw',
    walletAddress: '0x0000000000000000000000000000000000000001', transactionHash: `0x${'33'.repeat(32)}` }));
  let transfer;
  try {
    transfer = account.props.onWithdrawTransfer('0x0000000000000000000000000000000000000003', '0.001');
    transfer.catch(() => {});
    assert.equal(account.getSwitchCount(), 0, 'persisted pending must block a second wallet prompt');
    await assert.rejects(transfer, /already confirming/);
  } finally {
    if (account.getSwitchCount()) account.cancelApproval();
    await transfer?.catch(() => {});
    globalThis.window = previousWindow;
  }
});
