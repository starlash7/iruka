# 10. wave2-크리에이터대시보드-비용 — Wave 2 (병렬 가능: 09와 파일 안 겹침)

> Conductor에 이 문서 전체를 붙여넣어요. repo: `starlash7/iruka`, 브랜치: `pivot/10-크리에이터대시보드-비용`. 설계 문서: `00-전체-설계.md`(이 zip 안. repo에는 `docs/pivot/00-전체-설계.md`로 Wave 0에서 복사됨)를 먼저 읽어요.

## 목표
크리에이터 대시보드·정산 장부와 운영자 비용 대시보드를 만들어요.

## 범위
- `server/creator/`: `recordCreatorEarning` 구현(유료 차감 메시지마다 `creator_earnings`), 월 마감 `creator_settlements` + Merkle root → 06의 `server/chain` 공개 함수 `commitSettlement` 호출(06 코드 수정 금지, 없으면 PR에 요청 기록).
- `api/creator/**`, `api/admin/costs.ts`(일·모델 등급별 토큰, `cost_micro_usd`, 무료/유료 비율, DAU, 결제액 대비 원가).
- UI `src/features/creator/`(작품별 지표, 정산 내역, 월 영수증 검증), `src/features/admin/costs/`(비용 차트, 무료 한도 시뮬레이터: 무료 턴 수 바꾸면 월 비용 추정 — 기획 B절 단가 테이블 사용).

## 파일 소유권
touch: `server/creator/**`, `api/creator/**`, `api/admin/costs.ts`, `src/features/creator/**`, `src/features/admin/costs/**`, `supabase/migrations/07*`, `tests/creator-*`, `tests/costs-*`. do-not-touch: `src/features/admin/`의 신고 큐(09), `server/chain/**`.

## 선행 작업
Wave 1 전부 머지.

## 완료 기준
- 유료 턴 100건 시뮬레이션 → earnings 합계 = 차감 × share_bps, 월 마감 root 재계산 일치.
- 비용 대시보드 숫자가 messages 집계와 일치.

## 테스트 방법
`npm test -- tests/creator-* tests/costs-*`

## 끝나면
- draft PR 생성(제목 `[pivot 10] ...`), 본문에 변경 요약·테스트 결과·남은 한계·다른 태스크에 요청할 사항.
- main 머지는 사용자가 직접 해요.

## 금지 (모든 태스크 공통)
- `main` 브랜치에 push·merge 금지. 작업 브랜치 `pivot/<태스크번호>-<이름>`에서만 커밋하고, PR은 draft로만 열어요.
- 배포 금지(Vercel deploy, `vercel --prod`, 컨트랙트 메인넷 배포 금지. GIWA Sepolia 배포도 사용자 승인 전 금지).
- 유료 API 호출 금지: LLM·임베딩·PG·본인인증은 `mock` 어댑터로만 테스트. 실제 키 필요 시 멈추고 사용자에게 물어요.
- 비밀값을 코드·커밋·로그에 쓰지 말고 `.env.example` 플레이스홀더만 추가.
- 자기 범위 밖 파일 수정 금지. 꼭 필요하면 PR 설명에 "다른 태스크 요청 사항"으로 적고 수정은 하지 않아요.
- 실존 인물(K-pop 아이돌) 이미지·이름을 시드나 예시에 쓰지 않아요.
