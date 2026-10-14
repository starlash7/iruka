# 07. wave1-탐색-홈 — Wave 1 (병렬)

> Conductor에 이 문서 전체를 붙여넣어요. repo: `starlash7/iruka`, 브랜치: `pivot/07-탐색-홈`. 설계 문서: `00-전체-설계.md`(이 zip 안. repo에는 `docs/pivot/00-전체-설계.md`로 Wave 0에서 복사됨)를 먼저 읽어요.

## 목표
홈, 랭킹, 태그, 검색, 작품 상세, 좋아요를 만들어요.

## 범위
- `server/discover/`: 홈 레일 쿼리(배너 설정, 신작, 급상승, 장르 레일, 이어하기), 랭킹 MV `ranking_daily` + `api/cron/ranking.ts`, trigram 검색, 태그 포함/제외 필터, 19등급 필터(유저 `adult_verified_at` 기준).
- API: `api/discover/**`, `api/works/[id].ts`, `api/works/[id]/like.ts` — `public_works_v`만 사용.
- UI `src/features/discover/`: 홈(재사용: `HomeView`/`HomeImageCarousel` 패턴), 작품 카드(재사용: `MarketplaceCardTile` 패턴), 랭킹 탭(일/주/월 × 모드), 태그 페이지, 검색(디바운스), 작품 상세(소개, 태그, 등장인물 이름·이미지, 시작 상황 제목, 플레이 가이드, '대화 시작' → 05 시작 시트로 이동).

## 파일 소유권
touch: `server/discover/**`, `api/discover/**`, `api/works/**`, `api/cron/ranking.ts`, `src/features/discover/**`, `supabase/migrations/04*`, `tests/discover-*`. do-not-touch: 다른 features, `src/shared/**`.

## 선행 작업
02 머지.

## 완료 기준
- 시드 없이도 fixture 작품 30개로 홈·랭킹·검색 렌더.
- 비공개 필드가 상세 응답에 없음(테스트).
- 비인증 유저에게 19등급 작품이 목록·검색·상세 모두 안 보임.

## 테스트 방법
`npm test -- tests/discover-*`; dev 서버 `/`, `/ranking`, `/search?q=`.

## 끝나면
- draft PR 생성(제목 `[pivot 07] ...`), 본문에 변경 요약·테스트 결과·남은 한계·다른 태스크에 요청할 사항.
- main 머지는 사용자가 직접 해요.

## 금지 (모든 태스크 공통)
- `main` 브랜치에 push·merge 금지. 작업 브랜치 `pivot/<태스크번호>-<이름>`에서만 커밋하고, PR은 draft로만 열어요.
- 배포 금지(Vercel deploy, `vercel --prod`, 컨트랙트 메인넷 배포 금지. GIWA Sepolia 배포도 사용자 승인 전 금지).
- 유료 API 호출 금지: LLM·임베딩·PG·본인인증은 `mock` 어댑터로만 테스트. 실제 키 필요 시 멈추고 사용자에게 물어요.
- 비밀값을 코드·커밋·로그에 쓰지 말고 `.env.example` 플레이스홀더만 추가.
- 자기 범위 밖 파일 수정 금지. 꼭 필요하면 PR 설명에 "다른 태스크 요청 사항"으로 적고 수정은 하지 않아요.
- 실존 인물(K-pop 아이돌) 이미지·이름을 시드나 예시에 쓰지 않아요.
