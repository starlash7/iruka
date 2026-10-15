# Wave 02 공유 API 계약

이 계약은 `src/shared/contracts.ts`, `src/shared/apiClient.ts`,
`server/core/interfaces.ts`의 공개 export를 기준으로 한다. 실제 업무 구현이
주입되지 않은 API는 `503 SERVICE_UNAVAILABLE`을 반환한다. 테스트 어댑터는
생성자와 서버 생성 시점에 명시적으로 주입하며 환경변수로 인증을 우회하지 않는다.

## 응답과 인증

JSON 성공은 `{data: T, requestId: string}`, 실패는
`{error: {code: string, message: string}, requestId: string}`이다.
인증 필요 API는 매 요청 `Authorization: Bearer <Privy access token>`을 보낸다.
서버는 토큰 검증 후 자체 사용자 ID를 구하며 본문 userId를 신뢰하지 않는다.
미인증은 401, 소유권 위반은 403 또는 존재를 숨기는 404, 잘못된 본문은 400,
멱등키와 본문 충돌은 409, 업무 구현 미주입은 503이다.

`createApiClient({baseUrl?, getAccessToken, fetch?})`는 매 요청 토큰을 새로 조회한다. 토큰이 없으면 Authorization 없이 공개 API를 호출한다. 보호 API는 서버가 401을 반환한다.
`request<T>(path, init?)`는 성공 envelope를 반환하고 오류는
`ApiClientError(code, message, status, requestId)`로 전달한다. JSON 쓰기 요청의
본문과 Content-Type은 호출자가 지정한다. API 경로는 `/api/`로 시작한다.

## 데이터와 공개 경계

### 마이페이지 프로필 (2026-10-15)

`GET /api/me/profile`, `PUT /api/me/profile`는 검증된 로그인 사용자 본인의
`ProfileDto { nickname, bio, avatar }`만 읽고 저장한다. PUT은 세 필드를 함께
저장하며 다른 키(userId 포함)는 거부한다. nickname은 1~30자, bio는 300자 이하,
avatar는 null 또는 512px 이하의 검증·정규화된 PNG data URL이다(최대 1,500,000자).
전체 JSON 요청 상한은 해당 경로에서만 1,510,000바이트다. 기존 JSON 상한은 유지한다.
브라우저는 5MB 이하 PNG/JPEG/WebP를 정사각형 512px PNG로 변환한다.
이미지는 별도 공개 URL 없이 user_profiles에 저장하며 응답은 no-store다.
이메일·지갑·Privy DID를 프로필 DTO에 넣지 않으며 공개 프로필 API는 없다.
저장은 서버 DB 정본이며 브라우저 저장소에 프로필을 저장하지 않는다.

### 기존 데이터

- `UserDto`: 내부 id, privyDid, displayName, createdAt. 본인 응답 전용이며 공개 작품에 포함하지 않는다.
- `PublicWorkDto`: id, creatorId, mode(character/story), title, description,
  coverUrl, tags, publishedVersionId, createdAt. 서버는 이 필드만 명시적으로 선택한다.
- `PublicWorkDetailDto`: PublicWorkDto + snapshot(PublicWorkSnapshot/null). 공개 상세는 발행 버전의 중첩 필드를 whitelist로 반환한다.
- `PrivateWorkVersionDto`: id, workId, version, systemPrompt, hiddenSettings, publicSnapshot,
  createdAt. publicSnapshot은 초안의 부분 입력도 반환한다. 작성자 소유권 확인 이후만 반환한다.
- `CreatorWorkDto`: 공개 work와 비공개 versions를 묶는 작성자 전용 응답이다.
- `PersonaDto`: id, userId, name, description, createdAt. 소유자만 접근한다.
- `ChatDto`: id, userId, workId, workVersionId, personaSnapshot,
  activeMessageId, createdAt. 생성 당시 발행 작품 버전과 페르소나 내용을 고정한다.
- `MessageDto`: id, chatId, parentMessageId, role(user/assistant), content,
  createdAt. parent는 같은 chat 안의 메시지여야 한다. 분기 재시도는 기존 메시지를
  덮어쓰지 않으며 새로운 자식 메시지를 만든다.

날짜는 ISO-8601 문자열이다. 비공개 프롬프트/설정은 공개 응답과 SSE에 포함하지 않는다.
성인인증·결제·정산·신고·외부 지갑 관련 필드는 계약에 없다.

## 턴과 SSE

