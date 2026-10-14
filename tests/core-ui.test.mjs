import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { matchRoute, routes } from '../src/routes/paths.ts';

test('foundation route matcher decodes parameters and rejects malformed or unknown paths', () => {
  for (const route of routes) {
    const path = route.path.replace(/:[^/]+/, 'example');
    assert.equal(matchRoute(path)?.id, route.id);
    assert.equal(matchRoute(path === '/' ? path : `${path}/`)?.id, route.id);
  }
  assert.deepEqual(matchRoute('/tags/%ED%8C%90%ED%83%80%EC%A7%80')?.params, { tag: '판타지' });
  for (const path of ['/unknown', '/works/', '/works/a/more', '/works/%', '/works/a%2Fb', '//']) {
    assert.equal(matchRoute(path), null, path);
  }
});

test('all feature slots render without fabricated work, balance or authenticated state', async () => {
  const server = await createServer({ appType: 'custom', define: { 'import.meta.env.VITE_PRIVY_APP_ID': JSON.stringify('') }, optimizeDeps: { noDiscovery: true }, server: { hmr: false, middlewareMode: true } });
  const previous = globalThis.window;
  try {
    const { default: App } = await server.ssrLoadModule('/src/App.tsx');
    for (const route of routes) {
      globalThis.window = { location: { pathname: route.path.replace(/:[^/]+/, 'example') } };
      const html = renderToStaticMarkup(createElement(App));
      assert.match(html, /<main id="main"/);
      assert.match(html, /<h1>/);
      assert.doesNotMatch(html, /페이지를 찾을 수 없어요/);
      if (route.id === 'account' || route.id === 'home') assert.match(html, /로그인 설정이 필요해요/);
      if (route.id !== 'account') assert.match(html, /준비 중/);
    }
    const { Input, Tabs, WorkCard, Modal } = await server.ssrLoadModule('/src/ui/index.ts');
    const field = renderToStaticMarkup(createElement(Input, { id: 'title', label: '작품 이름', error: '이름을 입력해 주세요.' }));
    assert.match(field, /for="title"/);
    assert.match(field, /aria-invalid="true"/);
    assert.match(field, /aria-describedby="title-message"/);
    assert.match(field, /id="title-message" role="alert"/);
    const tabs = renderToStaticMarkup(createElement(Tabs, { label: '작품 모드', value: 'character', onChange() {}, items: [
      { id: 'character', label: '캐릭터', content: '캐릭터 작품' }, { id: 'story', label: '스토리', content: '스토리 작품' },
    ] }));
    assert.equal((tabs.match(/role="tab"/g) ?? []).length, 2);
    assert.equal((tabs.match(/aria-selected="true"/g) ?? []).length, 1);
    assert.match(tabs, /hidden="" tabindex="0">스토리 작품/);
    const card = renderToStaticMarkup(createElement(WorkCard, { id: 'a b', title: '<작품>', description: '소개', mode: 'story' }));
    assert.match(card, /href="\/works\/a%20b"/);
    assert.match(card, /&lt;작품&gt;/);
    const modal = renderToStaticMarkup(createElement(Modal, { open: false, title: '확인', onClose() {} }, '내용'));
    assert.match(modal, /<dialog/);
    assert.doesNotMatch(modal, / open=/);
  } finally { globalThis.window = previous; await server.close(); }
});
