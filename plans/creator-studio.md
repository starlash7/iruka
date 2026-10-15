# 제작 스튜디오 실행 체크리스트

기준 8ada036 포함 확인 후 깨끗한 작업 트리에서 fast-forward. 현재 branch starlash7/ffkk2 유지.
Docs b7f750e는 git show로 읽기만 한다. 공통 파일/DB migration/package/env 수정 없음.

## 설계
기본 소개 → 등장인물 → 시작 상황을 먼저 작성하고 고급 설정은 접어 둔다.
메인 프롬프트를 '이야기 방향'으로 기본 소개에서 접근 가능하게 하되 기존 데이터/필드와
고급 프롬프트 편집을 보존한다. 내부 character/story 값은 유지하며 표시는 스토리/한 인물과 대화.
이미지는 교체할 때마다 불변 자산을 추가해 기존 발행본·대화의 URL을 유지한다.
서버가 실제 PNG 구조·압축 해제·크기·소유권을 확인한다. 기존 의존성으로 브라우저에서
JPEG/PNG/WebP를 decode 후 PNG로 변환하고 서버는 전달받은 PNG를 다시 검증·정규화한다.
미발행 이미지는 인증된 작성자만 읽고, 공개 발행 이미지와 대화 버전에 포함된 이미지 접근을 분리한다.
사용자 결정: 로컬 개발용 저장과 저장소 인터페이스만 구현. 운영 저장소는 추후 결정. 외부 서비스/계정/의존성은 추가하지 않는다.
초안 오류는 메모리 입력 유지 + 사용자/작품별 sessionStorage 복구본 + 다운로드로 복구한다.
저장/발행 응답 유실은 서버 내용을 재조회해 동일 요청이 반영됐는지 확인한 후 재시도한다.

## 파일별 실행
- [x] tests/studio-media.test.mjs: 실제 파일 검사, private/public/chat 접근, 교체/중복/실패 테스트 먼저 실행.
- [x] server/media/png.ts, storage.ts, index.ts: bounded decode, immutable blob 저장 인터페이스와 접근 검증. 명시적으로 주입하는 로컬 개발 어댑터 제공. 공통 제품 연결은 통합 담당에게 인계.
- [x] api/studio/handler.ts: 인증된 업로드 및 media GET 경로, optional storage 주입. 미설정은 503.
- [x] server/studio/validate.ts: 소유 서버 이미지 URL 형식 허용. 공유 DTO/DB는 변경하지 않는다.
- [x] src/features/studio/ImageField.tsx, prepareImage.ts, client.ts: 파일 선택/교체/미리보기/실패 재시도.
- [x] src/features/studio/EditorPage.tsx, EditorFields.tsx, studio.css: 3단계 작성 + 고급 설정·미리보기·발행 이력 보존.
- [x] src/features/studio/useEditor.ts, recovery.ts: 직렬 저장, 응답 유실/충돌 복구, session 복구본·내보내기.
- [x] tests/studio-* 및 브라우저: 저장/재접속/이미지 교체/발행/버전·소유권·중복·실패, 390/768/1440px와 키보드.
- [x] npm test, npm run build, git diff --check 결과와 screenshots를 기록한다.
- [x] docs/pivot/handoffs/creator-studio.md: 계약/설정/통합 요청/운영 제한/PR 기록 후 현재 branch 커밋·Draft PR.
