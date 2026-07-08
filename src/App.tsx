import {
  Box,
  Clock3,
  PackageOpen,
  Send,
  ShieldCheck,
  Store,
  Wallet
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AuthActions } from "./AuthActions";
import irukaLogo from "./assets/iruka-logo.png";
import packProductImage from "./assets/iruka-pack-product.png";
import irukaWordmark from "./assets/iruka-wordmark.png";
import { DocsView } from "./DocsView";
import { HomeView } from "./HomeView";
import { IrukaBeam } from "./IrukaBeam";
import { MarketplaceView } from "./MarketplaceView";
import { marketplaceCards, type MarketplaceCard } from "./marketplaceData";

type WalletAuthMode = "disabled" | "privy";
type Locale = "en" | "ko";
type AppView = "home" | "pull" | "marketplace" | "vault" | "roadmap" | "docs";
type Rarity = "Common" | "Rare" | "Epic" | "Legendary" | "Iruka";
type VaultStatus = "Vaulted" | "Listed" | "Sold" | "Redeem queued";
type Category = "K-pop" | "TCG";

type RarityConfig = {
  rarity: Rarity;
  odds: number;
  valueRange: [number, number];
};

type Pack = {
  id: string;
  name: string;
  shortName: string;
  category: Category;
  price: number;
  remaining: number;
  total: number;
  closeTime: string;
  theme: string;
  tone: string;
  chaseCards: string[];
  odds: RarityConfig[];
};

type CardPull = {
  id: string;
  packId: string;
  category: Category;
  group: string;
  member: string;
  rarity: Rarity;
  estimatedValue: number;
  buybackValue: number;
  vaultStatus: VaultStatus;
  redeemable: boolean;
  imageStyle: string;
  serial: string;
  pulledAt: string;
};

