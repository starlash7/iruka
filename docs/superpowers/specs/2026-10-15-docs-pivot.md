# 한국어 Iruka Docs 개편 범위

기준: 8ada036 / origin/starlash7/clone-repo / Draft PR #14.
작업 브랜치 starlash7/iruka-docs 유지. 깨끗한 작업 트리를 확인한 뒤 fast-forward로 기준을 반영했다.

독자와 제작자가 탐색 → 작품 선택/제작 → 대화를 이해하는 한국어 Mintlify 문서 16페이지를 만든다.
시작하기, 이야기 즐기기, 작품 만들기, 계정과 크레딧, 기술과 방향 순서로 구성한다.
실제 코드·로컬 테스트와 공개 운영을 구분한다. 정해진 로컬 모델 응답, 선택적 지갑,
미완성 페르소나 관리/이미지 업로드, 크레딧 원장과 GIWA 보류를 정확하게 설명한다.

수정 소유권: docs/gitbook/** 및 이번 계획·검증·결정·인계 문서만.
공통 규칙, 앱/API/DB/패키지 수정 없음. 과거 자료는 docs/archive/에 보존한다.
현재 overview의 이전 단계 내용은 archive에 원문 보존한다.
현재 사이트 루트 밖의 archive는 메뉴/내부 링크/검색에 포함하지 않는다.
흰색·핑크 디자인과 public/brand의 기존 로고를 복사해 사용한다.
Mintlify 공개/인증 설정과 robots/SEO 값은 변경하지 않는다.

완료 증거: 메뉴·MDX·내부 링크·리디렉션 검사, 로컬 Mintlify desktop/mobile 화면,
npm test/build 실제 결과, 미검증 경계, 커밋과 통합 브랜치 대상 Draft PR.
