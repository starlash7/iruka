import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase } from './helpers/db.ts';
import { migrateStudio } from '../server/studio/migrate.ts';
import { createStudioService } from '../server/studio/index.ts';
import { getPublicWork } from '../server/core/works.ts';
import { createChat } from '../server/core/chats.ts';
import { makeDraft } from '../src/features/studio/draft.ts';
test('draft isolation, immutable publication, pinned chats, revisions and ownership', async () => {
    const db = await createTestDatabase();
    try {
        await migrateStudio(db);
        await migrateStudio(db);
        const user = (await db.query("INSERT INTO users(privy_did) VALUES ('did:privy:studio') RETURNING id")).rows[0].id;
        const other = (await db.query("INSERT INTO users(privy_did) VALUES ('did:privy:other') RETURNING id")).rows[0].id;
        const service = createStudioService({ db });
        const input = makeDraft();
        input.title = '원본';
        input.privateConfig.systemPrompt = '비공개 원고';
        input.publicSnapshot.openings = [{ id: 'start', title: '시작', prologue: '낮의 도서관', firstMessage: '안녕하세요', suggestedReplies: [] }];
        let saved = await service.saveDraft(user, input);
        const id = saved.work.id;
        await assert.rejects(service.getWork(other, id), { code: 'FORBIDDEN' });
        await assert.rejects(service.saveDraft(other, { ...input, id, revision: 1 }), { code: 'FORBIDDEN' });
        const first = await service.publishVersion(user, id, saved.revision);
        const chat = await createChat(db, user, { workId: id });
        saved = await service.getWork(user, id);
        const edit = { ...saved.draft, title: '수정 중', privateConfig: { ...saved.draft.privateConfig, systemPrompt: '새 원고' }, revision: saved.revision };
        const next = await service.saveDraft(user, edit);
        assert.equal((await getPublicWork(db, id)).title, '원본');
        assert.equal((await getPublicWork(db, id)).snapshot?.openings[0].prologue, '낮의 도서관');
        await assert.rejects(service.saveDraft(user, edit), { code: 'CONFLICT' });
        await assert.rejects(service.publishVersion(user, id, saved.revision), { code: 'CONFLICT' });
        const second = await service.publishVersion(user, id, next.revision);
        assert.notEqual(first.id, second.id);
        assert.equal(chat.workVersionId, first.id);
        assert.equal((await db.query('SELECT work_version_id FROM chats WHERE id=$1', [chat.id])).rows[0].work_version_id, first.id);
        await assert.rejects(db.query("UPDATE work_versions SET private_config='{}' WHERE id=$1", [first.id]), /immutable/);
        assert.equal((await service.getWork(user, id)).versions.find(v => v.id === first.id)?.systemPrompt, '비공개 원고');
        assert.equal((await service.listWorks(other)).length, 0);
        const results = await Promise.allSettled([service.saveDraft(user, { ...edit, revision: next.revision + 1 }), service.saveDraft(user, { ...edit, revision: next.revision + 1 })]);
        assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
    }
    finally {
        await db.close();
    }
});
