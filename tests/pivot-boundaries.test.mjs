import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
test('minimal routes render without authentication configuration', async () => {
  const server = await createServer({ appType: 'custom', optimizeDeps: { noDiscovery: true }, server: { hmr: false, middlewareMode: true } });
  const previous = globalThis.window;
  try {
    const { default: App } = await server.ssrLoadModule('/src/App.tsx');
    for (const [pathname, heading] of [['/', 'Iruka'], ['/account', '내 계정'], ['/account/', '내 계정'], ['/missing', '페이지를 찾을 수 없어요']]) {
      globalThis.window = { location: { pathname } };
      const html = renderToStaticMarkup(createElement(App));
      assert.match(html, new RegExp(`<h1>${heading}</h1>`));
      if (pathname !== '/missing') {
        assert.match(html, /로그인 설정이 필요해요/);
        assert.match(html, /disabled/);
      }
    }
  } finally { globalThis.window = previous; await server.close(); }
});
test('account adapter has no wallet or transaction prerequisite', async () => {
  const source = await read('src/PrivyAuthActions.tsx');
  assert.doesNotMatch(source, /useWallets|useCreateWallet|useConnectWallet|signMessage|sendTransaction|walletConnection/);
});
test('deployment cannot schedule removed operations or auto-deploy this cleanup', async () => {
  const config = JSON.parse(await read('vercel.json'));
  assert.equal(config.git.deploymentEnabled, false);
  assert.equal(config.crons, undefined);
  assert.equal(config.functions, undefined);
  assert.equal(config.buildCommand, 'npm run build');
  assert.ok(config.rewrites.some(entry => entry.destination === '/index.html'));
  const headers = config.headers.find(entry => entry.source === '/(.*)').headers;
  const get = (name) => headers.find(header => header.key === name)?.value;
  assert.equal(get('X-Content-Type-Options'), 'nosniff');
  assert.equal(get('X-Frame-Options'), 'DENY');
  assert.equal(get('Cross-Origin-Opener-Policy'), 'same-origin-allow-popups');
  assert.match(get('Content-Security-Policy'), /frame-ancestors 'none'/);
  assert.match(get('Content-Security-Policy'), /https:\/\/accounts.google.com/);
  assert.match(await read('.github/workflows/verify.yml'), /permissions:\s*\n\s*contents: read/);
});
test('brand assets and every Brand Kit CSS token remain available', async () => {
  const css = await read('src/brand-kit.css');
  const styles = await read('src/styles.css');
  for (const [, token] of css.matchAll(/var\((--[^)]+)\)/g)) assert.ok(styles.includes(`${token}:`), token);
  for (const name of ['iruka-main-logo', 'iruka-logomark', 'iruka-wordmark']) {
    for (const ext of ['png', 'svg']) assert.ok((await readFile(new URL(`../public/brand/${name}.${ext}`, import.meta.url))).length > 0);
  }
});
test('only the preserved GIWA definition is available for later chain work', async () => {
  const { giwaSepolia } = await import('../src/giwaChain.ts');
  assert.equal(giwaSepolia.id, 91342);
  assert.equal(giwaSepolia.testnet, true);
  for (const dir of ['api', 'server', 'contracts', 'scripts']) {
    const entries = await readdir(new URL(`../${dir}/`, import.meta.url), { recursive: true }).catch(error => {
      if (error.code === 'ENOENT') return [];
      throw error;
    });
    assert.equal(entries.length, 0, dir);
  }
});