`POST /api/chats/:chatId/turns`는 `Idempotency-Key` 헤더와
`TurnRequest {content, parentMessageId: string|null, model}` JSON을 받는다.
클라이언트의 `streamTurn(chatId, body, {idempotencyKey, signal?})`는
`AsyncGenerator<ChatEvent>`를 반환한다. 서비스 주입 시 정확한 서명은 다음과 같다.

```ts
streamTurn({userId, chatId, requestId, idempotencyKey, body, signal}): AsyncIterable<ChatEvent>
```

인증/소유권/본문 검사는 스트림을 시작하기 전에 끝낸다. 이후 응답은
`text/event-stream`이며 `event: <type>`와 `data: <JSON>`을 사용한다.
모든 이벤트는 `type`, `requestId`, 0 이상의 증가하는 정수 `sequence`를 포함한다.
같은 응답의 requestId는 고정된다. 추가 필드는 다음과 같다.

| type | 추가 필드 |
|---|---|
| ready | turnId |
| delta | text |
| image | url, alt |
| status | status |
| ending | endingId, title |
| usage | inputTokens, outputTokens, credits (0 이상) |
| done | turnId, status(completed/cancelled), messageId(string/null) |
| error | code, message |

완전한 스트림은 `done` 또는 `error` 중 단 하나로 종료한다. 정상 취소는
`done.status=cancelled`; 실패는 `error`다. terminal 이후 이벤트는 허용하지 않는다.
네트워크 단절/AbortSignal로 terminal을 받지 못한 클라이언트는 완료로 추정하지 않는다.
DB 턴 상태 `succeeded`는 `done.status=completed`, `aborted`는
`done.status=cancelled`, `failed`는 `error`로 매핑한다. 크레딧 예약의
completed/released 상태는 턴 상태와 별개다. 응답 body 취소와 원본 요청의
AbortSignal은 주입 서비스의 signal로 전달하므로 A는 signal을 관찰해 생성 작업을
중단하고 D의 예약 해제를 수행해야 한다.
클라이언트 파서는 UTF-8 분할, CRLF, multiline data, 주석, 취소를 지원하며
잘못된 JSON/타입/순서, 중복 terminal, terminal 없는 EOF를 거부한다.

멱등 범위는 사용자+키다. 같은 키와 동일한 본문/chat은 기존 턴과 결과를 반환하고
재과금하지 않는다. 같은 키의 다른 본문/chat은 409다. 재전송은 새 requestId를
사용할 수 있지만 턴 ID는 유지한다. 새로운 시도는 새로운 키와 턴 ID를 사용한다.
이 보장은 실제 A/D 구현에서 DB 트랜잭션과 영속 결과로 강제해야 한다.
`TestStreamService(chunks)`는 유료 호출 없는 결정적 스트림 테스트용이며
소유권·영속 멱등성·크레딧 구현의 대체물이 아니다.

## 무료 크레딧 인터페이스

`CreditsService`는 다음 메서드를 제공한다. 금액 정책과 실제 구현은 D가 담당한다.

- `getBalance(userId)` → `{available,reserved}`
- `reserveTurn({userId,turnId,credits})` → `{turnId,reserved,state}`
- `completeTurn({userId,turnId,actualCredits})` → 같은 reservation 형태
- `releaseTurn({userId,turnId,reason: 'failed'|'cancelled'})` → 같은 reservation 형태

reserve는 소유권·가용 잔액을 검사하고 예약/원장 기록을 원자적으로 생성한다.
동일 요청 재전송은 기존 결과를 반환하고 다른 예약 금액은 충돌이다. complete는
`actualCredits <= reserved`를 검사해 실제 차감과 나머지 해제를 하나의 트랜잭션으로
처리한다. release는 실패/취소 예약 전액을 복구한다. terminal은 completed 또는
released이며 이후 변경 불가다. 완료/해제가 경합할 때 한쪽만 성공하고 다른 쪽은
충돌을 반환한다. 동일 terminal payload 재전송만 멱등 성공한다. 실패 뒤 재시도는
새 턴 ID로 예약한다. 클라이언트 usage 이벤트는 서버 원장 증거가 아니다.

## 소유권과 연결 규칙

| 담당 | 소유 영역 | 공통 연결 |
|---|---|---|
| 공통 | src/shared, server/core, server/app, migrations, 패키지/설정 | DTO, 인증, envelope, 서비스 주입과 라우팅 |
| A 대화 | server/chat, api/chat, src/features/chat | StreamService, TurnRequest, ChatEvent, ChatDto, MessageDto |
| B 제작 | server/studio, src/features/studio, scripts/seed | CreatorWorkDto, PrivateWorkVersionDto, PublicWorkDto |
| C 탐색/사용자 | server/discovery, src/features/discovery/user | DiscoveryService, PublicWorkDto, UserDto, PersonaDto |
| D 크레딧/장부 | server/credits, server/giwa, src/features/credits, contracts | CreditsService, CreditBalanceDto, CreditReservation |

