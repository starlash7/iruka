# 무료 크레딧 실행 체크리스트

- [x] tests/credits-service.test.mjs: grant replay/conflict, 50 concurrent reservations,
  completed/released terminal payload, ownership, invalid amounts, rollback tests first.
- [x] server/credits/ledger.ts: account lock, bigint balance, owned turn reads, insert/read ledger.
- [x] server/credits/index.ts: createCreditsService({db}), server-only grant and history.
  Existing CreditsService signatures remain unchanged; reserved state derives from ledger.
- [x] tests/credits-api.test.mjs and server/credits/http.ts: GET balance/history with
  verified Privy identity; no public grant endpoint. Test 401, other-user isolation, bounds.
- [x] src/features/wallet/index.tsx, WalletView.tsx: common UI, cancellation/loading/error,
  balance and paginated history. No fake verified status. Add focused UI tests.
- [x] server/credits/README.md: A atomic completion/release wiring, policy injection,
  integration-owner HTTP/route wiring, deferred ledger anchor contract.
- [x] npm test; npm run build; desktop/mobile screenshots; git diff --check.
- [ ] Record actual evidence, commit current branch, push current branch, draft PR base main.

## 검증 기록

- `node --experimental-strip-types --test tests/credits-*.test.mjs`: 6/6 통과.
  구현 전 서비스/HTTP/UI 파일 미존재로 실패한 테스트를 확인했고 구현 후 통과했다.
- `npm test`: 67/67 통과 (최종 잠금 수정 후 재실행, 35.35초).
- `npm run build`: frontend/server TypeScript + Vite 성공. 기존 Privy/Rollup
  annotation 경고 유지. 공통 경로 미연결인 wallet은 TypeScript 검증과 별도 Vite preview로 확인.
- `node .context/credits-browser.mjs`: desktop 1440×1000, mobile 390×844에서
  페이지네이션, 새로고침, busy disabled, 503, 빈 내역, 401 데이터 제거 통과.
  overflow 0, pageerror 0. 스크린샷을 직접 열어 겹침/잘림 없음 확인.
  `.context/credits-desktop.png`, `.context/credits-mobile.png`는 로컬 HTTP fixture다.
- 독립 리뷰: 재무/멱등성/권한 blocking bug 없음. FK KEY SHARE와 불필요한 잠금 충돌
  가능성을 줄이기 위해 사용자/턴 잠금을 FOR NO KEY UPDATE로 변경하고 6개 테스트 재실행.
- `git diff --check`: 오류 없음.

원격 PostgreSQL 다중 연결, 실제 Privy 로그인, 계정 전환 브라우저 동작, 체인 검증은 미실행.
미확정 해시/앵커/키퍼 범위는 사용자 요청에 따라 보류. pending/running 프로세스 종료 예약의
자동 회수는 A 실행 lease/fencing과 후속 합의가 필요하다. 서버 실패/취소의 명시적 복구는 구현했다.
A 연결 방법과 공통 담당 변경 요청: `server/credits/README.md`.
