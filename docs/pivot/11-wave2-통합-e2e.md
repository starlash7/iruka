# 11. wave2-통합-e2e — Wave 2 (마지막, 09·10 머지 후 단독)

> Conductor에 이 문서 전체를 붙여넣어요. repo: `starlash7/iruka`, 브랜치: `pivot/11-통합-e2e`. 설계 문서: `00-전체-설계.md`(이 zip 안. repo에는 `docs/pivot/00-전체-설계.md`로 Wave 0에서 복사됨)를 먼저 읽어요.

## 목표
전체를 연결하고 e2e 테스트와 출시 전 점검표를 만들어요.

## 범위
- 05·07 화면에 신고 버튼·성인 인증 게이트 연결, 03에 `moderateText`·`recordCreatorEarning` 실제 구현 연결 확인.
- Playwright e2e(`tests/e2e/`): 로그인(mock) → 홈 → 시드 작품 상세 → 대화 시작 → 무료 턴 소진 → mock 충전 → 프리미엄 턴 → 재생성 → 분기 → 영수증 검증(anvil) → 신고 → 크리에이터 대시보드 반영.
- `.github/workflows/verify.yml`에 `forge test`, DB 테스트(서비스 컨테이너), e2e(mock 모드) 추가.
- `docs/pivot/출시-점검표.md`: 실제 키 넣을 항목, 사용자 승인 필요 항목(GIWA Sepolia 배포, Vercel 배포, LLM·PG·본인인증 계약), 법률 [확인 필요] 목록.

## 파일 소유권
touch: 연결부 최소 수정(각 feature의 버튼 삽입 지점), `tests/e2e/**`, `.github/workflows/verify.yml`, `docs/pivot/**`, `playwright.config.ts`. do-not-touch: 각 서버 모듈의 내부 로직(버그는 이슈로 기록).

## 선행 작업
09, 10 머지.

## 완료 기준
- e2e 시나리오 mock 모드 전부 통과, CI 녹색.
- 실제 유료 호출 0회(로그·환경으로 확인).

## 테스트 방법
`npm run build && npm test && npm run test:db && forge test && npx playwright test`

## 끝나면
- draft PR 생성(제목 `[pivot 11] ...`), 본문에 변경 요약·테스트 결과·남은 한계·다른 태스크에 요청할 사항.
- main 머지는 사용자가 직접 해요.

## 금지 (모든 태스크 공통)
- `main` 브랜치에 push·merge 금지. 작업 브랜치 `pivot/<태스크번호>-<이름>`에서만 커밋하고, PR은 draft로만 열어요.
- 배포 금지(Vercel deploy, `vercel --prod`, 컨트랙트 메인넷 배포 금지. GIWA Sepolia 배포도 사용자 승인 전 금지).
- 유료 API 호출 금지: LLM·임베딩·PG·본인인증은 `mock` 어댑터로만 테스트. 실제 키 필요 시 멈추고 사용자에게 물어요.
- 비밀값을 코드·커밋·로그에 쓰지 말고 `.env.example` 플레이스홀더만 추가.
- 자기 범위 밖 파일 수정 금지. 꼭 필요하면 PR 설명에 "다른 태스크 요청 사항"으로 적고 수정은 하지 않아요.
- 실존 인물(K-pop 아이돌) 이미지·이름을 시드나 예시에 쓰지 않아요.
