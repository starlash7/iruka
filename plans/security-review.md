# 보안 점검 파일별 체크리스트

- [x] `vite.config.ts`, `.gitignore`, `tests/visual-static-assets.test.mjs`: 비공개 디렉터리·키 파일·환경 파일·루트 밖 우회 차단
- [x] `server/security/**`, `server/nodeServer.ts`, `server/dev.ts`: 요청 속도/동시 처리/Origin/크기/수신 제한, 보안 응답 헤더
- [x] `server/chat/promptAssembler.ts`, `privateOutput.ts`, `safety.ts`, 관련 테스트: 모델 입력 권한 분리, 긴 비공개 텍스트 부분 복사·Unicode 우회, 정산 전 공개 출력 차단
- [x] 인증/소유권/공개 필드/이미지/크레딧 기존 경계 수동 코드 검토 및 회귀 검증
- [x] `package*.json`: 호환 가능한 보안 패치, 잔여 advisory와 도달 가능성 검토
- [x] 현재 추적 파일의 고신뢰 비밀값 패턴을 값 출력 없이 로컬 검사
- [x] `docs/security/2026-11-03-review.md`, `docs/pivot/HANDOFF.md`: 재현/수정/운영 한계 기록
- [x] 전체 테스트·빌드·diff 검사, 관련 변경 커밋/push 및 Draft PR 갱신
