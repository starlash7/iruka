# 로그인 및 실제 연결 후속 계획

근거: docs/archive/reference/2026-11-03-login-screen-audit.md.
2026-11-03 후속 구현 결과. 실서비스 검증은 구현/테스트 더블과 구분한다.

- [x] Google 우선·이메일 OTP·선택적 지갑의 흰색/핑크 로그인 화면 상세 설계
- [x] Privy 로그인 진입 공통화, 준비/이메일/코드/재전송/만료/오류/취소 화면
- [ ] 신규/기존 계정 프로필 흐름, 필요한 약관 안내·동의 데이터 항목 확정
- [x] 작품/시작 상황 로그인 복귀, 모바일/키보드/포털 레이어 QA
- [ ] 실제 Privy Google·이메일 설정과 허용 origin 확인, 실제 로그인 검증
- [ ] 운영 PostgreSQL 연결 대상·마이그레이션 계획·백업/롤백 확인
- [ ] 서버 JWT→Privy DID→DB 계정/프로필 매핑과 재로그인 지속성 검증
- [ ] 모델·안전 정책·사용 한도·예약/실차감 기준 확정
- [ ] 승인된 범위에서 실제 모델 스트리밍/취소/실패/크레딧 정산 검증

운영 비밀값은 문서/클라이언트/스크린샷에 넣지 않는다. 기존 DB 내용 삭제/변환,
main 병합·배포·승인 없는 유료 호출·GIWA 구현은 포함하지 않는다.

## 구현 파일과 검증

- [x] `src/features/auth/**`: 공통 로그인, headless Google/이메일 OTP, 재전송/오류/취소, 내부 복귀 경로 검증
- [x] `useReaderLogin`, `AuthActions`, `PrivyAuthActions`, routes: 로그인 진입 공통화와 계정 경계 유지
- [x] `WorkPage`, `StartChatAccess`, `StartChatSheet`: 로그인 뒤 시작 창/유효한 시작 상황 복원
- [x] `scripts/setup-local.mjs`, `check-environment.ts`, `.env.example`: 덮어쓰기 없는 비밀값 제외 초기화와 진단
- [x] 로컬 `.env.local` 생성·권한 0600, 파일 DB 실제 마이그레이션
- [x] `server/product/modelRuntime.ts`: 명시적 서버 정책으로만 실제 어댑터 조합, 기본 비활성화·운영 환경 거부
- [x] `tests/account-persistence.test.mjs`: 파일 DB 재시작 후 서명된 테스트 JWT/DID 프로필 복원·계정 격리
- [x] `tests/login-ui.test.mjs`, `reader-auth-session`, `local-model-runtime`: 준비 상태/중복 요청/선택적 지갑/안전한 복귀/실모델 자동 활성화 차단
- [x] 390/768/1440 및 실제 미설정 앱 화면 확인. 테스트용 인증 응답의 OTP/Google/지갑/작품 복귀 QA
- [ ] 실제 Privy 앱 등록/Google OAuth/이메일 코드 수신. 대시보드 로그인이 필요함
- [ ] 운영 DB 공급자/지역/백업/보존 정책, 실제 LLM 안전·사용량·크레딧 정책 확정

새 계정은 기존 DID 기반 프로필과 마이페이지 편집을 사용한다. 약관/개인정보 원문과
동의 버전이 미확정이므로 가짜 동의 UI/기록을 추가하지 않았다. 실제 모델에 대한 기본
크레딧 지급/차감 정책을 새로 추정하지 않았다. 연결 절차는 `docs/pivot/LOCAL_SETUP.md`.
