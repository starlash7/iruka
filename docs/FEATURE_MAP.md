# Iruka Feature Map

현재 범위: [CURRENT_SCOPE](pivot/CURRENT_SCOPE.md). 한국어 AI 캐릭터·스토리
플랫폼 준비 단계. 탐색/제작/대화·무료 크레딧·장부 앵커링은 아직 미구현.

| 파일 | 역할 |
|---|---|
| src/main.tsx | 기존 브랜드 자료 hash 진입점과 앱 lazy 로드 |
| src/app-main.tsx | Privy provider와 미설정 분기 |
| src/privyConfig.ts | Google/이메일 인증, 자동 지갑 생성 off |
| src/App.tsx | 홈·계정·404 최소 화면 |
| src/AuthActions.tsx | 미설정 표시와 SDK 경계 |
| src/PrivyAuthActions.tsx | Privy 세션·login/logout·오류 |
| src/AccountView.tsx | 지갑에 의존하지 않는 계정 표시 |
| src/styles.css | 기존 흰색·블루 토큰과 최소 앱 레이아웃 |
| src/BrandKitView.tsx, src/brand-kit.css, public/brand/ | 기존 브랜드 자료 |
| src/giwaChain.ts | 독립 보존한 테스트넷 정의. 현재 앱에서 호출하지 않음 |
| tests/ | 현재 인증·라우트·설정·브랜드 검증 |
| docs/archive/tcg/ | 과거 문서/공개 증거, 현행 제품 규칙 아님 |
| docs/pivot/ | 원문, 최신 범위, handoff |
| evals/, decisions/ | 지침 수동 검토와 결정 |

현재 api/server/contracts/cron은 없다. 계정은 Privy session만 표시하며
자체 users DB, 크레딧 잔액, 채팅 API가 존재한다고 가정하지 않는다.
패키지의 viem과 독립 체인 정의만 다음 GIWA 작업에 재사용한다.

검증: `npm ci`, `npm test`, `npm run build`. 로컬 실행: `npm run dev`.
