import type { Locale } from "./appTypes";
import type { MarketplaceBrowseCategory } from "./marketplaceBrowse";
import type { PackCopy } from "./vendingTypes";

const marketplaceBrowseLabels = {
  en: {
    all: "All",
    photocards: "Photocards",
    albums: "Albums",
    lightsticks: "Lightsticks",
    "fan-kits": "Fan kits",
    apparel: "Apparel",
    "acrylic-stands": "Acrylic stands",
    keyrings: "Keyrings",
    "plush-charms": "Plush charms"
  },
  ko: {
    all: "전체",
    photocards: "포토카드",
    albums: "앨범",
    lightsticks: "응원봉",
    "fan-kits": "팬키트",
    apparel: "의류",
    "acrylic-stands": "아크릴 스탠드",
    keyrings: "키링",
    "plush-charms": "인형"
  }
} satisfies Record<Locale, Record<MarketplaceBrowseCategory, string>>;

export const copy = {
  en: {
    nav: {
      home: "Home",
      pull: "Vending",
      marketplace: "Marketplace",
      event: "Event",
      login: "Login",
      signUp: "Sign Up",
      wallet: "Connect wallet",
      walletConnected: "Connected",
      walletConnecting: "Connecting",
      walletDisconnect: "Disconnect wallet",
      language: "Language"
    },
    home: {
      action: "Enter Vending",
      brandSlogan: "K-pop in Packs\nMoments in Your Vault",
      brandTitle: "Iruka",
      discovery: {
        categoryLabels: marketplaceBrowseLabels.en,
        hotPhotocards: "Hot photocards",
        newArrivals: "New arrivals",
        trendingNow: "Trending now",
        viewAll: "View all"
      },
      eyebrow: "Iruka Vending Machine",
      featurePack: "Pack",
      featureVault: "Vault",
      leftBody: "Choose collectible packs, reveal vaulted cards, and move into marketplace exits from one clean flow.",
      proof: "Verified pack pulls for collectors",
      rightTitle: "Fresh packs on demand",
      vendingTitle: "Iruka vending machine"
    },
    hero: {
      packPrice: "Pack price",
      remaining: "Remaining",
      supplyLabel: "Pack supply sold",
      openPack: "Pull a pack",
      opening: "Pulling"
    },
    vending: {
      morePacks: "More packs",
      packOdds: "Pack odds",
      physicalRedemption: "Physical redemption",
      recentPulls: "Recent pulls",
      vaultEligible: "Vault eligible",
      yourPull: "Your pull"
    },
    feedback: {
      cancelListingBeforeShipping: "Cancel the marketplace listing before shipping.",
      connectWallet: "Log in to pull a pack.",
      listed: "Listed on marketplace.",
      listingCancelled: "Marketplace listing cancelled.",
      listingUpdated: "Listing price updated.",
      purchaseAlreadyOwned: "This card is already in your vault.",
      purchaseQueued: "Added to vault.",
      vaulted: "Saved to vault.",
      sold: "Marked as sold.",
      shipQueued: "Shipping queued."
    },
    sections: {
      left: "left",
      chaseCards: "Chase cards",
      vault: "Vault",
      empty: "Empty",
      cards: "cards",
      vaultEmpty: "Vault empty",
      sold: "Sold",
      redeem: "Redeem"
    },
    actions: {
      vault: "Vault",
      sellNow: "Sell now",
      ship: "Ship"
    },
    categories: {
      "K-pop": "K-pop",
      TCG: "TCG"
    },
    rarities: {
      Common: "Common",
      Rare: "Rare",
      Epic: "Epic",
      Legendary: "Legendary",
      Iruka: "Iruka"
    },
    statuses: {
      Vaulted: "Vaulted",
      Listed: "Listed",
      Sold: "Sold",
      "Redeem queued": "Redeem queued"
    },
    footer: {
      body: "2026 Iruka Labs, Inc. All rights reserved.",
      about: "Platform",
      quickLinks: "Explore",
      support: "Support",
      links: {
        home: "Home",
        marketplace: "Marketplace",
        event: "Event",
        roadmap: "Roadmap",
        contact: "Contact Us",
        documentation: "Documentation"
      }
    },
    marketplacePage: {
      browseCategories: marketplaceBrowseLabels.en,
      browseCategoriesLabel: "Browse categories",
      browsePhotocards: "Browse photocards",
      buyNow: "Buy now",
      cancelListing: "Cancel listing",
      clear: "Clear",
      close: "Close",
      comingSoon: "Coming soon",
      condition: "Condition",
      delivery: "Shipping",
      deliveryEligible: "Eligible",
      editPrice: "Edit listing",
      filterLabels: ["Availability", "Group", "Member", "Card type", "Rarity", "Condition", "Price"],
      filters: "Filters",
      fixedPrice: "Fixed price",
      listForSale: "List for sale",
      listingPrice: "Listing price",
      noResults: "No cards match these filters.",
      ownedEmpty: "No vaulted cards",
      ownedTitle: "Sell from vault",
      priceHistory: "Price history",
      recentSale: "Last",
      recentSales: "Recent sales",
      results: "Listings",
      search: "Search group, member, release, type, or serial",
      sell: "Sell from vault",
      sellFromVault: "Sell from vault",
      serial: "Serial",
      sort: "Sort",
      sortOptions: {
        recent: "Recently listed",
        "price-asc": "Price: low to high",
        "price-desc": "Price: high to low"
      },
      statusLabels: {
        Available: "Available",
        Reserved: "Reserved",
        Sold: "Sold",
        Cancelled: "Cancelled"
      },
      thirtyDayRange: "30-day range",
      title: "Marketplace",
      updateListing: "Update price",
      vaultVerified: "Vault verified",
      version: "Version"
    },
    revealOverlay: {
      estimatedValue: "Est. value",
      skip: "Skip",
      soundOff: "Sound off",
      soundOn: "Sound on"
    },
    eventsPage: {
      heading: "What's ahead",
      items: [
        "Exclusive events will bring fans and creators together through live experiences, special access, and moments shared in person.",
        "Limited promotional cards and collaboration drops will turn every event into something fans can collect and remember.",
        "New rewards, community activations, and more ways to participate will arrive as the Iruka universe continues to grow."
      ],
      title: "Event"
    }
  },
  ko: {
    nav: {
      home: "홈",
      pull: "자판기",
      marketplace: "마켓플레이스",
      event: "이벤트",
      login: "로그인",
      signUp: "가입하기",
      wallet: "지갑 연결",
      walletConnected: "연결됨",
      walletConnecting: "연결 중",
      walletDisconnect: "연결 해제",
      language: "언어"
    },
    home: {
      action: "팩 뽑기",
      brandSlogan: "K-pop in Packs\nMoments in Your Vault",
      brandTitle: "Iruka",
      discovery: {
        categoryLabels: marketplaceBrowseLabels.ko,
        hotPhotocards: "지금 핫한 포토카드",
        newArrivals: "신상",
        trendingNow: "지금 인기",
        viewAll: "전체 보기"
      },
      eyebrow: "Iruka Vending Machine",
      featurePack: "팩",
      featureVault: "보관",
      leftBody: "팩을 고르면 바로 열고, 나온 카드는 보관하거나 판매할 수 있어요.",
      proof: "안심하고 뽑을 수 있어요",
      rightTitle: "팩을 고르고 바로 열어요",
      vendingTitle: "Iruka 자판기"
    },
    hero: {
      packPrice: "가격",
      remaining: "남은 팩",
      supplyLabel: "판매 현황",
      openPack: "팩 뽑기",
      opening: "뽑는 중"
    },
    vending: {
      morePacks: "다른 팩",
      packOdds: "팩 확률",
      physicalRedemption: "실물 배송 가능",
      recentPulls: "최근 뽑은 카드",
      vaultEligible: "보관 가능",
      yourPull: "뽑은 카드"
    },
    feedback: {
      cancelListingBeforeShipping: "판매 등록을 취소한 뒤 배송을 신청해 주세요.",
      connectWallet: "먼저 로그인해 주세요.",
      listed: "판매 목록에 올렸어요.",
      listingCancelled: "판매 등록을 취소했어요.",
      listingUpdated: "판매 가격을 수정했어요.",
      purchaseAlreadyOwned: "이미 보관함에 있는 카드예요.",
      purchaseQueued: "보관함에 담았어요.",
      vaulted: "보관함에 넣었어요.",
      sold: "판매 상태로 바꿨어요.",
      shipQueued: "배송 신청이 접수됐어요."
    },
    sections: {
      left: "남음",
      chaseCards: "인기 카드",
      vault: "보관함",
      empty: "아직 없음",
      cards: "장",
      vaultEmpty: "아직 보관한 카드가 없어요",
      sold: "판매됨",
      redeem: "배송 대기"
    },
    actions: {
      vault: "보관하기",
      sellNow: "판매하기",
      ship: "배송받기"
    },
    categories: {
      "K-pop": "케이팝",
      TCG: "TCG"
    },
    rarities: {
      Common: "커먼",
      Rare: "레어",
      Epic: "에픽",
      Legendary: "레전더리",
      Iruka: "Iruka"
    },
    statuses: {
      Vaulted: "보관 중",
      Listed: "판매 중",
      Sold: "판매 완료",
      "Redeem queued": "배송 대기"
    },
    footer: {
      body: "2026 Iruka Labs, Inc. All rights reserved.",
      about: "플랫폼",
      quickLinks: "둘러보기",
      support: "지원",
      links: {
        home: "홈",
        marketplace: "마켓플레이스",
        event: "이벤트",
        roadmap: "로드맵",
        contact: "문의",
        documentation: "문서 보기"
      }
    },
    marketplacePage: {
      browseCategories: marketplaceBrowseLabels.ko,
      browseCategoriesLabel: "카테고리 둘러보기",
      browsePhotocards: "포토카드 보기",
      buyNow: "구매하기",
      cancelListing: "판매 취소",
      clear: "초기화",
      close: "닫기",
      comingSoon: "준비 중",
      condition: "상태",
      delivery: "배송",
      deliveryEligible: "배송 가능",
      editPrice: "판매 정보 수정",
      filterLabels: ["판매 상태", "그룹", "멤버", "카드 유형", "희귀도", "상태", "가격"],
      filters: "필터",
      fixedPrice: "판매가",
      listForSale: "판매 등록",
      listingPrice: "판매 가격",
      noResults: "조건에 맞는 카드가 없어요.",
      ownedEmpty: "판매할 카드가 없어요",
      ownedTitle: "보관함에서 팔기",
      priceHistory: "시세 기록",
      recentSale: "최근",
      recentSales: "최근 거래",
      results: "개",
      search: "그룹, 멤버, 앨범, 유형, 시리얼 검색",
      sell: "보관함에서 팔기",
      sellFromVault: "보관함에서 팔기",
      serial: "시리얼",
      sort: "정렬",
      sortOptions: {
        recent: "최근 등록순",
        "price-asc": "낮은 가격순",
        "price-desc": "높은 가격순"
      },
      statusLabels: {
        Available: "판매 중",
        Reserved: "예약 중",
        Sold: "판매 완료",
        Cancelled: "판매 취소"
      },
      thirtyDayRange: "30일 거래 범위",
      title: "마켓플레이스",
      updateListing: "가격 수정",
      vaultVerified: "Vault 검증",
      version: "버전"
    },
    revealOverlay: {
      estimatedValue: "예상 시세",
      skip: "건너뛰기",
      soundOff: "소리 꺼짐",
      soundOn: "소리 켜짐"
    },
    eventsPage: {
      heading: "앞으로 펼쳐질 것들",
      items: [
        "독점 이벤트를 통해 팬과 크리에이터가 현장에서 만나고, 특별한 참여 기회와 순간을 함께 나누게 됩니다.",
        "한정 프로모션 카드와 협업 드롭으로 각 이벤트를 오래 수집하고 기억할 수 있는 경험으로 만듭니다.",
        "Iruka 유니버스가 성장할수록 새로운 리워드와 커뮤니티 활동, 더 다양한 참여 방식이 계속 추가됩니다."
      ],
      title: "이벤트"
    }
  }
} as const;

