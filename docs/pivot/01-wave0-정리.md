# 01. wave0-정리 — Wave 0 (순차 1/2)

> Conductor에 이 문서 전체를 붙여넣어요. repo: `starlash7/iruka`, 브랜치: `pivot/01-정리`. 설계 문서: `00-전체-설계.md`(이 zip 안. repo에는 `docs/pivot/00-전체-설계.md`로 Wave 0에서 복사됨)를 먼저 읽어요.

## 목표
iruka에서 TCG·가챠·Monad·실물·입출금·실존 인물 자산을 걷어내고, GIWA 단일·Privy 로그인만 남은 빈 앱 껍데기를 만들어요.

## 범위
- `00-전체-설계.md` 6절 '삭제' 목록 전부 삭제(문서는 `docs/archive/`로 이동).
- `package.json` 의존성 제거(@solana/*, @solana-program/*, three, @react-three/*, gsap, @vercel/blob), lockfile 갱신(`npm install`, 네트워크 필요 시만).
- `src/App.tsx`를 최소 라우트로: `/`(빈 홈 자리), `/account`, 404. 기존 네비의 Vending/Vault/Marketplace/Roadmap/Events 제거.
- `src/activeDeployment.ts`/네트워크 선택 제거 후 GIWA 단일로 `src/giwaChain.ts` 정리.
- `.env.example`를 설계 2-1절 내용으로 교체.
- `vercel.json`: 삭제된 함수·크론 제거, CSP는 그대로 두되 Monad RPC 제거.
- 남은 테스트 정리(삭제 대상 테스트 제거, `deployment-build`, `auth-actions`, `profile-menu`, `locale-storage`, `giwa-config`, `responsive-layout` 통과).
- `docs/pivot/00-전체-설계.md`에 설계 문서 복사, `AGENTS.md`/`CLAUDE.md`에 피봇 규칙(위 금지 항목) 추가.

## 파일 소유권
touch: 저장소 전체(이 태스크만 예외적으로 전역). do-not-touch: `.github/workflows/verify.yml`의 보안 설정(동작만 유지), `LICENSE`.

## 선행 작업
없음(첫 작업).

## 완료 기준
- `npm run build` 성공, `npm test` 전부 통과, `rg -i "monad|solana|vending|vault|pack-reveal|IrukaPackBatch" src api server tests` 결과 0건(archive 제외).
- 앱 실행 시 로그인 버튼과 계정 페이지만 보이고 콘솔 에러 없음.
- 실존 아이돌 이미지 파일 0개.

## 테스트 방법
`npm ci && npm run build && npm test`; `npm run dev` 후 `/`, `/account` 수동 확인.

## 끝나면
- draft PR 생성(제목 `[pivot 01] ...`), 본문에 변경 요약·테스트 결과·남은 한계·다른 태스크에 요청할 사항.
- main 머지는 사용자가 직접 해요.

## 금지 (모든 태스크 공통)
- `main` 브랜치에 push·merge 금지. 작업 브랜치 `pivot/<태스크번호>-<이름>`에서만 커밋하고, PR은 draft로만 열어요.
- 배포 금지(Vercel deploy, `vercel --prod`, 컨트랙트 메인넷 배포 금지. GIWA Sepolia 배포도 사용자 승인 전 금지).
- 유료 API 호출 금지: LLM·임베딩·PG·본인인증은 `mock` 어댑터로만 테스트. 실제 키 필요 시 멈추고 사용자에게 물어요.
- 비밀값을 코드·커밋·로그에 쓰지 말고 `.env.example` 플레이스홀더만 추가.
- 자기 범위 밖 파일 수정 금지. 꼭 필요하면 PR 설명에 "다른 태스크 요청 사항"으로 적고 수정은 하지 않아요.
- 실존 인물(K-pop 아이돌) 이미지·이름을 시드나 예시에 쓰지 않아요.
