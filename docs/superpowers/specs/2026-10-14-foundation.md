# Wave 02 공통 기반

사용자 요청을 실행 범위로 삼는다. 기준은 01 완료 커밋 7c9dad2이며 기존 브랜치를 유지한다.

## 설계
- PostgreSQL SQL 마이그레이션. 로컬은 파일 저장 PGlite(PostgreSQL WASM), 테스트는 매번 독립 인스턴스. 원격 PostgreSQL 연결 어댑터도 동일 query/transaction 인터페이스를 사용한다. Docker 없는 환경에서 실제 SQL 제약과 트리거를 검증한다. 다중 프로세스 운영 검증은 후속이다.
- Privy ES256 access token의 서명/issuer/audience/expiry/subject를 검증한다. DID로 users를 upsert하고 소유권은 서버에서 검사한다. 로그인은 Google/이메일이며 지갑 준비와 분리한다. 테스트 키와 주입된 verifier는 테스트에서만 사용한다.
- 작품 공개 필드와 비공개 버전 설정을 물리적으로 분리한다. 공개 DTO는 whitelist로 구성한다. 작성자 API만 private 설정에 접근한다. 채팅은 발행 버전과 페르소나 snapshot을 고정한다.
- 메시지는 같은 chat 안의 parent tree. turn 요청은 사용자+멱등키 및 payload hash로 식별한다. 성공은 charge 확정, 실패/중단은 reserve 복구, 같은 키 재전송은 기존 결과만 반환, 새 키 재시도는 새 요청이다. 확정된 terminal 상태는 변경하지 않는다.
- JSON envelope와 오류 code, requestId를 고정한다. SSE는 typed payload, sequence, terminal event를 사용한다. 유료 모델 호출 없이 테스트 어댑터를 주입한다. 미주입 업무 서비스는 503으로 닫는다.
- React 라우트 자리와 기본 UI만 구현한다. 실제 탐색/채팅/스튜디오/크레딧 기능은 A–D가 채운다. 한국어 Pretendard 본문과 별도 영문 브랜드 글꼴, 흰색/블루 토큰을 사용한다.

## 범위 제외
성인/결제/정산/신고 스키마, 자동 지갑 생성/서명 조건, 배포, 유료 API, 체인 호출. 원문 02의 제외 기능은 만들지 않는다.

## 파일 소유권
공통 담당: package/lock/env/config, server/core, server/app, server/dev, src/shared, src/routes, migrations, 테스트 하네스, docs.
이번 보조 구현: DB 담당은 server/db + migrations + tests/core-db만, UI 담당은 src/ui + src/features 빈 페이지 + src/routes + App/styles + tests/core-ui만. 공유 파일은 루트 담당만 수정한다.
후속 A: server/chat, api/chat, src/features/chat. B: server/studio, src/features/studio, scripts/seed. C: server/discovery, src/features/discovery/user. D: server/credits, server/giwa, src/features/credits, contracts. 공통 계약/패키지는 공통 담당에게 변경 요청한다.

## 검증
독립 DB 마이그레이션/제약, 유효·만료·위조 인증, 사용자 경계, 공개 비밀 누출, HTTP/SSE 실제 연결, 모든 빈 라우트, UI desktop/mobile, npm test/build. 실제 Google OAuth/OTP는 자격 증명 없이 완료했다고 주장하지 않는다.
