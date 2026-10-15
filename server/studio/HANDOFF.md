# 스튜디오·시드 인계

기준 공통 커밋 `e67418a` / 구현 branch `starlash7/ffkk2`. 공통 파일은 수정하지 않았다.

## 구현

한국어 내 작품 목록과 10탭 에디터: 기본 정보·캐릭터/스토리 모드·프롬프트·등장인물·
시작 상황/숨김 맥락/추천 답변·예시·설정집·이미지 코드·상태창/출력·엔딩·미리보기.
직렬 자동 저장, revision 충돌, 발행 전 저장, 오류 표시, 계정 전환 시 private state 초기화.
공통 Page/Button/Input/Tabs와 AuthActions를 재사용한다. 미리보기는 공개 프롤로그만
렌더하며 모델 호출이 없다. HTML은 텍스트로 escape한다.

`createStudioService({db})`는 공통 CreateStudioService를 만족한다. 추가 메서드:
- `listWorks(userId)` → `{id,title,mode,revision,published}[]`
- `getWork(userId,id)` / `saveDraft(userId,input)` → CreatorWorkDto + `{draft,revision,assets}`
- `createAsset(userId,id,{code,label})` → `{id,code,label,url:null}`
- `publishVersion(userId,id,revision?)` → PrivateWorkVersionDto

타입 확장은 `src/features/studio/types.ts`에만 있다. 공통 WorkDraftInput 직접 호출을 위해
revision은 서비스에서 선택적이다. 브라우저 HTTP 수정·발행에는 필수이며 조건 불일치는 409.
서버 직접 호출자는 revision을 전달하는 것이 권장된다. 공통 DTO 승격 여부를 조율해 달라.

초안은 별도 테이블에 저장한다. 발행은 작품 row lock 아래 새 immutable work_versions와
works 최신 공개 메타데이터를 원자적으로 갱신한다. 기존 chat.work_version_id는 변경하지 않는다.
버전의 hiddenSettings에는 PrivateWorkConfig + assets + workMetadata가 들어 있다.
A 런타임은 해당 발행 버전의 자산 매핑만 사용하고 현행 초안/자산 목록으로 대체하지 않아야 한다.
원고의 코드가 미업로드 슬롯을 가리키면 URL이 null이므로 이미지 이벤트를 만들지 않아야 한다.

## 공통 담당 연결 요청 (아직 제품 서버에 연결되지 않음)

1. 공통 migration 이후 `await migrateStudio(db)` 실행 또는 owned SQL을 공통 runner에 등록.
   파일: `server/studio/migrations/0200_studio.sql`. migration key `0200_studio`, advisory lock과
   schema_migrations 기록으로 멱등 적용. 기존 migration 파일 변경 없음.
2. `api/studio/handler.ts`의 `createStudioHandler({db,verifyToken})`를 `/api/studio/*`에
   **기존 공통 GET studio 경로보다 먼저** 연결. 공통 인증 검증기/DB 그대로 전달한다.
   Vercel 배포 어댑터가 아닌 Request→Response handler이며 배포 구성은 추가하지 않았다.
3. 공통 `server/dev.ts`도 동일하게 연결. 현재 `npm run dev`의 공통 서버만으로는 신규 저장/발행 API가 작동하지 않는다.
4. `tests/core-ui.test.mjs`의 모든 비계정 페이지가 `/준비 중/` 문구를 포함해야 한다는
   placeholder assertion을 구현된 studio/editor에는 새 상태 기준으로 갱신한다.

| 경로 | 메서드 | 입력/응답 |
|---|---|---|
| /api/studio/works | GET | 본인 초안 목록 |
| /api/studio/works | POST | WorkDraftInput + assets; id/revision 생략 → StudioWork (201) |
| /api/studio/works/:id | GET | 작성자 StudioWork |
| /api/studio/works/:id | PUT | id, revision 필수 StudioDraft → StudioWork |
| /api/studio/works/:id/publish | POST | `{revision}` → PrivateWorkVersionDto (201) |
| /api/studio/works/:id/assets | POST | `{code,label}` → 미업로드 소유 슬롯 (201) |

공통 envelope/requestId/no-store 사용. 401 인증, 403 다른 작성자/자산 소유권,
404 없는 작품/경로, 400 잘못된 구조/필드 제한/미등록 이미지/발행 필수값,
409 저장 버전/중복 이미지 코드. 본문 제한 1 MiB (100개 설정집은 공통 32 KiB를 넘음).
클라이언트가 보내는 owner/URL/알 수 없는 중첩 필드는 받지 않는다.

## 시드와 원고

```sh
node scripts/seed/seed-works.ts --local
```

