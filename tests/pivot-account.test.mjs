import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let server, AccountView, config;
before(async () => {
  server = await createServer({ appType: 'custom', optimizeDeps: { noDiscovery: true }, server: { hmr: false, middlewareMode: true } });
  ({ AccountView } = await server.ssrLoadModule('/src/AccountView.tsx'));
  ({ privyConfig: config } = await server.ssrLoadModule('/src/privyConfig.ts'));
});
after(async () => { await server?.close(); });
const render = (props = {}) => renderToStaticMarkup(createElement(AccountView, {
  ready: true, authenticated: false, user: null, onLogin() {}, onLogout() {}, ...props
}));
test('offers Google and verified email login without wallet creation', () => {
  assert.deepEqual(config.loginMethods, ['google', 'email']);
  assert.equal(config.embeddedWallets.ethereum.createOnLogin, 'off');
  assert.equal(config.embeddedWallets.solana.createOnLogin, 'off');
});
test('anonymous account offers login without exposing account data', () => {
  const html = render();
  assert.match(html, /로그인/);
  assert.doesNotMatch(html, /로그아웃|이메일<\/dt>/);
});
test('session readiness prevents premature login and identity display', () => {
  const html = render({ ready: false, authenticated: true, user: { id: 'private-id', email: { address: 'private@example.test' } } });
  assert.match(html, /disabled/);
  assert.doesNotMatch(html, /private@example|private-id/);
});
test('Google account works with no wallet or separate email account', () => {
  const html = render({ authenticated: true, user: { id: 'did:privy:test', google: { name: '사용자', email: 'google@example.test' } } });
  assert.match(html, /사용자/);
  assert.match(html, /google@example.test/);
  assert.match(html, /로그아웃/);
});
test('email account and missing optional profile fields remain usable', () => {
  assert.match(render({ authenticated: true, user: { id: 'did:privy:test', email: { address: 'email@example.test' } } }), /email@example.test/);
  assert.match(render({ authenticated: true, user: { id: 'did:privy:test' } }), /로그아웃/);
});
test('authenticated but unresolved user never displays a false account', () => {
  assert.doesNotMatch(render({ authenticated: true }), /로그아웃/);
});
test('escapes identity content and displays recoverable errors', () => {
  const html = render({ authenticated: true, user: { id: 'test', google: { name: '<script>alert(1)</script>' } }, error: '다시 시도해 주세요.' });
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /role="alert"/);
  assert.match(html, /다시 시도/);
});
test('logout pending disables repeated account actions', () => {
  assert.match(render({ authenticated: true, user: { id: 'test' }, busy: true }), /disabled/);
});
