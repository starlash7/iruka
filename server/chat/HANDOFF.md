# 채팅 서버 인계 — 2026-10-14

기반 `e67418a` (공통 구현 `743e01f` 포함), 작업 브랜치 `starlash7/gij68` 유지.
공통 기반은 문서가 지정한 브랜치에서 fast-forward했다. 이 작업의 신규 변경은
채팅 서버/API/0100 마이그레이션/채팅 테스트 및 해당 계획·결정·인계 문서다.
공통 서버, 공유 DTO, UI, 패키지, 환경설정은 수정하지 않았다.

## 실행과 검증

Node 24.14.0 / npm 11.9.0. 외부 LLM, 임베딩, 실제 OAuth, 체인, 배포 호출 없음.

```sh
npm ci --ignore-scripts
node --experimental-strip-types --test --test-concurrency=1 tests/chat-*.test.mjs
npm test
npm run build
./node_modules/.bin/tsc --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --skipLibCheck --allowImportingTsExtensions --types node api/chats/handler.ts
```

테스트는 매번 독립 메모리 PGlite를 만들고 폐기한다. 개발 DB를 읽거나 지우지 않는다.
`tests/chat-api.test.mjs`는 임시 ES256 키로 JWT를 서명하고 실제 서버 검증기를 사용한다.
실제 TCP HTTP/SSE, 한글 출력, 재전송, 소유권, 응답 취소와 TCP 연결 종료를 검증한다.
테스트용 크레딧 어댑터는 **공유 credit_ledger**만 사용한다. 독자 원장은 없다.
이 어댑터는 D의 가용 잔액/동시 과소잔액 정책 구현을 대신하지 않는다.

## 공통 담당 연결 요청

1. `createChatDatabase(baseDb)`를 한 번 만들고 **동일 인스턴스**를 채팅과 D의
   `createCreditsService({db})`에 모두 전달한다. AsyncLocalStorage로 크레딧 내부의
   `db.transaction`도 같은 연결의 savepoint가 된다. 다른 DB 인스턴스나 외부
   네트워크 기반 CreditsService로 대체하면 원자성을 보장할 수 없다.
2. 기존 `migrateDatabase(db)` 후 `migrateChatDatabase(db)`를 실행하거나,
   `supabase/migrations/0100_chat.sql`을 공통 migration registry에 등록한다.
   0100 helper는 advisory lock+트랜잭션+schema_migrations로 재실행 가능하다.
   기존 `npm run db:migrate`는 이 파일을 자동 적용하지 않는다.
3. `createChatService({db,model,credits},options)`를 구성한다. `ModelService`는
   현재 `TestModelService`만 사용한다. options에는 `safety`, `models`가 필수이며
   누락 시 503이다. model key마다 maxContextTokens, maxOutputCharacters,
   reservedCredits, actualCredits(usage)를 주입한다. 수량 정책을 임의 확정하지 않았다.
4. `createChatApiHandler({db,verifyToken,stream,safety})`를 `/api/chats`와 하위
   경로에 연결한다. 그 외 요청은 기존 `createApiHandler`로 보낸다. 기존 공통
   POST/GET chat 대신 이 핸들러를 먼저 사용해야 시작 상황과 active leaf를 보존한다.
   `api/chats/handler.ts`는 조합용 factory이며 Vercel 배포 엔트리가 아니다.
5. 공통 `server/dev.ts`에 위 구성을 주입하고 API 파일을 공통 서버 tsconfig 검사
   범위에 추가한다. 현재 `npm run dev`의 기존 채팅 경로는 미주입 503 상태를 유지한다.
6. 신뢰된 worker에서 `recoverExpiredTurns(db,credits)`를 주기적으로 호출하고
   `runSummaryJobs({db,model,safety})`를 실행한다. 공개 무인증 cron은 만들지 않았다.
   원격 PostgreSQL 다중 연결 부하/lease 경합은 별도 검증한다.

Factory의 첫 인자는 공통 `CreateChatService` 서명을 만족한다. 추가 두 번째 인자는
채팅 소유 정책 확장이다. 운영 모델/안전/가격 규칙을 공통 인터페이스로 승격할 때
공통 담당이 조율해야 한다. production에서 테스트 안전 어댑터를 주입하지 않는다.

