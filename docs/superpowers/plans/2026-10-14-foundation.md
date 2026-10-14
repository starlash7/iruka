# Foundation Implementation Plan

**Goal:** A–D가 병렬 구현할 인증·DB·API·UI 공통 기반과 검증 가능한 기준 커밋.
**Architecture:** PostgreSQL storage + injected Node HTTP services + React shared DTO/UI.
**Tech Stack:** Node 24, TypeScript, React/Vite, PGlite/Postgres, jose.

- [x] 01 기준 및 npm ci/test/build 확인.
- [x] tests/core-db.test.mjs 작성 후 SQL 제약/마이그레이션/독립 DB를 구현. `node --test tests/core-db.test.mjs`.
- [x] tests/core-auth.test.mjs 작성 후 server/core/auth.ts의 createTokenVerifier 및 DID 사용자 매핑 구현. 유효/위조/만료/aud/iss/sub 테스트.
- [x] src/shared/types.ts 및 server/core/interfaces.ts: public/private work, persona, chat/version, turn settlement, API error/SSE union 확정.
- [x] tests/core-api.test.mjs 작성 후 server/app.ts의 createApiHandler(services) 구현. 토큰/소유권/공개 whitelist, HTTP 및 SSE 테스트.
- [x] src/routes 및 src/features의 default page exports, src/ui 컴포넌트 구현. desktop/mobile 및 상호작용 검증.
- [x] scripts/dev.mjs로 Vite/API 동시 실행, /api proxy, DB migrate/test commands 및 .env.example 조율.
- [x] 전체 test/build/typecheck, 결정/인계/파일 소유권 문서.
- [ ] 관련 변경 commit 및 main 대상 draft PR.
