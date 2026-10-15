# 공통 UI와 라우트 계약

이번 단계는 실제 기능을 연결할 빈 페이지와 공통 컴포넌트다. 목록·잔액·메시지·저장
성공을 만들어 표시하지 않는다. Google/이메일 인증 UI는 기존 `AuthActions`를 그대로
사용하며 브라우저 세션을 서버 권한으로 사용하지 않는다.

## 라우트와 파일 소유권

각 페이지는 `default export function …Page(props: RoutePageProps)` 형태다.
`RoutePageProps`는 `src/routes/paths.ts`에서 제공하며 `params`는
`Readonly<Record<string, string>>`, `authEnabled`는 선택적 boolean이다.
파라미터는 URI decode된 값이며 잘못된 인코딩/추가 경로는 404다.

| 라우트 | 페이지 파일 (`src/features/`) | 담당 |
|---|---|---|
| `/` | discovery/HomePage.tsx | C |
| `/ranking` | discovery/RankingPage.tsx | C |
| `/search` | discovery/SearchPage.tsx | C |
| `/tags/:tag` | discovery/TagPage.tsx | C |
| `/works/:id` | discovery/WorkPage.tsx | C |
| `/chat/:chatId` | chat/ChatPage.tsx | A |
| `/studio` | studio/StudioPage.tsx | B |
| `/studio/:workId` | studio/EditorPage.tsx | B |
| `/account` | user/AccountPage.tsx | C |
| `/personas` | user/PersonasPage.tsx | C |
| `/credits` | credits/CreditsPage.tsx | D |

`src/routes/index.ts`의 `routePages`가 모든 route id를 컴포넌트에 매핑한다.
A–D는 자신의 페이지 내부를 채운다. 공통 라우트·UI·인증·토큰 변경은 공통 담당에게
요청한다. 일반 링크로 이동하므로 새 라우터 의존성은 없다. 서버는 정적 페이지
경로를 index.html로 돌려줘야 한다. 기존 `/#brand-kit` 진입점은 보존한다.

## 공통 토큰

- 본문: 자체 호스팅 Pretendard Variable 1.3.9, 100–900. `font-display: swap`.
  영문 브랜드: Avenir Next → Avenir → Trebuchet MS → sans-serif 별도 스택.
- 글자: `--text-sm/md/lg/xl` = 14/16/20/28px. 굵기: regular/medium/bold = 400/500/700.
- 간격: `--space-1/2/3/4/6/8/12` = 4/8/12/16/24/32/48px.
- 흰색 surface `#FFFFFF`, 배경 `#F4F8FF`, blue `#1677FF`, hover `#0B63F6`,
  ink `#101828`, muted `#667085`, line `#E6EEF8`, 오류 `#B42318`.
- 큰 surface 22px, control 18px, 버튼/chip pill. 기본 터치 영역 44px 이상.
- Pretendard 원본: https://github.com/orioncactus/pretendard/tree/v1.3.9
  폰트와 SIL Open Font License는 `public/fonts/`에 함께 보관한다. 외부 폰트 요청 없음.

## 컴포넌트 (`src/ui` named exports)

- `Button`: native button props, `variant=primary|secondary|ghost`, 기본 type=button.
- `Input`: native input props + 필수 `label`, 선택 `hint/error`. label/id 연결,
  오류 aria-invalid와 설명 연결을 제공한다.
- `Tabs`: `label`, `items: {id,label,content}[]`, `value`, `onChange`.
  호출자가 유효한 value와 고유 id를 제공한다. 좌우/Home/End 자동 선택과 focus 이동,
  roving tabindex 및 panel 연결을 제공한다.
- `Modal`: `open/title/onClose/children`. native dialog.showModal()로 focus 격리,
  Escape와 닫기 버튼으로 onClose 호출. 호출자가 open=false로 갱신한다.
- `WorkCard`: `id/title/description/mode`, 선택 `imageUrl`. 공개 필드만 전달하고
  비공개 설정 DTO를 넘기지 않는다. 실제 작품 데이터가 없으면 카드를 만들지 않는다.
- `Page`: title/description/children. `EmptyState`: title/description, 준비 중 상태.

## 후속 화면의 단순 구조

- 홈: 제목 → 검색/모드 필터 → 실제 공개 작품 카드 목록 → 빈 상태/오류.
- 상세: 공개 작품 소개 → 제작자/태그 → 대화 시작. 비공개 프롬프트는 전달하지 않는다.
- 대화: 작품 제목 → 메시지 tree의 선택 branch → 입력/전송 상태. turn 실패와 재시도를
  서버 상태에 맞추며 임의로 잔액이나 성공 메시지를 확정하지 않는다.
- 편집: 기본 정보 → 작성자 전용 설정 → 검증/저장/발행 상태. 서버 소유권 검증이 필요하다.

이 구조는 후속 구현 가이드이며 현재 빈 페이지에는 동작하지 않는 제작/전송 버튼을 두지 않는다.

## 검증

`node --experimental-strip-types --test tests/core-ui.test.mjs`: 2개 통과.
전체 라우트/뒤 slash/한글 파라미터/잘못된 URI와 404, 미설정 인증, 빈 페이지 렌더,
입력 오류 연결, tabs 의미 구조, 카드 경로 escaping, 닫힌 dialog 렌더를 검사한다.
`npx tsc --noEmit`: 통과. 실제 브라우저 키보드·desktop/mobile 검증 및 최종
`npm test`/`npm run build` 결과는 통합 담당이 `HANDOFF.md`에 기록한다.
