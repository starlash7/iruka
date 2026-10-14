# Iruka Design

방향: 밝고 차분한 한국어 AI 캐릭터·스토리 채팅. 기존 Iruka 흰색·블루 브랜드를
유지한다. 현재 단계는 최소 로그인·계정 화면이며 새 제품 화면 설계는 후속 작업이다.

## Visual system
| 역할 | 색상 |
|---|---|
| App background | #F4F8FF |
| Surface / soft surface | #FFFFFF / #F8FBFF |
| Blue / hover | #1677FF / #0B63F6 |
| Sky / aqua | #EAF4FF / #20C7DF |
| Ink / muted / subtle | #101828 / #667085 / #98A2B3 |
| Line | #E6EEF8 |
| Success / warning / danger | #12B76A / #F79009 / #F04438 |

- 큰 surface 22px, control 18px, primary button/chip은 full-pill.
- 그림자는 부드러운 blue tint. dark luxury, 거친 금융 테이블 형태를 피한다.
- Pretendard / Inter / system sans. 읽기 쉬운 제목, 숫자는 필요 시 tabular-nums.
- 현재 로고의 비율/색상을 유지한다. 불필요한 새 이미지나 패키지를 만들지 않는다.

## Product interaction
- 한국어를 기본으로 짧은 라벨: 로그인, 계정, 탐색, 만들기, 대화.
- 탐색/제작/대화는 후속 화면의 방향이며 현재 껍데기에 가짜 콘텐츠를 넣지 않는다.
- 지갑 연결·서명·입출금 CTA를 넣지 않는다. 빈 수치나 가짜 크레딧을 표시하지 않는다.
- 현재 상태(준비, 미설정, 오류, 로그인)를 사실대로 보여준다.
- 로그인/계정은 일반 DOM. 지갑이나 3D가 없어서 사용이 차단되면 안 된다.
- 키보드 focus와 44px 이상 터치 영역을 유지한다.
- 모바일은 단일 열, 긴 이름/이메일은 줄바꿈, 가로 넘침/겹침 없음.
- 새 애니메이션을 추가한다면 reduced-motion을 지원한다.

## Verification
흰색·블루 인상, 짧은 한국어, 유효한 CTA, 명시적 disabled/error 상태,
데스크톱/모바일과 긴 계정 정보 표시를 확인한다.
