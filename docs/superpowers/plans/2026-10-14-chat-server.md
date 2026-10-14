# Chat server implementation checklist

Goal: Implement the requested backend using Wave 02 contracts with no paid calls.
Architecture: owned service modules + durable SQL state + injected model/credits/safety.
Stack: existing TypeScript, Node test runner, PostgreSQL/PGlite, Web Request/Response.

- [x] tests/chat-prompt.test.mjs → promptAssembler.ts, lorebook.ts, postprocess.ts, safety.ts:
  character/story order, budgets, recent keyword selection, token controls, output filtering.
- [x] tests/chat-runtime.test.mjs → database.ts, migrate.ts, 0100_chat.sql, repository.ts,
  conversations.ts: migration, owner checks, active path, sibling edit/delete/branch.
- [x] tests/chat-runtime.test.mjs → index.ts, turnLifecycle.ts: reserve/settle in the same
  transaction, replay without model calls, concurrency, failure, disconnect and expired lease.
- [x] tests/chat-memory.test.mjs → memory.ts, summarize.ts: pinned CRUD, branch-scoped summary
  queue and retry, no stale or sibling summary in prompts.
- [x] tests/chat-api.test.mjs → api/chats/handler.ts: real HTTP envelopes, auth and SSE.
- [x] Run `node --experimental-strip-types --test --test-concurrency=1 tests/chat-*.test.mjs`.
- [x] Run `npm test`, `npm run build`, explicit typecheck for owned API modules, diff check.
- [ ] Record concrete results and common-owner requests in server/chat/HANDOFF.md; commit,
  push current branch and create draft PR against main. No merge or deployment.