const copy = {
  en: {
    nav: {
      home: "Home",
      pull: "Vending",
      marketplace: "Marketplace",
      drops: "Drops",
      chase: "Chase",
      vault: "Vault",
      roadmap: "Roadmap",
      docs: "Docs",
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
      eyebrow: "Iruka Vending Machine",
      featurePack: "Pack",
      featureVault: "Vault",
      leftBody: "Choose collectible packs, reveal vaulted cards, and move into marketplace exits from one clean flow.",
      proof: "Verified pack pulls for collectors",
      rightBody: "A bright vending route for pack drops, reveal moments, and vaulted inventory.",
      rightTitle: "Fresh packs on demand",
      vendingMeta: "Vending ready",
      vendingTitle: "Iruka vending machine"
    },
    hero: {
      packPrice: "Pack price",
      remaining: "Remaining",
      supplyLabel: "Pack supply sold",
      openPack: "Pull a pack",
      opening: "Pulling"
    },
    marketStrip: [
      { label: "Vault", value: "Verified storage" },
      { label: "Exit", value: "Sell or ship" },
      { label: "Wallet", value: "EVM ready" }
    ],
    activity: [
      {
        title: "Aurora Stage",
        pack: "Girl Group Iruka Pack",
        status: "Pulled",
        time: "42 sec ago"
      },
      {
        title: "Signed Event",
        pack: "Girl Group Iruka Pack",
        status: "Vaulted",
        time: "1 min ago"
      },
      {
        title: "Velvet Signal",
        pack: "Premium Idol Drop #001",
        status: "Listed",
        time: "3 min ago"
      },
      {
        title: "Blue Hour",
        pack: "Boy Group Iruka Pack",
        status: "Pulled",
        time: "5 min ago"
      }
    ],
    feedback: {
      connectWallet: "Log in to pull a pack.",
      listed: "Listed on marketplace.",
      purchaseQueued: "Added to vault.",
      vaulted: "Saved to vault.",
      sold: "Marked as sold.",
      shipQueued: "Shipping queued."
    },
    sections: {
      marketplace: "Marketplace",
      activity: "Just pulled",
      liveDrops: "Active drops",
      openDrop: "Grab a pack",
      left: "left",
      reveal: "Reveal",
      odds: "Odds",
      chaseCards: "Chase cards",
      vault: "Vault",
      roadmap: "Roadmap",
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
    roadmap: [
      {
        status: "Planned",
        title: "Fan community boards",
        body: "Open group boards where idol fans can share pulls, discuss drops, and follow collections together."
      },
      {
        status: "Planned",
        title: "GitBook documentation",
        body: "Publish detailed docs for vault flows, redemption structure, service architecture, and GIWA integration."
      }
    ],
    docs: {
      eyebrow: "Documentation",
      title: "Iruka Docs",
      body: "GitBook-style documentation for Iruka's vending, marketplace, vault, redemption, policy, and roadmap flows.",
      sourceTitle: "GitBook source",
      sourceBody: "The matching GitBook markdown source is prepared in the repository and can be published later.",
      sourcePath: "docs/gitbook/SUMMARY.md"
    },
    footer: {
      body: "2026 Iruka Labs, Inc. All rights reserved.",
      about: "Platform",
      quickLinks: "Explore",
      support: "Support",
      links: {
        home: "Home",
        marketplace: "Marketplace",
        vault: "Vault",
        roadmap: "Roadmap",
        contact: "Contact Us",
        documentation: "Documentation"
      }
    },
    marketplacePage: {
      buyNow: "Buy now",
      filterLabels: ["Status", "Category", "Rarity", "Grade", "Price Range"],
      filters: "Filters",
      fmv: "FMV",
      ownedEmpty: "No vaulted cards",
      ownedTitle: "Sell from vault",
      results: "Listings",
      search: "Search cards",
      sell: "Sell",
      sort: "Recently listed",
      title: "Marketplace"
    }
  },
  ko: {
    nav: {
      home: "홈",
      pull: "자판기",
      marketplace: "마켓플레이스",
      drops: "드롭",
      chase: "체이스",
      vault: "보관함",
      roadmap: "로드맵",
      docs: "문서",
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
      eyebrow: "Iruka Vending Machine",
      featurePack: "팩",
      featureVault: "보관",
      leftBody: "팩을 고르면 바로 열고, 나온 카드는 보관하거나 판매할 수 있어요.",
      proof: "안심하고 뽑을 수 있어요",
      rightBody: "팩을 열고, 나온 카드는 보관함에서 바로 관리해요.",
      rightTitle: "팩을 고르고 바로 열어요",
      vendingMeta: "지금 열 수 있어요",
      vendingTitle: "Iruka 자판기"
    },
    hero: {
      packPrice: "가격",
      remaining: "남은 팩",
      supplyLabel: "판매 현황",
      openPack: "팩 뽑기",
      opening: "뽑는 중"
    },
    marketStrip: [
      { label: "보관", value: "안전하게 보관" },
      { label: "정산", value: "팔거나 배송받기" },
      { label: "지갑", value: "EVM 지갑 연결" }
    ],
    activity: [
      {
        title: "오로라 스테이지",
        pack: "걸그룹 Iruka 팩",
        status: "열림",
        time: "42초 전"
      },
      {
        title: "사인 이벤트",
        pack: "걸그룹 Iruka 팩",
        status: "보관됨",
        time: "1분 전"
      },
      {
        title: "벨벳 시그널",
        pack: "프리미엄 아이돌 팩 #001",
        status: "판매 중",
        time: "3분 전"
      },
      {
        title: "블루 아워",
        pack: "보이그룹 Iruka 팩",
        status: "열림",
        time: "5분 전"
      }
    ],
    feedback: {
      connectWallet: "먼저 로그인해 주세요.",
      listed: "판매 목록에 올렸어요.",
      purchaseQueued: "보관함에 담았어요.",
      vaulted: "보관함에 넣었어요.",
      sold: "판매 상태로 바꿨어요.",
      shipQueued: "배송 신청이 접수됐어요."
    },
    sections: {
      marketplace: "마켓",
      activity: "방금 나온 카드",
      liveDrops: "지금 열 수 있는 팩",
      openDrop: "팩 뽑기",
      left: "남음",
      reveal: "결과",
      odds: "나올 확률",
      chaseCards: "인기 카드",
      vault: "보관함",
      roadmap: "로드맵",
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
    roadmap: [
      {
        status: "예정",
        title: "팬 커뮤니티 게시판",
        body: "그룹별 게시판에서 팩 결과와 새 팩 소식을 나눌 수 있게 할 예정이에요."
      },
      {
        status: "예정",
        title: "GitBook 문서화",
        body: "보관함, 배송, 서비스 구조, GIWA 연동을 GitBook에 자세히 정리할 예정이에요."
      }
    ],
    docs: {
      eyebrow: "문서",
      title: "Iruka 문서",
      body: "자판기, 마켓, 보관함, 배송, 정책, 로드맵을 한곳에 모았어요.",
      sourceTitle: "GitBook 소스",
      sourceBody: "배포 전까지는 저장소 문서로 확인할 수 있어요.",
      sourcePath: "docs/gitbook/SUMMARY.md"
    },
    footer: {
      body: "2026 Iruka Labs, Inc. All rights reserved.",
      about: "플랫폼",
      quickLinks: "둘러보기",
      support: "지원",
      links: {
        home: "홈",
        marketplace: "마켓플레이스",
        vault: "보관함",
        roadmap: "로드맵",
        contact: "문의",
        documentation: "문서 보기"
      }
    },
    marketplacePage: {
      buyNow: "구매하기",
      filterLabels: ["상태", "분류", "등급", "보관 등급", "가격"],
      filters: "필터",
      fmv: "예상 시세",
      ownedEmpty: "판매할 카드가 없어요",
      ownedTitle: "보관함에서 팔기",
      results: "개",
      search: "카드, 등급 검색",
      sell: "내 카드 팔기",
      sort: "최근순",
      title: "마켓플레이스"
    }
  }
} as const;

const packCopy: Record<
  Locale,
  Record<string, { name: string; shortName: string; chaseCards: string[] }>
> = {
  en: {
    "girl-grail": {
      name: "Girl Group Iruka Pack",
      shortName: "Girl Group",
      chaseCards: ["Aurora Stage", "Blue Hour", "Signed Event"]
    },
    "boy-grail": {
      name: "Boy Group Iruka Pack",
      shortName: "Boy Group",
      chaseCards: ["World Tour", "Fan Sign", "Debut Era"]
    },
    "ive-drop": {
      name: "Premium Idol Drop #001",
      shortName: "Premium Idol",
      chaseCards: ["Velvet Signal", "Afterglow", "Blue Stage"]
    },
    "aespa-drop": {
      name: "Rookie Idol Drop #001",
      shortName: "Rookie Idol",
      chaseCards: ["Sync Live", "Drama Unit", "Chrome Stage"]
    },
    "pokemon-slab": {
      name: "TCG Slab Pack",
      shortName: "TCG Slab",
      chaseCards: ["Holo Starter", "Trainer Rare", "Gem Mint Chase"]
    }
  },
  ko: {
    "girl-grail": {
      name: "걸그룹 Iruka 팩",
      shortName: "걸그룹",
      chaseCards: ["오로라 스테이지", "블루 아워", "사인 이벤트"]
    },
    "boy-grail": {
      name: "보이그룹 Iruka 팩",
      shortName: "보이그룹",
      chaseCards: ["월드 투어", "팬사인", "데뷔 시절"]
    },
    "ive-drop": {
      name: "프리미엄 아이돌 팩 #001",
      shortName: "프리미엄 아이돌",
      chaseCards: ["벨벳 시그널", "애프터글로우", "블루 스테이지"]
    },
    "aespa-drop": {
      name: "루키 아이돌 팩 #001",
      shortName: "루키 아이돌",
      chaseCards: ["싱크 라이브", "드라마 유닛", "크롬 스테이지"]
    },
    "pokemon-slab": {
      name: "TCG 슬랩 팩",
      shortName: "TCG 슬랩",
      chaseCards: ["홀로 스타터", "트레이너 레어", "젬민트 체이스"]
    }
  }
};

const packs: Pack[] = [
  {
    id: "girl-grail",
    name: "Girl Group Iruka Pack",
    shortName: "Girl Group",
    category: "K-pop",
    price: 39900,
    remaining: 84,
    total: 120,
    closeTime: "18:42:09",
    theme: "Multi-group grails",
    tone: "aqua",
    chaseCards: ["Aurora Stage", "Blue Hour", "Signed Event"],
    odds: [
      { rarity: "Common", odds: 60, valueRange: [8000, 25000] },
      { rarity: "Rare", odds: 28, valueRange: [30000, 80000] },
      { rarity: "Epic", odds: 9, valueRange: [100000, 300000] },
      { rarity: "Legendary", odds: 2, valueRange: [500000, 1200000] },
      { rarity: "Iruka", odds: 1, valueRange: [1500000, 3000000] }
    ]
  },
  {
    id: "boy-grail",
    name: "Boy Group Iruka Pack",
    shortName: "Boy Group",
    category: "K-pop",
    price: 44900,
    remaining: 66,
    total: 100,
    closeTime: "1D 03:16",
    theme: "Fan-sign era cards",
    tone: "smoke",
    chaseCards: ["World Tour", "Fan Sign", "Debut Era"],
    odds: [
      { rarity: "Common", odds: 58, valueRange: [9000, 28000] },
      { rarity: "Rare", odds: 29, valueRange: [35000, 90000] },
      { rarity: "Epic", odds: 10, valueRange: [120000, 340000] },
      { rarity: "Legendary", odds: 2, valueRange: [650000, 1500000] },
      { rarity: "Iruka", odds: 1, valueRange: [1700000, 3400000] }
    ]
  },
  {
    id: "ive-drop",
    name: "Premium Idol Drop #001",
    shortName: "Premium Idol",
    category: "K-pop",
    price: 59900,
    remaining: 31,
    total: 60,
    closeTime: "06:22:41",
    theme: "Verified idol mix",
    tone: "cyan",
    chaseCards: ["Velvet Signal", "Afterglow", "Blue Stage"],
    odds: [
      { rarity: "Common", odds: 52, valueRange: [12000, 32000] },
      { rarity: "Rare", odds: 33, valueRange: [42000, 110000] },
      { rarity: "Epic", odds: 11, valueRange: [130000, 380000] },
      { rarity: "Legendary", odds: 3, valueRange: [700000, 1600000] },
      { rarity: "Iruka", odds: 1, valueRange: [1800000, 3600000] }
    ]
  },
  {
    id: "aespa-drop",
    name: "Rookie Idol Drop #001",
    shortName: "Rookie Idol",
    category: "K-pop",
    price: 54900,
    remaining: 44,
    total: 70,
    closeTime: "22:08:33",
    theme: "Verified rookie mix",
    tone: "mint",
    chaseCards: ["Sync Live", "Drama Unit", "Chrome Stage"],
    odds: [
      { rarity: "Common", odds: 54, valueRange: [10000, 30000] },
      { rarity: "Rare", odds: 31, valueRange: [38000, 105000] },
      { rarity: "Epic", odds: 11, valueRange: [125000, 360000] },
      { rarity: "Legendary", odds: 3, valueRange: [650000, 1400000] },
      { rarity: "Iruka", odds: 1, valueRange: [1600000, 3200000] }
    ]
  },
  {
    id: "pokemon-slab",
    name: "TCG Slab Pack",
    shortName: "TCG Slab",
    category: "TCG",
    price: 89900,
    remaining: 18,
    total: 40,
    closeTime: "2D 11:30",
    theme: "Graded slab proof",
    tone: "rose",
    chaseCards: ["Holo Starter", "Trainer Rare", "Gem Mint Chase"],
    odds: [
      { rarity: "Common", odds: 50, valueRange: [30000, 70000] },
      { rarity: "Rare", odds: 32, valueRange: [85000, 180000] },
      { rarity: "Epic", odds: 13, valueRange: [220000, 550000] },
      { rarity: "Legendary", odds: 4, valueRange: [900000, 2400000] },
      { rarity: "Iruka", odds: 1, valueRange: [2600000, 5200000] }
    ]
  }
];

const kpopGroups = ["Aurora", "Velvet", "Nova", "Lime", "Prism", "Signal"];
const kpopMembers = ["Mina", "Yuri", "Hana", "Sera", "Jin", "Theo", "Rin"];
const tcgGroups = ["Kanto Vault", "Sky League", "Mint Lab", "Blue Trainer"];
const tcgMembers = ["Holo Starter", "Foil Trainer", "Gem Slab", "Vault Rare"];

const rarityStyles: Record<Rarity, string> = {
  Common: "rarity-common",
  Rare: "rarity-rare",
  Epic: "rarity-epic",
  Legendary: "rarity-legendary",
  Iruka: "rarity-iruka"
};

function formatWon(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  }).format(value);
}

