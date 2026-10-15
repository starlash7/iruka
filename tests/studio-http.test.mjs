import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase } from './helpers/db.ts';
import { migrateStudio } from '../server/studio/migrate.ts';
import { createStudioHandler } from '../api/studio/handler.ts';
import { makeDraft } from '../src/features/studio/draft.ts';
import { ApiError } from '../server/core/errors.ts';
test('HTTP authentication, ownership, asset binding and publication reject forged inputs', async () => {
    const db = await createTestDatabase();
    try {
        await migrateStudio(db);
        const handler = createStudioHandler({ db, verifyToken: async (token) => { if (!['alice', 'bob'].includes(token))
                throw new ApiError('UNAUTHORIZED', '로그인 필요'); return { privyDid: `did:privy:${token}` }; } });
        const request = (path, method = 'GET', body, token = 'alice') => handler(new Request('http://local/api/studio/works' + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) }));
        assert.equal((await request('', 'GET', undefined, '')).status, 401);
        assert.equal((await request('', 'GET', undefined, 'invalid')).status, 401);
        const draft = makeDraft();
        draft.title = '스토리';
        draft.privateConfig.systemPrompt = '숨김';
        draft.publicSnapshot.openings = [{ id: 'start', title: '시작', prologue: '텍스트', firstMessage: '', suggestedReplies: [] }];
        let response = await request('', 'POST', draft);
        assert.equal(response.status, 201);
        let work = (await response.json()).data;
        const id = work.work.id;
        assert.equal((await request('/' + id, 'GET', undefined, 'bob')).status, 403);
        assert.equal((await request('/' + id + '/publish', 'POST', { revision: work.revision }, 'bob')).status, 403);
        assert.equal((await request('/' + id + '/assets', 'POST', { code: 'A', label: '이미지', url: 'https://attacker/image.png' })).status, 400);
        const asset = (await (await request('/' + id + '/assets', 'POST', { code: 'A', label: '이미지' })).json()).data;
        assert.equal(asset.url, null);
        const other = (await (await request('', 'POST', draft, 'bob')).json()).data;
        assert.equal((await request('/' + other.work.id, 'PUT', { ...other.draft, revision: other.revision, assets: [{ id: asset.id, code: 'A' }] }, 'bob')).status, 403);
        assert.equal((await request('/' + id, 'PUT', { ...work.draft, revision: work.revision, coverUrl: 'https://attacker/img' })).status, 403);
        response = await request('/' + id, 'PUT', { ...work.draft, revision: work.revision, assets: [{ id: asset.id, code: 'A' }], publicSnapshot: { ...work.draft.publicSnapshot, openings: [{ ...draft.publicSnapshot.openings[0], prologue: '{{img:A}}' }] } });
        assert.equal(response.status, 200);
        work = (await response.json()).data;
        assert.equal((await request('/' + id + '/publish', 'POST', { revision: work.revision })).status, 201);
        assert.equal((await request('/' + id + '/publish', 'POST', { revision: work.revision })).status, 409);
        assert.equal((await request('/' + id + '/publish', 'POST', {})).status, 400);
        assert.equal((await request('/not-a-uuid')).status, 400);
    }
    finally {
        await db.close();
    }
});
