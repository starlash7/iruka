# 실제 모델 연결 실행 계획

기준: 8ada036. 작업 브랜치 starlash7/gij68 유지. 문서 참조 b7f750e는 읽기 전용.

## 설계 및 소유권

기존 ModelService.stream({messages,signal}) → delta/usage 계약을 유지한다.
이미 조립된 작품 설정·선택 분기·기억·로어북을 재구성하거나 누락하지 않는다.
server/models/**에서 선택된 한 제공사만 구현한다. 새 SDK 의존성 없이 Node fetch와
AbortSignal을 우선한다. server/product, server/core, DTO, 환경 파일, 패키지는 수정하지 않는다.
server/chat/** 변경은 현재 계획하지 않는다. 필요하면 이유·파일·검증을 먼저 이 계획에 추가한다.

## 체크리스트

- [x] git fetch, 깨끗한 트리 및 현재 브랜치 확인; 기준 8ada036 fast-forward.
- [x] 필수 문서, b7f750e 제품 방향, ModelService/채팅/정산/로컬 정책 확인.
- [x] 실제 제공사 미확정 확인; 공식 문서로 권장 GPT-5.4 mini와 대안 Sonnet 5.5 비교.
- [x] 사용자 선택: OpenAI GPT-5.4 mini + Responses API. 실제 유료 호출은 여전히 금지.
- [x] server/models/index.ts: 명시적 초기화 factory. 서버 키·모델·한도·안전 정책
      미설정은 차단하고 테스트 정책을 실제 모델로 자동 승격하지 않는다.
- [x] server/models/openai.ts: 고정 공식 endpoint, 이미 조립된 messages 전달,
      외부 AbortSignal + 타임아웃, 자동 재시도 없음, 안전한 오류 및 응답 제한.
- [x] server/models/openaiStream.ts: 공식 스트림
      이벤트 검증, 종료 상태 확인, 실제 usage를 한 번 반환. 누락·중단·불완전 종료는 실패.
- [x] server/models/requestScope.ts: 취소 가능한 await 및 이미 취소된 Promise rejection 처리.
- [x] tests/models-*.test.mjs 및 tests/models-fixtures/**: 합성 공급자 fixture로 정상,
      UTF-8/청크 분할, 사용량 누락, 중단, 시간 초과, HTTP/스트림 오류 검증.
- [x] tests/models-runtime.test.mjs: 실제 채팅/크레딧 서비스와 fixture transport 조합.
      중복 모델 호출 방지, 실패 release, 정산 rollback, private 출력 검사 확인.
- [x] docs/pivot/handoffs/ai-runtime.md: 초기화 함수·환경변수 제안·정책·공통 수정
      요청·실제 호출 전 승인 및 미검증 사항을 선택한 제공사에 맞춰 확정.
- [x] focused tests, npm test, npm run build, git diff --check 실제 결과 기록.
- [x] 관련 변경만 커밋·현재 브랜치 push·기존 draft PR #11 갱신. main push/merge 및 배포 금지.

## 선택 근거

OpenAI GPT-5.4 mini + Responses API를 초기 비용 기준으로 권장한다.
공식 표준 입력/출력 단가 $0.75/$4.50 per 1M tokens, streaming 지원.
대안 Anthropic Claude Sonnet 5.5는 $2/$10 per 1M tokens.
한국어 캐릭터/스토리 품질은 실측 전이므로 우열을 주장하지 않는다.
이 값은 공급자 원가 참고일 뿐 Iruka의 무료 크레딧 또는 서비스 요금제가 아니다.

문서 확인일 2026-10-15:
- https://developers.openai.com/api/docs/models/gpt-5.4-mini
- https://developers.openai.com/api/docs/guides/streaming-responses
- https://platform.claude.com/docs/en/models/sonnet-5-5/overview

## 확정 구현 계약

createOpenAIRuntime({apiKey,modelId,timeoutMs,maxOutputTokens,policy,safety,fetch?})는
{model,safety,models}를 반환한다. safety는 id와 check를 가진 명시적 정책이다.
LOCAL_TEST_CHAT의 단순 check만 있는 객체는 설정으로 받아들이지 않는다. 정책 id는
품질 검증 증명이 아니라 통합 담당의 명시적 선택 경계다.
모델은 gpt-5.4-mini만 허용, 고정 https://api.openai.com/v1/responses를 사용한다.
store:false, background:false, stream:true, reasoning:none, truncation:disabled.
사용량은 response.completed의 input_tokens/output_tokens (캐시/추론 토큰 포함 합계)를
검증해 반환한다. 완료 output_text와 누적 delta 불일치도 실패한다. 원가 세부 할인이나
서비스 가격은 이 2필드 계약으로 계산하지 않는다. API/프로토콜 오류는 정적 메시지로만
표현하고 제공사 body/키/프롬프트/추론 텍스트를 공개하지 않는다.
입력/출력 safety 검사에도 취소·시간 제한을 적용한다. 어댑터 delta는 서버 내부용이며
기존 chat 전체 출력 검사 완료 전 사용자에게 노출하지 않는다.
