# 새 로컬 환경 연결

Node 24.14 이상을 사용한다. 새 환경에 필요한 파일은 `npm run setup:local`로 만든다.
기존 `.env.local`은 덮어쓰지 않는다. 생성 파일은 Git 제외, 권한 0600이다.
현재 워크스페이스는 비밀값 없이 초기화했고 로컬 DB 마이그레이션을 적용했다.

## 인증

1. [Privy Dashboard](https://dashboard.privy.io/)에서 개발용 앱을 만든다. 대시보드는 현재 로그아웃 상태라 계정 소유자의 로그인이 필요하다.
2. Google과 이메일 로그인을 활성화한다. 기존 선택적 지갑 로그인은 유지하고 자동 지갑 생성은 꺼 둔다.
3. 프런트 origin `http://127.0.0.1:5173`을 등록한다. localhost를 쓰면 `http://localhost:5173`도 등록한다. 실제 사용 origin과 OAuth 허용 복귀 URL을 대시보드 설정에 맞게 등록한다. `/login`으로 돌아와야 하며 `next` 쿼리를 포함한 Google 복귀를 실제로 검증한다.
4. 앱 ID를 `.env.local`의 `VITE_PRIVY_APP_ID`, `PRIVY_APP_ID`에 동일하게 넣는다. 클라이언트 ID가 설정된 앱만 `VITE_PRIVY_CLIENT_ID`를 넣는다.
5. 대시보드의 ES256 인증 검증 **공개키**를 `PRIVY_VERIFICATION_KEY`에 넣는다. PEM의 줄바꿈은 `\n` 리터럴로 적을 수 있다. Privy 앱 secret은 이 방식의 JWT 검증에 필요하지 않다.
6. 다른 개발 포트를 쓰면 `API_ALLOWED_ORIGINS`에 실제 프런트 origin을 정확히 등록한다. 기본은 127.0.0.1/localhost의 5173 포트다.
7. `npm run env:check`로 확인하고 `npm run dev`로 시작한다. 이 진단은 값을 출력하지 않으며 실제 OAuth/메일 수신을 대신하지 않는다.

새 계정은 별도 비밀번호를 만들지 않는다. Google/이메일/선택적 지갑의 인증 결과인
Privy DID를 서버가 JWT로 검증하고 DB 계정 키로 사용한다. 닉네임은 마이페이지에서 수정한다.
약관/개인정보 정책 원문과 동의 버전은 미확정이며 동의 기록은 아직 구현하지 않았다.

공식 계약: [이메일 OTP](https://docs.privy.io/authentication/user-authentication/login-methods/email),
[Google OAuth](https://docs.privy.io/authentication/user-authentication/login-methods/oauth),
[서버 토큰 검증](https://docs.privy.io/authentication/user-authentication/access-tokens).

## 데이터베이스

`DATABASE_URL`이 비어 있으면 `.context/local-db`에 PostgreSQL 호환 PGlite가 영속 저장된다.
`npm run db:migrate`는 기존 데이터를 지우지 않고 기록된 마이그레이션만 추가한다.
API를 중지한 상태에서 실행한다. 로컬 DB 잠금 파일을 임의로 제거하지 않는다.

원격 PostgreSQL은 아직 만들거나 연결하지 않았다. 운영 사업자/지역/백업·복원/보존 정책을
정한 뒤 전용 개발 DB 연결 문자열을 서버의 `DATABASE_URL`에 설정한다. 마이그레이션 전
대상과 백업을 확인한다. URL은 Git·브라우저 환경 변수·로그에 넣지 않는다.

검증된 범위는 임시 파일 DB 재시작, 서명된 테스트 JWT→DID→동일 프로필 복원,
다른 DID 격리다. 실제 Privy 재로그인이나 운영 PostgreSQL의 증거는 아니다.

## 모델

기본 `LOCAL_TEST_CHAT=0`, `LOCAL_LIVE_MODEL=0`으로 모델이 비활성화되어 있다.
인증 설정 후 비용 없는 로컬 흐름 확인에는 `LOCAL_TEST_CHAT=1`을 명시한다.
이 경우에만 테스트 응답과 사용자별 1회 100 테스트 크레딧/턴당 1 차감이 활성화된다.

실제 OpenAI 어댑터는 기존 `gpt-5.4-mini`를 유지한다. [공식 모델 계약](https://developers.openai.com/api/docs/models/gpt-5.4-mini)을 확인했다.
실제 연결 경로는 다음 두 설정을 **모두** 요구하며, 키만 넣어도 호출되지 않는다.

- 서버 환경의 `OPENAI_API_KEY`와 `LOCAL_LIVE_MODEL=1` (`LOCAL_TEST_CHAT=0`).
- Git 제외 `.context/model-runtime.ts`에서 `createOptions()`를 export한다. 반환 타입은
  `Omit<OpenAIRuntimeOptions, 'apiKey' | 'fetch'>`이다. `server/models/index.ts`의 계약에 따라
  `modelId`, `timeoutMs`, `maxOutputTokens`, `policy`, 이름 있는 `safety`를 지정한다.
  키/transport는 이 모듈에서 받지 않는다. 입력/출력 안전 서비스와 예약/실차감 함수가 없으면 시작이 거부된다.

실제 안전 정책과 한도/크레딧 정책은 미확정이다. 키·안전 서비스·정책을 준비하기 전에는
켜지 않는다. 실제 모델 모드에 테스트 크레딧을 자동 지급하지 않으므로 기존 잔액 또는
별도로 확정한 서버 지급 정책이 필요하다. 정규식 로컬 테스트 안전 검사를 운영 정책으로 재사용하지 않는다.
두 로컬 모델 모드 모두 production/Vercel에서 거부된다. 요약 모델 호출도 기본 비활성화다.
이번 작업은 실제 모델/유료 API 호출, 원격 DB 생성, 배포를 실행하지 않았다.
