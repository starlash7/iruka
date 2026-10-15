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