function chooseRarity(odds: RarityConfig[]) {
  const roll = Math.random() * 100;
  let cursor = 0;

  for (const item of odds) {
    cursor += item.odds;
    if (roll <= cursor) return item;
  }

  return odds[0];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createPull(pack: Pack): CardPull {
  const rarity = chooseRarity(pack.odds);
  const estimatedValue = randomInt(rarity.valueRange[0], rarity.valueRange[1]);
  const isKpop = pack.category === "K-pop";
  const groups = isKpop ? kpopGroups : tcgGroups;
  const members = isKpop ? kpopMembers : tcgMembers;

  return {
    id: `${pack.id}-${Date.now()}-${Math.round(Math.random() * 10000)}`,
    packId: pack.id,
    category: pack.category,
    group: groups[randomInt(0, groups.length - 1)],
    member: members[randomInt(0, members.length - 1)],
    rarity: rarity.rarity,
    estimatedValue,
    buybackValue: Math.round(estimatedValue * 0.82),
    vaultStatus: "Vaulted",
    redeemable: true,
    imageStyle: `card-style-${randomInt(1, 5)}`,
    serial: `IRK-${randomInt(1000, 9999)}-${randomInt(10, 99)}`,
    pulledAt: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })
  };
}

function createMarketplacePurchase(item: MarketplaceCard): CardPull {
  return {
    id: `${item.id}-${Date.now()}-${Math.round(Math.random() * 10000)}`,
    packId: item.id,
    category: item.category,
    group: item.group,
    member: item.member,
    rarity: item.rarity,
    estimatedValue: item.fmv,
    buybackValue: Math.round(item.fmv * 0.82),
    vaultStatus: "Vaulted",
    redeemable: true,
    imageStyle: `card-style-${randomInt(1, 5)}`,
    serial: item.serial,
    pulledAt: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })
  };
}

