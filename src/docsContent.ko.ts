import type { DocsPage } from "./docsContent";

export const docsPagesKo: DocsPage[] = [
  {
    category: "시작",
    slug: "welcome",
    summary: "Iruka에서 할 수 있는 일을 한눈에 볼 수 있어요.",
    title: "Iruka 문서",
    sections: [
      { title: "Iruka란?", body: "Iruka는 실물 컬렉터블을 디지털 팩으로 열고, 보관하거나 거래하고, 배송까지 요청할 수 있는 서비스예요." },
      { title: "핵심 흐름", bullets: ["자판기에서 팩 선택", "팩 열기와 결과 확인", "보관함 보관, 마켓 판매, 배송 요청"] },
      { title: "브랜드 기준", body: "공식 파트너십이 없다면 Iruka를 아티스트, 소속사, 레이블, 카드 제조사, 그레이딩 회사의 공식 서비스처럼 표현하지 않아요." }
    ]
  },
  {
    category: "제품",
    slug: "vending-machine",
    summary: "팩을 고르고 결과를 확인하는 흐름이에요.",
    title: "Vending Machine",
    sections: [
      { title: "팩 선택", body: "팩을 열기 전에 가격, 남은 수량, 등급, 확률, 예상 가치 범위를 보여줘요." },
      { title: "결과", bullets: ["등급", "시리얼 또는 아이템 ID", "예상 가치", "보관 상태", "할 수 있는 일"] },
      { title: "결과 처리", body: "나온 아이템은 보관함에 넣거나, 마켓에 올리거나, 배송을 요청할 수 있어요." }
    ]
  },
  {
    category: "제품",
    slug: "marketplace",
    summary: "검증된 컬렉터블을 사고파는 공간이에요.",
    title: "Marketplace",
    sections: [
      { title: "판매 등록", body: "판매 등록에는 사진, 제목, 분류, 등급 또는 상태, 보관 상태, 가격, 배송 가능 여부가 필요해요." },
      { title: "판매자 액션", bullets: ["보관함 아이템 판매 등록", "가격 수정 또는 취소", "마켓 판매"] },
      { title: "식별 정보", body: "제3자 이름은 실물 아이템을 구분하는 데 필요할 때만 사용하고, Iruka의 공식 팩 브랜딩처럼 쓰지 않아요." }
    ]
  },
  {
    category: "보관",
    slug: "vault",
    summary: "검증된 실물 아이템을 보관하는 공간이에요.",
    title: "Vault",
    sections: [
      { title: "보관함 역할", body: "보관함은 보관, 판매 등록, 판매, 배송 요청이 가능한 검증된 실물 재고를 보여줘요." },
      { title: "필수 기록", bullets: ["아이템 ID", "팩 출처", "보관 상태", "소유자 기록", "사진 또는 스캔", "배송 가능 여부"] },
      { title: "보관 원칙", body: "보관, 검증, 배송 가능 여부가 내부 기록으로 확인된 아이템만 보관함에 표시해요." }
    ]
  },
  {
    category: "보관",
    slug: "redemption",
    summary: "보관한 아이템을 배송받는 흐름이에요.",
    title: "Redemption and Shipping",
    sections: [
      { title: "요청 흐름", bullets: ["보관함 아이템 선택", "배송 정보와 비용 확인", "배송 대기 상태로 변경", "운송장과 처리 상태 연결"] },
      { title: "배송 데이터", body: "운영 기록에는 수령자 정보, 운송사, 운송장, 배송비, 처리 상태, 지원 메모가 포함돼야 해요." }
    ]
  },
  {
    category: "팩",
    slug: "rarities",
    summary: "등급과 구매 전에 보여줘야 할 정보예요.",
    title: "Rarities and Odds",
    sections: [
      { title: "등급", bullets: ["Common", "Rare", "Epic", "Legendary", "Iruka"] },
      { title: "공개 기준", body: "모든 팩은 수량, 가격, 확률, 등급, 예상 가치 범위, 배송 정책, 취소 기준을 보여줘야 해요." }
    ]
  },
  {
    category: "정책",
    slug: "ip-listing",
    summary: "팩 이름과 아이템 표기 기준이에요.",
    title: "IP and Listing Policy",
    sections: [
      { title: "중립 팩 브랜딩", body: "권리, 라이선스, 파트너십이 없다면 공개 팩 이름은 중립적으로 유지해요." },
      { title: "마켓 식별", body: "실물 아이템을 구분하는 데 필요할 때만 아티스트, 멤버, 세트, 앨범, 카드 번호, 상태, 그레이딩 정보를 사용해요." },
      { title: "이미지 기준", body: "Iruka 오리지널 이미지, 중립 제품 이미지, 실제 재고 사진을 사용해요. 권리 없이 제3자 얼굴, 로고, 아트워크로 상업용 카드를 만들지 않아요." }
    ]
  },
  {
    category: "로드맵",
    slug: "roadmap",
    summary: "지금 만들고 있는 것과 다음 단계예요.",
    title: "Roadmap",
    sections: [
      { title: "MVP", bullets: ["랜딩 페이지", "자판기 팩 흐름", "마켓플레이스 프리뷰", "Vault 액션", "Privy 로그인과 외부 EVM 지갑"] },
      { title: "다음", bullets: ["실제 재고 기록", "보관함 운영", "마켓 정산", "배송 운영", "GitBook 공개 문서"] },
      { title: "이후", body: "아이돌 팬과 컬렉터가 새 팩, 뽑기 결과, 컬렉션을 함께 이야기할 수 있는 커뮤니티 게시판을 추가할 계획이에요." }
    ]
  }
];
