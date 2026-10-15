# D: 무료 테스트 크레딧

기준 e67418a. 사용자 후속 지시에 따라 미확정 seq/hash/Merkle/checkpoint 및
앵커/키퍼 구현은 보류한다. 02 CreditsService와 기존 append-only ledger를 사용한다.

사용자 행 FOR NO KEY UPDATE를 계정 잠금으로 사용하고 원장의 합계를 정본으로 계산한다.
예약은 음수 reserve, 완료는 0 charge + 미사용분 release, 실패/취소는 전액 release다.
turn별 unique 제약과 잠금으로 재전송/경합을 직렬화한다. terminal payload는 원장
operation key와 amount로 재구성한다. 새 테이블/공통 마이그레이션은 필요 없다.
무료 지급은 서버 전용 grantFreeCredits({userId,credits,grantKey})로 정책을 주입한다.
운영 지급량/주기와 자동 지급 시점은 정하지 않는다. HTTP로 금액을 받지 않는다.

소유 파일: server/credits/**, src/features/wallet/**, tests/credits-*, 이 작업의 문서.
공통 라우터/페이지 매핑/환경 설정 변경은 하지 않고 연결 예시를 제공한다.
UI는 공통 Page/Button, 잔액/예약/사용 내역과 '미검증' 상태를 제공한다.
DB에 증거가 없으므로 anchored나 가짜 tx를 표시하지 않는다.

검증: 실제 독립 PGlite에서 50개 동시 예약, 중복 지급/예약/terminal,
소유권, 잘못된 금액, 외부 트랜잭션 롤백, 실패 후 신규 턴, HTTP 인증/페이지네이션.
UI는 로컬 fixture만으로 desktop/mobile 확인. 실제 로그인/체인 증거가 아니다.