function progress(remaining: number, total: number) {
  return Math.round(((total - remaining) / total) * 100);
}

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem("iruka-locale") === "ko" ? "ko" : "en";
}

function getInitialView(): AppView {
  if (typeof window === "undefined") return "home";
  const hash = window.location.hash.replace("#", "");
  return ["pull", "marketplace", "vault", "roadmap", "docs"].includes(hash) ? (hash as AppView) : "home";
}

function DolphinLogo() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <img src={irukaLogo} alt="" />
    </span>
  );
}

function PackVisual({ pack, compact = false }: { pack: Pack; compact?: boolean }) {
  return (
    <div className={`pack-visual tone-${pack.tone} ${compact ? "compact" : ""}`}>
      <img src={packProductImage} alt="" />
      <span className="light-sweep" />
    </div>
  );
}

function VendingImageSlot({ pack }: { pack: Pack }) {
  return (
    <div className={`vending-image-slot tone-${pack.tone}`}>
      <div className="vending-image-frame">
        <img src={packProductImage} alt="" />
        <span className="vending-image-sheen" />
      </div>
      <span className="light-sweep" />
    </div>
  );
}

function RevealedCard({ card, locale }: { card: CardPull; locale: Locale }) {
  const t = copy[locale];

  return (
    <article className={`revealed-card ${rarityStyles[card.rarity]} ${card.imageStyle}`}>
      <div className="revealed-top">
        <span>{t.categories[card.category]}</span>
        <span>{card.serial}</span>
      </div>
      <div className="revealed-image">
        <div className="card-slab" aria-hidden="true">
          <span className="card-slab-rail" />
          <span className="card-slab-emblem">
            <DolphinLogo />
          </span>
        </div>
      </div>
      <div className="revealed-copy">
        <strong>{card.member}</strong>
        <span>{card.group}</span>
      </div>
    </article>
  );
}

