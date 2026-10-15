# 06. wave1-재화-결제-온체인 — Wave 1 (병렬)

> Conductor에 이 문서 전체를 붙여넣어요. repo: `starlash7/iruka`, 브랜치: `pivot/06-재화-결제-온체인`. 설계 문서: `00-전체-설계.md`(이 zip 안. repo에는 `docs/pivot/00-전체-설계.md`로 Wave 0에서 복사됨)를 먼저 읽어요.

## 목표
재화 장부, 무료 일일 한도, PG 결제 검증, GIWA 앵커 컨트랙트와 키퍼를 구현해요.

## 범위
- `server/credits/`: `chargeForTurn`/`refundTurn` 실제 구현(트랜잭션, 무료 한도 KST 날짜, bonus→paid 순 차감 여부는 설정, 잔액 부족 에러), ledger 해시 체인(`entry_hash`, `prev_hash`), 잔액 캐시 갱신.
- `server/payments/`: 어댑터 인터페이스 + `mock` 구현(포트원/토스 골격만, 키 없으면 비활성), prepare/webhook(서명 검증, 금액 재조회, 멱등성 `provider_payment_id` unique).
- `server/chain/`: viem 키퍼, `recordPayment`, `commitCheckpoint`(미앵커 seq 구간 Merkle root), 리스/락(Postgres advisory lock), 재시도, 상태 기록. 체인 호출은 `CHAIN_MODE=mock|anvil|giwa-sepolia`, 기본 mock.
- `api/credits/**`, `api/products/**`, `api/payments/**`, `api/ledger/**`, `api/cron/anchor.ts`.
- `contracts/src/IrukaLedgerAnchor.sol`(Wave 0 인터페이스 구현), `contracts/test/IrukaLedgerAnchor.t.sol`(권한, 중복 영수증 revert, 체크포인트 연속성, pause), `contracts/script/DeployIrukaLedgerAnchor.s.sol`(실행 금지, 스크립트만).
- UI `src/features/wallet/`: 잔액·무료 잔여, 상품 목록, mock 결제 플로우, 거래 내역, 영수증 상세(tx 해시 링크 + Merkle proof 검증 버튼, 클라에서 viem으로 root 비교), 연결된 지갑 주소.
- `/wallet` 라우트 페이지.

## 파일 소유권
touch: `server/credits/**`, `server/payments/**`, `server/chain/**`, `api/credits/**`, `api/products/**`, `api/payments/**`, `api/ledger/**`, `api/cron/anchor.ts`, `contracts/**`(interfaces 제외), `src/features/wallet/**`, `supabase/migrations/03*`, `tests/credits-*`, `tests/payments-*`, `tests/ledger-*`. do-not-touch: `server/core/interfaces.ts` 시그니처, `server/chat/**`, 다른 features.

## 선행 작업
02 머지.

## 완료 기준
- `forge test` 통과. anvil 로컬 배포 후 `CHAIN_MODE=anvil`로 결제→앵커→proof 검증 e2e 통과.
- 동시 차감 50건 테스트에서 잔액 음수 없음, ledger 해시 체인 연속.
- 같은 웹훅 2번 → 재화 1번만 지급.
- 체인에 user_id·이메일·지갑 주소가 올라가지 않음(이벤트 인자 검사).

## 테스트 방법
`forge test && anvil & npm test -- tests/credits-* tests/payments-* tests/ledger-*` (GIWA Sepolia 실배포는 사용자 승인 후 별도).

## 끝나면
- draft PR 생성(제목 `[pivot 06] ...`), 본문에 변경 요약·테스트 결과·남은 한계·다른 태스크에 요청할 사항.
- main 머지는 사용자가 직접 해요.

## 금지 (모든 태스크 공통)
- `main` 브랜치에 push·merge 금지. 작업 브랜치 `pivot/<태스크번호>-<이름>`에서만 커밋하고, PR은 draft로만 열어요.
- 배포 금지(Vercel deploy, `vercel --prod`, 컨트랙트 메인넷 배포 금지. GIWA Sepolia 배포도 사용자 승인 전 금지).
- 유료 API 호출 금지: LLM·임베딩·PG·본인인증은 `mock` 어댑터로만 테스트. 실제 키 필요 시 멈추고 사용자에게 물어요.
- 비밀값을 코드·커밋·로그에 쓰지 말고 `.env.example` 플레이스홀더만 추가.
- 자기 범위 밖 파일 수정 금지. 꼭 필요하면 PR 설명에 "다른 태스크 요청 사항"으로 적고 수정은 하지 않아요.
- 실존 인물(K-pop 아이돌) 이미지·이름을 시드나 예시에 쓰지 않아요.