`DATABASE_URL`이 있거나 --local이 없으면 거부. 고정 `.context/studio-seed-db`만 사용한다.
개발 DB와 별개이며 local-studio-seed DID는 로컬 fixture 계정이지 로그인 증거가 아니다.
트랜잭션 내 두 원고 발행, slug+원고 hash로 재실행 중복 방지. 원고가 바뀌면 자동 덮어쓰기 거부.
실제 앱 사용자에게 작품을 이관하려면 별도 승인된 import/소유권 흐름이 필요하다.

`seed/works/office-romance/`와 `2096-deletion/`의 work.json/assets.csv/REVIEW.md.
원본 읽기만 수행했고 원고 두 편을 실제 텍스트로 이식했다. 사내연애의 첫 도입·승인 반응컷
6개 코드만 등록하며 이미지는 없다. 2096 원문은 텍스트판으로 이미지/설정집 생략을 유지했다.
사내연애의 원문에 별도 네이티브 엔딩 텍스트가 없어 창작하지 않고 조건을 프롬프트에 보존했다.
실제 이미지 연결, 모델 플레이/엔딩 도달, 콘텐츠 공개 검수는 미완료다.

## 검증 결과

최종 검증 결과는 아래에 기록한다. 브라우저 검증은 .context 테스트 harness의 독립 메모리 DB와
명시적 테스트 인증 adapter로 실행했다. 제품 환경에 인증 우회를 추가하지 않았다.

| 명령/확인 | 실제 결과 |
|---|---|
| npm ci + 기준 npm run build | 성공 (구현 전 기준 확인) |
| node --experimental-strip-types --test --test-concurrency=1 tests/studio-*.test.mjs tests/seed-studio.test.mjs | 6 passed / 0 failed |
| npm test | 66 passed / 1 failed. 유일한 실패는 core-ui의 이전 '준비 중' placeholder assertion; 공통 파일 수정 금지에 따라 남김 |
| npm run build | TypeScript frontend/server + Vite 성공 |
| npx tsc --noEmit --target es2022 --module NodeNext --moduleResolution NodeNext --allowImportingTsExtensions --skipLibCheck --strict api/studio/handler.ts scripts/seed/*.ts | 성공 (공통 tsconfig가 포함하지 않는 owned API/seed 별도 검사) |
| node scripts/seed/seed-works.ts --local (2회) | 첫 실행 두 작품 created=true, 재실행 같은 id/created=false |
| node .context/studio-browser-check.mjs | 1440×1000 / 390×844 목록·10탭·자동저장/새로고침·키보드·발행, overflow 0/page errors 0 |
| node .context/studio-create-check.mjs | UI로 인물 6·시작 2·설정집 20·미업로드 코드 10 생성 후 발행/DB 확인 |
| node .context/studio-auth-check.mjs | 명시적 테스트 adapter: 로그인 시 목록 재조회, 로그아웃 시 private 목록 제거 통과 |
| 독립 읽기 전용 코드 리뷰 | auth lifecycle/부분 인물 설정 오류 수정 후 재검토. 추가 중요 결함 없음 |
| git diff --check | 성공 |

브라우저 첫 검증은 hidden 탭의 display:grid 충돌을 발견했고 :not([hidden]) selector로 수정 후
비활성 9개 panel이 실제 숨김임을 확인했다. 테스트 인증은 제품 환경변수/서버에 추가하지 않았다.
UI 직접 작성 검증 작품은 독립 중립 fixture이며 원본 원고를 대신하거나 수정한 것이 아니다.

화면: `.context/studio-desktop-editor.png`, `studio-mobile-editor.png`,
`studio-desktop-list.png`, `studio-mobile-list.png`, `studio-desktop-preview.png`,
`studio-mobile-preview.png`, `studio-created-assets.png`.
로그: `.context/studio-focused-tests.log`, `studio-tests-final.log`, `studio-build-final.log`,
`studio-seed-first.log`, `studio-seed-second.log`, `studio-browser-final.log`.

빌드 경고: Privy 전이 dependency annotation 및 652.58 kB app chunk (gzip 198.04 kB).
실제 Privy Google/OTP, 운영 PostgreSQL 다중 연결, 실제 모델/이미지/배포 검증은 수행하지 않았다.
체인 호출과 거래 영수증은 이 작업에 해당하지 않는다. main 직접 push/merge 없음.

## 전달

- 구현 커밋: `1264582`.
- Draft PR: https://github.com/starlash7/iruka/pull/12 (base main).
- 스튜디오 변경만 검토: `git diff e67418a..HEAD` (선행 #9 공통 기반 포함).
- 현재 체크아웃 `starlash7/ffkk2` 유지. 후속 문서 커밋은 PR/체크리스트 기록만 갱신한다.
