import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

for (const network of ['monad', 'giwa']) {
  test(`${network} funding surfaces show the native token and chain logos`, async () => {
    const server = await createServer({
      appType: 'custom', optimizeDeps: { noDiscovery: true },
      define: { 'import.meta.env.VITE_IRUKA_DEPLOYMENT': JSON.stringify(network) },
      server: { hmr: false, middlewareMode: true }
    });
    try {
      const { copy } = await server.ssrLoadModule('/src/appCopy.ts');
      const { AccountCryptoDepositPanel } = await server.ssrLoadModule('/src/AccountCryptoDepositPanel.tsx');
      const { AccountWithdrawDialog } = await server.ssrLoadModule('/src/AccountWithdrawDialog.tsx');
      const { AccountFundingMethods } = await server.ssrLoadModule('/src/AccountFundingMethods.tsx');
      const labels = copy.en.account;
      const noop = () => {};
      const common = { copy: labels, onTransfer: noop, onTransferComplete: noop };
      const deposit = renderToStaticMarkup(React.createElement(AccountCryptoDepositPanel, {
        ...common, address: '0x0000000000000000000000000000000000000001', copied: false,
        onConnectWallet: noop, onCopyAddress: noop, onDone: noop
      }));
      const withdrawal = renderToStaticMarkup(React.createElement(AccountWithdrawDialog, {
        ...common, balance: { status: 'ready', label: `0.07 ${labels.testEth}` },
        onClose: noop, open: true
      }));
      const funding = renderToStaticMarkup(React.createElement(AccountFundingMethods, {
        copy: labels, onSelectCrypto: noop
      }));
      const token = network === 'monad' ? '/assets/wallet-mon.svg' : '/assets/wallet-ethereum.png';
      const chain = network === 'monad' ? '/assets/wallet-monad.svg' : '/assets/wallet-giwa.png';
      for (const html of [deposit, withdrawal]) {
        assert.equal((html.match(/name="account-assets"/g) ?? []).length, 2, 'token and network menus need one exclusive group');
        assert.ok(html.includes(`src="${token}"`), 'native token logo missing');
        assert.ok(html.includes(`src="${chain}"`), 'network logo missing');
        assert.ok(html.includes(labels.giwaSepolia));
        assert.ok(html.includes(labels.testEth));
        assert.doesNotMatch(html, /account-asset-mark-monad">MON/);
      }
      assert.ok(funding.includes(`src="${token}"`), 'funding method native token logo missing');
    } finally { await server.close(); }
  });
}
