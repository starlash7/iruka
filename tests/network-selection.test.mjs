import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';

async function loadNetwork(search = '', defaultNetwork = 'giwa') {
  const previous = globalThis.window;
  globalThis.window = { location: { search } };
  const server = await createServer({
    appType: 'custom', optimizeDeps: { noDiscovery: true },
    define: { 'import.meta.env.VITE_IRUKA_DEPLOYMENT': JSON.stringify(defaultNetwork),
      'import.meta.env.VITE_GIWA_PACK_BATCH_ADDRESS': JSON.stringify('0x0000000000000000000000000000000000000001'),
      'import.meta.env.VITE_MONAD_PACK_BATCH_ADDRESS': JSON.stringify('0x0000000000000000000000000000000000000002') },
    server: { hmr: false, middlewareMode: true }
  });
  try {
    return await Promise.all(['/src/networkSelection.ts', '/src/activeDeployment.ts', '/src/giwaPull.ts'].map(path => server.ssrLoadModule(path)));
  } finally {
    await server.close();
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
}

test('the public deployment opens Monad without a URL network selection', async () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const defaultNetwork = config.buildCommand?.match(/(?:^|\s)VITE_IRUKA_DEPLOYMENT=(\w+)/)?.[1] ?? 'giwa';
  const [, descriptor, pull] = await loadNetwork('', defaultNetwork);
  assert.equal(descriptor.activeDeployment.id, 'monad');
  assert.equal(descriptor.activeChain.id, 10143);
  assert.equal(pull.getGiwaPackBatchAddress(), '0x0000000000000000000000000000000000000002');
  assert.equal(descriptor.activeDeployment.allowFixturePull, false);
  assert.equal(descriptor.getDeploymentStorageKey('collection', '0xABC'), 'iruka:collection:monad:10143:0xabc');
});

test('one build selects each network, contract and explorer from the URL', async () => {
  const [, monad, monadPull] = await loadNetwork('?network=monad');
  assert.equal(monad.activeDeployment.id, 'monad');
  assert.equal(monad.activeChain.id, 10143);
  assert.equal(monadPull.getGiwaPackBatchAddress(), '0x0000000000000000000000000000000000000002');
  assert.equal(monad.getDeploymentStorageKey('collection', '0xABC'), 'iruka:collection:monad:10143:0xabc');
  const [, giwa, giwaPull] = await loadNetwork('?network=giwa', 'monad');
  assert.equal(giwa.activeChain.id, 91342);
  assert.equal(giwaPull.getGiwaPackBatchAddress(undefined, false), '0x0000000000000000000000000000000000000001');
  assert.equal(giwa.getDeploymentStorageKey('collection', '0xABC'), 'iruka:collection:91342:0xabc');
});

test('invalid URL selection falls back; switching preserves route and other parameters', async () => {
  const [selection, descriptor] = await loadNetwork('?network=wrong', 'monad');
  assert.equal(descriptor.activeDeployment.id, 'monad');
  assert.equal(selection.getSelectedNetwork('?network=giwa'), 'giwa');
  assert.equal(selection.getSelectedNetwork('?network=10143'), undefined);
  const target = new URL(selection.getNetworkUrl('https://playiruka.space/?ref=valley#pull', 'monad'));
  assert.equal(target.searchParams.get('network'), 'monad');
  assert.equal(target.searchParams.get('ref'), 'valley');
  assert.equal(target.hash, '#pull');
  assert.throws(() => selection.getNetworkUrl(target.href, 'wrong'), /Unknown/);
});

test('network control exposes both testnets and locks during an operation', async () => {
  const server = await createServer({ appType: 'custom', optimizeDeps: { noDiscovery: true }, server: { hmr: false, middlewareMode: true } });
  try {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { NetworkSelector } = await server.ssrLoadModule('/src/NetworkSelector.tsx');
    const html = renderToStaticMarkup(React.createElement(NetworkSelector, { disabled: true, locale: 'en' }));
    assert.match(html, /GIWA Sepolia/);
    assert.match(html, /Monad Testnet/);
    assert.match(html, /disabled/);
    assert.match(html, /aria-label="Network: GIWA Sepolia"/);
    assert.match(html, /aria-haspopup="menu"/);
    assert.match(html, /role="menuitemradio"/);
    assert.match(html, /aria-checked="true"/);
    assert.match(html, /src="\/assets\/wallet-monad\.svg"/);
    assert.match(html, /src="\/assets\/wallet-giwa\.png"/);
    assert.doesNotMatch(html, /<select/);
  } finally { await server.close(); }
});
