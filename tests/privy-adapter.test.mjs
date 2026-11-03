import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Mock only the SDK and display boundary; exercise the real PrivyAuthActions adapter.
let server, PrivyAuthActions;
before(async () => {
  server = await createServer({
    appType: 'custom', ssr: { noExternal: ['@privy-io/react-auth'] }, optimizeDeps: { noDiscovery: true }, server: { hmr: false, middlewareMode: true },
    plugins: [{ name: 'test-auth-boundaries', enforce: 'pre',
      resolveId(source, importer) {
        if (source === '@privy-io/react-auth') return '\0test-privy';
        if (source === './features/auth/LoginAccess') return '\0test-login-access';
        if (source === './AccountView' && importer?.endsWith('/PrivyAuthActions.tsx')) return '\0test-view';
      },
      load(id) {
        if (id === '\0test-privy') return `
          export const usePrivy = () => globalThis.__authTest.session;
          export const useLogin = callbacks => {
            globalThis.__authTest.callbacks = callbacks;
            return { login: options => globalThis.__authTest.logins.push(options) };
          };`;
        if (id === '\0test-login-access') return `export function LoginAccess(props){globalThis.__authTest.loginAccess=props;return null;}`;
        if (id === '\0test-view') return `export function AccountView(props) { globalThis.__authTest.props = props; return null; }`;
      }
    }]
  });
  ({ PrivyAuthActions } = await server.ssrLoadModule('/src/PrivyAuthActions.tsx'));
});
after(async () => { delete globalThis.__authTest; await server?.close(); });
function render(session) {
  globalThis.__authTest = { session, logins: [] };
  renderToStaticMarkup(createElement(PrivyAuthActions));
  return globalThis.__authTest;
}
test('anonymous and restoring accounts use the shared login boundary', () => {
  for(const session of [{ready:true,authenticated:false,user:null},{ready:false,authenticated:true,user:null}]){
    const state=render({...session,logout(){}});
    assert.equal(state.loginAccess.enabled,true);
    assert.equal(state.props,undefined,'account settings must not mount before an identity exists');
  }
});
test('authenticated email-only user reaches account without wallet readiness', async () => {
  let logouts = 0;
  const user = {id:'did:privy:fixture', email:{address:'fixture@example.test'}};
  const state = render({ready:true, authenticated:true, user, logout:async () => { logouts++; }});
  assert.equal(state.props.user, user);
  assert.equal(state.props.authenticated, true);
  state.props.onLogout();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(logouts, 1);
});
test('SDK logout rejection is handled instead of escaping to the app', async () => {
  let calls = 0;
  const state = render({ready:true, authenticated:true, user:{id:'fixture'}, logout:async () => { calls++; throw new Error('fixture failure'); }});
  state.props.onLogout();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
});
