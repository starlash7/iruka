# C 사용자 화면 구현·검증 인계 — 2026-10-14

기준: 02 e67418a, 현재 브랜치 starlash7/iruka-ui. shared 변경 없이 discover/chat 소유 범위 구현.
[연결 요청서](reader-integration.md)의 반영 전까지 운영 홈은 02 빈 페이지다.
A/D의 실제 데이터/모델/크레딧 구현과 전역 핑크 토큰 확정은 통합 대기다.

## 구현
- 홈 검색/이어하기/신작/태그별 추천, 검색·태그·랭킹·공개 상세.
- 시작 상황·페르소나·모델 선택, 채팅 목록, 스트리밍·중단·이미지·상태창·엔딩.
- 재생성/형제 분기/여기서 분기/수정/삭제/고정 메모와 잔여·부족 상태.
- 공개 작품은 public + published만, 중첩 snapshot whitelist. 비공개·unlisted·미발행 404.
- 실제 API 기본, 실패 시 fixture 전환 없음. 테스트 adapter는 별도 Vite preview에서만 주입.
- 랭킹 집계가 없으면 빈 상태. 인기도/사용자 활동/개인화 추천 수치를 만들어내지 않음.
- 통합 계약 밖 API는 feature-local 타입과 02/A/D 요청서로 명시. 임의 DB 마이그레이션 없음.

## 실행
```
npm run dev:web -- --port 5193
# /src/features/discover/preview.html
# /src/features/discover/viewport.html?width=360 (768,1440)
```
preview의 state=loading/empty/error/insufficient는 명시적 QA 상태.
source=api는 실제 서버 요청만 사용. main entry에서 preview/fixture를 import하지 않는다.
fixture 작품/표지는 자체 작성 테스트 자료이며 실서비스 재고나 실제 사용자 대화가 아니다.

## 실제 검증
- Node 24.14.0. npm ci 완료. npm test: 69 passed, 0 failed.
- npm run build: frontend/server TypeScript + Vite 성공. 기존 SDK Rollup annotation 경고 남음.
- api/discover는 공통 tsconfig include 밖이므로 `.context/reader-api-typecheck.json`으로 별도 tsc 통과.
- focused tests: 공개 범위/비밀 필드/SQL 검색, branch tree, 네트워크 오류 무대체,
  문구 escape, 개발 adapter의 시작상황/메모/편집/삭제/형제/이미지/엔딩/취소·차감,
  미확정/terminal/rejected 상태의 멱등 재확인.
- Chrome에서 https://crack.wrtn.ai/ 실제 홈 확인. 상단 검색/모드, 왼쪽 대화 목록,
  장르 필터와 이미지 레일만 구조 참고. 레퍼런스 로고/콘텐츠/사용자 기록 복제 안 함.
- Safari 실제 렌더, 고정 폭 iframe 360/768/1440 × 900 CSS px로 검증.
  홈/상세/시작 시트와 대화, 로딩/빈 상태/오류 모두 가로 넘침 0px 관찰.
  screenshot는 표시 공간에 맞춰 iframe을 축소한 화면이며 실제 레이아웃 viewport 폭은 위 값이다.
- 세 폭 시작 시트: 잔여0/부족 경고/시작 disabled, Escape 후 시작 버튼으로 focus 복원 확인.
- Safari 기본 Tab은 버튼을 건너뛰는 설정. Option+Tab으로 검색 버튼 focus 확인.
- 한국어 검색 제출→빈 결과, 한국어 메시지 전송→스트리밍→이미지/상태/엔딩 확인.
- 스트림 중단→같은 키 재시도 노출→새로고침에도 재시도 유지·편집/전송 disabled→재시도 완료 확인.
- macOS 네이티브 입력 도구의 한국어 typeText가 공백으로 입력되어 paste로 다시 검증했다.
  실제 한국어 IME 조합 및 iOS/Android 소프트 키보드는 미검증. composition guard와 visualViewport 대응 구현.
- 읽기 전용 리뷰가 발견한 미확정 키 유실/재시도 숨김/완료 뒤 stale history 전송/400 영구 잠금 수정.

## 대비 계산 (WCAG 상대 휘도)
| 전경 / 배경 | 비율 |
|---|---:|
| #DB6096 / #FFFFFF | 3.43:1 — 작은 글씨/흰 버튼 글씨 조합으로 사용하지 않음 |
| #A83269 / #FFFFFF | 6.32:1 |
| #A83269 / #FCEBF3 | 5.51:1 |
| #716A76 / #FAF9FB | 4.97:1 |
| #25232A / #FAF9FB | 14.79:1 |

## 증거
`.context/reader-{360,768,1440}-{home,chat,loading,empty,error,start}.png`.
전체 로그 `.context/final-tests.log`, `.context/final-build.log`.
공유 라우트·공통 디자인·실제 인증/모델/크레딧·집계/추천 서비스 통합 완료 증거는 아니다.
브라우저 전체 reload 또는 다른 기기의 pending turn 복구에는 A의 서버 상태 조회가 추가로 필요하다.
이번 클라이언트 recovery guard는 현재 페이지 안의 중단/네트워크 실패/재조회 동작을 보호한다.

main 직접 push/merge, 배포, 실제 모델 호출, 체인 쓰기는 수행하지 않았다.

## 전달
구현 커밋 `1d79abc`, [draft PR #13](https://github.com/starlash7/iruka/pull/13).
현재 checkout `starlash7/iruka-ui`, base `main`. 운영 연결은 위 요청서 반영 대기.
