# Persona implementation checklist

Goal: 한국어 흰색·핑크 이름/소개 관리 UI, 기존 PersonaDto 재사용.
Baseline: clean tree에서 8ada036 fast-forward; branch 변경 없음. Docs b7f750e read-only.

- [x] 기존 API, DTO, 인증, snapshot/FK 검토.
- [x] `tests/persona-client.test.mjs`: 실제 GET/POST/입력/권한 및 미구현 PATCH/DELETE 실패 검증.
- [x] `src/features/user/personas/client.ts`: 공통 인증 client 재사용, 입력 검증. PATCH/DELETE는 요청 계약이며 서버 미구현.
- [x] `src/features/user/PersonasPage.tsx`: 인증 상태 연결, 계정별 remount.
- [x] `src/features/user/personas/PersonaManager.tsx`, `personas.css`: 목록, 생성/편집 폼, 삭제 확인, loading/error/retry, 중복 제출 차단.
- [x] 브라우저 fixture로 CRUD/실패/키보드, 390/768/1440 확인. 실제 서버와 fixture 결과 구분.
- [x] `docs/pivot/handoffs/persona.md`: 서버 계약과 snapshot/FK 삭제 제약, 테스트/빌드 실제 결과.
- [x] 관련 변경 커밋 및 Draft PR #16. 공유 코드/라우터/DB 수정 금지.
