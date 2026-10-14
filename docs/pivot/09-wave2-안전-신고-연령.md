# 09. wave2-안전-신고-연령 — Wave 2 (병렬 가능: 10과 파일 안 겹침)

> Conductor에 이 문서 전체를 붙여넣어요. repo: `starlash7/iruka`, 브랜치: `pivot/09-안전-신고-연령`. 설계 문서: `00-전체-설계.md`(이 zip 안. repo에는 `docs/pivot/00-전체-설계.md`로 Wave 0에서 복사됨)를 먼저 읽어요.

## 목표
신고, 관리자 처리 큐, 차단, 성인 인증, 출력 모더레이션을 붙여요.

## 범위
- `server/safety/`: `moderateText` 실제 구현(금칙어 사전 + 미성년자 성적 콘텐츠 하드 룰 + 공급자 모더레이션 어댑터 골격, 기본 mock), 레이트 리밋(유저 분당 N).
- `api/reports/**`, `api/admin/reports/**`, `api/age/verify/**`(본인인증 어댑터 mock, Dojang 어댑터는 골격 + [확인 필요] 주석).
- 누적 신고 임계치 → `works.status='hidden_by_report'`, `audit_log`.
- UI `src/features/safety/`(신고 모달 컴포넌트 export, 성인 인증 페이지) + `src/features/admin/`(신고 큐).
- 05·07 화면에 신고 버튼 연결은 **11에서** 함(여기서는 컴포넌트만).

## 파일 소유권
touch: `server/safety/**`, `api/reports/**`, `api/admin/reports/**`, `api/age/**`, `src/features/safety/**`, `src/features/admin/**`, `supabase/migrations/06*`, `tests/safety-*`. do-not-touch: `src/features/chat|discover|studio|wallet/**`.

## 선행 작업
Wave 1 전부 머지.

## 완료 기준
- 금지 입력/출력 차단 테스트, 신고 임계치 자동 숨김 테스트, 비인증 유저 19 접근 차단(서버) 테스트.

## 테스트 방법
`npm test -- tests/safety-*`

## 끝나면
- draft PR 생성(제목 `[pivot 09] ...`), 본문에 변경 요약·테스트 결과·남은 한계·다른 태스크에 요청할 사항.
- main 머지는 사용자가 직접 해요.

## 금지 (모든 태스크 공통)
- `main` 브랜치에 push·merge 금지. 작업 브랜치 `pivot/<태스크번호>-<이름>`에서만 커밋하고, PR은 draft로만 열어요.
- 배포 금지(Vercel deploy, `vercel --prod`, 컨트랙트 메인넷 배포 금지. GIWA Sepolia 배포도 사용자 승인 전 금지).
- 유료 API 호출 금지: LLM·임베딩·PG·본인인증은 `mock` 어댑터로만 테스트. 실제 키 필요 시 멈추고 사용자에게 물어요.
- 비밀값을 코드·커밋·로그에 쓰지 말고 `.env.example` 플레이스홀더만 추가.
- 자기 범위 밖 파일 수정 금지. 꼭 필요하면 PR 설명에 "다른 태스크 요청 사항"으로 적고 수정은 하지 않아요.
- 실존 인물(K-pop 아이돌) 이미지·이름을 시드나 예시에 쓰지 않아요.
