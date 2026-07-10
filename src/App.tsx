import {
  Box,
  Send,
  ShieldCheck,
  Store
} from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AuthActions } from "./AuthActions";
import irukaLogo from "./assets/iruka-logo.png";
import packProductImage from "./assets/iruka-pack-product.png";
import irukaWordmark from "./assets/iruka-wordmark.png";
import { DocsView } from "./DocsView";
import { HomeView } from "./HomeView";
import { MarketplaceView } from "./MarketplaceView";
import { marketplaceCards, type MarketplaceCard } from "./marketplaceData";
import type { IrukaRarity, RevealCard } from "./features/pack-reveal/revealConfig";
import { RoadmapView } from "./RoadmapView";
import { VaultGuide } from "./VaultGuide";
import { VendingView } from "./VendingView";
import type {
  CardPull,
  ChaseCard,
  Pack,
  Rarity,
  RarityConfig,
  VaultStatus
} from "./vendingTypes";

type WalletAuthMode = "disabled" | "privy";
type Locale = "en" | "ko";
type AppView = "home" | "pull" | "marketplace" | "vault" | "roadmap" | "docs";

const MINTLIFY_DOCS_URL = "https://docs.playiruka.space/overview";
const PackRevealOverlay = lazy(() =>
  import("./features/pack-reveal/PackRevealOverlay").then((module) => ({
    default: module.PackRevealOverlay
  }))
);

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
      rightBody: "",
      rightTitle: "Fresh packs on demand",
      vendingMeta: "",
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
    },
    revealOverlay: {
      estimatedValue: "Est. value",
      skip: "Skip",
      soundOff: "Sound off",
      soundOn: "Sound on"
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
      rightBody: "",
      rightTitle: "팩을 고르고 바로 열어요",
      vendingMeta: "",
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
    },
    revealOverlay: {
      estimatedValue: "예상 시세",
      skip: "건너뛰기",
      soundOff: "소리 꺼짐",
      soundOn: "소리 켜짐"
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

function createChaseCards(packId: string, values: [number, number, number, number]): ChaseCard[] {
  const rarities: Rarity[] = ["Iruka", "Legendary", "Epic", "Rare"];

  return values.map((estimatedValue, index) => ({
    estimatedValue,
    id: `${packId}-chase-${index + 1}`,
    imageUrl: packProductImage,
    rarity: rarities[index]
  }));
}

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
    heroImage: packProductImage,
    theme: "Multi-group grails",
    tone: "aqua",
    chaseCards: createChaseCards("girl-grail", [1500000, 1200000, 300000, 80000]),
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
    heroImage: packProductImage,
    theme: "Fan-sign era cards",
    tone: "smoke",
    chaseCards: createChaseCards("boy-grail", [1700000, 1500000, 340000, 90000]),
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
    heroImage: packProductImage,
    theme: "Verified idol mix",
    tone: "cyan",
    chaseCards: createChaseCards("ive-drop", [1800000, 1600000, 380000, 110000]),
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
    heroImage: packProductImage,
    theme: "Verified rookie mix",
    tone: "mint",
    chaseCards: createChaseCards("aespa-drop", [1600000, 1400000, 360000, 105000]),
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
    heroImage: packProductImage,
    theme: "Graded slab proof",
    tone: "rose",
    chaseCards: createChaseCards("pokemon-slab", [2600000, 2400000, 550000, 180000]),
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

function escapeSvgText(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function toRevealRarity(rarity: Rarity): IrukaRarity {
  return rarity.toLowerCase() as IrukaRarity;
}

function createRevealImageUrl(card: CardPull, locale: Locale) {
  const rarityLabel = copy[locale].rarities[card.rarity];
  const title = escapeSvgText(card.member);
  const subtitle = escapeSvgText(card.group);
  const serial = escapeSvgText(card.serial);
  const rarity = escapeSvgText(rarityLabel);
  const value = escapeSvgText(formatWon(card.estimatedValue));
  const accent = {
    Common: "#98A2B3",
    Rare: "#12B76A",
    Epic: "#F04438",
    Legendary: "#F5C842",
    Iruka: "#6F8DFF"
  }[card.rarity];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 900">
      <defs>
        <linearGradient id="face" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#FFFFFF"/>
          <stop offset="0.48" stop-color="#EAF4FF"/>
          <stop offset="1" stop-color="${accent}"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="34%" r="60%">
          <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.92"/>
          <stop offset="0.45" stop-color="${accent}" stop-opacity="0.22"/>
          <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="640" height="900" rx="52" fill="#FFFFFF"/>
      <rect x="28" y="28" width="584" height="844" rx="42" fill="url(#face)" opacity="0.72"/>
      <rect x="62" y="80" width="516" height="560" rx="34" fill="#FFFFFF" opacity="0.62"/>
      <rect x="62" y="80" width="516" height="560" rx="34" fill="url(#glow)"/>
      <path d="M80 438 C190 400 274 456 384 410 C468 374 530 380 578 360 L578 640 L80 640 Z" fill="#FFFFFF" opacity="0.46"/>
      <circle cx="320" cy="330" r="78" fill="${accent}" opacity="0.58"/>
      <circle cx="320" cy="330" r="36" fill="#FFFFFF" opacity="0.5"/>
      <text x="320" y="116" text-anchor="middle" fill="#475467" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="800">${serial}</text>
      <text x="320" y="514" text-anchor="middle" fill="#101828" font-family="Inter, Arial, sans-serif" font-size="106" font-weight="800">${title.slice(0, 2).toUpperCase()}</text>
      <text x="86" y="716" fill="#101828" font-family="Inter, Arial, sans-serif" font-size="46" font-weight="900">${title}</text>
      <text x="86" y="766" fill="#667085" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700">${subtitle}</text>
      <text x="86" y="820" fill="${accent}" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="900">${rarity}</text>
      <text x="554" y="820" text-anchor="end" fill="#101828" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="900">${value}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function createRevealCard(card: CardPull, locale: Locale): RevealCard {
  return {
    estimatedValue: card.estimatedValue,
    imageUrl: createRevealImageUrl(card, locale),
    name: card.member,
    rarity: toRevealRarity(card.rarity),
    serial: card.serial
  };
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
        <img
          alt=""
          className="revealed-card-art"
          src={createRevealImageUrl(card, locale)}
        />
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
  const [pendingReveal, setPendingReveal] = useState<CardPull | undefined>();
  const [isOpening, setIsOpening] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(walletAuth === "disabled");
  const [walletPromptSignal, setWalletPromptSignal] = useState(0);
  const [notice, setNotice] = useState<string | undefined>();
  const [activeView, setActiveView] = useState<AppView>(getInitialView);
  const noticeTimerRef = useRef<number | undefined>(undefined);
  const revealCompleteRef = useRef(false);
  const revealSectionRef = useRef<HTMLElement | null>(null);
  const t = copy[locale];

  const selectedPack = useMemo(
    () => packs.find((pack) => pack.id === selectedPackId) ?? packs[0],
    [selectedPackId]
  );
  const pendingRevealCard = useMemo(
    () => (pendingReveal ? createRevealCard(pendingReveal, locale) : undefined),
    [locale, pendingReveal]
  );

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

    setActivePull(undefined);
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

    revealCompleteRef.current = false;
    setIsOpening(true);
    setPendingReveal(createPull(selectedPack));
  }

  function completePendingReveal() {
    if (!pendingReveal || revealCompleteRef.current) return;

    revealCompleteRef.current = true;
    setActivePull(pendingReveal);
    setCollection((items) => [pendingReveal, ...items]);
    setPendingReveal(undefined);
    setIsOpening(false);
    window.setTimeout(scrollToReveal, 40);
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
        <VendingView
          activePull={activePull}
          collection={collection}
          copy={{
            categories: t.categories,
            hero: t.hero,
            labels: {
              chaseCards: t.sections.chaseCards,
              left: t.sections.left,
              morePacks: t.vending.morePacks,
              packOdds: t.vending.packOdds,
              physicalRedemption: t.vending.physicalRedemption,
              recentPulls: t.vending.recentPulls,
              vaultEligible: t.vending.vaultEligible,
              yourPull: t.vending.yourPull
            },
            rarities: t.rarities
          }}
          formatValue={formatWon}
          getCardImageUrl={(card) => createRevealImageUrl(card, locale)}
          isOpening={isOpening}
          onOpenPack={openPack}
          onSelectPack={choosePack}
          packCopies={packCopy[locale]}
          packs={packs}
          pullActions={renderActivePullActions()}
          pullCard={activePull ? <RevealedCard card={activePull} locale={locale} /> : null}
          resultRef={revealSectionRef}
          selectedPack={selectedPack}
          selectedRemaining={selectedRemaining}
          supplyProgress={supplyProgress}
          walletRequired={walletRequired}
        />
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

          <VaultGuide locale={locale} statusLabels={t.statuses} />
        </section>
      ) : null}

      {activeView === "roadmap" ? (
        <RoadmapView locale={locale} />
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
          <a href={MINTLIFY_DOCS_URL} target="_blank" rel="noreferrer">
            {t.footer.links.documentation}
          </a>
        </nav>

        <nav className="footer-column" aria-label={t.footer.support}>
          <h2>{t.footer.support}</h2>
          <a href="mailto:hello@playiruka.io">{t.footer.links.contact}</a>
        </nav>
      </footer>

      {pendingRevealCard ? (
        <Suspense fallback={<div className="pack-reveal-overlay pack-reveal-loading" aria-hidden="true" />}>
          <PackRevealOverlay
            cards={[pendingRevealCard]}
            labels={t.revealOverlay}
            onComplete={completePendingReveal}
          />
        </Suspense>
      ) : null}

      {notice ? (
        <div className="status-toast" role="status" aria-live="polite">
          {notice}
        </div>
      ) : null}
    </main>
  );
}

export default App;
