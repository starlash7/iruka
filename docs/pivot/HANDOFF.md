# 피봇 정리 인수인계 — 2026-10-14

최신 제품 범위는 [CURRENT_SCOPE.md](CURRENT_SCOPE.md)다. 이번 구현은 원문 Wave 01
정리와 최소 로그인/계정 앱이다. 새 탐색/제작/대화 화면과 크레딧/장부 엔진은 미구현이다.

## 변경·제거·재사용

| 분류 | 내용과 참조 확인 |
|---|---|
| 앱/라우트 변경 | App → AuthActions → PrivyAuthActions → AccountView만 남김. `/`, `/account`, 404. 한국어 기본. `/#brand-kit` 보존 |
| 인증 재사용 | Privy provider/usePrivy/useLogin 기반 재사용. 계정 표시를 wallet readiness/주소에서 분리. Google + 이메일 OTP, 양 체인의 자동 지갑 생성 off |
| 상품 코드 제거 | 이전 App의 Vending/Vault/Marketplace/Reveal import 묶음, pack/card/inventory 데이터, pull/pending/receipt/local collection 모듈과 전용 CSS/테스트 제거 |
| 지갑 기능 제거 | AccountPage → funding/deposit/withdraw/balance/transfer/NetworkSelector/ProfileMenu 연결과 walletConnection 제거. 이전 localStorage를 읽거나 지우지 않음 |
| 운영 코드 제거 | api/giwa, api/monad → server Keeper/recovery/manifest/lease → scripts/contracts 참조 묶음 제거. Vercel 함수 includeFiles/cron과 Foundry CI 제거 |
| 환경/빌드 변경 | 기존 배치 배포 주소/키 예시와 Monad build gate 제거. Privy 식별자 및 다음 단계 서버 placeholder만 유지. SPA 직접 경로 fallback, 기존 보안 헤더 유지 |
| 브랜드 재사용 | public/brand 전체, public/iruka-logo.png, BrandKitView와 전용 CSS. 기존 UI와 별개로 로고/브랜드 다운로드 보존 |
| 자산 제거 | src/assets의 상품/아이돌/마켓 이미지와 public/assets의 카드·지갑·상품 아이콘 제거. 런타임 import 및 정적 경로 참조가 제거된 후 삭제 |
| 체인 참고 보존 | src/giwaChain.ts, viem만 보존. 앱/provider에서 체인 RPC를 호출하지 않음. 기존 Keeper lease 패턴은 archive의 비실행 Markdown 참고로 보존 |
| 의존성 제거 | 직접 @react-three/*, @solana-program/*, @solana/kit, three, gsap, @vercel/blob, border-beam 제거. React/Privy/lucide/viem과 기존 build 도구 유지 |
| 문서 보존 | 기존 docs 63개 전부 docs/archive/tcg/docs로 바이트 동일 이동. 과거 root rules/README/Foundry config, 의사결정 및 eval 보존. ZIP Markdown 13개 바이트 동일 보관 |
| 규칙 갱신 | AGENTS/CLAUDE/design/sprint/FEATURE_MAP/README/Mintlify overview를 최신 범위에 맞춤. 원문과 archive가 현행 지시로 적용되지 않도록 명시 |

삭제 직전 import inventory는 `.context/pre-pivot-imports.json`(198개 원본 코드/테스트 파일),
삭제 목록은 `.context/removed-files.txt`에 있다. 원본 코드는 Git `89c4596`에서 확인 가능하다.
삭제된 테스트는 위 제거 기능의 동작/소스 형태에 묶여 있었다. 현재 테스트는 계정 상태,
인증 어댑터 호출, 라우트, 보안/배포 설정, 브랜드 자산/토큰, 독립 GIWA 정의를 검증한다.

Privy의 전이 의존성에는 지갑/Solana 모듈이 남아 있다. 직접 의존성 제거가 SDK 내부
패키지 제거를 뜻하지 않는다. 앱은 이 기능을 호출하거나 이용 조건으로 두지 않는다.

## 검증

아래 결과는 로컬 코드 검증이다. 실제 인증 공급자 완료나 원격 배포 증거가 아니다.
최종 명령/화면 결과는 이 문서의 후속 검증 기록에 남긴다.

## 다음 작업 주의사항

- ZIP 02를 그대로 실행하지 않는다. SIWE/wallet-link, 19/성인인증, 유료상품/결제/
  환불/정산/신고관리 스키마와 어댑터를 제외하고 최소 users/works/chats/무료원장을 설계한다.
- `user.id`(Privy DID)를 서버 검증 토큰에서 얻어 계정을 매핑한다. 지금은 브라우저 세션
  표시만 있으며 DB users upsert, 자체 세션 API, 토큰 검증 서버는 없다.
- Privy dashboard Google/Email, allowed origins, 선택적 client ID 설정이 필요하다.
  Google 로그인과 이메일 OTP를 각각 실제 계정으로 수동 검증해야 한다.
  Google 계정에 별도 email 링크나 지갑 주소를 필수로 요구하지 않는다.
- 무료 크레딧 지급량/주기/차감량은 미결정. 서버 트랜잭션/멱등키/동시 차감/실패
  보상부터 정의한다. 원문의 유료 재화 가격을 기본값으로 사용하지 않는다.
- 기존 GIWA pack 주소는 새 ledger anchor 주소가 아니다. DB append-only 원장,
  checkpoint/proof/재시도 및 개인정보 경계부터 검증한다. 배포/실거래는 별도 승인.
- 새 채팅의 비공개 프롬프트/키워드북/숨김 시작 상황을 공개 API로 노출하지 않는다.
  콘텐츠 안전/입출력 제한은 후속 작업에서 정의하되 성인 콘텐츠를 열지 않는다.
- 로컬/브라우저 fixture는 테스트 파일에서만 사용했다. 앱에 mock 로그인 우회는 없다.
- `vercel.json`의 `git.deploymentEnabled=false`는 자동 배포를 끈다. 다음 실제 배포는
  사용자 승인 후 이 설정을 재검토한다. 기존 원격 서비스/cron은 이 PR만으로 중단되지 않는다.
- 기존 CSP/보안 헤더를 유지했고 불필요한 체인/지갑 endpoint만 제거했다. 새 API,
  스토리지 도입 시 필요한 origin만 추가하고 실제 OAuth/CSP 검증을 별도로 한다.

## 확인한 외부 문서

- [Privy 인증](https://docs.privy.io/authentication): Google/이메일 인증 범위 확인.
  현재 설치 SDK 타입으로 loginMethods와 createOnLogin off 구성을 확인했다.
- [Vercel Git 배포 설정](https://vercel.com/docs/project-configuration/git-configuration#git.deploymentenabled):
  자동 배포 비활성화 설정 확인. 배포는 실행하지 않았다.

## 최종 로컬 검증 기록

환경: Node 24.14.0 / npm 11.9.0, 현재 Conductor worktree와 브랜치 유지.

| 명령/검사 | 실제 결과 |
|---|---|
| 정리 전 `npm test` | 424 passed, 0 failed (기준 상태) |
| 새 계정 테스트 최초 실행 | privyConfig 미구현으로 실패 확인 후 구현 |
| `npm ci --no-audit --no-fund` | exit 0, 765 packages 설치. 기존 직접 의존성 제거 후 102 packages 감소 |
| `npm test` | 16 passed, 0 failed. 계정 상태 8, 경로/경계 5, 실제 SDK 어댑터 콜백 3 |
| `npm run build` | exit 0, TypeScript + Vite 빌드 성공 |
| `VITE_PRIVY_APP_ID=build-only-public-placeholder npm run build -- --outDir .context/configured-build` | exit 0. SDK 포함 구성도 타입/번들 성공. 가짜 public ID는 빌드만 사용, 공급자 호출 안 함 |
| `node .context/browser-check.mjs` | 1440×1000 / 390×844에서 홈·계정·404·새로고침·이동·Brand Kit 통과. overflow/page error/외부 요청 0 |
| `node .context/auth-browser-check.mjs` | 1440×1000 / 360×800에서 SDK 테스트 더블로 ready/login/error/Google·이메일 계정/logout pending/failure/retry/키보드 동작 통과. page error 0 |
| ZIP 바이트 비교 | 원본 Markdown 13/13 동일 |
| 과거 docs 바이트 비교 | 기존 tracked docs 63/63 archive에 동일 보존. 기존 root README도 ORIGINAL-README.md로 별도 보존 |
| 상대 import 검사 | src의 끊어진 상대 import 0 |
| 활성 기능 검색 | src에서 monad/vending/vault/pack-reveal/IrukaPackBatch 0. solana 한 곳은 SDK 자동 생성 off 설정 |
| `git diff --check` | 오류 0 |
| 비밀 패턴 검사 | 추가/현존 텍스트의 private key·API token 패턴 0. .env/.context는 커밋 대상 제외 |
| 수동 지침 평가 | evals/2026-10-14-pivot.md의 7개 입력에 대한 관찰 기록 완료 |
| 독립 읽기 전용 리뷰 | 루트 README 보존 누락 1건 발견 후 수정; 그 외 지적 없음 |

스크린샷은 `.context/pivot-desktop-home.png`, `pivot-mobile-account.png`,
`pivot-desktop-account-fixture.png`, `pivot-mobile-account-fixture.png` 및 brand/404
파일로 보관했다. fixture 스크린샷의 계정은 합성 테스트 데이터이며 실제 인증 증거가 아니다.

빌드에는 SDK 전이 패키지의 기존 Rollup annotation 경고가 있다. Privy 설정 포함
빌드는 SDK의 큰 chunk 경고(최대 app-main 약 2.32 MB, gzip 약 687 KB)도 있다.
이번 범위에서는 SDK 교체나 번들 구조 최적화를 추가하지 않았다.

실제 Google OAuth·메일 OTP 완료, 배포된 호스트의 CSP/직접 경로, 서버 인증,
무료 크레딧, GIWA 앵커링은 검증하지 않았다. 배포/유료 API/체인 쓰기 호출은 하지 않았다.

## 전달

구현 커밋: `d86bb2b`. 현재 브랜치 `starlash7/iruka-ai`에 push하고
[draft PR #8](https://github.com/starlash7/iruka/pull/8)을 `main` 대상으로 작성했다.
브랜치 변경/직접 main push/merge/배포는 하지 않았다. PR 생성 시 GitHub verify는
실행 중이었으며 원격 CI 상태는 PR에서 확인한다. 로컬 검증 결과와 구분한다.

## 후속 공통 기반

01 이후 Wave 02의 별도 인계는 [FOUNDATION_HANDOFF.md](FOUNDATION_HANDOFF.md)다.
위 01 검증 기록은 유지하며 현재 기능/제한과 구분한다.

## 2026-10-15 후속 통합 준비

기준 8ada036 및 Docs b7f750e 이후 원격 상태를 확인했다. A/B/D의 기존 PR
구현은 이미 통합된 조상 커밋이며 새 후속 handoff는 아직 원격에 없었다.
C 페르소나의 새 원격 PR도 확인되지 않았다. 로컬 진행 여부는 판단하지 않는다.

공통 규칙을 핑크·스토리 중심, 내부 mode 보존, 선택적 지갑, 구현된 테스트
크레딧, 앵커링 보류로 통일했다. 과거 Wave 지침은 역사 기록으로 표시했다.
파일 소유권·검증 순서는 ../../plans/integration-next.md,
기존 계약·요청 형식은 handoffs/integration.md,
미해결 입력은 ../../decisions/2026-10-15-integration.md에 기록했다.

이번 변경은 지침·인계 문서만 포함한다. 앱/API/DB/패키지와 A–D 소유 파일은
수정하지 않았고 Docs PR도 임의 병합하지 않았다. 메시지 자동 전달은 하지 않았다.
실제 OAuth/메일·원격 DB·유료 모델·운영 작업자·시각 흐름은 이번에 재검증하지
않았다. 이전 로컬 테스트 증거와 구분하며 후속 통합 시 다시 확인한다.

검증: npm test 128/128 통과, npm run build 통과, git diff --check 통과.
빌드는 기존 큰 번들/Privy 주석 경고, 테스트는 Vite HMR 포트 24678 사용 중
경고를 출력했으나 종료 코드는 0이었다. 다른 실행 프로세스는 중지하지 않았다.

## 2026-10-15 작품 중심 탐색 후속
8ada036 통합 기반의 홈/검색/태그/랭킹/상세 변경과 실제 API/fixture 검증을
[탐색 UI 인계](handoffs/discovery-ui.md)에 기록했다. 전체 테스트 134/134 및 빌드 통과.
## Docs 개편 — 2026-10-15

8ada036을 starlash7/iruka-docs에 fast-forward한 뒤 한국어 16페이지/5개 메뉴,
핑크 로고·모바일 표, 이전 URL 13개 전환 안내를 작성했다. 앱/공통 지침은 수정하지 않았다.
`npm test` 128/128, `npm run build`, Mintlify validate/broken-links 통과.
로컬 17경로 200, 13리디렉션 307, archive 404; desktop/390px 표·코드·메뉴 확인.
검색 결과는 CLI 로그인 요구로 미검증. SEO/robots 및 원격 공개/인증 설정을 변경하지 않았다.
상세 근거·제한: [DOCS_VERIFICATION.md](DOCS_VERIFICATION.md).
공통 규칙의 옛 블루/인증/지갑/크레딧 범위 모순은
[Docs 결정 기록](../../decisions/2026-10-15-docs.md)에 통합 담당용으로 남겼다.

Docs 구현 커밋 `ff07fb3`, [Draft PR #15](https://github.com/starlash7/iruka/pull/15).
대상은 `starlash7/clone-repo`이며 현재 체크아웃은 `starlash7/iruka-docs`다.

후속 승인으로 스토리 중심 소개·통합 작품 탐색·캐릭터 대화 지원 방향을 Docs에 반영했다.
`캐릭터·스토리 모드` 메뉴를 `캐릭터와 이야기`로 교체하고 이전 주소를 리디렉션한다.
앱의 모드 필터/선택/발행 조건은 현재 동작으로 남기고 화면 정리는 계획으로 구분했다.
재검증: 테스트 128/128, 빌드, Mintlify validate/broken-links 통과. 시각 검증은 재실행하지 않음.

## 2026-10-15 A–D 후속 구현 통합

현재 브랜치 starlash7/clone-repo 유지. A 4fb5391, B a1eca8d, C ecba192,
D 7a0ae58, Docs b7f750e를 검토하고 순차 통합했다. HANDOFF 충돌은 양쪽
기록을 보존해 해결했다. 각 담당의 초기 제한 사항은 당시 기록으로 남긴다.

공통 연결 수정:
- 페르소나 PATCH/DELETE, 0004 soft-delete 마이그레이션, 소유권 검사.
  삭제한 페르소나는 새 선택에서 제외하고 기존 대화의 스냅샷은 유지한다.
- ProductOptions 이미지 저장소 주입, 로컬 dev 파일 저장, Reader/Studio
  인증 이미지 로더 통일. 토큰을 외부 이미지 주소로 전송하지 않는다.
- 등록된 내부 이미지가 대화 후처리에서 누락되던 경로를 허용 목록으로 수정.
- 만료 요청 복구와 요약 호출 분리. runSummaries 기본 off, 유료 호출 미실행.
- 390px 공통 헤더 줄바꿈 수정. Docs의 페르소나·제작·이미지·모델 상태 갱신.

검증: npm test 169 passed / 0 failed, npm run build 종료 0,
git diff --check 통과. 기존 Privy 주석/약 2.43MB app-main 번들 경고는 남는다.
Docs 메뉴 16개, 리디렉션 14개, 내부 링크 목적지 정적 검사 통과.
이번 문구 변경 후 Mintlify 프리뷰·원격 검색·공개 제한은 재검증하지 않았다.

브라우저 390/768/1440: 탐색·상세·랭킹·제작 경로·대화 시작·응답·새로고침
복구에서 가로 넘침과 런타임 오류 없음. .context/integration-*.png에 기록.
인증은 테스트 전송/검증기이며 실제 Google/OTP 완료 증거가 아니다.
추가 브라우저 검사도 같은 세 화면 너비에서 통과: 실제 로컬 API를 통한
페르소나 생성·수정·선택·삭제, 삭제 후 기존 대화 열기, 인증 PNG를 응답 직후와
새로고침 후 표시. 모달 키보드 이동 확인. 최초 하네스는 getByLabel의 정확한
일치 선택자로 타임아웃했으나 접근성 트리의 이름은 정상임을 확인하고 역할 기반
선택자로 수정했다. 기능 실패로 숨기거나 실제 OAuth로 표시하지 않는다.

실제 OAuth/메일/지갑 승인, 원격 PostgreSQL, 유료 모델 품질·안전 정책,
원격 이미지 저장소, 배포 API·상시 작업자는 미검증 또는 미설정이다.
운영 결정 목록은 decisions/2026-10-15-integration.md에 기록했다.
main push/merge·배포·유료 호출 없음. 다른 작업자 workspace는 편집하지 않았다.
Docs 담당 반영 목록은 handoffs/integration.md와 plans/integration-next.md에
남겼으며 별도 메시지가 전달됐다고 가정하지 않는다.

## 2026-10-15 버튼·푸터 후속

사용자 요청으로 핑크 버튼의 흰색 상단 경계와 중복 호버 그림자를 정리했다.
기본·호버에서 같은 1px 테두리를 유지하고 키보드 포커스와 disabled 상태를 보존한다.
과거 89c4596의 푸터 로고/링크 열/파도 구도를 복원하되 현재 서비스 링크만 사용한다.
파도 SVG의 기존 경로는 유지하고 색상만 #F2B8CE로 변경했다. 채팅에는 넣지 않는다.

검증: npm test 170/170, npm run build 종료 0, git diff --check 통과.
390/768/1440px에서 버튼 기본·hover·focus, reduced-motion, 푸터 1개,
가로 넘침 없음·브라우저 오류 없음 확인. .context/footer-*.png와 buttons-hover-*.png.
기존 Privy 번들 경고는 남아 있다. 로그인·API·배포 설정은 변경하지 않았다.

## 2026-10-15 계정·제작 공통 레이아웃

App의 이전 app-shell 분기를 ReaderLayout으로 연결했다. 계정, 스튜디오/편집,
페르소나, 크레딧, 404에서도 기존 탐색 헤더·최근 대화 사이드바·핑크 푸터를 사용한다.
페이지 외곽의 중복 카드 테두리와 여백만 제거했으며 내부 기능과 인증은 변경하지 않았다.
대화방의 전용 헤더 및 푸터 없는 구성은 유지한다.

회귀 테스트에서 기존 분기의 실패를 확인한 뒤 수정했다. 전체 라우트의 단일 main,
단일 사이드바, 헤더/푸터 수를 검증했다. npm test 170/170, npm run build 종료 0,
git diff --check 통과. 기존 번들 크기 경고 유지. 사용자의 브라우저 탭 전환과
검수 조작이 겹쳐 desktop/mobile 시각·키보드 검수는 미완료다. 배포하지 않았다.

## 2026-10-15 마이페이지 프로필

- /account에 프로필 이미지·닉네임·자기소개 편집, 저장·취소, 사진 삭제를 추가했다.
- 내 작품/최근 대화/페르소나/크레딧 링크와 기존 계정·지갑 설정을 분리했다.
- GET/PUT /api/me/profile은 검증된 본인만 접근하며 0005 user_profiles에 저장한다.
  Google 정보나 이메일은 프로필 데이터로 복사하지 않는다. 공개 프로필 API는 없다.
- 사진은 브라우저에서 중앙 정사각형 512px로 변환하고 서버에서 PNG를 재검증한다.
  저장 전 이미지는 미리보기일 뿐이며 취소 시 서버에 반영되지 않는다.
- 헤더는 서버 프로필을 조회하며 저장 이벤트 후 갱신한다. 브라우저 영구 캐시 없음.
- 로컬 API 8791을 기존 DB 경로 그대로 재시작해 마이그레이션을 적용했다.

검증: 신규 API 회귀 테스트의 404 실패를 확인한 뒤 구현했다. 본인 저장/재조회,
계정 격리, 미인증 401, 필드 제한, PNG 저장/삭제·위조/크기 초과 거부, SSR 편집
폼/헤더 검사 포함 npm test 172/172 통과. npm run build 종료 0; 기존 번들 경고 유지.
실제 Privy 로그인 상태의 프로필 저장/재로그인, 업로드·취소·키보드 및
390/768/1440px 시각 검수는 공유 브라우저 사용과 겹쳐 미완료다.
원격 DB 마이그레이션·배포·유료 호출은 하지 않았다.

## 2026-10-30 Reader UX first batch

- Approved reference audit: plans/reader-ux-reference-audit.md. Existing white/pink
  tokens and shared navigation retained; no competitor assets copied.
- Discovery adds filter reset, noninteractive loading grid and an unavailable-work
  explanation. Mobile work detail uses a single column.
- Chat explains pending/model/credit conditions, aligns regenerate eligibility with
  the handler and displays edit/delete failures inside the active modal.
- Studio exposes missing publish requirements and distinguishes the current draft
  from the confirmed public version; public-work link uses the published work ID.
- No API contracts, database, payment, model policy or authentication bypass changed.

Verification: focused tests first failed for the missing behavior, then passed.
Final integrated npm test: 192/192; npm run build: exit 0 with existing chunk-size
warning; git diff --check passed. Review caught section-only readiness focus;
exact-control focus was added, tested and re-reviewed. Its authenticated browser
flow remains unverified.
Ego lite TaskSpace 32 used isolated local fixture components for search, chat model
unavailability and publication notices at 390/768/1440px: no horizontal overflow.
Search reset keyboard focus was visible. Screenshots/harness stay in .context only.
The fixture is not proof of live auth, model calls, save/publish or credit settlement.

Local app: http://localhost:5173, API 8791 with the existing integration-dev-db.
Actual signed-in API requests currently report missing server Privy configuration;
real OAuth-to-publish/chat remains unverified. No credentials were changed or bypassed.
Deferred contract/identity work is listed in plans/reader-ux-first-batch.md.

## 2026-10-30 Visible homepage redesign

- Home now uses a compact sidebar/header search, original Iruka image masthead,
  discovery/ranking/search navigation, real work tags and a responsive poster grid.
  White/pink controls, account actions and the existing footer are preserved.
- Manual featured slides accept published works with usable covers only. The
  current local database contains two published works with no covers: explicit
  missing-cover tiles appear instead of fabricated artwork or activity.
- Public list/ranking/detail reads no longer request a private access token.
  All private calls still require authentication; server public projections and
  unpublished-work isolation are covered by regression tests.
- npm test: 202/202 passed. npm run build: exit 0, existing bundle-size warning.
  git diff --check passed. Independent static review reported no scoped findings.
- Ego lite TaskSpace 35 checked the actual localhost:5173 homepage at
  390/768/1440/2560px without horizontal overflow, visible keyboard search focus,
  and a real Korean search returning the matching work. Screenshots are in
  .context/home-final-*.png. Multi-slide behavior is component-tested only because
  the actual works have no covers. No autoplay or motion was added.
- Local private recent chats still report missing server Privy configuration.
  Real OAuth-to-chat/publish is not validated; no authentication bypass, remote
  service changes, paid calls, main merge or deployment were performed.

## 2026-10-31 Account and work-detail reference follow-up

- Baseline is integration `061c630` from PR #14. The new feature branch retains
  that complete story-platform history; `main` remains the historical TCG tree.
- Reused the approved reference audit and read-only signed-in Crack profile/menu
  and Uummai menu observations. No competitor account data, artwork or content
  was copied; restricted detail views were not unlocked or configured.
- My Page uses a compact responsive profile card and activity destinations.
  Profile failures retain those links, and a refresh failure retains the same
  user's last loaded profile. Login identity/settings are separated from the
  saved profile; optional wallets and conversation library remain available.
- Work detail adds anchors for existing public sections and one mobile start
  action above the navigation. Missing artwork remains explicitly absent.
- Start options wait for authenticated readiness. Login cancellation/retry
  returns to the same sheet/work without header-triggered reloads. The native
  dialog releases its top layer for the SDK portal; closing the sheet restores
  focus to the original start button. Existing development fixtures stay explicit.

Verification (Node 24.14.0 via `npm exec --package=node@24.14.0`):

- Existing-lockfile `npm ci --no-audit --no-fund`: passed.
- Baseline `npm test`: 202/202. New focused tests first failed in five cases.
- Final `npm test`: 208 passed, 0 failed/skipped; `npm run build`: exit 0.
  Existing Privy annotation and large-chunk warnings remain. `git diff --check`
  passed. No dependency, API, database or model-policy changes.
- Ego lite TaskSpace 4: original components with a labelled local auth/HTTP
  fixture, profile and work detail at 390/768/1440px, measured horizontal
  overflow 0 and no mobile CTA/navigation overlap. Screenshots inspected.
- Profile: failed save retains draft, successful save updates header, refresh
  error retains saved data, initial error retains four activity destinations,
  retry recovers, cancel restores focus. Long 30-character nickname and long
  bio fit at 390px; editor actions are usable after normal vertical scrolling.
- Start sheet: no private option reads before login/cancellation; SDK portal
  is not blocked by a native modal; retry and success keep the same page/work.
  390px options dialog has no horizontal overflow; Tab stays inside and Escape
  restores the start button. Fixture pages reported no runtime errors.

Private artifacts: `.context/reader-{mypage,work}-{390,768,1440}.png`,
`reader-start-390.png`, `reader-profile-editor-390.png`, and
`reader-account-work-{tests,build}-final.log`. The screenshots use synthetic data
and say so. These checks do not prove real Privy OAuth/OTP, production profile
persistence, remote DB, model output or paid credit settlement. No production
authentication bypass, paid call, chain transaction, main merge or deployment.
## 2026-10-31 Reader library, search and image-code expansion

- Work detail separates Continue (latest activity for that exact work) and New
  conversation. New retains opening/persona/model selection. Auth restoration and
  signed-out states do not mount private conversation/favorite requests.
- Private library supports custom titles, 50-row pages, folder create/rename/delete,
  moving chats and confirmed chat deletion. Deleting a folder keeps its chats
  unfiled. Mutations preserve the pinned version/persona; pending chat deletion
  remains 409. Errors stay in the dialog, retry preserves input, and Escape/save
  restore useful keyboard focus.
- Search highlights literal text on the selected loaded message path, navigates
  matching messages and never generates a response. Font size (14–24px) and line
  spacing are bounded device preferences; denied storage remains usable.
- Home/search/tag retain filters while loading another 60 works, prevent duplicate
  requests/rows, ignore obsolete responses, and keep previous cards on failure.
  Private favorites have an authenticated `/favorites` destination from My Page
  and the profile menu. Only publicly published works appear there.
- `showCreator` is an explicit Studio publishing choice, false for existing works.
  Public DTOs expose the saved nickname only when opted in; private profile fields
  and hidden prompts remain excluded.
- Named image-code slots now upload/replace real files and bind the returned
  immutable asset revision to the draft. Existing published and pinned images
  survive replacements; hash-equal retries reuse the latest asset. Different
  stale uploads fail with 409. The existing 200-record work cap includes history.
- Additive migrations: foundation `0006_reader_library.sql`, Studio
  `0201_asset_versions.sql`. Product migrations, clients, explicit development
  adapters, feature/API map and user documentation are updated together.

Verification (Node 24.14.0 through npm exec):

- Final `npm test`: **216 passed, 0 failed/skipped**. `npm run build`: **exit 0**;
  existing Privy annotation and large-chunk warnings remain. `git diff --check`
  passed. Logs: `.context/reader-expansion-{tests,build}-final.log`.
- Real local handler/DB tests cover anonymous/cross-user rejection, invalid names,
  folder uniqueness/moves/deletion, recent activity and exact-work filtering,
  pending deletion, opt-in/withdrawn author disclosure, private/hidden favorites,
  60+ paging, repeatable upgrades and immutable code image access/replacement.
  UI regressions cover literal/XSS-safe search, reading/storage denial, dialogs,
  private-client tokens and auth readiness. Earlier failures from migration counts
  and an incorrect test MIME assumption were corrected before the final run.
- Ego lite TaskSpace 17 used the real product handlers and local PGlite database,
  injected test authentication and the deterministic local model. Six routes at
  **390/768/1440px** had no horizontal overflow or runtime errors; work CTAs did
  not overlap mobile navigation. Responsive measurements are in
  `.context/reader-expansion-responsive.json`.
- Browser: rename/move/folder CRUD and confirmed chat deletion; failed save retains
  input and retry succeeds; folder deletion preserves conversations; Escape and
  successful save restore focus. Signed-out work detail issued only its public
  work read, and signed-out chat did not mount the private chat room.
- Search moved between two matching messages, font/spacing survived reload, and
  the mobile composer stayed within the 844px viewport. Discovery retained 60
  cards after an injected failure and reached **65 distinct cards** on retry.
  Saved works displayed the opted-in creator name. Code upload/replacement saved
  immutable revisions while retaining the original published version; interrupted
  upload retains its local file/preview for retry.

Inspected private screenshots: `.context/reader-library-{desktop,mobile}.png`,
`reader-work-continue-mobile.png`, `reader-search-mobile.png`,
`reader-code-upload-{desktop,mobile}.png`, `reader-favorites-desktop.png`.
These contain synthetic local data and approved original Iruka image assets.
Real Privy OAuth/OTP, remote PostgreSQL, production image storage and live LLM
generation remain unverified. No paid provider call, chain transaction,
deployment or main merge was performed. Draft delivery remains PR #19 against
the story-platform integration branch, since `main` is still the historical tree.
## 2026-10-31 Visual story experience and original artwork

User explicitly excluded actual DB and real login verification. This change uses
automatic isolated tests and a labelled, in-memory HTTP/auth UI fixture. No user
DB, real OAuth flow, remote storage, paid model or deployment was exercised.

- Reviewed the reference audit and original `starlash7/crack` artwork at
  `58545d092ffef20d1b44e6d8ada6ee5e001fd310`. Deliver 24 byte-identical public
  covers/portraits/intro/opening files and five adopted private Chaeri reactions.
  Manifests record source, role, bytes and SHA-256. Unadopted cards/reactions and
  spoiler scenes are excluded. Evidence: seed/ARTWORK.md and the archived
  reference selection record. Source worktrees were not changed.
- Public introduction/gallery/opening artwork, public character captions, safe
  inline image-code rendering and accessible enlargement are shared with Studio
  preview. A duplicate opening thumbnail is suppressed when the same image is
  already present inline. Public image reads do not depend on login tokens.
- Discovery preserves full poster artwork with a separate featured poster and
  ambient banner. Detail tags collapse after four items, and long copy wraps.
- Chat uses portraits from its pinned work version, image enlargement and parsed
  status cards with a complete text fallback. Private reactions stay outside
  public/ and pass normal media authorization. Hash-verified bundled WebP is
  served as image/webp; ordinary uploads retain normalized PNG validation.
- Studio list has cover thumbnails, published/draft filters, name search and
  modification dates. Removed the duplicate full account/wallet screen from its
  toolbar. Compact readiness/sign-in guidance prevents mounting private editor
  state for restoring or anonymous sessions; optional wallet/account destinations
  remain intact. This is code/fixture coverage, not actual login verification.
- Image management includes thumbnail overview, code/description search, usage
  filters, per-file batch progress/retry (20 files), public gallery selection,
  cover/character/opening placement and gallery ordering/descriptions/removal.
  Replacement updates current draft references while preserving earlier versions.
  Hidden tabs/offscreen private images defer their network requests.
- JSON presentation contracts are validated/projected and owned-image bindings
  checked. No new DB schema migration or package dependency is required.
- Existing seed work.json files/hashes are untouched. The explicit local
  `scripts/seed/attach-artwork.ts --development` command refuses source mismatch
  or edited drafts, adds new publications and is repeatable. It was tested only
  against temporary test databases, and was **not run on the user's actual DB**.

Verification:

- Node 24.14.0: npm test **227 passed, 0 failed/skipped**; npm run build **exit 0**.
  Existing Privy annotation and chunk-size warnings remain. git diff --check
  passed. Final logs: `.context/visual-story-{tests,build}-final.log`.
- New regressions cover all 29 hashes, safe public projection, private WebP MIME
  and pinned access, seed attachment/rollback/idempotency, XSS-safe previews,
  name-matched portraits, structured/text status, current-draft asset rebinding,
  compact Studio auth gating and tokenless public image reads.
- Final static-path review reproduced a Vite development-server bypass: raw seed
  images/manuscripts were directly served. Vite fs.deny now blocks seed/** while
  preserving its default secret/key exclusions. A red/green HTTP regression
  verifies public artwork 200 and both raw and /@fs private seed paths 403.
- Ego lite TaskSpace 19: six routes at **390/768/1440px**, 18 measurements, zero
  horizontal overflow, CTA/nav overlap or runtime errors. Mobile composer bottom
  was 844px at an 844px viewport. See visual-story-responsive.json in .context.
- Native enlargement and original-size scrolling stayed within the page;
  Escape restored the triggering image control. Work detail had six gallery
  images/six portraits and one opening image, without raw image codes or private
  reaction codes. The 24 public files and five private reactions were inspected.
- Studio filters/search, two-file batch success, injected second-file failure and
  failed-file-only retry, gallery/intro selection and image replacement succeeded.
  Replacement retained the earlier published gallery. Hidden editor tabs issued
  zero private-media requests; selecting a reaction loaded its 1536x1024 WebP.
- Screenshots inspected under .context: visual-home-{390,1440}, visual-work-
  {390,1440}, visual-gallery-390, visual-chat-{390,1440}, visual-studio-list-1440,
  visual-studio-images-{390,1440}, visual-original-assets-review and
  visual-private-reactions-1440 (all .png). They use approved story art and an
  explicitly synthetic session. No competitor account screenshot is delivered.

Separate later planning items remain the drama/video/BGM engine and executable
creator JSX/HTML. This delivery completes the normal reader/creator visual flow;
it does not claim those separate runtime systems or operational readiness.