function App({ walletAuth = "disabled" }: { walletAuth?: WalletAuthMode }) {
  const [locale, setLocale] = useState<Locale>(getStoredLocale);
  const [selectedPackId, setSelectedPackId] = useState(packs[0].id);
  const [collection, setCollection] = useState<CardPull[]>([]);
  const [activePull, setActivePull] = useState<CardPull | undefined>();
  const [isOpening, setIsOpening] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(walletAuth === "disabled");
  const [walletPromptSignal, setWalletPromptSignal] = useState(0);
  const [notice, setNotice] = useState<string | undefined>();
  const [activeView, setActiveView] = useState<AppView>(getInitialView);
  const noticeTimerRef = useRef<number | undefined>(undefined);
  const revealSectionRef = useRef<HTMLElement | null>(null);
  const t = copy[locale];

  const selectedPack = useMemo(
    () => packs.find((pack) => pack.id === selectedPackId) ?? packs[0],
    [selectedPackId]
  );
  const selectedPackCopy = packCopy[locale][selectedPack.id];

  const openedCount = collection.filter(
    (card) => card.packId === selectedPack.id
  ).length;
  const selectedRemaining = Math.max(selectedPack.remaining - openedCount, 0);
  const supplyProgress = progress(selectedRemaining, selectedPack.total);
  const soldCount = collection.filter((card) => card.vaultStatus === "Sold").length;
  const redeemQueue = collection.filter(
    (card) => card.vaultStatus === "Redeem queued"
  );
  const hasVaultOps = soldCount > 0 || redeemQueue.length > 0;
  const walletRequired = walletAuth === "privy" && !isWalletConnected;
  const isPrimaryView = activeView === "pull";
  const shouldHighlightActivePull =
    activePull?.rarity === "Legendary" || activePull?.rarity === "Iruka";
  const recentActivity = useMemo(() => {
    const pullRows = collection.slice(0, 4).map((card) => {
      const sourcePack = packs.find((pack) => pack.id === card.packId);
      const sourceCopy = sourcePack ? packCopy[locale][sourcePack.id] : undefined;

      return {
        title: card.member,
        pack: sourceCopy?.name ?? card.group,
        status: t.statuses[card.vaultStatus],
        time: card.pulledAt,
        tone: sourcePack?.tone ?? "aqua"
      };
    });
    const fallbackRows = t.activity.map((item, index) => ({
      ...item,
      tone: packs[index % packs.length].tone
    }));

    return [...pullRows, ...fallbackRows].slice(0, 4);
  }, [collection, locale, t.activity, t.statuses]);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem("iruka-locale", locale);
  }, [locale]);

  useEffect(() => {
    return () => window.clearTimeout(noticeTimerRef.current);
  }, []);

  function showNotice(message: string) {
    window.clearTimeout(noticeTimerRef.current);
    setNotice(message);
    noticeTimerRef.current = window.setTimeout(() => setNotice(undefined), 2600);
  }

  function scrollToReveal() {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    revealSectionRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });
  }

  function choosePack(packId: string) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setSelectedPackId(packId);
    document.getElementById("drops")?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });
  }

  function showView(view: AppView, targetId?: string) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setActiveView(view);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!targetId) {
          window.scrollTo({
            top: 0,
            behavior: prefersReducedMotion ? "auto" : "smooth"
          });
          return;
        }

        document.getElementById(targetId)?.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start"
        });
      });
    });
  }

  function openPack() {
    if (isOpening || selectedRemaining === 0) return;

    if (walletRequired) {
      setWalletPromptSignal((value) => value + 1);
      showNotice(t.feedback.connectWallet);
      return;
    }

    setIsOpening(true);
    window.setTimeout(() => {
      const pull = createPull(selectedPack);
      setActivePull(pull);
      setCollection((items) => [pull, ...items]);
      setIsOpening(false);
      window.setTimeout(scrollToReveal, 40);
    }, 960);
  }

  function updateCardStatus(id: string, vaultStatus: VaultStatus) {
    setCollection((items) =>
      items.map((item) => (item.id === id ? { ...item, vaultStatus } : item))
    );
    setActivePull((card) => (card?.id === id ? { ...card, vaultStatus } : card));
    showNotice(
      {
        Vaulted: t.feedback.vaulted,
        Listed: t.feedback.listed,
        Sold: t.feedback.sold,
        "Redeem queued": t.feedback.shipQueued
      }[vaultStatus]
    );
  }

  function renderActivePullActions() {
    if (!activePull) return null;

    return (
      <div className="asset-actions">
        <button onClick={() => updateCardStatus(activePull.id, "Vaulted")} type="button">
          <ShieldCheck size={16} />
          {t.actions.vault}
        </button>
        <button onClick={() => updateCardStatus(activePull.id, "Sold")} type="button">
          <Store size={16} />
          {t.actions.sellNow}
        </button>
        <button
          onClick={() => updateCardStatus(activePull.id, "Redeem queued")}
          type="button"
        >
          <Send size={16} />
          {t.actions.ship}
        </button>
      </div>
    );
  }

  function buyMarketplaceCard(item: MarketplaceCard) {
    if (walletRequired) {
      setWalletPromptSignal((value) => value + 1);
      showNotice(t.feedback.connectWallet);
      return;
    }

    const purchase = createMarketplacePurchase(item);
    setCollection((items) => [purchase, ...items]);
    setActivePull(purchase);
    showNotice(t.feedback.purchaseQueued);
  }

  return (
    <main className="product-shell">
      <header className="app-nav">
        <nav className="nav-links" aria-label="Primary navigation">
          <button
            aria-pressed={activeView === "home"}
            className={activeView === "home" ? "selected" : ""}
            onClick={() => showView("home")}
            type="button"
          >
            {t.nav.home}
          </button>
          <button
            aria-pressed={activeView === "pull"}
            className={activeView === "pull" ? "selected" : ""}
            onClick={() => showView("pull", "drops")}
            type="button"
          >
            {t.nav.pull}
          </button>
          <button
            aria-pressed={activeView === "marketplace"}
            className={activeView === "marketplace" ? "selected" : ""}
            onClick={() => showView("marketplace")}
            type="button"
          >
            {t.nav.marketplace}
          </button>
        </nav>
        <a className="header-wordmark" href="/" aria-label="Iruka home">
          <img src={irukaWordmark} alt="Iruka" />
        </a>
        <div className="nav-actions">
          <div className="language-toggle" aria-label={t.nav.language}>
            {(["en", "ko"] as const).map((item) => (
              <button
                aria-pressed={locale === item}
                className={locale === item ? "selected" : ""}
                key={item}
                onClick={() => setLocale(item)}
                type="button"
              >
                {item === "en" ? "EN" : "KO"}
              </button>
            ))}
          </div>
          <AuthActions
            connectSignal={walletPromptSignal}
            labels={{
              connected: t.nav.walletConnected,
              connecting: t.nav.walletConnecting,
              disconnect: t.nav.walletDisconnect,
              login: t.nav.login,
              signUp: t.nav.signUp,
              unavailable: t.nav.wallet
            }}
            mode={walletAuth}
            onConnectedChange={setIsWalletConnected}
          />
        </div>
      </header>

      {activeView === "home" ? (
        <HomeView copy={t.home} onEnterVending={() => showView("pull", "drops")} />
      ) : null}

      {isPrimaryView ? (
        <div className="view-panel" data-view="pull">
          <section className={`drop-hero tone-${selectedPack.tone}`} id="drops">
            <div className="hero-art" aria-hidden="true">
              <VendingImageSlot pack={selectedPack} />
            </div>

            <div className="hero-panel">
              <div className="drop-label-row">
                <span>{t.categories[selectedPack.category]}</span>
                <span>
                  <Clock3 size={15} />
                  {selectedPack.closeTime}
                </span>
              </div>

              <h1>{selectedPackCopy.name}</h1>

              <div className="hero-price-row">
                <div>
                  <span>{t.hero.packPrice}</span>
                  <strong>{formatWon(selectedPack.price)}</strong>
                </div>
                <div>
                  <span>{t.hero.remaining}</span>
                  <strong>
                    {selectedRemaining}/{selectedPack.total}
                  </strong>
                </div>
              </div>

              <div className="supply-meter" aria-label={t.hero.supplyLabel}>
                <span style={{ width: `${supplyProgress}%` }} />
              </div>

              <IrukaBeam
                active={!isOpening && selectedRemaining > 0}
                className="primary-action-beam"
              >
                <button
                  className={`primary-action ${isOpening ? "opening" : ""}`}
                  disabled={isOpening || selectedRemaining === 0}
                  onClick={openPack}
                  type="button"
                >
                  {walletRequired ? <Wallet size={19} /> : <PackageOpen size={19} />}
                  {isOpening ? t.hero.opening : t.hero.openPack}
                </button>
              </IrukaBeam>

              <div className="market-strip" aria-label={t.sections.marketplace}>
                {t.marketStrip.map((item) => (
                  <div className="market-strip-item" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            {isOpening ? (
              <div className="reveal-flash" aria-hidden="true">
                <span />
              </div>
            ) : null}
          </section>

          <section className="activity-section" aria-label={t.sections.activity}>
            <div className="section-heading activity-heading">
              <div>
                <span>{t.sections.marketplace}</span>
                <h2>{t.sections.activity}</h2>
              </div>
              <button className="section-link" onClick={() => showView("pull", "drops")} type="button">
                {t.sections.openDrop}
              </button>
            </div>

            <div className="activity-grid">
              {recentActivity.map((item, index) => (
                <article className="activity-card" key={`${item.title}-${item.time}-${index}`}>
                  <div className={`activity-slab tone-${item.tone}`} aria-hidden="true">
                    <DolphinLogo />
                  </div>
                  <div className="activity-copy">
                    <span>{item.time}</span>
                    <strong>{item.title}</strong>
                    <small>{item.pack}</small>
                  </div>
                  <b>{item.status}</b>
                </article>
              ))}
            </div>
          </section>

          <section className="drop-rail-section" aria-label={t.sections.liveDrops}>
            <div className="section-heading">
              <h2>{t.sections.liveDrops}</h2>
            </div>
            <div className="drop-rail-wrap">
              <div className="drop-rail">
                {packs.map((pack) => {
                  const opened = collection.filter((card) => card.packId === pack.id).length;
                  const remaining = Math.max(pack.remaining - opened, 0);
                  const tileCopy = packCopy[locale][pack.id];

                  return (
                    <button
                      className={`drop-tile ${selectedPack.id === pack.id ? "selected" : ""}`}
                      key={pack.id}
                      onClick={() => choosePack(pack.id)}
                      type="button"
                    >
                      <PackVisual pack={pack} compact />
                      <span>{t.categories[pack.category]}</span>
                      <strong>{tileCopy.name}</strong>
                      <small>
                        {formatWon(pack.price)} · {remaining} {t.sections.left}
                      </small>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="reveal-section" ref={revealSectionRef}>
            <div className="reveal-stage">
              <div className="section-heading">
                <h2>{t.sections.reveal}</h2>
                {activePull ? <span>{activePull.serial}</span> : null}
              </div>
              {activePull ? (
                <div className="reveal-result">
                  {shouldHighlightActivePull ? (
                    <IrukaBeam
                      borderRadius={34}
                      className="reveal-card-beam"
                      strength={0.48}
                    >
                      <RevealedCard card={activePull} locale={locale} />
                    </IrukaBeam>
                  ) : (
                    <div className="reveal-card-cell">
                      <RevealedCard card={activePull} locale={locale} />
                    </div>
                  )}
                  {renderActivePullActions()}
                </div>
              ) : (
                <div className="sealed-stage vending-slot-stage">
                  <div className="vending-drop-slot" aria-hidden="true">
                    <span />
                  </div>
                  <div className={`sealed-card tone-${selectedPack.tone}`} aria-hidden="true">
                    <span className="sealed-card-mark">
                      <DolphinLogo />
                    </span>
                  </div>
                </div>
              )}
            </div>

            <aside className="order-panel">
              <div className="section-heading compact">
                <h2>{t.sections.odds}</h2>
              </div>
              <div className="odds-list">
                {selectedPack.odds.map((item) => (
                  <div className="odds-row" key={item.rarity}>
                    <span className={rarityStyles[item.rarity]}>{t.rarities[item.rarity]}</span>
                    <strong>{item.odds}%</strong>
                    <small>
                      {formatWon(item.valueRange[0])} - {formatWon(item.valueRange[1])}
                    </small>
                  </div>
                ))}
              </div>
            </aside>
          </section>

          <section className="chase-section" id="chase">
            <div className="section-heading">
              <h2>{t.sections.chaseCards}</h2>
            </div>
            <div className="chase-grid">
              {selectedPackCopy.chaseCards.map((chase, index) => (
                <article className="chase-card" key={chase}>
                  <span className="rarity-iruka">{t.rarities.Iruka}</span>
                  <strong>{chase}</strong>
                  <small>{selectedPackCopy.shortName}</small>
                  <b>{formatWon(selectedPack.odds[4].valueRange[index % 2])}</b>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {activeView === "marketplace" ? (
        <MarketplaceView
          copy={t.marketplacePage}
          items={marketplaceCards}
          locale={locale}
          onBuy={buyMarketplaceCard}
          onSell={(card) => updateCardStatus(card.id, "Listed")}
          ownedCards={collection.filter((card) => card.vaultStatus !== "Sold")}
        />
      ) : null}

      {activeView === "vault" ? (
        <section className="vault-section" id="vault">
          <div className="section-heading">
            <h2>{t.sections.vault}</h2>
            <span>
              {collection.length > 0
                ? `${collection.length} ${t.sections.cards}`
                : t.sections.empty}
            </span>
          </div>

          {collection.length > 0 ? (
            <div className="vault-table">
              {collection.map((card) => (
                <button
                  className="vault-row"
                  key={card.id}
                  onClick={() => setActivePull(card)}
                  type="button"
                >
                  <span className={`rarity-dot ${rarityStyles[card.rarity]}`} />
                  <strong>{card.member}</strong>
                  <span>{card.group}</span>
                  <span>{formatWon(card.estimatedValue)}</span>
                  <span>{t.statuses[card.vaultStatus]}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="vault-empty">
              <Box size={28} />
              <strong>{t.sections.vaultEmpty}</strong>
            </div>
          )}

          {renderActivePullActions()}

          {hasVaultOps ? (
            <div className="vault-ops" id="redeem">
              {soldCount > 0 ? <span>{t.sections.sold} {soldCount}</span> : null}
              {redeemQueue.length > 0 ? <span>{t.sections.redeem} {redeemQueue.length}</span> : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {activeView === "roadmap" ? (
        <section className="roadmap-section" id="roadmap">
          <div className="section-heading">
            <h2>{t.sections.roadmap}</h2>
          </div>

          <div className="roadmap-grid">
            {t.roadmap.map((item) => (
              <article className="roadmap-card" key={item.title}>
                <span>{item.status}</span>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeView === "docs" ? (
        <DocsView copy={t.docs} locale={locale} />
      ) : null}

      <footer className="site-footer" id="footer">
        <div className="footer-brand">
          <a className="footer-brand-link" href="/" aria-label="Iruka home">
            <DolphinLogo />
            <img src={irukaWordmark} alt="Iruka" />
          </a>
          <p>{t.footer.body}</p>
        </div>

        <nav className="footer-column" aria-label={t.footer.about}>
          <h2>{t.footer.about}</h2>
          <button onClick={() => showView("home")} type="button">
            {t.footer.links.home}
          </button>
          <button onClick={() => showView("pull")} type="button">
            {t.nav.pull}
          </button>
          <button onClick={() => showView("marketplace")} type="button">
            {t.footer.links.marketplace}
          </button>
        </nav>

        <nav className="footer-column" aria-label={t.footer.quickLinks}>
          <h2>{t.footer.quickLinks}</h2>
          <button onClick={() => showView("vault")} type="button">
            {t.footer.links.vault}
          </button>
          <button onClick={() => showView("roadmap")} type="button">
            {t.footer.links.roadmap}
          </button>
          <button onClick={() => showView("docs")} type="button">
            {t.footer.links.documentation}
          </button>
        </nav>

        <nav className="footer-column" aria-label={t.footer.support}>
          <h2>{t.footer.support}</h2>
          <a href="mailto:hello@playiruka.io">{t.footer.links.contact}</a>
        </nav>
      </footer>

      {notice ? (
        <div className="status-toast" role="status" aria-live="polite">
          {notice}
        </div>
      ) : null}
    </main>
  );
}

export default App;
