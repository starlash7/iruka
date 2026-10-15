# 페르소나 관리 인계

## 상태와 범위

기준 `8ada036`을 깨끗한 작업 트리에서 fast-forward했다. 현재 브랜치
`starlash7/iruka-persona-crud` 유지. Docs `b7f750e`의
`reading/persona-memory.mdx`를 읽기만 했다. 공유 파일/인증/라우터/서버/DB는 수정하지 않았다.

이 PR은 이름·소개 관리 화면과 API 클라이언트를 제공한다. **실제 생성·조회는
기존 서버로 동작하지만 수정·삭제 서버는 미구현이다.** PATCH/DELETE는 요청 계약이며,
현재 서버는 404를 반환한다. 실패 시 입력과 목록을 보존한다. 로컬 성공 데이터를
만들거나 브라우저 저장소로 대체하지 않는다. 화면 성공만으로 통합 완료로 표시하지 않는다.

## 사용하는 기존 API

공통 `createApiClient`, `PersonaDto` 재사용. Privy access token을 Bearer로 전달한다.
계정이 바뀌면 관리 화면을 remount하여 이전 계정 목록/편집 상태를 버린다.
지갑/충전/서명/추가 인증은 요구하지 않는다.

| 요청 | 입력 | 응답 |
|---|---|---|
| GET `/api/me/personas` | 없음 | `{data: PersonaDto[], requestId}` |
| POST `/api/me/personas` | `{name, description}` | 201 `{data: PersonaDto, requestId}` |

`PersonaDto`: `id, userId, name, description, createdAt`. 이름은 공백만 불가,
원문 길이 1–50자, 저장 시 trim. 소개는 선택, 최대 500자. 기존 서버와 동일한 JS 문자열 길이.
조회 결과는 대화 시작 화면의 `listPersonas()`와 같은 원본이다.

## 통합 담당 요청 — 서버

1. PATCH `/api/me/personas/:id`
   - JSON `{name: string, description: string}`. 위 POST와 동일한 검증.
   - 200 `{data: PersonaDto, requestId}`.
   - Privy 토큰 검증 후 서버 사용자 ID + persona ID로 소유권 확인.
   - 익명 401, 잘못된 입력/ID 400, 미존재 또는 다른 사용자 소유 404.
   - 요청 본문의 userId를 신뢰하지 않는다. 다른 사용자 데이터는 응답하지 않는다.
2. DELETE `/api/me/personas/:id`
   - 본문 없음. 200 `{data: null, requestId}` (현재 client는 JSON envelope 필요, 204 아님).
   - PATCH와 같은 인증/소유권 검증. 이미 없거나 타인 소유인 경우 404.
   - 기존 대화 참조를 보존하는 삭제 전략 필요. 현재 복합 FK가 물리 삭제를 차단한다.
     `protect_chat_pins`도 persona_id 변경을 금지하므로 단순 null 처리도 불가하다.
   - 권장: 소프트 삭제와 목록/새 대화 선택에서 제외. 마이그레이션/공유 DTO 변경은
     통합 담당 결정·소유이며 이 PR에서는 추가하지 않았다.
3. PATCH/DELETE 성공, 실패, 타인 ID 접근 거부, 동시 대화 시작/삭제, 삭제 후 새 대화
   선택 거부를 실제 API 통합 테스트로 추가해야 한다. 현재 이 경로의 404는 소유권 검증
   증거가 아니다. 오류 envelope는 기존 `{error:{code,message},requestId}` 유지.

## snapshot 유지 조건과 채팅 담당 요청

- 대화 생성 시 해당 사용자의 페르소나 이름·소개를 `personaSnapshot`에 복사한다.
- 기존 대화 읽기/모델 prompt는 원본 persona 조회가 아니라 저장된 snapshot을 사용한다.
- 수정·삭제 시 chats.persona_snapshot, persona_id 및 과거 메시지를 갱신하지 않는다.
- 삭제된 페르소나는 새 대화 선택 목록/시작 API에서 제외한다. 관리 화면 저장 후
  새로 열리는 StartChatSheet는 동일 GET을 사용하므로 DTO 변환은 필요 없다.
- 이미 열린 선택 화면은 재조회하거나 시작 실패 시 목록을 갱신하도록 채팅 담당에게 요청한다.
- 기본 페르소나/아바타 기능과 채팅 화면 변경은 이번 PR에 포함하지 않았다.

## 검증

- focused: `node --experimental-strip-types --test tests/persona-client.test.mjs`
  2 passed, 0 failed. 실제 PGlite + 기존 HTTP handler로 생성/목록, 잘못된 입력,
  익명 401, 사용자별 목록 분리, 타인 페르소나 대화 시작 404 확인.
- 원본 DB 이름·소개 직접 변경 후 기존 대화 snapshot 유지 확인. 참조 중인 persona
  물리 삭제가 FK로 실패함을 확인. **이것은 수정·삭제 API 성공 검증이 아니다.**
- 브라우저: `tests/persona-browser.mjs`는 별도 HTTP fixture. 배포 앱에 연결하지 않으며
  수정·삭제 API가 있다고 가정하는 실제 서버 증거로 사용하지 않는다.
- 최종 전체 테스트/빌드 및 화면 검증 결과는 아래에 기록한다.

실제 OAuth/OTP, 원격 DB, PATCH/DELETE 서버 권한/성공, 실제 서버 CRUD 전체 흐름은
미검증 또는 미구현이다. 유료 API·배포·체인 호출 없음.

### 최종 실행 결과 (2026-10-15)

- `npm test`: **130 passed, 0 failed** (204.48초). 로그 `.context/persona-test.log`.
- `npm run build`: **passed**. 포커스 수정 후 재실행도 통과. 기존 Rollup annotation /
  500kB 초과 chunk 경고가 남는다. 로그 `.context/persona-build.log`.
- `PLAYWRIGHT_MODULE=/Users/sungwooyang/.npm/_npx/b234c773f454f454/node_modules/playwright/index.mjs node tests/persona-browser.mjs`:
  **passed**. 기존 캐시 Playwright 사용, 의존성/lockfile 변경 없음.
  fixture 생성→목록→수정→삭제, 공백 입력, 목록 재시도, 저장/삭제 오류,
  중복 제출 1회 처리, 삭제 취소, Escape, Tab 이동, 삭제 후 새 버튼 포커스 확인.
- 390/768/1440px 목록/폼: 가로 넘침 없음, 긴 이름/소개 겹침 없음, 키보드 포커스 표시.
  브라우저 runtime error 0. 스크린샷 `.context/persona-{form,list}-{390,768,1440}.png`.
  화면 캡처는 **독립 관리 컴포넌트 + HTTP fixture**이며 실제 로그인된 앱 전체 캡처는 아니다.
- 리뷰와 실패한 브라우저 테스트로 삭제 후 focus가 body로 빠지는 문제를 찾았고,
  모달 닫힘 후 다음 frame에서 새 버튼으로 이동하도록 수정 후 재검증 통과.
- `git diff --check`: passed.

Draft PR: https://github.com/starlash7/iruka/pull/16
구현 커밋: `ba578da`. main 대상 PR에는 선행 기준 변경이 포함되므로 담당 변경 리뷰는
`git diff 8ada036...HEAD` 사용. 현재 작업 브랜치 유지.
