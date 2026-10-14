# Wave 02 병렬 개발 기준

01 인계 기준: `7c9dad2` (`d86bb2b` 구현). 현재 브랜치 이름을 유지하고 fast-forward했다.
이 문서는 최신 사용자 요청에 따른 공통 기반이며 원문 02의 제외 기능은 구현하지 않는다.
기준 커밋과 draft PR 주소는 아래 전달 기록에 남긴다.

## 실행

```sh
npm ci
npm run db:migrate
npm run dev
npm run test:db
npm test
npm run build
```

Node 24 사용. Vite는 127.0.0.1:5173, API는 127.0.0.1:8787이다. `/api`는 Vite에서
프록시하므로 브라우저는 같은 origin으로 요청한다. `.env.local`에 `.env.example`의
필요 값을 설정한다. API_PORT는 두 서버에서 동일하게 읽는다. 포트 충돌 시 공통 담당이 조율한다.
종료하면 두 프로세스가 함께 종료된다. 직접 API만 실행하려면 `npm run dev:api`.

`DATABASE_URL`이 비어 있으면 `.context/local-db`에 PGlite PostgreSQL 데이터가 저장된다.
테스트는 별도 메모리 인스턴스 또는 임시 디렉터리를 만들고 폐기하므로 개발 DB를 지우지 않는다.
마이그레이션은 트랜잭션+버전 기록+advisory lock으로 반복 실행 가능하다.
파일 DB는 배타적 lock으로 중복 프로세스 열기를 거부한다. `db:migrate` 전에 로컬 API를 종료한다.
프로세스가 비정상 종료한 경우 `.context/local-db.lock`에 적힌 PID가 실행 중이 아닌지 확인한 뒤에만
해당 lock 파일을 제거한다. 실행 중인 DB lock을 삭제하지 않는다. URL을 지정하면
postgres 드라이버를 쓴다. 공유/운영 DB를 로컬 테스트 URL로 사용하지 않는다.
브라우저용 DB 키·직접 DB 접근은 없다. PUBLIC 권한을 revoke하고 서버가 소유권을 검사한다.
원격 운영에서는 별도 최소 권한 서버 role/접속 정책을 설정해야 한다.

## 고정한 경계

- [API/DTO/SSE/차감 계약](API_CONTRACT.md)
- [UI 토큰·컴포넌트·화면 구조·페이지 export](UI_FOUNDATION.md)
- SQL: `migrations/0001_foundation.sql`, `0002_ledger_operations.sql`, `0003_work_metadata.sql`; 공통 DB: `server/db/index.ts`.
- 인증: `createTokenVerifier({appId,verificationKey})`; 검증된 DID만 users upsert에 사용.
- 진입점: `createApiHandler({db,verifyToken,stream?,credits?,discovery?})` → `(Request)=>Promise<Response>`.
- 실제 로컬 구성은 검증기만 생성한다. 미주입 채팅/크레딧은 503. 환경변수 mock 인증 우회 없음.
- `createNodeServer(handler)`는 disconnect를 AbortSignal로 서비스에 전달한다.
- `getOwnedChat`, `getPublicWork`, `getCreatorWork`, `getOrCreateUser`는 공통 서버 함수다.
- `beginTurnRequest(db,{userId,chatId,idempotencyKey,body})`는 new/pending을 한 번만 반환한다.
  in_progress/replay는 모델을 재호출하면 안 된다. chatId+명시된 body 필드를 SHA256으로 비교한다.
- `finishTurnRequest(db,{userId,turnId,status,response})`는 조건부 terminal 갱신 후 영속 결과를 반환한다.
  동일 terminal 재호출은 최초 저장 결과를 반환한다. 반대 terminal은 409다.
- A/D는 `db.transaction` 안에서 finish와 크레딧 확정을 묶어야 한다. 네트워크 응답 전달은
  확정 이후 수행한다. 완료 직전 disconnect와 취소의 경합은 DB terminal 승자로 판단한다.

## 담당별 파일 소유권과 연결

