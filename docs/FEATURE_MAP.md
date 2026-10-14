# Iruka Feature Map

현재 범위: [CURRENT_SCOPE](pivot/CURRENT_SCOPE.md). 한국어 AI 캐릭터·스토리
플랫폼의 공통 기반. 실제 탐색/제작/채팅·크레딧/GIWA 업무는 A–D가 구현한다.

| 파일 | 역할 |
|---|---|
| src/main.tsx | 브랜드 자료 hash 진입점과 앱 lazy 로드 |
| src/app-main.tsx, privyConfig.ts | Google/이메일 인증 provider, 자동 지갑 생성 off |
| src/AuthActions.tsx, PrivyAuthActions.tsx, AccountView.tsx | 지갑에 의존하지 않는 로그인·계정 상태 |
| src/App.tsx, src/routes | 공통 셸과 11개 feature 페이지 라우트 |
| src/features | A 채팅, B 스튜디오, C 탐색/사용자, D 크레딧 페이지 자리 |
| src/ui, src/styles.css, public/fonts | 공통 컴포넌트·토큰과 자체 호스팅 Pretendard |
| src/shared | DTO, API 클라이언트, SSE parser |
| server/db, migrations | PostgreSQL 스키마, 파일 로컬 DB와 독립 테스트 DB |
| server/core | Privy 검증, 계정/소유권, 작품 공개 경계, 버전 고정, 턴 멱등성, SSE/서비스 계약 |
| server/app.ts, nodeServer.ts, dev.ts | 주입형 HTTP 라우터, Node 스트림 브리지, 로컬 구성 |
| scripts/dev.mjs, migrate.ts | Vite/API 함께 실행, 실제 DB 마이그레이션 |
| tests/core-* | DB/인증/권한/API/SSE/UI/멱등성 검증 |
| src/BrandKitView.tsx, brand-kit.css, public/brand | 기존 브랜드 자료 |
| src/giwaChain.ts | 독립 GIWA 정의. 현재 앱에서 호출하지 않음 |
| docs/archive/tcg | 과거 자료; 현행 제품 규칙 아님 |

패키지/env/lockfile, 공통 파일은 단일 공통 담당이 조율한다. 파일 소유권·공개 함수·
route export는 [공통 인계](pivot/FOUNDATION_HANDOFF.md), [API](pivot/API_CONTRACT.md),
[UI](pivot/UI_FOUNDATION.md)를 따른다.

검증: `npm ci`, `npm run db:migrate`, `npm test`, `npm run build`.
로컬 실행: `npm run dev`. 실제 OAuth/OTP·운영 DB·유료 모델·체인 배포는 별도 검증 대상이다.
