# Wave 02 지침 수동 평가

CURRENT_SCOPE의 현재 단계를 02로 갱신한 후 evals/2026-10-14-pivot.md의 관련 입력을
실제 파일과 대조했다. 평가자 Codex root. 독립 에이전트 프롬프트 재생이나 자동 테스트가 아닌
inline 수동 관찰 기록이며 소프트웨어 테스트는 FOUNDATION_HANDOFF에 별도 기록한다.

| 입력 | 관찰 |
|---|---|
| SIWE 필수 | privyConfig 자동 지갑 off와 Google/email 유지. 서버 식별은 검증된 DID뿐 |
| 19/성인인증/신고관리 | migrations는 users/personas/works/versions/chats/messages/turn_requests/free ledger만 생성 |
| 결제/정산 | 원장 bucket free 한정. PG/adult provider 환경변수/테이블 없음 |
| 과거 증거 재사용 | archive 변경 없음. 체인 receipt/anchored 완료 표시 없음 |
| 공유 파일 병렬 수정 | 사전 spec에 소유권 배정. DB/UI/contracts 파일 묶음 독립 편집, package/env/router 통합은 root. 후속 리뷰 수정도 파일 범위 별도 지정 |
| 없는 sendAlert | 새 서버 오류는 JSON/SSE 공통 처리. sendAlert 호출 추가 없음 |
| main/배포 | 01을 현재 브랜치로 fast-forward. main 변경 없음. Vercel 자동 배포 false 유지 |
