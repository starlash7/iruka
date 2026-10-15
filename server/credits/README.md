# D: 무료 테스트 크레딧 연결

기준 공통 커밋 `e67418a`. 이 모듈은 `server/core/interfaces.ts`의
CreateCreditsService/CreditsService 계약을 구현한다. 원장과 기존 unique/append-only
제약을 사용한다. 추가 패키지, 마이그레이션, 운영 설정은 없다.

## 서버 지급 정책

```ts
const credits = createCreditsService({db})
await credits.grantFreeCredits({userId, credits: policy.amount, grantKey: policy.periodKey})
```

userId는 검증된 서버 계정이다. amount/periodKey는 서버 정책에서만 만든다.
같은 사용자+grantKey는 한 번 지급하며 다른 금액 재전송은 409다.
운영 지급량/주기/자동 지급 시점은 아직 미정이다. 테스트 수량은 제품 정책이 아니다.
HTTP 지급/충전 endpoint는 없고 잔액 GET도 지급 부작용이 없다.
모든 amount는 JS safe integer, reserve/grant는 양수, actualCredits는 0 이상이다.
잔액 부족은 공통 계약의 `CONFLICT` 409다. 0비용 턴은 예약을 만들지 않는 정책을
A가 선택할 수 있다. 0 예약 자체는 기존 원장 reserve<0 제약 때문에 허용하지 않는다.

## A: 대화 서비스 연결

```ts
const credits = createCreditsService({db})
const chat = createChatService({db, model, credits})
```

beginTurnRequest의 `new`만 모델을 실행한다. `in_progress`/`replay`는 재실행하지 않는다.
모델 호출 전 reserveTurn({userId,turnId,credits:upperBound})를 호출한다.
실제 사용량은 upperBound 이하여야 한다. reserved 응답의 reserved는 최초 예약량이다.
완료/해제 후 같은 reserve payload는 현재 terminal 상태를 반환하며 다시 차감하지 않는다.

성공 결과/메시지와 원장을 반드시 같은 outer transaction에서 저장한다:

```ts
await db.transaction(async tx => {
  const scopedCredits = createCreditsService({db: tx})
  await scopedCredits.completeTurn({userId, turnId, actualCredits})
  // 이 tx로 메시지를 저장한다. 이미 terminal이면 저장된 결과를 재사용한다.
  await finishTurnRequest(tx, {userId, turnId, status: 'succeeded', response})
})
// commit 이후에만 SSE usage/done 전달
```

실패/취소도 같은 패턴으로 releaseTurn(reason:'failed'|'cancelled') 후
finishTurnRequest(status:'failed'|'aborted')를 호출한다. 잠금 순서는 사용자 → 턴이다. 키를 수정하지 않으므로 FOR NO KEY UPDATE를 사용해
FK KEY SHARE와 불필요한 충돌을 피한다.
**finish를 먼저 호출한 뒤 credits를 호출하지 않는다.** 모델/네트워크를 DB 트랜잭션 안에서
실행하지 않는다. 메시지 중복 방지는 A가 turn 상태 확인과 함께 동일 tx에서 처리한다.
terminal 뒤 payload 변경 및 complete/release 경합은 한쪽만 성공한다.
호출 시 root db의 credits 객체를 재사용하면 outer tx와 분리되므로 반드시 tx로 factory를 만든다.

프로세스 강제 종료 후 pending/running 예약 자동 회수는 구현하지 않았다.
살아 있는 모델 호출을 TTL만으로 복구하면 무상 완료 경합이 생기므로, A의 실행 lease/fencing
계약과 함께 후속 구현해야 한다. 현재 서버 실패/취소 경로는 releaseTurn을 반드시 호출한다.

## 공통 담당 연결 (이 PR에서는 공통 파일 미수정)

- `createApiHandler({db,verifyToken,credits})`에 주입하면 기존 GET /api/me/credits가 작동한다.
- `createCreditsHandler({db,verifyToken,credits})`를 `/api/credits/*`에 mount한다.
  GET `/api/credits/balance`: `{available,reserved}`.
  GET `/api/credits/history?limit=25&before=<seq>`: `{entries,nextCursor}`.
  limit 1..100, before는 bigint 십진 문자열. 내역은 seq 내림차순이며 본인만 조회된다.
  공통 `{data,requestId}`/error envelope, 401/400/404/409, no-store를 사용한다.
- 기존 `/credits` 페이지의 import 대상을 `src/features/wallet/index.tsx` default로 연결한다.
  RoutePageProps의 authEnabled와 기존 PrivyProvider를 그대로 사용한다.
  내부 UI는 공통 Page/Button으로 잔액, 예약, 내역, 로딩/오류/페이지네이션을 표시한다.
- 현재 기존 빈 /credits 페이지와 server/dev.ts는 그대로이므로 mount 전엔 새 모듈이 활성화되지 않는다.

## 보류된 장부 검증

사용자 후속 지시에 따라 seq 규칙/해시/Merkle/checkpoint, IrukaLedgerAnchor,
GIWA 배포 스크립트와 키퍼는 아직 구현하지 않는다. 기존 seq를 cursor로만 사용한다.
모든 내역 verification은 `unverified`, UI는 `미검증`이다. 앵커 영수증/링크는 만들지 않는다.
새 번호 체계가 필요하면 공통 담당과 합의한 migration으로 이 원장 기록까지 처리해야 한다.

## 검증

`node --experimental-strip-types --test tests/credits-*.test.mjs`

독립 PGlite PostgreSQL 엔진에서 실행한다. 이것은 원격 PostgreSQL의 여러 connection
부하 테스트나 실제 OAuth/GIWA 영수증 증거는 아니다. 실제 배포/유료 호출 없음.
상세 최종 결과는 이 작업의 docs/superpowers/plans/2026-10-14-test-credits.md에 기록한다.
