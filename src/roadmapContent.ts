export type RoadmapPhase = {
  items: string[];
  title: string;
};

export type RoadmapContent = {
  community: { body: string; title: string };
  intro: string;
  phases: RoadmapPhase[];
};

export const roadmapContent: Record<"en" | "ko", RoadmapContent> = {
  en: {
    intro: "This roadmap describes the near-term direction for Iruka.",
    phases: [
      {
        title: "MVP",
        items: [
          "Bright Iruka landing page",
          "Vending machine pack flow",
          "Rarity and odds display",
          "Reveal animation",
          "Vault, sell, and ship actions",
          "Marketplace preview",
          "Privy login with external EVM wallets",
          "English and Korean UI"
        ]
      },
      {
        title: "Next",
        items: [
          "Production inventory records",
          "Real vault custody workflow",
          "Marketplace listings and settlement",
          "Redemption and shipping operations",
          "Public docs at docs.playiruka.space"
        ]
      },
      {
        title: "Later",
        items: [
          "Fan community boards",
          "Group and collection discussion pages",
          "User collection profiles",
          "Marketplace leaderboard",
          "Detailed vault and proof-of-custody records",
          "GIWA integration documentation"
        ]
      }
    ],
    community: {
      title: "Community boards",
      body: "Iruka plans to open community boards so idol fans and collectors can share pulls, discuss drops, and follow collections together."
    }
  },
  ko: {
    intro: "Iruka가 가까운 시일 내에 나아갈 방향을 정리한 로드맵입니다.",
    phases: [
      {
        title: "MVP",
        items: [
          "밝은 톤의 Iruka 랜딩 페이지",
          "자판기 팩 플로우",
          "등급·확률 표시",
          "리빌 애니메이션",
          "보관·판매·배송 액션",
          "마켓플레이스 프리뷰",
          "외부 EVM 지갑을 지원하는 Privy 로그인",
          "영어·한국어 UI"
        ]
      },
      {
        title: "다음 단계",
        items: [
          "실제 재고 기록",
          "실물 보관 커스터디 워크플로우",
          "마켓플레이스 리스팅·정산",
          "배송·리딤 운영",
          "docs.playiruka.space 공개 문서"
        ]
      },
      {
        title: "이후 계획",
        items: [
          "팬 커뮤니티 게시판",
          "그룹·컬렉션 토론 페이지",
          "유저 컬렉션 프로필",
          "마켓플레이스 리더보드",
          "보관·커스터디 증빙 상세 기록",
          "GIWA 연동 문서"
        ]
      }
    ],
    community: {
      title: "커뮤니티 게시판",
      body: "아이돌 팬과 컬렉터가 팩 결과를 공유하고 드롭을 이야기하며 컬렉션을 함께 팔로우할 수 있는 커뮤니티 게시판을 준비하고 있어요."
    }
  }
};
