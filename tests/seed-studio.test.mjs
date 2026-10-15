import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createTestDatabase } from './helpers/db.ts';
import { migrateStudio } from '../server/studio/migrate.ts';
import { importSeedWorks, seedSlugs } from '../scripts/seed/importWorks.ts';
import { validateDraft } from '../server/studio/validate.ts';
import { getPublicWork } from '../server/core/works.ts';
test('real manuscript seeds validate, import once and keep private fields out of public responses', async () => {
    const db = await createTestDatabase();
    try {
        await migrateStudio(db);
        for (const slug of seedSlugs) {
            const text = await readFile(`seed/works/${slug}/work.json`, 'utf8');
            const draft = validateDraft(JSON.parse(text), true);
            const csv = await readFile(`seed/works/${slug}/assets.csv`, 'utf8');
            for (const a of draft.assets ?? [])
                assert.ok(csv.includes(`${a.id},${a.code},`));
            assert.doesNotMatch(text, /\{\{img::|(?<!\{)\{user\}(?!\})/);
            assert.ok(draft.privateConfig.systemPrompt.length > 1000);
        }
        const first = await importSeedWorks(db), second = await importSeedWorks(db);
        assert.deepEqual(first.map(x => x.id), second.map(x => x.id));
        assert.ok(second.every(x => !x.created));
        assert.equal((await db.query('SELECT id FROM work_versions')).rows.length, 2);
        for (const row of first) {
            const pub = JSON.stringify(await getPublicWork(db, row.id));
            assert.doesNotMatch(pub, /systemPrompt|hiddenContext|openingContexts|condition|privateConfig|CL12|M-Y 남성|초기 모듈 감사/);
        }
    }
    finally {
        await db.close();
    }
});
