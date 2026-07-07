import type { DocsPage } from "./docsContent";

export const docsPagesKo: DocsPage[] = [
  {
    category: "시작",
    slug: "welcome",
    summary: "Iruka의 제품 범위와 유저가 할 수 있는 핵심 흐름입니다.",
    title: "Iruka 문서",
    sections: [
      { title: "Iruka란?", body: "Iruka는 실물 컬렉터블을 디지털로 뽑고, 보관하고, 거래하거나 배송 요청할 수 있게 연결하는 팩/Vault/마켓플레이스 제품입니다." },
      { title: "핵심 흐름", bullets: ["자판기 팩 선택", "팩 뽑기와 리빌", "Vault 보관, 마켓 판매, 배송 요청"] },
      { title: "브랜드 기준", body: "명시된 파트너십이 없는 한 Iruka는 아티스트, 소속사, 레이블, 카드 제조사, 그레이딩 회사의 공식 서비스로 표현하지 않습니다." }
    ]
  },
  {
    category: "제품",
    slug: "vending-machine",
    summary: "팩 선택, 리빌, 등급 결과를 설명합니다.",
    title: "Vending Machine",
    sections: [
      { title: "팩 선택", body: "각 팩은 가격, 남은 수량, 등급, 확률, 예상 가치 범위를 뽑기 전에 보여줘야 합니다." },
      { title: "리빌 결과", bullets: ["등급", "시리얼 또는 아이템 ID", "예상 가치", "Vault 상태", "가능한 액션"] },
      { title: "결과 처리", body: "리빌된 아이템은 Vault 보관, 마켓 리스팅, 배송 요청 흐름으로 이동할 수 있습니다." }
    ]
  },
  {
    category: "제품",
    slug: "marketplace",
    summary: "검증된 컬렉터블을 사고파는 구조입니다.",
    title: "Marketplace",
    sections: [
      { title: "리스팅", body: "리스팅에는 사진, 제목, 카테고리, 등급 또는 상태, 보관 상태, 가격, 배송 가능 여부가 필요합니다." },
      { title: "판매자 액션", bullets: ["Vault 아이템 리스팅", "가격 수정 또는 취소", "마켓플레이스 판매"] },
      { title: "식별 정보", body: "제3자 이름은 실물 아이템 식별에 필요한 경우에만 사용하고, Iruka 소유 팩 브랜딩처럼 쓰지 않습니다." }
    ]
  },
  {
    category: "보관",
    slug: "vault",
    summary: "검증된 실물 아이템의 보관 레이어입니다.",
    title: "Vault",
    sections: [
      { title: "Vault 역할", body: "Vault는 보관, 리스팅, 판매, 배송 요청이 가능한 검증된 실물 재고를 나타냅니다." },
      { title: "필수 기록", bullets: ["아이템 ID", "팩 출처", "보관 상태", "소유자 기록", "사진 또는 스캔", "배송 가능 여부"] },
      { title: "보관 원칙", body: "내부 기록으로 보관, 검증, 리딤 가능 여부가 확인될 때만 Vault 아이템으로 표시합니다." }
    ]
  },
  {
    category: "보관",
    slug: "redemption",
    summary: "Vault 아이템을 유저에게 배송하는 흐름입니다.",
    title: "Redemption and Shipping",
    sections: [
      { title: "요청 흐름", bullets: ["Vault 아이템 선택", "배송 정보와 비용 확인", "Redeem queued 상태로 변경", "운송장과 처리 상태 연결"] },
      { title: "배송 데이터", body: "운영 기록에는 수령자 정보, 운송사, 운송장, 배송비, 처리 상태, 지원 메모가 포함되어야 합니다." }
    ]
  },
  {
    category: "팩",
    slug: "rarities",
    summary: "등급 체계와 구매 전 공개해야 할 정보입니다.",
    title: "Rarities and Odds",
    sections: [
      { title: "등급", bullets: ["Common", "Rare", "Epic", "Legendary", "Iruka"] },
      { title: "공개 기준", body: "모든 팩은 수량, 가격, 확률, 등급, 예상 가치 범위, 배송 정책, 취소 기준을 보여줘야 합니다." }
    ]
  },
  {
    category: "정책",
    slug: "ip-listing",
    summary: "팩 브랜딩과 아이템 식별 기준입니다.",
    title: "IP and Listing Policy",
    sections: [
      { title: "중립 팩 브랜딩", body: "권리, 라이선스, 파트너십이 없다면 공개 팩 이름은 중립적으로 유지합니다." },
      { title: "마켓 식별", body: "실물 아이템 식별에 필요한 경우에만 아티스트, 멤버, 세트, 앨범, 카드 번호, 상태, 그레이딩 정보를 사용합니다." },
      { title: "이미지 기준", body: "Iruka 오리지널 이미지, 중립 제품 이미지, 실제 재고 사진을 사용합니다. 권리 없이 제3자 얼굴, 로고, 아트워크로 상업용 카드를 만들지 않습니다." }
    ]
  },
  {
    category: "로드맵",
    slug: "roadmap",
    summary: "현재 MVP와 다음 단계입니다.",
    title: "Roadmap",
    sections: [
      { title: "MVP", bullets: ["랜딩 페이지", "자판기 팩 흐름", "마켓플레이스 프리뷰", "Vault 액션", "Privy 로그인과 외부 EVM 지갑"] },
      { title: "다음", bullets: ["실제 재고 기록", "Vault 운영", "마켓 정산", "배송 운영", "GitBook 공개 문서"] },
      { title: "이후", body: "아이돌 팬과 컬렉터가 드롭, 뽑기 결과, 컬렉션을 함께 이야기할 수 있는 커뮤니티 게시판을 추가할 계획입니다." }
    ]
  }
];
