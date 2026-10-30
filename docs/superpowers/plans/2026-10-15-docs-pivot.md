# Iruka Docs Implementation Plan

> 사용자 요청에 따라 이 workspace에서 문서 작성·검증·커밋·Draft PR까지 순차 실행한다.

**Goal:** 한국어 캐릭터·스토리 제품을 실제 구현에 맞게 설명한다.
**Architecture:** docs/gitbook을 유일한 Mintlify 루트로 유지하고 과거 단계는 archive에 보존한다.
**Tech Stack:** MDX, docs.json, 기존 Mintlify CLI, React/Vite 프로젝트의 기존 테스트.

## Global Constraints
- 기준 8ada036, 현재 브랜치 유지, 앱/API/DB/패키지/공통 지침 수정 금지.
- main push/merge, 배포, 공개 설정 변경, 유료 호출 금지.
- 코드 구현/로컬 검증/공개 운영 구분. 과거 체인 영수증 재사용 금지.

## Checklist
- [x] 작업 트리/기준 확인, 통합 브랜치 fast-forward, 필수 문서와 코드/테스트 읽기.
- [x] docs/archive/ai-docs/에 기존 overview 보존.
- [x] docs/gitbook/overview.mdx, quickstart.mdx, faq.mdx 작성.
- [x] docs/gitbook/reading/{discovery,modes,conversations,persona-memory}.mdx 작성.
- [x] docs/gitbook/creating/{studio,visibility,worldbuilding,publishing}.mdx 작성.
- [x] docs/gitbook/account/{login,credits}.mdx 작성.
- [x] docs/gitbook/technical/{architecture,giwa}.mdx 및 roadmap.mdx 작성.
- [x] docs/gitbook/docs.json 메뉴·핑크 색상·리디렉션, images 로고 동기화. style.css로 모바일 표 셀 너비 수정.
- [x] Mintlify validate/broken-links 및 전체 라우트·검색/아카이브 분리 검사. 실제 검색 결과는 CLI 로그인 요구로 미검증 기록.
- [x] 로컬 desktop/mobile 내비게이션·표·코드 표시 및 스크린샷 확인.
- [x] npm test, npm run build, git diff --check 실제 결과 기록.
- [x] docs/pivot/DOCS_VERIFICATION.md, decisions/2026-10-15-docs.md, HANDOFF.md 갱신.
- [x] 변경 범위 확인 후 커밋, 현재 브랜치 push, clone-repo 대상 Draft PR.

구현 커밋 ff07fb3, Draft PR #15: https://github.com/starlash7/iruka/pull/15

## 후속 Docs 방향 반영

- [x] 소개/quickstart/탐색/FAQ/메타데이터를 작품·이야기 중심으로 정리.
- [x] reading/modes 원문 archive, reading/stories로 메뉴·링크·리디렉션 갱신.
- [x] 스튜디오/발행/세계관/로드맵에서 현재 mode 구현과 후속 통합 UI를 구분.
- [x] npm test/build, Mintlify validate/broken-links, 새 페이지 200/이전 주소 307 확인. 기존 Draft PR #15에 반영.
