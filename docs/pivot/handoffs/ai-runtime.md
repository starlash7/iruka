# 실제 모델 연결 인계

## 결과와 기준

사용자가 선택한 OpenAI `gpt-5.4-mini` + Responses API 어댑터를 구현했다.
기준 8ada036을 깨끗한 현재 브랜치 starlash7/gij68에 fast-forward했다.
문서 b7f750e는 읽기만 했다. 유료 호출, 배포, 환경 파일 변경은 하지 않았다.
수정 범위는 server/models/**, 담당 테스트 및 이 문서/계획뿐이다.
server/chat/**, server/product/**, server/core/**, 공유 DTO, 패키지/lockfile은 변경하지 않았다.

CURRENT_SCOPE 상단과 최신 사용자 요청을 우선한다. 하단 Wave 01/02의 신규
채팅/서버 제외 문구는 과거 기록으로 해석했다. Docs b7f750e의 작품 중심 방향을
참고했으며 기존 mode와 발행 규칙은 변경하지 않았다.

## 초기화 계약

`server/models/index.ts`의 `createOpenAIRuntime(options)`:

```ts
const runtime = createOpenAIRuntime({
  apiKey: serverSecrets.openaiApiKey,
  modelId: 'gpt-5.4-mini',
  timeoutMs: approvedTimeoutMs,
  maxOutputTokens: approvedOutputTokenLimit,
  policy: approvedChatPolicy,
  safety: approvedSafetyPolicy,
});
// 통합 담당의 서버 composition에서 createProduct에 ...runtime 주입.
```

필수 인자:
- apiKey: 서버 전용 비밀. 브라우저 환경에서는 초기화 차단.
- modelId: 정확히 `gpt-5.4-mini`. 모델 생략/다른 모델은 차단.
- timeoutMs: 1–55000 정수. fetch, stream read, adapter safety 검사 모두 제한.
- maxOutputTokens: 1–128000 정수.
- policy: 기존 ChatPolicy. maxContextTokens는 1부터 400000−maxOutputTokens까지,
  maxOutputCharacters는 1–200000, reservedCredits는 양의 안전한 정수,
  actualCredits({inputTokens,outputTokens})는 통합 담당이 승인한 정산 함수.
- safety: `{id:string, check(text, direction):Promise<boolean>}`. 명시적 정책 필수.
  id는 선택을 명시하는 경계일 뿐 운영 안전성 인증이 아니다.
- fetch?: fixture 주입용. 생략하면 플랫폼 fetch를 사용하므로 실제 구성 활성화는 별도 승인 필요.

반환값은 `{model, safety, models}`이며 기존 ModelService/ChatPolicy 계약을 유지한다.
환경변수를 직접 읽거나 로컬 테스트 응답으로 fallback하지 않는다.
입력은 채팅 서버가 조립한 역할/내용을 그대로 전달한다. 작품 설정, 시작 상황,
페르소나, 선택 분기의 이력, 메모, 로어북을 어댑터에서 재조립하지 않는다.
요청은 고정 공식 HTTPS endpoint, redirect:error, stream:true, store:false,
background:false, reasoning.effort:none, truncation:disabled이며 자동 재시도하지 않는다.
`store:false`는 공급자의 모든 데이터 보관이 없다는 보장이 아니다.

## 완료·실패·안전 계약

완료 상태, 마지막 텍스트와 delta의 일치, usage의 안전한 정수 및 합계를 검증한다.
캐시를 포함한 input_tokens, 추론을 포함한 output_tokens를 그대로 한 번 반환한다.
캐시 할인 등 USD 원가 세부사항은 현재 두 필드 계약으로 산정하지 않는다.
누락된 사용량, 중단, timeout, HTTP 오류, refusal, 불완전 응답, 도구 출력,
잘못된 SSE/UTF-8 및 크기 한도 초과는 실패한다. HTTP/프로토콜 오류에 원본 body,
키, 프롬프트, cause를 포함하지 않는다. 취소 시 body를 닫고 요청 signal을 중단한다.

adapter delta는 서버 내부용이다. 사용자 SSE는 기존 chat 전체 출력 safety/private
검사와 원자적 정산 이후에만 발생한다. 기존 채팅 멱등 키와 CreditsService의
reserve/complete/release를 그대로 사용하며 별도 원장을 만들지 않는다.
실패 시 반환된 사용자 크레딧은 이미 발생한 공급자 비용의 환불을 뜻하지 않는다.

로컬 TestModelService 및 LOCAL_TEST_CHAT 경로와 분리되어 있다. 테스트의 단순
키워드 필터는 운영 안전 정책이 아니다. 기존 private guard는 정규화된 8자 이상
비공개 원문 전체 일치만 차단하므로 짧은 발췌·재서술·프롬프트 주입 위험은 남는다.
모델 어댑터를 직접 API로 노출하지 말고 기존 인증·대화 소유권·출력 검사를 통과시켜야 한다.

## 통합 담당 변경 요청

1. 서버 composition에서 factory를 호출하여 createProduct에 model/safety/models를
   주입한다. 실제 모드와 LOCAL_TEST_CHAT을 상호 배타적으로 선택한다. 자동 fallback 금지.
2. 제안 환경변수 이름: `OPENAI_API_KEY`, `IRUKA_OPENAI_MODEL`,
   `IRUKA_OPENAI_TIMEOUT_MS`, `IRUKA_OPENAI_MAX_OUTPUT_TOKENS`.
   환경 예제와 서버 설정 검증은 통합 담당 소유다. VITE_ 접두사, 공개 DTO, 로그에 키 금지.
3. 승인된 운영 safety 검증기와 모델·입출력 한도·크레딧 예약/정산 정책을 주입한다.
   테스트의 지급량/1 credit 비용과 공급자 원가를 확정 서비스 요금제로 사용하지 않는다.
   기존 chat 입력/출력 safety 호출도 있으므로 주입 검증기는 자체 취소/timeout을 가져야 한다.
4. 채팅 기본 generation 60초, lease 90초보다 adapter timeout을 짧게 유지한다.
   예약량이 actualCredits 상한을 감당하는지 확인한다. 제공사 거절 시에도 비용 가능성을 반영한다.
5. `product.maintain()`은 동일 모델을 기억 요약에도 사용한다. 요약 worker는 별도
   30초 제한과 최대 3회 시도를 가진다. 실제 생성뿐 아니라 요약 활성화·비용·재시도
   예산을 별도 승인하고 gating해야 한다. adapter의 재시도 없음이 worker 재시도 없음은 아니다.
6. 실제 호출 전 API 계정의 모델 접근, 비밀 주입, 공급자 데이터 처리 조건, 운영 안전
   정책, 예산/속도 제한과 요약 실행 승인을 확인한다. 이 PR만으로 live 모드를 켜지 않는다.

## 검증

모든 공급자 응답은 합성 fixture이며 실제 유료 호출은 0회다.
- `npm ci --ignore-scripts`: exit 0, 패키지/lockfile 변경 없음.
- 기준 `npm test`: 128 passed, 0 failed.
- `node --experimental-strip-types --test tests/models-openai.test.mjs tests/models-runtime.test.mjs`:
  24 passed, 0 failed. 사용량 누락, timeout/취소, 동기 abort의 unhandled rejection,
  HTTP/stream 오류, UTF-8/프레임 분할, 비공개 출력, 중복 요청, 실제 DB 크레딧
  정산 실패 rollback 및 환급, 선택 분기 전달을 확인했다.
- 읽기 전용 별도 리뷰에서 동기 abort 경계 사례를 확인했고 회귀 테스트와 함께 수정했다.
- 전체 `npm test`: exit 0, 152 passed, 0 failed (61.2초).
- `npm run build`: exit 0. 기존 Rollup annotation 및 500 kB 초과 chunk 경고가 남는다.
- `git diff --cached --check`: exit 0.

Draft PR: https://github.com/starlash7/iruka/pull/11
현재 브랜치에 이미 열려 있던 Draft PR을 갱신한다. base main과의 전체 diff에는
기준 8ada036의 통합 변경도 포함되므로 이번 담당 변경은 `git diff 8ada036..HEAD`로
검토한다. main 직접 push/merge는 수행하지 않는다.

실제 한국어 캐릭터 품질, 계정별 모델 접근, 실제 응답 호환성/비용, 운영 safety,
공급자 보관 설정 및 원격 PostgreSQL 동시성은 미검증이다. PGlite/fixture 결과를
live 환경 검증으로 취급하지 않는다. UI/UX 변경은 이번 작업 범위가 아니다.

공식 문서 확인 2026-10-15:
- https://developers.openai.com/api/docs/models/gpt-5.4-mini
- https://developers.openai.com/api/reference/resources/responses/methods/create
- https://developers.openai.com/api/docs/guides/streaming-responses
