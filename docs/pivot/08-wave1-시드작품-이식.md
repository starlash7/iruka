# 08. wave1-시드작품-이식 — Wave 1 (병렬)

> Conductor에 이 문서 전체를 붙여넣어요. repo: `starlash7/iruka`, 브랜치: `pivot/08-시드작품-이식`. 설계 문서: `00-전체-설계.md`(이 zip 안. repo에는 `docs/pivot/00-전체-설계.md`로 Wave 0에서 복사됨)를 먼저 읽어요.

## 목표
「사내연애 조작단」과 「2096 삭제예정자」를 새 에디터 데이터 형식(JSON)으로 옮겨 시드로 만들어요.

## 범위
- 원본: `starlash7/crack`의 `assets/사내연애-조작단/`, `assets/2096-삭제예정자/`(읽기만). 이미 만든 제닛 원고(사용자 박스 `/workspace` 산출물)가 있으면 참고.
- `seed/works/<slug>/work.json`(설계 1-2 필드 구조), `seed/works/<slug>/assets.csv`(코드↔원본 파일 대응표). 이미지 파일 자체는 커밋하지 말고 대응표만(업로드는 사용자 승인 후).
- `scripts/seed-works.ts`: JSON → DB 삽입(로컬 Supabase만), 이미지는 mock storage 경로.
- 변수·이미지 코드는 04 임포터 규칙과 같은 통일 형식으로 직접 변환(04 코드 import 금지 → 충돌 방지).
- 등급: 15세 이용가 기준으로 수위 조정 필요 부분 목록화(내용 수정은 하지 말고 `seed/works/<slug>/REVIEW.md`에 표시).

## 파일 소유권
touch: `seed/**`, `scripts/seed-works.ts`, `supabase/migrations/05*`(필요 시), `tests/seed-*`. do-not-touch: `src/**`, `server/**`, `api/**`, crack repo(읽기만).

## 선행 작업
02 머지.

## 완료 기준
- `node scripts/seed-works.ts`로 두 작품이 로컬 DB에 public으로 들어감.
- JSON 스키마 검증 테스트(필드 제한, 이미지 코드가 assets.csv에 존재, `{user}` 등 구형 변수 0개).
- 정답·히든 조건이 공개 필드(description, prologue, play_guide)에 없음.

## 테스트 방법
`supabase db reset && node --experimental-strip-types scripts/seed-works.ts && npm test -- tests/seed-*`

## 끝나면
- draft PR 생성(제목 `[pivot 08] ...`), 본문에 변경 요약·테스트 결과·남은 한계·다른 태스크에 요청할 사항.
- main 머지는 사용자가 직접 해요.

## 금지 (모든 태스크 공통)
- `main` 브랜치에 push·merge 금지. 작업 브랜치 `pivot/<태스크번호>-<이름>`에서만 커밋하고, PR은 draft로만 열어요.
- 배포 금지(Vercel deploy, `vercel --prod`, 컨트랙트 메인넷 배포 금지. GIWA Sepolia 배포도 사용자 승인 전 금지).
- 유료 API 호출 금지: LLM·임베딩·PG·본인인증은 `mock` 어댑터로만 테스트. 실제 키 필요 시 멈추고 사용자에게 물어요.
- 비밀값을 코드·커밋·로그에 쓰지 말고 `.env.example` 플레이스홀더만 추가.
- 자기 범위 밖 파일 수정 금지. 꼭 필요하면 PR 설명에 "다른 태스크 요청 사항"으로 적고 수정은 하지 않아요.
- 실존 인물(K-pop 아이돌) 이미지·이름을 시드나 예시에 쓰지 않아요.