| 담당 | 소유 파일/디렉터리 | 고정 연결 |
|---|---|---|
| 공통 | migrations, server/db, server/core, server/app.ts, server/nodeServer.ts, server/dev.ts, src/shared, src/routes, src/ui, App/styles, scripts/dev/migrate, package/lock/env/config | 모든 공유 변경을 단일 담당이 순차 반영 |
| A 채팅 서버 | server/chat/**, src/features/chat/**, tests/chat-* | StreamService.streamTurn; begin/finishTurnRequest; CreditsService; ChatPage default export |
| B 스튜디오·시드 | server/studio/**, src/features/studio/**, scripts/seed/**, tests/studio-* | CreatorWorkDto; immutable work_versions; StudioPage/EditorPage default export |
| C 탐색·사용자 프론트 | server/discovery/**, src/features/discovery/**, src/features/user/**, tests/discovery-* | PublicWorkDto/DiscoveryService; createApiClient; 기존 AuthActions 사용 |
| D 테스트 크레딧·GIWA | server/credits/**, server/giwa/**, src/features/credits/**, contracts/**, tests/credits-* | CreditsService, free ledger, CreditsPage default export |

페이지 인자는 `RoutePageProps {params: Readonly<Record<string,string>>; authEnabled?: boolean}`.
라우트 등록은 공통 `src/routes`에서만 한다. A–D는 해당 feature 파일의 default export를 유지한다.
서버 모듈은 각 서비스 interface 구현을 named export하고 공통 담당이 createApiHandler 구성에 연결한다.
새 HTTP 엔드포인트는 경로/메서드/DTO/오류/권한 테스트를 먼저 제안한 후 공통 라우터에 반영한다.
`api/` 배포 어댑터는 이번에 만들지 않았다. Vercel 배포 작업과 혼합하지 않는다.

## API 자리

| 메서드·경로 | 상태 |
|---|---|
| GET /api/health | 로컬 health |
| GET /api/auth/session, /api/me | 서버 토큰 검증·본인 user |
| GET/POST /api/me/personas | 본인 목록/생성 |
| GET /api/works | 주입된 C 탐색 서비스; 기본 503 |
| GET /api/works/:id | public 작품의 공개 whitelist |
| GET /api/studio/works/:id | 작성자 전용 private versions |
| POST /api/chats | 공개/unlisted/본인 작품 최신 발행 버전과 본인 페르소나 고정 |
| GET /api/chats/:id | 소유자만 조회 |
| POST /api/chats/:id/turns | 인증·소유권·본문·멱등키 검증 뒤 주입 서비스 SSE; 기본 503 |
| GET /api/me/credits | 주입된 D 서비스; 기본 503 |

## A/D 차감·복구 인계

원장 단위는 구매/양도/환전 불가 무료 테스트 크레딧이다. 정책 수량/주기/모델 가격은 아직 미결정.
reserve는 음수 기록, 성공 charge는 예약 차감의 0 marker, 실제 사용량이 적으면 나머지 release,
실패/취소는 전액 양수 release. D는 account lock과 잔액 계산으로 동시 초과 예약을 막아야 한다.
원장은 UPDATE/DELETE 불가. 각 원장 key/turn의 중복 기록은 unique 제약으로 막는다.
서버 강제 종료 후 pending/running 예약을 회수하는 TTL/lease 정책은 A/D 구현 항목이다.
미완료 요청의 재전송은 in_progress로 돌려주며 자동으로 새 과금을 만들지 않는다.
현재 helper는 중복 시작/terminal을 처리하며 실제 크레딧 엔진·프로세스 복구 worker는 구현하지 않는다.

## 환경·패키지 조율

추가 직접 의존성: @electric-sql/pglite(로컬 실제 PostgreSQL 엔진), postgres(원격 DB 어댑터),
jose(서버 JWT 서명/claim 검증). devDependency @types/node. 기존 스택에는 DB 드라이버가 없었고,
JWT 재구현을 피했다. 클라이언트/서버 타입 검사를 build에 포함한다. 별도 router/UI 패키지 없음.
Pretendard는 공식 v1.3.9 WOFF2+OFL을 자체 호스팅한다. A–D는 package/env/lockfile을 수정하지 않는다.
실제 LLM/임베딩/체인/저장소 provider는 이번 공통 기반에 설치하거나 활성화하지 않는다.

## 제한과 확인할 입력

실제 Google OAuth/이메일 OTP 완료는 Privy dashboard 설정 및 실제 계정으로 별도 확인해야 한다.
서버 검증은 로컬 ES256 키로 정상·만료·위조·issuer/audience/subject를 검증했다. 외부 인증 성공 증거는 아니다.
로컬 PGlite는 PostgreSQL WASM 단일 프로세스다. 원격 PostgreSQL 접속/다중 연결 부하/운영 권한 검증은 미실행.
실제 모델 호출·스토리지·무료 정책·GIWA 앵커 계약/체크포인트·운영 복구는 A–D 후속이다.
실제 배포, 유료 API 호출, 체인 쓰기, main 직접 push/merge는 실행하지 않는다.

참조: [Privy access token](https://docs.privy.io/authentication/user-authentication/access-tokens),
[PGlite API](https://pglite.dev/docs/api). 설치된 jose/postgres/PGlite 타입과 실제 테스트를 함께 확인했다.

## 최종 검증 기록 — 2026-10-14

환경: Node 24.14.0 / npm 11.9.0. 테스트 DB는 개발 DB와 독립이다.

| 명령/확인 | 실제 결과 |
|---|---|
| 01 기준 npm ci → npm test | 설치 후 16/16 통과 |
| npm run db:migrate | 파일 DB에 0001/0002/0003 적용, 재실행 성공. schema_migrations 직접 조회로 세 버전 확인 |
| npm test | 61 passed / 0 failed. DB 12개, ES256 인증, 소유권, 공개 중첩 필드, API, 멱등성, 어댑터, HTTP/SSE, 기존 UI 포함 |
| npm run build | frontend/server TypeScript + Vite 성공 |
| VITE_PRIVY_APP_ID=build-only-public-placeholder npm run build -- --outDir .context/configured-build | SDK 포함 빌드 성공; 외부 로그인 호출 없음 |
| node .context/browser-check.mjs | 1440×1000 / 390×844 각각 11 route+404; overflow/page error 0. 탭 키보드/모달 Escape·닫기/disabled/작품 카드 확인 |
| Vite /api 프록시 | health 200, 미인증 session 401 |
| 실제 Node HTTP/SSE 테스트 | 한글 청크/requestId 유지, 정상 종료, 취소와 disconnect 전달, malformed 이벤트 및 비공개 추가 필드 차단 |
| 독립 코드 리뷰 | 공개 목록 추가 필드 누출·SSE lifecycle·turn 원장 중복 발견 → 회귀 테스트로 수정 확인 |
| git diff --check | 오류 없음 |
| 지침 수동 평가 | evals/2026-10-14-foundation.md에 관찰 기록 |

SDK 전이 의존성 Rollup annotation 경고가 남는다. SDK 설정 포함 빌드의 최대 chunk는
약 2.32 MB(gzip 약 688 KB)로 기존 큰 chunk 경고가 있다. 이번 공통 기반에서 SDK 교체는 하지 않았다.
화면 증거: `.context/foundation-desktop-home.png`, `foundation-mobile-home.png`,
`foundation-desktop-chat.png`, `foundation-mobile-chat.png`, `foundation-desktop-studio.png`,
`foundation-mobile-studio.png`, `foundation-desktop-components.png`, `foundation-mobile-components.png`.
UI 컴포넌트 검증 화면은 로컬 테스트 전용이며 제품 작품/실제 사용자 데이터가 아니다.

## 전달 기준

- 공통 구현 기준 커밋: `743e01f` (`feat: establish pivot shared development foundation`).
- A–D는 이 커밋을 포함한 각자의 격리 workspace/branch에서 시작한다. 동일 공유 파일을 직접 병렬 수정하지 않는다.
- 현재 브랜치: `starlash7/docs/pivot` (이름 유지).
- [draft PR #9](https://github.com/starlash7/iruka/pull/9), base `main`.
- 선행 [01 draft PR #8](https://github.com/starlash7/iruka/pull/8)이 아직 main에 없으므로 PR 전체 diff에는 01도 포함된다.
  이번 공통 기반만 검토하려면 `git diff 7c9dad2..743e01f`를 사용한다.
- 이 후속 인계 기록 커밋은 실행 코드를 바꾸지 않는다. main 직접 push/merge와 배포는 하지 않았다.
