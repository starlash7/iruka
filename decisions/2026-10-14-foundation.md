# Wave 02 공통 기반 결정

- 기준: 01 완료 `7c9dad2`를 현재 브랜치에 fast-forward. main을 직접 수정하지 않는다.
- 현재 머신에 PostgreSQL/Docker 실행기가 없어 PGlite 파일 DB를 채택했다. SQL 파서 mock이 아닌
  PostgreSQL WASM 엔진에서 마이그레이션/제약/트리거를 실행한다. 운영 DB 선택은 확정하지 않는다.
  원격 postgres 어댑터는 있으나 실제 원격/다중 프로세스 검증은 후속이다.
- 서버 인증은 jose로 ES256/issuer/audience/expiry/DID를 검증한다. 기존 Privy Google/이메일 UI 유지.
  OAuth/OTP 실제 완료는 아직 미검증. 지갑 생성/서명과 인증을 결합하지 않는다.
- 공개 작품 컬럼과 비공개 버전 JSON 분리. 작성자만 private 응답 접근. 후속 편집 필드 확장은
  B가 DTO 변경안을 내고 공통 담당이 A/C와 순차 합의한다.
- 모델/스토리지/체인 의존성을 추가하지 않고 테스트 스트림을 명시적으로 주입한다. 기본 서비스는 503.
- 원장/턴 계약은 고정했으나 무료 지급량/주기/차감량은 결정하지 않는다. A/D가 같은 트랜잭션으로
  terminal+차감/복구를 구현하고 pending 복구 정책/TTL을 합의해야 한다.
- 성인·결제·정산·신고 스키마와 wallet-link/SIWE는 만들지 않는다.
