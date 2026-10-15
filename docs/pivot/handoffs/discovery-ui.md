# 작품 중심 탐색 UI — 2026-10-15

## 기준과 범위
- 시작 시 fetch/status 확인: 깨끗한 `starlash7/iruka-ui`. 기존 HEAD가 기준의 조상이므로 `git merge --ff-only 8ada036` 수행. 브랜치 변경/이름 변경 없음.
- Docs `b7f750e`의 reading/discovery, reading/stories, overview를 read-only로 참고. Docs 브랜치 병합 없음.
- 이번 변경은 8ada036 이후 탐색 Page/Grid/Layout, 전용 CSS와 테스트/인계 문서만 해당한다.

## 변경 화면
- 상단: 전체/스토리/캐릭터 대신 작품/검색/랭킹. 모드를 제품의 양자택일로 내세우지 않는다.
- 홈: 검색, 실제 공개 응답의 태그, 공개 작품, 이어하기. 동일 작품을 반복하던 태그별 추천 블록 제거.
- 검색/태그: 보조 작품 유형 필터. q/tag/mode를 함께 유지하고 태그 해제 시 q/mode 유지. 태그 내 검색 지원.
- 카드: 모드 배지 제거, 제목/소개 각 두 줄, 두 태그의 폭 분리. 캐릭터 작품도 같은 목록과 상세 링크로 제공.
- 상세: 공개 소개/인물/태그, 첫 시작 상황 펼침, 기존 대화 시작 시트 유지. 이미지 URL 변경 후 이전 실패 상태가 다음 이미지를 막지 않게 수정.
- 랭킹: 서버 순서 그대로. 최근 7일 성공 대화 이용자 기준만 표시. 가짜 수치 없음.

## 기존 기능 보존
mode 데이터/검색 필터, 기존 `/search?q=&tag=&mode=`, `/tags/:tag`, `/works/:id`, `/ranking` 경로 유지.
ReaderProvider/readerApi/라우터/DTO/서버/인증·지갑 메뉴/채팅 UI/공통 styles.css 변경 없음.
새 의존성, 추천 알고리즘, API 필드, 자동 fixture fallback 없음.

## 검증 결과
- `node --experimental-strip-types --test tests/discovery-ui.test.mjs`: 6/6 통과.
- `npm test`: 134/134 통과, 0 실패. 실행 중 Vite 테스트 HMR 포트 경고가 있었으나 모든 테스트 종료/통과.
- `npm run build`: 통과. 기존 SDK annotation 및 bundle size 경고 유지.
- `git diff --check`: 통과. 읽기 전용 코드 리뷰 추가 중요 문제 없음.

### 실제 HTTP/API 화면
별도 로컬 DB `.context/discovery-ui-db`에 기존 원고 두 개를 기존 seed importer로 발행.
`server/dev.ts`(8787) + Vite(5193) 실제 공개 endpoint를 사용. fixture adapter가 아니다.
- 한국어 `사내` 검색 → 실제 작품 1개, character 필터 → 빈 결과, 브라우저 뒤로 → query/결과 복원.
- SF 태그/작품 상세 직접 URL 진입, 긴 실제 소개와 표지 없음, 랭킹 빈 상태 확인.
- 390px 상세/시작 시트, 768px 태그, 1440px 홈에서 overflow 0px, 시각 겹침 없음.
- 대화 시작 시트 열기, Escape 닫기 → 대화 시작 버튼 포커스 복귀 확인.
- API 프로세스 중단 → 오류/재시도 표시, 작품 대체 없음. 프로세스 재시작 → 다시 시도에서 결과 복구.
- 서버 Privy 검증 키 미설정으로 개인 대화 목록/대화 시작의 실제 인증 완료는 미검증. 오류를 숨기지 않았다. 유료 호출/대화 생성/체인 쓰기 없음.

### 명시적 개발 fixture
`.context/discovery-fixture.tsx`에서 긴 무공백 제목, 긴 소개/태그, 실패 표지를 주입.
운영 코드와 분리된 검증 페이지이며 개발 미리보기 표시. 390px overflow 0px,
제목/소개 줄임, 서로 밀어내지 않는 태그, 깨진 표지 대체 표면 확인.
두 모드 노출/상세와 오류/로딩/필터 유지의 자동 테스트 역시 test double이며 실제 인증 증거가 아니다.

### 로컬 스크린샷
- `.context/discovery-real-home-1440.png`
- `.context/discovery-real-tag-768.png`
- `.context/discovery-real-detail-390.png`
- `.context/discovery-fixture-long-390.png`
- `.context/discovery-real-api-error.png`

## 통합 담당에게
1. 8ada036 이후 본 변경만 통합한다. 이전 #13 전체 main diff는 A–D 통합 범위까지 포함하므로 새 integration-base PR을 사용한다.
2. 실제 Privy 서버 설정을 연결해 개인 목록과 대화 시작을 재검증한다. 인증 코드는 이번 범위에서 수정하지 않았다.
3. 현재 태그는 조회된 공개 작품(서버 최대 60개)에서만 도출한다. 전체 장르/태그 분류와 페이지 종료/전체 개수 계약은 없다. 필요 시 공개 taxonomy 및 pagination 계약을 먼저 정하고 UI에 인계한다. 임의 필드는 추가하지 않았다.
4. Docs의 ‘앞으로 모드 탭을 정리할 예정’ 문구는 통합 후 실제 화면에 맞게 Docs 담당이 갱신한다. 내부 mode/발행 조건은 유지한다.