공유 파일과 패키지는 공통 담당에게 변경 요청하고 동시에 수정하지 않는다.
UI 라우트는 src/routes, HTTP `/api/*` 연결은 공통 서버 라우터가 관리한다.
후속 모듈은 인증된 userId를 주입받고 모든 DB 조회/변경에서 소유권을 다시 제한한다.
원장 앵커는 D 후속 범위이며 실제 영수증 없이 anchored를 반환하지 않는다.

공통 멱등성 구현 `server/core/turnRequests.ts`의 beginTurnRequest/finishTurnRequest를 A가 사용한다.
구체적인 저장/상태 전이와 연결 규칙은 FOUNDATION_HANDOFF.md를 따른다.

## A–D factory와 제작/모델 입력 고정

다음은 후속 담당자가 실제 구현에서 export할 이름과 함수 타입이다. 공통 기반에
성공을 가장하는 factory 구현을 두지 않는다. 의존성의 db는
`server/db/index.ts`의 `Database`이며 환경변수로 mock 구현을 선택하지 않는다.

| 모듈 / 공개 export | 의존성 | 반환 타입 |
|---|---|---|
| `server/chat/index.ts` / `createChatService` | `{db, model: ModelService, credits: CreditsService}` | `StreamService` |
| `server/studio/index.ts` / `createStudioService` | `{db}` | `StudioService` |
| `server/discovery/index.ts` / `createDiscoveryService` | `{db}` | `DiscoveryService` |
| `server/credits/index.ts` / `createCreditsService` | `{db}` | `CreditsService` |

공통 `CreateChatService`, `CreateStudioService`, `CreateDiscoveryService`,
`CreateCreditsService` 함수 타입으로 각 export를 검사한다. 크레딧 지급/차감 정책은
D 구현에서 별도 결정하며 이 factory 계약이 정책값이나 실제 지급을 확정하지 않는다.

`StudioService`의 서버 전용 메서드는 다음과 같다. 모든 userId는 인증 계층에서
주입하며 입력 id의 소유권을 검사한다.

- `getWork(userId, id): Promise<CreatorWorkDto>`
- `saveDraft(userId, input: WorkDraftInput): Promise<CreatorWorkDto>`
- `publishVersion(userId, id): Promise<PrivateWorkVersionDto>`

`WorkDraftInput`은 신규 생성 시 id를 생략하고 수정 시 소유한 작품 id를 넣는다.
mode, title, description, coverUrl, tags, publicSnapshot, privateConfig를 명시한다.
저장은 비공개 초안 저장이며 발행은 별도 동작이다. 이 입력 계약 추가는 기존 HTTP
작품 응답의 필드나 현재 저장 구현을 변경하지 않는다. 공개 응답 확장은 B/C와 공통
담당이 함께 결정한다.

`PublicWorkSnapshot`은 tagline, playGuide, characters(id/name/imageUrl),
openings(id/title/prologue/firstMessage/suggestedReplies)만 담는다.
`PrivateWorkConfig`는 systemPrompt, outputRules, statusTemplate,
characterSettings(characterId/description/speechStyle), examples(user/assistant),
openingContexts(openingId/hiddenContext), lorebook(id/category/keywords/content/
hidden/priority/alwaysOn), endings(id/title/condition/text/imageUrl)를 담는다.
등장인물 설명/말투, 숨김 시작 상황, 키워드북과 엔딩 조건은 공개 snapshot에
복사하지 않는다. 원문 길이 제한과 발행 검사 규칙은 B에서 구현한다.

`ModelService.stream({messages, signal})`은 다음 이벤트의 AsyncIterable을 반환한다.
messages는 role(system/user/assistant)과 content의 배열이다.

```ts
{type: 'delta', text: string}
{type: 'usage', inputTokens: number, outputTokens: number}
```

모델 어댑터는 취소 signal을 관찰한다. 모델 이벤트에는 HTTP requestId, 공개 DTO,
크레딧 확정 책임이 없으며 A가 모델 결과를 ChatEvent로 변환하고 D를 호출한다.
`TestModelService(chunks, {inputTokens, outputTokens})`는 명시적으로 전달한 문자열과
usage만 재생한다. 취소 시 AbortError로 종료하며 실제 모델 사용량이나 유료 호출
증거로 취급하지 않는다. 운영 모델 어댑터는 별도 주입 전까지 존재한다고 가정하지 않는다.
