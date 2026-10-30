# C 사용자 화면 → 02/A/D 연결 요청

기준 e67418a. 최신 사용자 요청은 discover + chat UI를 C에 배정했다.
공통 파일과 A/D 서버는 이 브랜치에서 수정하지 않는다.

## 02 공통 디자인·라우트
- `src/routes/index.ts`의 discovery import를 `features/discover/{Home,Search,Tag,Ranking,Work}Page`로 변경.
- `/chats` → `features/chat/ChatList` default export 추가. `/chat/:chatId`는 기존 export 유지.
- 이 페이지들은 ReaderLayout(사이드바/모바일 내비 포함)을 갖는다. 기존 App header와 중복하지 않도록 해당 route에서 기존 셸 제외.
- `ReaderProvider` 없이 실제 API를 사용하며 Privy `getAccessToken()`으로 매 요청 최신 토큰을 읽는다.
- 공통 styles/UI/Foundation의 색상은 #FAF9FB 배경, #FFFFFF 표면, #DB6096 포인트,
  #C94B82 hover, #FCEBF3 선택, #25232A 본문으로 변경 요청.
  작은 핑크 글씨와 흰 글자 primary 배경은 #A83269로 대비 보정. feature 내부 토큰과 동일하게 적용.
- 자체 호스팅 Pretendard 유지. B/D도 위 토큰 사용. 로고 파일 색상 자체는 여기서 변경하지 않음.
- 공통 UI core-ui 테스트의 빈 페이지 전제는 라우트 통합 시 실제 화면 상태로 갱신.

## 공개 API
`server/discover/index.ts`의 `createDiscoveryService({db})`는 기존 DiscoveryService와 호환.
`api/discover/index.ts`의 `createDiscoverHandler(service)`를 공통 라우터보다 먼저
아래 경로에만 연결. 기존 상세 core helper 대신 이 handler를 쓰면 미발행 public도 보호됨.
- GET `/api/discover/works?q=&tag=&mode=&offset=` 또는 `/api/works`: PublicWorkDto[]
- GET `/api/works/:id`: PublicWorkDetailDto. public + 발행 버전만, 나머지 404.
- 검색 title/description literal substring, 태그 정확 일치, 최신순, 최대 60, offset 0..10000.
- GET `/api/discover/ranking`: 아직 집계 정본 없음. 503 유지; 실제 순위 정본 도입 후 PublicWorkDto[] 반환.
  fixture는 빈 배열, 임의 순위를 생성하지 않음. 개인화 추천 역시 API 정책이 없는 동안 태그 탐색 제공.

## A 대화 API 제안 (공통 DTO 확정 요청)
로컬 타입 `src/features/discover/readerApi.ts`가 프론트 기대 형식 정본이다.
모든 성공/오류 envelope는 02 규격. 보호 API는 서버 토큰+자원 소유권 검증 필수.
- GET `/api/chats`: ChatSummary[] = {chat:ChatDto,title,preview,coverUrl}[]; 본인만.
- POST `/api/chats`: 기존 {workId,personaId}에 openingId/model 추가. 선택 시작 상황을
  발행 버전 내에서 검증하고 고정. 현재 core createChat은 이 필드를 무시하므로 통합 전 수정 필수.
- GET `/api/chats/:id/view`: ChatView = {chat,title,messages,memo,guide,suggestedReplies}.
  messages는 MessageDto + 선택 images[{url,alt}],status,ending{id,title}. private prompt 포함 금지.
- PUT `/api/chats/:id/branch` {messageId:string|null} → ChatView. 본인 chat 내부 메시지만 허용.
- PATCH `/api/chats/:id/messages/:messageId` {content} → ChatView. 1..8000자, 소유권+진행 중 턴 충돌 검사.
- DELETE 동일 경로 → ChatView. 하위 분기도 soft delete하고 active pointer를 남은 부모로 이동.
- PUT `/api/chats/:id/memo` {memo} → null. 최대 2000자, 본인만, 성공 이후 UI 확정.
- 재생성은 기존 사용자 메시지의 content와 그 부모를 TurnRequest로 전송한다.
  동일 user content/parent를 재사용하고 assistant 형제 노드를 추가하는 의미를 A와 확정할 것.
  다른 의미를 채택하면 전용 regenerate endpoint 필요. 기존 메시지를 overwrite하면 안 됨.
- POST turns는 기존 SSE/Idempotency-Key 그대로. 끊긴 응답은 같은 키로 재확인.
- 오류/소유권 테스트: 미인증401, 타인404, 다른 chat 메시지404, 잘못된 입력400,
  진행 중 편집409, 동일 멱등키 다른 본문409, 동일 요청 재과금 없음.

## D 모델·크레딧
- GET `/api/models`: {id,name,credits:number|null,available:boolean}[] 서버 정본.
- GET `/api/me/credits`: 기존 {available,reserved}. usage로 잔액을 추정하지 않고 완료/중단 뒤 재조회.
- 테스트 정책 미정이면 가격을 임의 표시하지 말고 null. 실제 사용 가능 모델과 부족 판단은 서버에서 재검사.
- 무료 정책/예약/차감/복구 및 GIWA는 D 소유. 이번 UI fixture 잔액은 실제 지급/차감 증거 아님.

## 개발 검토
`npm run dev:web -- --port 5193` 후 `/src/features/discover/preview.html`.
명시적 fixture 주입, 별도 sessionStorage key, 유료 호출 없음. `?source=api`는 실제 API만 호출하며 실패를 보여줌.
프리뷰는 Vite DEV guard, 운영 index 의존성 그래프에 없음.
공통 연결 전 `/`에는 02 빈 페이지가 유지된다. 이 요청서 반영 전 제품 통합 완료로 간주하지 않는다.
