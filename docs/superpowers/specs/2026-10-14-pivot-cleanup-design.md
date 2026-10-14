# Iruka 피봇 정리 설계

사용자가 제공한 설계와 최신 범위를 기반으로 승인된 정리 작업을 구체화한다.
권위 문서는 docs/pivot/CURRENT_SCOPE.md다. 이번 작업은 로그인/계정 기반 앱만
실행 가능하게 남기는 Wave 0 정리이며 새 작품/채팅 화면은 만들지 않는다.

## 선택
기존 App과 지갑 인증을 계속 조건부 유지하면 구매/서명 부작용과 오래된 UI가
남는다. 제품 전체를 새 프레임워크로 옮기는 것은 범위를 넘는다.
따라서 React/Vite/Privy와 브랜드를 유지하고 App·인증 경계를 작게 교체한다.
AccountView는 순수 표시, PrivyAuthActions는 SDK 어댑터, AuthActions는
미설정 경계, App은 최소 경로와 화면 틀을 담당한다. 지갑 API를 호출하지 않는다.

## 보존과 제거
기존 import 그래프는 .context/pre-pivot-imports.json에 기록했다.
App/entry → 구매/리빌/계정 지갑 → 체인/스토리지 및 api → Keeper → manifest의
참조 묶음을 함께 제거한다. 브랜드 화면/에셋과 GIWA 체인 정의는 독립 보존한다.
과거 문서/영수증은 archive로 이동하고 Git 이력으로 삭제 코드를 복구할 수 있다.

## 검증
Node/Vite SSR로 비로그인·준비·미설정·로그인 계정·에러 표시를 검증한다.
Privy SDK 경계를 테스트 더블로 대체해 login/logout 및 지갑 없는 계정을 검증한다.
빌드와 전체 관련 테스트, 로컬 데스크톱/모바일, 경로/404, 수동 agent eval을 기록한다.
외부 Google/이메일 인증 완료는 실제 사용자 인증 없이는 검증했다고 주장하지 않는다.
