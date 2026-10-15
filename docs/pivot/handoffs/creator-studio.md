# 제작 스튜디오 · 이미지 등록 인계

## 범위와 기준
- 현재 브랜치 starlash7/ffkk2 유지. 깨끗한 작업 트리에서 origin fetch 후 통합 기준 8ada036으로 fast-forward.
- Docs b7f750e는 읽기만 했으며 병합하지 않았다.
- 사용자 결정: **이번에는 로컬 개발용 저장과 연결 인터페이스만 구현. 운영 저장소는 추후 결정.**
- 공통 UI/라우터/DTO/DB migration/환경변수/package/lockfile은 수정하지 않았다.
- 기본 소개 → 등장인물 → 시작 상황 → 필요한 고급 설정. 한국어·흰색·핑크 UI.
- 내부 character/story 및 프롬프트·로어북·예시·상태창·엔딩·초안·발행·버전 기능 유지.
- 기존 시드는 변경하지 않았다. 실제 원고의 추가 확보·이식은 이번 작업에서 수행하지 않았다.

## 업로드 계약
- POST /api/studio/works/:id/images: Privy Bearer 인증, 작성자 소유권 검사, raw PNG body, image/png.
- 브라우저: PNG/JPEG/WebP 최대 5 MiB, 디코딩 후 canvas PNG로 변환. 서버: 실제 PNG signature/chunk CRC/IHDR/IDAT 압축 해제/필터/종료 검사.
- 서버 PNG는 8비트 RGB/RGBA, 각 변 최대 4096px, 최대 12M pixels, body 최대 5 MiB. 인터레이스·APNG·palette·미지원 critical chunk 거부. 메타데이터 제거 후 재압축.
- 응답은 기존 StudioAsset {id,code,label,url}. SHA256 내용 주소, 같은 작품/내용 재시도는 동일 자산. 작품당 최대 200개. 잠금 안에서 한도 검사 후 파일 저장.
- 교체는 새 불변 자산 추가. 기존 발행본 URL 및 chat.work_version_id 유지.
- GET /api/studio/media/:workId/:hash: 미발행은 작성자만; 공개 발행 표지·등장인물·시작 상황에서 참조한 이미지만 익명 공개.
- 비공개 설정에만 들어 있는 이미지는 작성자 또는 해당 발행 버전에 고정된 대화 소유자만 접근. 공개 응답에 프롬프트/숨김 설정 없음.
- image/png, nosniff, CSP sandbox, private/no-store 응답. 저장소 미주입 시 503.

## 저장소와 통합 담당 작업
ImageStorage는 put(key, Uint8Array), get(key) → Uint8Array|null 인터페이스다.
server/media/localStorage.ts의 createLocalImageStorage(directory)는 개발/테스트 전용.
임시 파일 + atomic link로 불변 파일을 생성하며 파일 권한은 0600. NODE_ENV=production 또는 VERCEL에서는 거부한다.

통합 담당이 소유한 제품 composition에서 아래 연결이 필요하다. 이 PR은 공통 파일을 수정하지 않았으므로 기본 제품 실행에서 이미지 등록은 아직 503이다.

1. ProductOptions에 선택적 imageStorage: ImageStorage 주입 통로 추가.
2. createStudioHandler({...shared, imageStorage: options.imageStorage})로 전달.
3. 로컬 개발 진입점에서만 createLocalImageStorage('.context/studio-images') 명시적 생성/주입. 운영 fallback 금지.
4. 채팅의 비공개 이미지 렌더러는 인증된 blob 요청 또는 승인된 단기 URL 계약으로 연결해야 한다. 현재 일반 img src만으로는 Bearer 인증이 전달되지 않아 비공개 이미지가 401이다. 스튜디오에는 인증 blob 미리보기를 구현했다.
5. 390px 공통 헤더에서 메뉴가 세로로 줄바꿈되고 로그인 영역이 잘리는 기존 레이아웃을 공통 UI 담당이 수정해야 한다. 스튜디오 본문은 가로 넘침/겹침 없음.

기존 studio_assets와 work_versions JSON 설정을 사용하여 필수 DB migration/공유 DTO 변경은 없다.
향후 운영 저장소 선택 시 비공개 원본/공개 발행 자산 분리, 백업·수명·권한·쿼터·삭제 정책을 확정해야 한다.
이번 로컬 파일 저장은 **운영용 영구 저장소가 아니다**. 다른 호스트/서버리스/디스크 삭제 시 복구를 보장하지 않는다.
DB 실패 직전 파일 저장이 성공한 경우 orphan 파일이 남을 수 있다. 재시도는 같은 키를 재사용하며, 자동 GC는 구현하지 않았다.
과거 공개 발행본이 참조한 이미지는 작품이 공개인 동안 접근 가능하다. 버전 보존 때문에 교체 즉시 파일을 삭제하지 않는다.

## 실패 복구와 발행
- 직렬 자동 저장, 실패해도 편집 내용 유지. 사용자/작품별 sessionStorage 복구본, 재접속 시 복구 선택, JSON 다운로드.
- sessionStorage는 같은 탭 세션 범위다. 탭 폐기/브라우저 저장소 삭제를 넘어서는 복구 보장은 없으므로 다운로드 제공.
- 저장 응답 유실은 서버 초안 비교로 확인. 충돌 시 기존 내용을 덮어쓰지 않는다.
- 파일 등록 실패는 선택 파일 미리보기와 재시도 유지. 새로고침 이후 미업로드 파일은 다시 선택해야 한다.
- 중복 발행은 원래 revision으로 재시도하거나, 재접속 후 중간 저장 없이 발행하면 기존 버전을 반환한다. 실제 초안 저장 뒤에는 새 버전 생성 가능.
- 실제 외부 이미지 업로드, 운영 계정 생성, 유료 호출, 배포는 하지 않았다. 검증용 합성 PNG만 격리 로컬 저장소에 기록했다.

## 검증
- npm test: 133 passed, 0 failed (최종 재실행 완료).
- npm run build: 통과. 기존 chunk 500 kB 경고 및 의존성 annotation 경고 있음.
- 관련 HTTP/media 테스트: 5 passed. 실제 PNG/한도/소유권/공개 경계/버전 고정/파일 저장 실패/중복/재접속 발행 검증.
- 브라우저: 390/768/1440px, 표지 및 등장인물 등록·교체, 업로드 실패 재시도, 저장 실패 후 재접속 복구, 저장·발행 응답 유실, 키보드 탭 이동, 스튜디오 넘침 검사.
- 검증 서버는 실제 handler/PGlite/local adapter와 가짜 인증 fixture 사용. 실제 Privy OAuth 검증 증거가 아니다.
- .context/creator-tests.log, creator-build.log, creator-focused-final.log, creator-browser.log.
- .context/creator-{390,768,1440}-{editor,preview}.png. 공통 모바일 헤더 제한은 위 통합 항목 참고.
- 리뷰에서 발견한 거부 업로드 파일 잔존 및 재접속 발행 중복을 수정하고 회귀 검증 추가.

## 전달
현재 브랜치의 기존 Draft PR #12로 전달:
https://github.com/starlash7/iruka/pull/12
main push/merge 또는 배포 없음.
