import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDraft } from '../server/studio/validate.ts';
import { importText } from '../server/studio/importer.ts';
import { makeDraft } from '../src/features/studio/draft.ts';
test('incomplete drafts save but publish validates required fields, limits and nested private keys', () => {
    const draft = makeDraft();
    validateDraft(draft);
    assert.throws(() => validateDraft(draft, true));
    draft.title = '테스트';
    draft.privateConfig.systemPrompt = '프롬프트';
    draft.publicSnapshot.openings = [{ id: 'start', title: '시작', prologue: '이야기', firstMessage: '', suggestedReplies: [] }];
    validateDraft(draft, true);
    draft.mode = 'character';
    assert.throws(() => validateDraft(draft, true));
    draft.privateConfig.examples = [{ user: '안녕', assistant: '반가워' }];
    validateDraft(draft, true);
    assert.throws(() => validateDraft({ ...draft, title: '가'.repeat(31) }));
    assert.throws(() => validateDraft({ ...draft, publicSnapshot: { ...draft.publicSnapshot, hiddenSettings: 'secret' } }));
    draft.publicSnapshot.openings[0].prologue = '{{img:UNKNOWN}}';
    assert.throws(() => validateDraft(draft, true), /이미지 UNKNOWN/);
    draft.publicSnapshot.openings[0].prologue = '본문';
    draft.privateConfig.lorebook = [{ id: 'l', category: '', keywords: [], content: '내용', hidden: true, priority: 0, alwaysOn: false }];
    assert.throws(() => validateDraft(draft, true), /카테고리/);
});
test('platform syntax import reports unresolved identities without guessing URLs', () => {
    for (const source of ['{{img::YN_1}}', '{{image:YN_1}}', 'img:[YN_1]', '{bg::YN_1}'])
        assert.equal(importText(source).text, '{{img:YN_1}}');
    assert.equal(importText('{user} <char> {{user}}').text, '{{user}} {{char}} {{user}}');
    assert.equal(importText('{{url}}a.webp {{iurl}}b.png', { 'a.webp': 'A', 'b.png': 'B' }).text, '{{img:A}} {{img:B}}');
    assert.ok(importText('{{url}}missing.webp').unknown.length);
    assert.equal(importText('{{img:OK}}').changed, 0);
});
