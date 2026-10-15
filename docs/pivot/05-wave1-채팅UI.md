# 05. wave1-채팅UI — Wave 1 (병렬)

> Conductor에 이 문서 전체를 붙여넣어요. repo: `starlash7/iruka`, 브랜치: `pivot/05-채팅UI`. 설계 문서: `00-전체-설계.md`(이 zip 안. repo에는 `docs/pivot/00-전체-설계.md`로 Wave 0에서 복사됨)를 먼저 읽어요.

## 목표
유저가 작품을 골라 대화하는 채팅 화면을 만들어요(크랙/베이브챗 UX).

## 범위
- `src/features/chat/`: 채팅 시작 시트(시작 상황 선택, 페르소나 선택, 모델 등급 선택 + 턴 가격 표시), 프롤로그 표시, 메시지 리스트(소설체 렌더: `@이름@ "대사"` → 이름 말풍선, 지문 이탤릭 등), 이미지 코드 렌더, 상태창 패널(접기), 엔딩 카드, 추천 답변 칩, 입력창, 스트리밍 표시·중단, 재생성·형제 스와이프(1/3), 분기, 메시지 수정·삭제, 고정 메모 패널, 내 채팅 목록, 플레이 가이드 보기.
- 재화 부족 시 충전 유도 모달(라우팅만 `/wallet`), 오늘 무료 잔여 배지 — 데이터는 `GET /api/credits/balance`를 `src/shared/api.ts`로 호출(미구현 시 mock 응답 fixture).
- 03 API가 아직 없으면 `src/features/chat/__fixtures__`의 mock SSE로 개발.
- 모바일 우선 레이아웃.

## 파일 소유권
touch: `src/features/chat/**`, `tests/chat-ui-*`. do-not-touch: `api/**`, `server/**`, `src/shared/**`(필요 타입은 로컬 확장), 다른 features.

## 선행 작업
02 머지. (03과 동시 진행 가능, API 계약은 `src/shared/types.ts`·설계 5절 기준)

## 완료 기준
- fixture로 전송→스트리밍→이미지·상태창·엔딩 렌더, 재생성 스와이프, 분기 동작.
- 03 머지 후 실제 API로 같은 흐름 통과(통합은 11에서 최종 확인).
- 360px 폭에서 레이아웃 깨짐 없음.

## 테스트 방법
`npm test -- tests/chat-ui-*`; `npm run dev` 후 `/chat/demo`(fixture 모드).

## 끝나면
- draft PR 생성(제목 `[pivot 05] ...`), 본문에 변경 요약·테스트 결과·남은 한계·다른 태스크에 요청할 사항.
- main 머지는 사용자가 직접 해요.

## 금지 (모든 태스크 공통)
- `main` 브랜치에 push·merge 금지. 작업 브랜치 `pivot/<태스크번호>-<이름>`에서만 커밋하고, PR은 draft로만 열어요.
- 배포 금지(Vercel deploy, `vercel --prod`, 컨트랙트 메인넷 배포 금지. GIWA Sepolia 배포도 사용자 승인 전 금지).
- 유료 API 호출 금지: LLM·임베딩·PG·본인인증은 `mock` 어댑터로만 테스트. 실제 키 필요 시 멈추고 사용자에게 물어요.
- 비밀값을 코드·커밋·로그에 쓰지 말고 `.env.example` 플레이스홀더만 추가.
- 자기 범위 밖 파일 수정 금지. 꼭 필요하면 PR 설명에 "다른 태스크 요청 사항"으로 적고 수정은 하지 않아요.
- 실존 인물(K-pop 아이돌) 이미지·이름을 시드나 예시에 쓰지 않아요.
