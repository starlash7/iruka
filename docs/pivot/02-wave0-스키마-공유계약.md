# 02. wave0-스키마-공유계약 — Wave 0 (순차 2/2)

> Conductor에 이 문서 전체를 붙여넣어요. repo: `starlash7/iruka`, 브랜치: `pivot/02-스키마-공유계약`. 설계 문서: `00-전체-설계.md`(이 zip 안. repo에는 `docs/pivot/00-전체-설계.md`로 Wave 0에서 복사됨)를 먼저 읽어요.

## 목표
DB 스키마, 공유 타입, 서버 코어(인증·DB·에러), 태스크 간 인터페이스를 고정해서 Wave 1이 병렬로 일할 수 있게 해요.

## 범위
- `supabase/` 초기화, `supabase/migrations/0001_init.sql`: 설계 3절 테이블 전부 + 확장(pgvector, pg_trgm) + 인덱스 + RLS 기본 정책 + `credit_ledger` append-only 트리거 + `public_works_v` 뷰.
- `supabase/seed.sql`: `model_tiers`(basic/standard/premium, provider='mock'), `products` 4개(가격은 설계 1-7 추정값).
- `server/core/`: `db.ts`(postgres 클라이언트, `DATABASE_URL`), `auth.ts`(Privy 토큰 검증 + 테스트용 `AUTH_MODE=mock`), `http.ts`(JSON/SSE 헬퍼, 에러 포맷), `errors.ts`, `interfaces.ts`(설계 5절 공유 계약: `chargeForTurn`, `refundTurn`, `recordCreatorEarning`, `moderateText` 타입 + 스텁 구현), `llm/types.ts`(LLM 어댑터 인터페이스 `stream(messages, opts)`와 `mock` 어댑터), `storage/types.ts`(R2 presign 인터페이스 + mock).
- `src/shared/`: `types.ts`(Work, WorkVersion, Opening, LorebookEntry, Asset, Chat, Message, Memory, CreditBalance, Product, Payment 등 DTO), `api.ts`(fetch 래퍼, 토큰 첨부, SSE 파서), `constants.ts`(필드 길이 제한, 이미지 코드 정규식 `{{img:CODE}}`, 변수 `{{user}}`/`{{char}}`).
- `src/routes/`: 라우터 뼈대와 빈 페이지 자리(`/`, `/ranking`, `/search`, `/tags/:tag`, `/works/:id`, `/chat/:chatId`, `/studio`, `/studio/:workId`, `/wallet`, `/creator`, `/admin`) — 각 페이지는 Wave 1 태스크가 채울 `src/features/<영역>/index.tsx`를 lazy import.
- `api/auth/session.ts`, `api/auth/wallet-link.ts`(SIWE, viem `verifyMessage`), `api/me/*` 구현.
- `contracts/src/interfaces/IIrukaLedgerAnchor.sol`: 설계 4-2 이벤트·함수 시그니처만.
- 테스트 하네스: `tests/helpers/db.ts`(로컬 Supabase 또는 `pg-mem`/Docker Postgres), `npm run test:db`.

## 파일 소유권
touch: `supabase/**`, `server/core/**`, `src/shared/**`, `src/routes/**`, `src/App.tsx`, `api/auth/**`, `api/me/**`, `contracts/src/interfaces/**`, `package.json`, `.env.example`, `tests/core-*`, `tests/helpers/**`. do-not-touch: 01에서 남긴 인증 UI 파일 동작.

## 선행 작업
01 머지 완료.

## 완료 기준
- `supabase db reset`(로컬)로 마이그레이션 성공. `credit_ledger` UPDATE/DELETE 시 에러.
- `AUTH_MODE=mock`으로 `/api/auth/session` → users 생성, SIWE 서명 검증 테스트 통과(로컬 생성 키로).
- 모든 라우트가 빈 페이지로 렌더, `npm run build`·`npm test` 통과.
- `interfaces.ts` 스텁으로 Wave 1이 import 가능.

## 테스트 방법
`supabase start && supabase db reset && npm test && npm run test:db && forge build`

## 끝나면
- draft PR 생성(제목 `[pivot 02] ...`), 본문에 변경 요약·테스트 결과·남은 한계·다른 태스크에 요청할 사항.
- main 머지는 사용자가 직접 해요.

## 금지 (모든 태스크 공통)
- `main` 브랜치에 push·merge 금지. 작업 브랜치 `pivot/<태스크번호>-<이름>`에서만 커밋하고, PR은 draft로만 열어요.
- 배포 금지(Vercel deploy, `vercel --prod`, 컨트랙트 메인넷 배포 금지. GIWA Sepolia 배포도 사용자 승인 전 금지).
- 유료 API 호출 금지: LLM·임베딩·PG·본인인증은 `mock` 어댑터로만 테스트. 실제 키 필요 시 멈추고 사용자에게 물어요.
- 비밀값을 코드·커밋·로그에 쓰지 말고 `.env.example` 플레이스홀더만 추가.
- 자기 범위 밖 파일 수정 금지. 꼭 필요하면 PR 설명에 "다른 태스크 요청 사항"으로 적고 수정은 하지 않아요.
- 실존 인물(K-pop 아이돌) 이미지·이름을 시드나 예시에 쓰지 않아요.
