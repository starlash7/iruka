# 04. wave1-작품에디터 — Wave 1 (병렬)

> Conductor에 이 문서 전체를 붙여넣어요. repo: `starlash7/iruka`, 브랜치: `pivot/04-작품에디터`. 설계 문서: `00-전체-설계.md`(이 zip 안. repo에는 `docs/pivot/00-전체-설계.md`로 Wave 0에서 복사됨)를 먼저 읽어요.

## 목표
크리에이터가 캐릭터/스토리 작품을 만들고 발행하는 스튜디오(UI + API)를 만들어요.

## 범위
- API: `api/studio/**`(CRUD, publish 검증, assets presign(mock storage), import).
- `server/studio/validate.ts`: 설계 1-2 필드 제한, 캐릭터 모드 예시 대화 ≥1, 시작 상황 ≥1, 설정집 카테고리 필수, 본문에 쓰인 이미지 코드가 자산에 존재, 19등급은 설명 경고.
- `server/studio/importer.ts`: 크랙 `{user}`/`{{user}}`, `{{img::x}}`, 제닛 `{{url}}x.webp`·`{{iurl}}`, 베이브챗 `img:[slug]`, 플레이툰 `{{image:name}}`, 프론티아 `{bg::}` → 통일 형식. 변환 리포트(바뀐 개수, 남은 미확인 코드) 반환.
- UI `src/features/studio/`: 작품 목록, 탭형 에디터(기본정보 / 프롬프트 / 등장인물 / 시작 상황(여러 개, 프롤로그·숨김·첫 대사·추천답변 3) / 예시 대화 / 설정집(카테고리·키워드·숨김·상시·우선순위) / 이미지(코드 자동 제안 `YN_1`) / 상태창·출력규칙 / 엔딩 / 미리보기), 글자수 카운터, 자동 저장(초안), 발행 버튼.
- 미리보기는 프롤로그 렌더(이미지 코드 → 이미지)까지만, 실제 채팅은 05 몫.

## 파일 소유권
touch: `api/studio/**`, `server/studio/**`, `src/features/studio/**`, `supabase/migrations/02*`, `tests/studio-*`. do-not-touch: `src/shared/**`(타입 추가 필요하면 `src/features/studio/types.ts`에 로컬 확장), 다른 features.

## 선행 작업
02 머지.

## 완료 기준
- 시드 형태의 스토리 작품(인물 6, 시작 상황 2, 설정집 20, 이미지 10)을 UI로 만들고 발행 가능.
- 임포터 단위 테스트: 각 플랫폼 코드 샘플 변환.
- 발행 시 `work_versions` 스냅샷 생성, 이후 수정은 새 초안.
- 작성자 아닌 유저가 studio API 접근 시 403.

## 테스트 방법
`npm test -- tests/studio-*`; dev 서버에서 `/studio` 수동 작성→발행.

## 끝나면
- draft PR 생성(제목 `[pivot 04] ...`), 본문에 변경 요약·테스트 결과·남은 한계·다른 태스크에 요청할 사항.
- main 머지는 사용자가 직접 해요.

## 금지 (모든 태스크 공통)
- `main` 브랜치에 push·merge 금지. 작업 브랜치 `pivot/<태스크번호>-<이름>`에서만 커밋하고, PR은 draft로만 열어요.
- 배포 금지(Vercel deploy, `vercel --prod`, 컨트랙트 메인넷 배포 금지. GIWA Sepolia 배포도 사용자 승인 전 금지).
- 유료 API 호출 금지: LLM·임베딩·PG·본인인증은 `mock` 어댑터로만 테스트. 실제 키 필요 시 멈추고 사용자에게 물어요.
- 비밀값을 코드·커밋·로그에 쓰지 말고 `.env.example` 플레이스홀더만 추가.
- 자기 범위 밖 파일 수정 금지. 꼭 필요하면 PR 설명에 "다른 태스크 요청 사항"으로 적고 수정은 하지 않아요.
- 실존 인물(K-pop 아이돌) 이미지·이름을 시드나 예시에 쓰지 않아요.