## API 제안 (공통 라우터/클라이언트 담당 확인 대상)

모든 경로는 Privy 서버 인증과 본인 chat 검증, JSON envelope/requestId를 사용한다.
본문 userId는 사용하지 않는다. 없는/타인 chat·message는 404, 본문 오류 400,
멱등키/현재 분기/진행 중 변경 충돌 409, 정책 미설정 503이다.

| 메서드 / 경로 | 입력 / 결과 |
|---|---|
| POST /api/chats | workId, personaId?, openingId? → 201 conversation |
| GET /api/chats/:id | conversation 복구 |
| DELETE /api/chats/:id | chat soft delete; 실행 중이면 409 |
| POST /api/chats/:id/turns | 기존 TurnRequest + Idempotency-Key → 기존 ChatEvent SSE |
| GET /api/chats/:id/turns/:turnId | 본인 turnId/status/저장된 안전 이벤트 결과 |
| POST /api/chats/:id/select | messageId → 선택 leaf 변경, conversation |
| POST /api/chats/:id/branch | messageId → 해당 조상 경로를 복제한 새 chat, 201 |
| PATCH /api/chats/:id/messages/:messageId | content → 사용자 메시지 형제 생성/선택 |
| DELETE /api/chats/:id/messages/:messageId | 메시지와 모든 후손 soft delete |
| GET/POST /api/chats/:id/memories | 선택 경로 기억 목록 / content 고정 메모 생성 |
| PATCH/DELETE /api/chats/:id/memories/:memoryId | 고정 메모 수정/삭제 |
| POST /api/chats/:id/summaries | messageId → 현재 경로 요약 작업 예약, 202 |

conversation = `{chat: ChatDto, openingId, messages: MessageDto[], presentations}`.
presentations = `{messageId, images: [{url,alt}], statuses: string[], endings: [{endingId,title}] }[]`.
공유 ChatDto 자체는 변경하지 않았다. GET/POST의 기존 외부 shape보다 확장된 envelope이므로
공통 클라이언트가 합의 후 도입해야 한다. GET turn은 완료 직전 연결이 끊긴 경우 정본을 조회한다.

재생성은 기존 turns 계약을 그대로 사용한다: 선택된 assistant의 user 부모 ID와
**그 부모의 동일 content**, 새로운 멱등키를 보낸다. 형제 assistant를 만들고 선택한다.
다른 기존 분기를 재생성하려면 먼저 select한다. user leaf가 선택된 경우 그 user를
재사용한다. 새 사용자 발화는 선택된 assistant leaf를 부모로 보내야 한다.
수정은 원문 덮어쓰기 없이 user 형제를 만들며 원래 후손은 이전 분기에 남긴다.
분기 복제는 버전·페르소나·시작 상황·이미지/상태/엔딩 표시·고정 메모를 보존한다.

## 실패/중단/복구 계약

- claim + reserve + running lease는 한 DB 트랜잭션이다. 채팅별 동시에 한 생성만 허용한다.
- beginTurnRequest 사용자+키+본문 hash를 사용한다. 진행 중 재전송 409, 완료 재전송은
  영속 이벤트를 새 requestId/sequence로 반환한다. 모델 재호출·재예약은 없다.
- 성공 메시지/active leaf/표시 정보 + completeTurn + finishTurnRequest는 한 트랜잭션이다.
  커밋 후에만 delta/image/status/ending/usage/done을 전송한다.
- 모델 실패, 출력 안전 차단, 사용량 누락, 제한 초과는 전액 release + failed/error.
  AbortSignal/소비자 취소는 release + aborted/cancelled. 늦은 완료는 DB terminal 승자를 따른다.
- 기본 생성 제한 60초, lease 90초. options로 바꿀 때 lease는 생성 제한보다 길어야 한다.
  무응답 모델 next()도 abort race로 중단한다. 실패한 release는 running 상태/lease를 남겨
  worker가 다시 회수할 수 있다. DB 자체가 꺼진 동안에는 즉시 복구를 보장하지 않는다.
