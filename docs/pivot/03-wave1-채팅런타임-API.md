# 03. wave1-채팅런타임-API — Wave 1 (병렬)

> Conductor에 이 문서 전체를 붙여넣어요. repo: `starlash7/iruka`, 브랜치: `pivot/03-채팅런타임-API`. 설계 문서: `00-전체-설계.md`(이 zip 안. repo에는 `docs/pivot/00-전체-설계.md`로 Wave 0에서 복사됨)를 먼저 읽어요.

## 목표
채팅 시작·전송·스트리밍·재생성·분기·장기기억·키워드북·이미지 코드 검증을 서버에 구현해요.

## 범위
- `server/chat/promptAssembler.ts`: 설계 1-3의 12단계 조립, 토큰 예산(간단한 한국어 토큰 추정: 글자수/1.5 (추정), 어댑터가 제공하면 그걸 사용), 캐시 경계 표시.
- `server/chat/lorebook.ts`: 키워드 매칭(최근 K턴, 정규식 옵션, 우선순위, 예산).
- `server/chat/memory.ts`: 고정 메모 CRUD, 요약 작업 큐 등록, `api/cron/summarize.ts`(mock LLM으로 요약 + mock 임베딩), pgvector 검색.
- `server/chat/postprocess.ts`: `{{img:CODE}}` 검증·추출, ```status 블록 분리, `{{ending:KEY}}` 감지, `{{user}}`/`{{char}}` 치환.
- `server/chat/llmRouter.ts`: `model_tiers` 읽어 어댑터 선택(mock 기본, OpenAI호환/Anthropic/Gemini 어댑터 골격은 키 없으면 비활성).
- API: `api/chats/*`(설계 5절 03 담당 전부), SSE 이벤트 `delta/image/status/ending/usage/done/error`.
- 재화: 생성 전 `chargeForTurn`(Wave 0 스텁) 호출, 실패 시 `refundTurn`. 안전: `moderateText` 스텁 입·출력 양쪽 호출.
- 메시지 트리(`parent_id`, `active_child_id`), 분기 시 새 chat.
- 마이그레이션 필요 시 `supabase/migrations/01xx_*.sql`만.

## 파일 소유권
touch: `server/chat/**`, `api/chats/**`, `api/cron/summarize.ts`, `server/core/llm/adapters/**`(신규 파일만), `supabase/migrations/01*`, `tests/chat-*`. do-not-touch: `src/**`, `server/core/interfaces.ts`(시그니처 변경 금지), 다른 `api/*`.

## 선행 작업
02 머지.

## 완료 기준
- mock LLM으로 시작→전송→스트림→재생성(형제 2개)→분기→요약 생성까지 통합 테스트 통과.
- 비공개 필드(hidden_context, lorebook, system_prompt)가 어떤 응답 JSON에도 포함되지 않음을 테스트로 확인.
- 존재하지 않는 이미지 코드는 출력에서 제거됨.
- 프롬프트 조립 스냅샷 테스트(캐릭터 모드·스토리 모드 각 1).

## 테스트 방법
`npm run test:db -- tests/chat-*`; `LLM_PROVIDER=mock npm run dev` 후 `curl -N` 로 SSE 확인.

## 끝나면
- draft PR 생성(제목 `[pivot 03] ...`), 본문에 변경 요약·테스트 결과·남은 한계·다른 태스크에 요청할 사항.
- main 머지는 사용자가 직접 해요.

## 금지 (모든 태스크 공통)
- `main` 브랜치에 push·merge 금지. 작업 브랜치 `pivot/<태스크번호>-<이름>`에서만 커밋하고, PR은 draft로만 열어요.
- 배포 금지(Vercel deploy, `vercel --prod`, 컨트랙트 메인넷 배포 금지. GIWA Sepolia 배포도 사용자 승인 전 금지).
- 유료 API 호출 금지: LLM·임베딩·PG·본인인증은 `mock` 어댑터로만 테스트. 실제 키 필요 시 멈추고 사용자에게 물어요.
- 비밀값을 코드·커밋·로그에 쓰지 말고 `.env.example` 플레이스홀더만 추가.
- 자기 범위 밖 파일 수정 금지. 꼭 필요하면 PR 설명에 "다른 태스크 요청 사항"으로 적고 수정은 하지 않아요.
- 실존 인물(K-pop 아이돌) 이미지·이름을 시드나 예시에 쓰지 않아요.
