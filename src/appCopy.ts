import type { Locale } from "./appTypes";
import type { MarketplaceBrowseCategory } from "./marketplaceBrowse";

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
      allRarities: "All rarities",
      batch: "Batch",
      category: "Girl Groups",
      estimatedValue: "Est. value",
      giwaReceipt: "GIWA testnet receipt",
      giwaTestnet: "GIWA testnet",
      individualOdds: "Individual odds",
      insidePack: "Inside this pack",
      loadError: "Cards could not be loaded.",
      loadMore: "Load more",
      openPack: "Pull 1 pack",
      packLabel: "Pack",
      packOdds: "Pack odds",
      physicalRedemption: "Physical redemption",
      redemptionUnavailable: "Redemption unavailable",
      recentPulls: "Recent pulls",
      redeemable: "Redeemable",
      showFeatured: "Show featured",
      statusLabels: {
        live: "Live",
        "low-stock": "Low stock",
        "sold-out": "Sold out",
        "coming-soon": "Coming soon"
      },
      testPull: "Test pull",
      viewAllCards: "View all cards",
      viewTransaction: "View transaction",
      viewBack: "View back",
      viewFront: "View front",
      viewOdds: "View odds & values",
      yourPull: "Your pull"
    },
    feedback: {
      cancelListingBeforeShipping: "Cancel the marketplace listing before shipping.",
      connectWallet: "Log in to pull a pack.",
      giwaPullConfirmed: "Test pull submitted on GIWA.",
      giwaPullFailed: "Test pull could not be submitted.",
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
      allRarities: "전체 등급",
      batch: "배치",
      category: "걸그룹",
      estimatedValue: "예상 시세",
      giwaReceipt: "GIWA 테스트넷 영수증",
      giwaTestnet: "GIWA 테스트넷",
      individualOdds: "개별 확률",
      insidePack: "이 팩에 들어 있어요",
      loadError: "카드를 불러오지 못했어요.",
      loadMore: "더 보기",
      openPack: "1팩 뽑기",
      packLabel: "팩",
      packOdds: "팩 확률",
      physicalRedemption: "실물 배송 가능",
      redemptionUnavailable: "실물 배송 미지원",
      recentPulls: "최근 뽑은 카드",
      redeemable: "배송 가능",
      showFeatured: "대표 카드만 보기",
      statusLabels: {
        live: "판매 중",
        "low-stock": "품절 임박",
        "sold-out": "품절",
        "coming-soon": "준비 중"
      },
      testPull: "테스트 뽑기",
      viewAllCards: "전체 카드 보기",
      viewTransaction: "트랜잭션 보기",
      viewBack: "뒷면 보기",
      viewFront: "앞면 보기",
      viewOdds: "확률과 예상 시세 보기",
      yourPull: "뽑은 카드"
    },
    feedback: {
      cancelListingBeforeShipping: "판매 등록을 취소한 뒤 배송을 신청해 주세요.",
      connectWallet: "먼저 로그인해 주세요.",
      giwaPullConfirmed: "GIWA 테스트넷에 뽑기를 등록했어요.",
      giwaPullFailed: "테스트넷 뽑기를 등록하지 못했어요.",
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