- 커밋 뒤 네트워크 단절은 성공을 취소하지 않는다. GET turn 또는 동일 키 재전송으로 복구한다.
- 모델의 전체 출력을 먼저 길이 제한·안전 검사한다. 그 후 256자 이하 delta로 SSE 전송한다.
  **실시간 첫 토큰 스트리밍은 아니다.** 부분 유해 출력/비공개 텍스트/제어 코드 유출 방지 선택이다.

## 기억·프롬프트·공개 경계

12단계 프롬프트와 cacheBoundary=6을 제공한다. 캐릭터/스토리 mode, 고정 발행 버전,
시작 상황과 숨김 context, 페르소나, 항상/최근 3턴 키워드 설정집, 고정/요약 기억을 사용한다.
토큰 추정은 글자수/1.5이며 고정 부분이 예산을 넘으면 거부한다. 오래된 history만 잘라
요약 큐로 보낸다. K턴=최근 6개 메시지, 키워드는 NFKC/공백/대소문자를 정규화한다.
고정 메모는 최대 5개, 최근 요약과 합쳐 최대 10개이며 고정 메모를 먼저 보장한다.
20 사용자 턴마다 요약 작업을 만들고 작업 anchor까지의 조상 경로만 요약한다.
worker는 최대 3회 시도, 60초 lease/token을 사용하며 삭제된 경로를 저장하지 않는다.
요약은 anchor가 현재 선택 경로에 있을 때만 재사용한다. 시각순 전체 메시지 조회는 없다.

최신 공유 계약에는 regex 설정, asset DTO, model_tiers, 임베딩/벡터 인터페이스가 없다.
따라서 정규식 실행/유료 임베딩/pgvector 패키지를 임의 추가하지 않았다. 현 구현은
literal 키워드 + 조상 요약 선택이다. 공통/B 담당에게 asset schema/code 규칙과 향후
검색/모델 한도 계약을 요청한다. 이미지는 server-only `assets(workVersionId)` resolver로
검증하며 미등록/비HTTPS/자격증명 포함 URL은 제거한다. URL을 서버가 가져오지는 않는다.

공개 API/SSE에는 config 객체를 펼치지 않는다. 모델 출력도 입력/출력 SafetyService를
거치고 정규화 후 8자 이상인 private 설정 전체 문자열의 재출력을 차단한다.
이 결정적 검사만으로 짧은 문자열, 일부 발췌, 의미상 재서술까지 검증했다고 주장하지 않는다. 운영 안전 정책은 별도 승인·주입해야 하며 없으면 생성 불가다.
상태는 HTML이 아닌 텍스트, 이미지는 승인 URL, 엔딩은 등록 ID/title만 공개한다.
UI 담당은 텍스트를 escape하고 raw HTML로 렌더하지 않아야 한다.

## 검증 기록

| 명령 / 확인 | 실제 결과 |
|---|---|
| npm ci --ignore-scripts | exit 0, lockfile 변경 없음 |
| 채팅 focused suite | 24 passed / 0 failed (독립 리뷰 재실행 포함) |
| npm test | 85 passed / 0 failed, 약 44초 |
| npm run build | TypeScript + Vite 성공, 약 9초 |
| API 명시적 tsc 명령 (위) | exit 0 |
| git diff --cached --check | 오류 없음 |
| 독립 읽기 전용 리뷰 | 비공개 필드 누락/usage 누락/고정 메모 밀림 3건 발견, 재현 테스트 실패 확인 후 수정, 재검토 차단 이슈 없음 |
| 실제 HTTP/SSE | ES256 검증, 한글·표시 정보 복구, 키 재사용, 응답 취소, TCP 단절 확인 |
| 실패 원자성 | reserve 실패, complete 도중 예외/취소 rollback, release 실패 뒤 lease 회수, late completion 차단 확인 |

기존 SDK 전이 의존성 Rollup annotation 경고는 남아 있다. 화면 변경이 없어
데스크톱/모바일 스크린샷은 해당하지 않는다. 실제 유료 모델/운영 DB/배포/체인 영수증은 없다.
