# Docs 개편 검증 — 2026-10-15

## 기준과 변경 범위

`starlash7/iruka-docs` 유지. 시작 HEAD `89c4596`, `git status --short` 출력 없음.
`git merge-base --is-ancestor 8ada036 HEAD`는 시작 시 1. `git fetch origin` 뒤
`git merge --ff-only origin/starlash7/clone-repo`로 `8ada036`까지 반영하고 포함 확인 0.
통합 기준 PR: [Draft #14](https://github.com/starlash7/iruka/pull/14).

이번 차이는 docs/gitbook, 이전 overview 보존, Docs 전용 계획·검증·결정·인계에 한정한다.
앱/API/DB/패키지/공통 지침은 직접 수정하지 않았다. 통합 커밋의 변경과 Docs 차이를 구분한다.

## 사실 확인 근거

| 문서 내용 | 읽은 구현 | 실제 테스트 근거 |
| --- | --- | --- |
| 공개 탐색·검색·최근 7일 성공 대화 이용자 랭킹 | server/discover/index.ts, src/features/discover | discover-api.test.mjs, product-integration.test.mjs |
| Privy DID/JWT 및 소유권 | server/core/auth.ts, accounts.ts, chats.ts | core-auth.test.mjs, core-api.test.mjs, product-integration.test.mjs |
| 선택적 지갑·자동 생성 off | src/privyConfig.ts, PrivyAuthActions.tsx, discover/account/RestoredWallet.tsx; reader-brand-wallet.md | privy-adapter.test.mjs, pivot-account.test.mjs, restored-giwa-*.test.mjs; 실제 송금은 수행하지 않음 |
| 정해진 모델 응답·100/1 개발값 | server/product/localPolicy.ts, index.ts | product-integration.test.mjs |
| 재생성·선택·편집·분기·메모 | server/chat/conversations.ts, reader.ts, memory.ts; src/features/chat | chat-api.test.mjs, chat-memory.test.mjs, product-integration.test.mjs |
| 페르소나 선택/복사, 관리 화면 미완성 | server/core/chats.ts, src/features/chat/StartChatSheet.tsx, user/PersonasPage.tsx | core-db.test.mjs 및 화면 원문 확인 |
| 초안/발행 분리·불변 버전·경쟁 저장 | server/studio/index.ts, validate.ts; src/features/studio/useEditor.ts | studio-service.test.mjs, studio-validation.test.mjs |
| 미리보기와 미업로드 이미지 슬롯 | src/features/studio/Preview.tsx, AssetFields.tsx; server/studio/index.ts | studio-ui.test.mjs, studio-http.test.mjs |
| 공개 화이트리스트·원문 반복 검사 한계 | server/core/publicSnapshot.ts, chat/privateSettings.ts, safety.ts, index.ts | discover-api.test.mjs, chat-runtime.test.mjs, chat-prompt.test.mjs |
| 지급·예약·정산·반환·멱등성·복구 | server/credits/index.ts, ledger.ts; chat/turnLifecycle.ts, recovery.ts | credits-service.test.mjs (50개 동시 요청), chat-runtime.test.mjs, product-integration.test.mjs |
| GIWA 보류·운영 미검증 | docs/pivot/INTEGRATION.md, CURRENT_SCOPE.md, server/credits/index.ts의 unverified | 새 체인 호출/영수증 없음 |

## 명령과 결과

- 초기 `npm run build`: 의존성 미설치로 `tsc: command not found`, 종료 127.
- `npm ci`: 성공. 패키지/lockfile 변화 없음. 설치 출력의 기존 moderate 취약점 25건은 이번 Docs 범위에서 변경하지 않음.
- 의존성 설치 후 `npm run build`: 종료 0. 클라이언트·서버 TypeScript와 Vite 빌드 통과. 500 kB 초과 chunk 경고가 남음 (이 환경 app-main 약 719 kB). 실제 Privy 배포 설정을 넣은 빌드 증거가 아님.
- `npm test`: 종료 0, 128 passed / 0 failed / 0 skipped.
- docs/gitbook에서 `npx --yes mint validate --telemetry false`: 종료 0, build validation passed. 모바일 CSS/최종 리디렉션 추가 후 재실행도 통과.
- 같은 위치에서 `npx --yes mint broken-links --telemetry false`: no broken links found.
- Python 표준 라이브러리 일회성 검사: 메뉴 16개 중복/파일 누락 0, MDX 17개 내부 링크와 로고 경로 정상, 리디렉션 목적지 누락/자기참조 0.
- `urllib.request`로 로컬 17개 페이지 HTTP 200, 이전 URL 13개 HTTP 307 및 목적지 일치. archive 경로 2개 HTTP 404. 원시 결과 `.context/docs-route-check.txt`.
- `git diff --check`: 오류 없음.

## 메뉴·검색·공개 제한

현재 검색 후보는 `seo.indexing: navigable`과 16개 메뉴 페이지다. 이전 제품 전환
안내는 메뉴 밖 페이지이며 과거 원문은 아예 docs/gitbook 루트 밖이다. 새 본문과
내부 링크에 과거 영수증·팩 소개를 연결하지 않는다. `/faq`, `/roadmap`은 현행
페이지로 재작성했고 이전 원문은 기존 TCG archive에 보존되어 있다.

`docs.json`의 seo 객체와 robots.txt가 `8ada036`과 동일함을 바이트/JSON 비교했다.
Mintlify 대시보드 인증/공개 설정을 변경하지 않았다. robots는 접근 제어가 아니다.
원격 접근 제한의 실제 동작과 원격 검색 인덱스 갱신은 이번 작업에서 미검증이다.

검색창을 실제 열었으나 `Run mint login in the cli to activate search`가 표시되어
검색 결과 확인은 완료하지 못했다. 로그인/배포/공개 변경으로 우회하지 않았다.
Mintlify 검색 모달에서 aria-hidden 포커스 관련 브라우저 경고도 관찰되었다.
메뉴 열기/닫기와 콘텐츠 이동은 동작했고 모달 경고의 내부 구현은 수정하지 않았다.

## 로컬 Mintlify 시각 검증

`npx --yes mint dev --no-open --telemetry false`, localhost:3000, Chrome.
데스크톱 약 1380px 창에서 소개·전체 메뉴·기술 페이지의 표/코드를 확인했다.
모바일 responsive 390×844에서 소개, 카드 단일 열, 메뉴 열기/닫기, 시작 가이드 이동,
기술 페이지 코드와 3열 표를 확인했다. 기본 표의 150px 셀 너비로 마지막 열이
잘리는 것을 관찰한 뒤 style.css를 추가하여 전체 3열이 뷰포트 안에서 줄바꿈됨을 확인했다.
본문·카드·코드에 눈에 띄는 가로 넘침이나 겹침 없음. 전 페이지의 픽셀 단위 overflow
자동 측정은 하지 않았으며 모든 MDX의 화면을 개별 촬영한 것은 아니다.

스크린샷 (gitignored, 로컬 증거):
- `.context/docs-desktop.png`: 소개와 전체 메뉴
- `.context/docs-desktop-technical.png`: 표·코드
- `.context/docs-mobile.png`: 소개 단일 열
- `.context/docs-mobile-code.png`: 390px 코드
- `.context/docs-mobile-table.png`: 수정 후 3열 표
- `.context/docs-mobile-navigation.png`: 모바일 메뉴
- `.context/docs-search-limit.png`: 로컬 검색 활성화 제한

## 미검증과 인계

실제 OAuth/OTP·LLM 품질·원격 DB·지갑 신규 생성/전송·공개 운영을 검증 완료로
쓰지 않았다. 배포·Mintlify 공개 설정 변경·main push/merge·유료 호출·체인 쓰기는 없음.
공통 지침 모순과 남은 정책 결정은 `decisions/2026-10-15-docs.md`에 기록했다.

Mintlify CLI/검색 범위 확인 참고: [공식 개발 안내](https://github.com/mintlify/mintlify-docs/blob/main/development.mdx),
[메뉴 밖 페이지와 검색](https://mintlify.com/docs/guides/hidden-pages).

## 후속 수정: 스토리 중심·통합 작품

사용자 승인에 따라 소개·메타데이터·탐색·제작·FAQ·로드맵을 작품 중심으로 정리했다.
`reading/modes`는 `reading/stories`로 교체하고 이전 원문을 archive에 보존했다.
앱의 SearchPage/EditorFields 및 스튜디오 발행 검증을 다시 읽어, 아직 남은 모드
필터·선택·캐릭터 예시 필수 조건을 현재 구현으로 명시했다. 통합 UI는 계획으로 구분한다.

재실행: `npm test` 128 passed / 0 failed, `npm run build` 종료 0 (기존 chunk 경고),
Mintlify validate/broken-links 종료 0. 정적 검사에서 16개 메뉴 파일·내부 링크·14개
리디렉션 목적지 정상, SEO 설정 동일, archive 원문과 이전 커밋 내용 일치 확인.
이번 후속 수정의 desktop/mobile 스크린샷 검증은 재실행하지 않았다.
앞선 스크린샷은 이전 문구 기준이며 새 문구의 시각 검증 증거로 사용하지 않는다.
검색 결과 및 원격 접근 제한 관련 미검증 범위는 위와 동일하다.

로컬 Mintlify에서 `/reading/stories` HTTP 200, `/reading/modes` HTTP 307 및
`Location: /reading/stories`를 확인했다.
