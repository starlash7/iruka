# GASOK Phase 3 합격 이후 내부 정리

> 내부 확인용 문서입니다. 공식 GASOK 페이지와 Iruka 저장소·GIWA Sepolia 기록을 대조해 작성했습니다.
>
> 최종 확인일: 2026-08-25
>
> 공식 기준: [GIWA GASOK](https://giwa.io/gasok)

> **과거 기준 기록:** 아래 프로그램 일정과 지원금 설명은 2026-08-25 당시
> 공개 페이지를 정리한 내용입니다. 2026-09-03 개별 안내 이후의 일정과
> 9월 5일 KBW Showcase 제출 기록은
> [최신 내부 정리](docs/internal/kbw-showcase-2026.md)를 우선 확인하세요.

## 1. 한 줄 결론

Iruka는 내부적으로 GASOK 가속 3단계 합격 상태이며, 다음 목표는 **실제 사용자 지표를 만들고, 테스트넷 MVP를 프라이빗 메인넷 출시가 가능한 제품으로 전환하는 것**입니다.

공식 페이지에서 Phase 4는 `Growth & Adoption`으로 정의되어 있습니다. 다만 공개 페이지에는 개인별 합격 결과나 Phase 4 진입 확정 공지가 없으므로, 내부 합격 안내와 GIWA 담당자 확인을 최종 근거로 보관해야 합니다.

## 2. GIWA 공식 프로그램 구조

공식 사이트의 현재 로드맵은 아래 순서입니다.

| 단계 | 공식 명칭 | 공식 기간·상태 | 핵심 목표 |
| --- | --- | --- | --- |
| Phase 1 | Screening | 2026년 5월 | GIWA 적합성, 독창성, 실행력, 시장성, 팀 역량 검증 |
| Phase 2 | MVP Build | 2026년 6~7월 | 테스트넷 배포와 기술 실행력 검증 |
| Phase 3 | Productize | 2026년 8~9월 | 테스트넷 사용자 지표와 프라이빗 메인넷 배포 |
| Demo Day | Demo Day @ KBW | 2026년 10월 | GIWA 팀·VC·업계 전문가 앞 제품 피칭 |
| Phase 4 | Growth & Adoption | 지속 진행 | 트랜잭션·TVL 등 KPI 마일스톤 달성과 GIWA 생태계 확장 |

공식 페이지는 Phase 1과 Phase 2가 통합되었다고 안내하고 있습니다. 따라서 외부 문서에서는 별도 심사 단계로 과도하게 설명하기보다, `Screening → MVP Build → Productize → Demo Day → Growth` 흐름으로 이해하는 편이 정확합니다.

## 3. Phase 3에서 평가된 것

GIWA가 공개한 Phase 3 평가 기준은 이전 단계의 제품·기술 실행력에 더해 다음 세 가지입니다.

1. **UI/UX 완성도**: 실제 사용자가 막힘 없이 사용할 수 있는 경험
2. **초기 사용자 확보**: 초기 사용자 확보 가능성을 보여주는 근거
3. **장기 지속 가능성**: 단기 데모가 아니라 오래 운영될 수 있는 구조

Iruka의 Phase 3 이후 설명은 단순히 “컨트랙트를 배포했다”가 아니라, 아래 세 가지를 함께 증명하는 방향이어야 합니다.

- 팬 컬렉터가 3초 안에 제품의 핵심 흐름을 이해한다.
- 로그인부터 Pull, Reveal, Inventory 확인까지 실제로 완료할 수 있다.
- 테스트넷 트랜잭션 기록과 제품 화면이 서로 일치하고, 다음 단계의 실물 운영으로 확장할 수 있다.

### Phase 3 공식 혜택과 지원

GIWA 공식 페이지에 공개된 Phase 3 지원 항목은 다음과 같습니다.

| 지원 항목 | Iruka에 의미하는 것 | 확인할 점 |
| --- | --- | --- |
| Advanced Builder Activity Package | 제품화 단계에 필요한 개발 리소스 패키지 | 제공 도구·한도·사용 기간 |
| GIWA 팀 지원 | 메인넷 준비와 GIWA 생태계 연동에 대한 협의 창구 | 담당자와 지원 범위 |
| 업계 전문가 자문 | 제품·시장·운영에 대한 전문가 피드백 | 자문 주제와 횟수 |
| 서울 내 사무 공간 | 필요 시 대면 협업 공간 | 이용 가능 기간과 조건 |
| PR·언론/미디어 지원 | 제품화 이후 공개·홍보 기회 | 공개 시점과 콘텐츠 승인 절차 |
| KBW Demo Day 참가 기회 | 2026년 10월 Korea Blockchain Week 피칭 기회 | 참가 확정 여부와 발표 조건 |

GASOK FAQ는 Builder Activity Package에 클라우드 크레딧, RPC 액세스,
스마트 컨트랙트 감사 지원, AI 도구 등이 포함될 수 있으며 단계에 따라
`Advanced → Full`로 확대된다고 설명합니다. 패키지의 개별 구성은 팀별
안내가 필요하므로, 현재 Iruka가 모두 제공받았다고 표현하지 않습니다.

공식 안내상 프로그램은 기본 원격 진행이며, Phase 3 팀은 필요 시 서울
사무 공간을 이용할 수 있고, Demo Day는 KBW 현장에서 오프라인으로
진행됩니다.

## 4. Iruka 현재 상태

아래는 현재 저장소 Docs와 GIWA Sepolia 기록을 기준으로 한 상태입니다.

### Live

- `playiruka.space` 웹 애플리케이션
- Privy 기반 이메일·Google·지원 EVM 지갑 로그인
- 계정별 Iruka embedded wallet과 외부 EVM wallet 기반 자금 이동 UX
- GIWA Sepolia `IrukaPackBatch` 계약
- 검증된 소스와 전용 Keeper operator
- Debut 테스트 배치의 공급량·odds·draw seed commitment
- `requestPull → Keeper fulfillment → Reveal → Inventory` 흐름
- 브라우저를 닫거나 결과가 지연되어도 같은 request를 복구하는 Keeper recovery
- 실제 GIWA Sepolia Pull request·fulfillment receipt 2쌍

### In validation

- 실제 K-pop 실물 카드의 확보·소싱 기록
- 카드별 진품 확인, 상태 기록, 촬영, grading 수용 기준
- 실물 intake와 보관 위치를 Inventory record와 연결하는 운영
- 완료 거래 기반 가격 데이터와 FMV 산정 방식
- 출시 전 동의 기반 폐쇄형 사용자 테스트와 퍼널 측정

### Planned

- GIWA 메인넷 프라이빗 배포
- 외부 감사와 production randomness 검토
- 적격 실물 카드와 일대일로 연결되는 ERC-721 ownership
- canonical USDC 결제와 Marketplace 정산
- 영구 event indexer와 reconciliation job
- 물리적 Redemption·배송·고객지원·소비자보호 운영
- 정식 라이선스 IP Drop

테스트넷 Pull 성공은 실물 카드의 보관, 상업 결제, NFT ownership, 배송을 증명하지 않습니다. 이 네 가지는 Phase 4에서 반드시 별도 운영 증거를 만들어야 합니다.

## 5. GIWA가 공개한 Phase 4

공식 페이지의 Phase 4 이름은 **Growth & Adoption**이며, 목표는 트랜잭션
목표와 TVL 목표 같은 KPI 마일스톤 달성입니다. 공개된 지원 항목은 아래와
같습니다.

| 지원 항목 | 공식 페이지의 의미 | Iruka가 확인할 점 |
| --- | --- | --- |
| Demo Day 우승팀 지원금 2만 달러 | Demo Day 우승팀에 제공되는 초기 그랜트 | 우승 조건, 지급 시점, 세금 |
| KPI 기반 추가 지원금 최대 8만 달러 | 트랜잭션 볼륨·TVL·유저 확보 등 KPI 달성에 따른 보너스 그랜트 | Iruka의 KPI 정의, 최소 기준, 측정 기간 |
| Full Builder Activity Package | Phase 3보다 확대된 개발 리소스 패키지 | 클라우드·RPC·감사·AI 도구의 실제 한도 |
| GIWA 팀 24시간 핫라인 | 성장·운영 단계의 GIWA 지원 채널 | 운영 시간, 응답 범위, 긴급 장애 대응 방식 |
| GIWA Wallet 인앱 탑재 기회 | GIWA Wallet 안에서 제품을 노출할 수 있는 기회 | 심사 기준, 연동 API, 출시 일정 |
| 업계 전문가·VC 소개 | 사업 확장과 투자·파트너십 연결 기회 | 소개 대상, 시점, 선발·참여 조건 |

Phase 4의 혜택은 자동 지급이나 무조건적인 보장이 아니라, 프로그램
조건과 KPI 달성 여부에 따라 적용되는 지원입니다. 공식 FAQ는 Demo Day
우승팀의 2만 달러 초기 그랜트와 KPI 기반 최대 8만 달러 추가 보너스를
설명하지만, 중도 하차·최소 KPI 미달성 시 지급이 제한될 수 있고 세금이
발생할 수 있다고 안내합니다.

따라서 Iruka 내부 문서와 피치 자료에서는 `최대 10만 달러 혜택`을 확정
수익이나 투자금으로 쓰지 않고, **KPI 달성 시 접근 가능한 프로그램 지원
범위**로 표현합니다. 지급 조건, KPI 최소값, 측정 기간, 팀별 적용 여부와
세무·운영 조건은 GIWA 선발 담당자에게 별도 확인합니다.

## 6. Phase 4에서 Iruka가 만들어야 할 증거

### 6.1 제품 지표

첫 폐쇄형 베타부터 아래 지표를 같은 정의로 기록합니다.

| 지표 | 정의 | 기록 시점 |
| --- | --- | --- |
| Wallet onboarding completion | 로그인 시작 후 Iruka Wallet이 준비된 사용자 비율 | 세션 종료 또는 완료 |
| First Pull conversion | 로그인 완료 사용자 중 첫 Pull까지 도달한 비율 | 첫 Pull request 전송 시점 |
| Transaction success rate | Pull request가 성공적으로 확정된 비율 | receipt 확인 시점 |
| Fulfillment P50/P95 | Pull request부터 fulfillment 확정까지 걸린 시간 | `PullFulfilled` 수신 시점 |
| Reveal completion | fulfillment 후 결과 화면까지 도달한 비율 | Reveal summary 진입 시점 |
| Inventory recovery rate | 새로고침·재접속 후 결과 Inventory가 복구된 비율 | 계정 재조회 시점 |
| D7 retention | 첫 사용 후 7일 안에 다시 방문한 사용자 비율 | 첫 사용일 기준 7일 |

초기에는 숫자를 크게 보이게 만드는 것보다, 이벤트 정의와 분모를 고정하고 세션 단위로 재현 가능한 로그를 남기는 것이 중요합니다.

### 6.2 온체인 지표

GIWA와 KPI를 협의할 때는 다음을 분리해 제출합니다.

- Pull request 수
- 성공 fulfillment 수와 성공률
- request-to-fulfillment P50/P95
- 실패·재시도·중복 방지 건수
- 활성 지갑 수와 재방문 지갑 수
- 배치별 잔여 공급량

현재 테스트넷 ETH Pull을 상업 매출이나 TVL로 합산하면 안 됩니다. 실물 custody와 production ownership이 없는 단계에서 임의의 TVL을 만들지 말고, GIWA가 정의한 TVL 산정 범위를 먼저 확인해야 합니다.

### 6.3 신뢰·운영 지표

실물 운영이 시작되면 기술 지표와 별도로 아래 기록이 필요합니다.

- 실제 물리적 재고 수와 `inventoryId` 대조율
- intake부터 verification 완료까지의 시간
- 검증 실패·보류·재검수 비율
- 보관 기록과 Inventory record의 reconciliation 결과
- Marketplace listing과 Redemption lock의 충돌 여부
- 배송 요청·delist·lock·fulfillment 기록

## 7. Phase 4 진입 전 출시 게이트

### Product

- 첫 화면에서 Vending → Reveal → Vault의 역할이 즉시 이해된다.
- 로그인 전후 Pull 상태와 지갑 상태가 명확하게 표시된다.
- Reveal 실패·지연·새로고침 복구가 사용자에게 막힘 없이 처리된다.
- 영어 judging surface의 문구와 모바일 레이아웃이 안정적이다.

### Technology

- GIWA 메인넷 배포 방식과 canonical network configuration 확정
- production randomness 방식과 계약 감사 범위 확정
- ERC-721 ownership·USDC settlement·Marketplace contract 설계 검토
- 이벤트 indexer, reconciliation, alerting, pause와 recovery runbook 구축
- deployer·Keeper·admin key 분리와 운영 권한 검토

### Physical operations

- 실제 카드 소싱과 권리 확인
- 카드별 앞·뒤 이미지, 상태, 인증·grading 정보 기록
- intake·authentication·custody 상태 변경 이력
- 배송·반품·분쟁·개인정보 처리 정책
- 검증되지 않은 카드나 가상 inventory가 `Vaulted`로 보이지 않도록 차단

### Growth

- 동의 기반 폐쇄형 베타 모집
- funnel·cohort·D7 대시보드
- 첫 Pull까지의 이탈 구간 분석
- 사용자 인터뷰와 반복 개선 기록
- 카테고리 확장 전 K-pop 첫 운영 루프의 재현성 확보

## 8. GIWA에 확인할 질문

Phase 4를 실제 실행 단계로 전환하기 전에 GIWA 담당자에게 아래를 확인합니다.

1. Phase 3 합격팀의 Phase 4 진입 조건과 공식 일정은 무엇인가?
2. KPI의 최소 기준과 측정 기간은 팀별로 어떻게 정의되는가?
3. 소비자 컬렉터블 서비스에서 `TVL`은 custody value, onchain ownership value, settlement volume 중 무엇을 의미하는가?
4. GIWA Wallet 인앱 탑재의 기술·제품 심사 기준과 제공 일정은 무엇인가?
5. 프라이빗 메인넷 배포 시 RPC, indexer, gas sponsorship, contract review 지원 범위는 어디까지인가?
6. Builder Activity Package와 보너스 그랜트의 실제 신청·지급·세무 조건은 무엇인가?
7. 10월 Demo Day의 참가 조건과 Phase 4 KPI 평가와의 관계는 무엇인가?

## 9. 내부 실행 순서

### 지금 바로

- Phase 3 합격 안내와 담당자 확인을 내부 증거로 보관
- GIWA에 Phase 4 KPI·TVL·메인넷 조건 문의
- 테스트넷 앱에 funnel 이벤트와 fulfillment latency 측정 추가
- 폐쇄형 베타의 동의 문구와 테스트 시나리오 확정

### 메인넷 전

- 실제 실물 재고와 권리·소싱 기록 확정
- custody와 grading 운영을 작은 파일럿으로 검증
- production contract·USDC·ownership·indexer 설계를 외부 검토
- 보안 감사와 운영 장애 대응 절차 완료

### Phase 4 성장 단계

- 공개 가능한 지표만 주기적으로 공유
- 사용자의 첫 Pull과 재방문을 개선
- K-pop 운영 루프가 안정된 뒤 트로트·치어리더·스포츠 카테고리 검토
- 라이선스가 없는 이미지를 새로 제작하거나 상업 IP Drop으로 오해받을 수 있는 표현을 사용하지 않음

## 10. 공식 페이지와 내부 문서의 차이

| 항목 | 공식 페이지에서 확인되는 내용 | 내부적으로 필요한 다음 확인 |
| --- | --- | --- |
| Phase 3 | Productize, 테스트넷 사용자 지표, 프라이빗 메인넷 배포 | Iruka의 Phase 3 합격 통지와 다음 평가 일정 |
| Phase 4 | Growth & Adoption, KPI·TVL 마일스톤 | Iruka에 적용되는 KPI·TVL 정의와 최소 기준 |
| 그랜트 | Demo Day 2만 달러, KPI 기반 최대 8만 달러 | 지급 조건, 세금, 중도 이탈·미달성 조건 |
| GIWA Wallet | 인앱 탑재 기회 | 기술 심사, UX 요구사항, 실제 탑재 시점 |
| 일정 | Phase 3 Aug-Sep, Demo Day Oct, Phase 4 ongoing | 합격팀별 실제 일정과 운영 채널 |
| 신청 안내 | 공개 페이지에 2026년 7월 31일 신청 마감 문구가 남아 있음 | 페이지가 개인별 선발 상태를 반영하는지 GIWA에 확인 |

## 11. Source

- [GIWA GASOK 공식 페이지](https://giwa.io/gasok)
- [Iruka Docs: Overview](https://docs.playiruka.space/overview)
- [Iruka Docs: GIWA Contracts](https://docs.playiruka.space/technical/giwa-testnet)
- [GIWA Sepolia Explorer](https://sepolia-explorer.giwa.io)

이 문서는 공개 페이지의 프로그램 설명과 Iruka의 현재 기술 증거를 분리하기 위한 내부 체크 문서입니다. 숫자·지원금·KPI·메인넷 일정은 GIWA의 개별 안내가 오면 이 파일과 제출 자료에 함께 업데이트합니다.