export type AppCopy = (typeof copy)[Locale];

export const packCopy: Record<Locale, Record<string, PackCopy>> = {
  en: {
    "girl-grail": {
      name: "Girl Group Iruka Pack",
      shortName: "Girl Group",
      chaseCards: ["Aurora Stage", "Blue Hour", "Signed Event", "Prism Encore"]
    },
    "boy-grail": {
      name: "Boy Group Iruka Pack",
      shortName: "Boy Group",
      chaseCards: ["World Tour", "Fan Sign", "Debut Era", "Midnight Unit"]
    },
    "ive-drop": {
      name: "Premium Idol Drop #001",
      shortName: "Premium Idol",
      chaseCards: ["Velvet Signal", "Afterglow", "Blue Stage", "Holo Encore"]
    },
    "aespa-drop": {
      name: "Rookie Idol Drop #001",
      shortName: "Rookie Idol",
      chaseCards: ["Sync Live", "Drama Unit", "Chrome Stage", "First Light"]
    },
    "pokemon-slab": {
      name: "TCG Slab Pack",
      shortName: "TCG Slab",
      chaseCards: ["Holo Starter", "Trainer Rare", "Gem Mint Chase", "Foil Vault"]
    }
  },
  ko: {
    "girl-grail": {
      name: "걸그룹 Iruka 팩",
      shortName: "걸그룹",
      chaseCards: ["오로라 스테이지", "블루 아워", "사인 이벤트", "프리즘 앙코르"]
    },
    "boy-grail": {
      name: "보이그룹 Iruka 팩",
      shortName: "보이그룹",
      chaseCards: ["월드 투어", "팬사인", "데뷔 시절", "미드나잇 유닛"]
    },
    "ive-drop": {
      name: "프리미엄 아이돌 팩 #001",
      shortName: "프리미엄 아이돌",
      chaseCards: ["벨벳 시그널", "애프터글로우", "블루 스테이지", "홀로 앙코르"]
    },
    "aespa-drop": {
      name: "루키 아이돌 팩 #001",
      shortName: "루키 아이돌",
      chaseCards: ["싱크 라이브", "드라마 유닛", "크롬 스테이지", "퍼스트 라이트"]
    },
    "pokemon-slab": {
      name: "TCG 슬랩 팩",
      shortName: "TCG 슬랩",
      chaseCards: ["홀로 스타터", "트레이너 레어", "젬민트 체이스", "포일 볼트"]
    }
  }
};
