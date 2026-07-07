import { usePrivy, useWallets } from "@privy-io/react-auth";
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
import irukaLogo from "./assets/iruka-logo.png";
import packProductImage from "./assets/iruka-pack-product.png";

type WalletAuthMode = "disabled" | "privy";
type Locale = "en" | "ko";
type AppView = "marketplace" | "vault" | "roadmap";
type Rarity = "Common" | "Rare" | "Epic" | "Legendary" | "Iruka";
type VaultStatus = "Vaulted" | "Listed" | "Sold" | "Redeem queued";
type Category = "K-pop" | "TCG";

const DOCS_URL = "https://docs.playiruka.io";

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
      drops: "Drops",
      chase: "Chase",
      vault: "Vault",
      roadmap: "Roadmap",
      docs: "Docs",
      wallet: "Connect wallet",
      walletConnected: "Connected",
      walletConnecting: "Connecting",
      walletDisconnect: "Disconnect wallet",
      language: "Language"
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
      connectWallet: "Connect wallet to open a pack.",
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
    footer: {
      body: "Pull K-pop and collectible packs, reveal cards, keep them vaulted, sell, or ship them from one GIWA-ready marketplace.",
      about: "About Us",
      quickLinks: "Quick Links",
      support: "Support",
      social: "Social Media",
      socialBody: "Follow Iruka for drop updates, community highlights, and collection news.",
      links: {
        home: "Home",
        marketplace: "Marketplace",
        drops: "Drops",
        vault: "Vault",
        roadmap: "Roadmap",
        contact: "Contact Us",
        documentation: "Documentation",
        terms: "Terms of Service",
        privacy: "Privacy Policy"
      },
      socialItems: ["X", "Discord", "GitBook"]
    }
  },
  ko: {
    nav: {
      drops: "드롭",
      chase: "체이스",
      vault: "보관함",
      roadmap: "로드맵",
      docs: "문서",
      wallet: "지갑 연결",
      walletConnected: "연결됨",
      walletConnecting: "연결 중",
      walletDisconnect: "지갑 연결 해제",
      language: "언어"
    },
    hero: {
      packPrice: "팩 가격",
      remaining: "남은 수량",
      supplyLabel: "팩 판매 현황",
      openPack: "팩 뽑기",
      opening: "뽑는 중"
    },
    marketStrip: [
      { label: "보관", value: "실물 보관" },
      { label: "정산", value: "판매/배송" },
      { label: "지갑", value: "EVM 지원" }
    ],
    activity: [
      {
        title: "오로라 스테이지",
        pack: "걸그룹 이루카 팩",
        status: "오픈됨",
        time: "42초 전"
      },
      {
        title: "사인 이벤트",
        pack: "걸그룹 이루카 팩",
        status: "보관됨",
        time: "1분 전"
      },
      {
        title: "벨벳 시그널",
        pack: "프리미엄 아이돌 드롭 #001",
        status: "리스팅",
        time: "3분 전"
      },
      {
        title: "블루 아워",
        pack: "보이그룹 이루카 팩",
        status: "오픈됨",
        time: "5분 전"
      }
    ],
    feedback: {
      connectWallet: "팩을 열려면 지갑을 연결하세요.",
      vaulted: "보관함에 저장됐어요.",
      sold: "판매 상태로 변경됐어요.",
      shipQueued: "배송 대기열에 추가됐어요."
    },
    sections: {
      marketplace: "마켓",
      activity: "방금 열린 카드",
      liveDrops: "진행 중인 드롭",
      openDrop: "팩 뽑기",
      left: "남음",
      reveal: "리빌",
      odds: "확률",
      chaseCards: "체이스 카드",
      vault: "보관함",
      roadmap: "로드맵",
      empty: "비어 있음",
      cards: "장",
      vaultEmpty: "보관함이 비어 있어요",
      sold: "판매",
      redeem: "배송"
    },
    actions: {
      vault: "보관",
      sellNow: "즉시 판매",
      ship: "배송"
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
      Vaulted: "보관중",
      Listed: "리스팅됨",
      Sold: "판매됨",
      "Redeem queued": "배송 대기"
    },
    roadmap: [
      {
        status: "예정",
        title: "팬 커뮤니티 게시판",
        body: "아이돌 팬들이 그룹별 게시판에서 팩 결과와 드롭 정보를 함께 나눌 수 있게 열 예정입니다."
      },
      {
        status: "예정",
        title: "GitBook 문서화",
        body: "Vault 흐름, 리딤 구조, 서비스 구조, GIWA 연동을 GitBook에 상세히 정리할 예정입니다."
      }
    ],
    footer: {
      body: "케이팝과 컬렉터블 팩을 뽑고, 카드를 리빌하고, 보관/판매/배송까지 이어지는 GIWA-ready 마켓플레이스입니다.",
      about: "소개",
      quickLinks: "바로가기",
      support: "지원",
      social: "소셜",
      socialBody: "드롭 업데이트, 커뮤니티 소식, 컬렉션 뉴스를 Iruka 채널에서 전할 예정입니다.",
      links: {
        home: "홈",
        marketplace: "마켓플레이스",
        drops: "드롭",
        vault: "보관함",
        roadmap: "로드맵",
        contact: "문의하기",
        documentation: "문서",
        terms: "이용약관",
        privacy: "개인정보 처리방침"
      },
      socialItems: ["X", "Discord", "GitBook"]
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
      name: "걸그룹 이루카 팩",
      shortName: "걸그룹",
      chaseCards: ["오로라 스테이지", "블루 아워", "사인 이벤트"]
    },
    "boy-grail": {
      name: "보이그룹 이루카 팩",
      shortName: "보이그룹",
      chaseCards: ["월드 투어", "팬사인", "데뷔 시절"]
    },
    "ive-drop": {
      name: "프리미엄 아이돌 드롭 #001",
      shortName: "프리미엄 아이돌",
      chaseCards: ["벨벳 시그널", "애프터글로우", "블루 스테이지"]
    },
    "aespa-drop": {
      name: "루키 아이돌 드롭 #001",
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

function progress(remaining: number, total: number) {
  return Math.round(((total - remaining) / total) * 100);
}

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem("iruka-locale") === "ko" ? "ko" : "en";
}

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
        <DolphinLogo />
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

function FallbackWalletButton({ locale }: { locale: Locale }) {
  const t = copy[locale];

  return (
    <button
      className="wallet-button wallet-button-disabled"
      disabled
      title="Set VITE_PRIVY_APP_ID to enable Privy wallet login."
      type="button"
      aria-label={t.nav.wallet}
    >
      <Wallet size={16} />
      <span className="wallet-label">{t.nav.wallet}</span>
    </button>
  );
}

function PrivyWalletButton({
  connectSignal,
  locale,
  onConnectedChange
}: {
  connectSignal: number;
  locale: Locale;
  onConnectedChange: (connected: boolean) => void;
}) {
  const { authenticated, connectOrCreateWallet, logout, ready, user } = usePrivy();
  const { wallets } = useWallets();
  const t = copy[locale];
  const connectedAddress = user?.wallet?.address ?? wallets[0]?.address;
  const label = !ready
    ? t.nav.walletConnecting
    : authenticated && connectedAddress
      ? formatAddress(connectedAddress)
      : authenticated
        ? t.nav.walletConnected
        : t.nav.wallet;

  useEffect(() => {
    onConnectedChange(authenticated);
  }, [authenticated, onConnectedChange]);

  useEffect(() => {
    if (connectSignal > 0 && ready && !authenticated) {
      void connectOrCreateWallet();
    }
  }, [authenticated, connectOrCreateWallet, connectSignal, ready]);

  return (
    <button
      className={`wallet-button ${authenticated ? "wallet-button-connected" : ""}`}
      disabled={!ready}
      onClick={() => {
        if (authenticated) {
          void logout();
          return;
        }
        void connectOrCreateWallet();
      }}
      title={authenticated ? t.nav.walletDisconnect : t.nav.wallet}
      type="button"
      aria-label={authenticated ? t.nav.walletDisconnect : t.nav.wallet}
    >
      <Wallet size={16} />
      <span className="wallet-label">{label}</span>
    </button>
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
  const [activeView, setActiveView] = useState<AppView>("marketplace");
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

  function showView(view: AppView) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setActiveView(view);
    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth"
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
        Listed: t.feedback.vaulted,
        Sold: t.feedback.sold,
        "Redeem queued": t.feedback.shipQueued
      }[vaultStatus]
    );
  }

  return (
    <main className="product-shell">
      <header className="app-nav">
        <a className="brand" href="/" aria-label="Iruka home">
          <DolphinLogo />
          <span>Iruka</span>
        </a>
        <nav className="nav-links" aria-label="Primary navigation">
          <button
            aria-pressed={activeView === "marketplace"}
            className={activeView === "marketplace" ? "selected" : ""}
            onClick={() => showView("marketplace")}
            type="button"
          >
            {t.sections.marketplace}
          </button>
          <button
            aria-pressed={activeView === "vault"}
            className={activeView === "vault" ? "selected" : ""}
            onClick={() => showView("vault")}
            type="button"
          >
            {t.nav.vault}
          </button>
          <button
            aria-pressed={activeView === "roadmap"}
            className={activeView === "roadmap" ? "selected" : ""}
            onClick={() => showView("roadmap")}
            type="button"
          >
            {t.nav.roadmap}
          </button>
          <a href={DOCS_URL} rel="noreferrer" target="_blank">
            {t.nav.docs}
          </a>
        </nav>
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
          {walletAuth === "privy" ? (
            <PrivyWalletButton
              connectSignal={walletPromptSignal}
              locale={locale}
              onConnectedChange={setIsWalletConnected}
            />
          ) : (
            <FallbackWalletButton locale={locale} />
          )}
        </div>
      </header>

      {activeView === "marketplace" ? (
        <div className="view-panel" data-view="marketplace">
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

              <button
                className={`primary-action ${isOpening ? "opening" : ""}`}
                disabled={isOpening || selectedRemaining === 0}
                onClick={openPack}
                type="button"
              >
                {walletRequired ? <Wallet size={19} /> : <PackageOpen size={19} />}
                {isOpening ? t.hero.opening : t.hero.openPack}
              </button>

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
              <button className="section-link" onClick={() => showView("marketplace")} type="button">
                {t.sections.openDrop}
              </button>
            </div>

            <div className="activity-grid">
              {t.activity.map((item, index) => (
                <article className="activity-card" key={`${item.title}-${item.time}`}>
                  <div className={`activity-slab tone-${packs[index % packs.length].tone}`} aria-hidden="true">
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
                      onClick={() => setSelectedPackId(pack.id)}
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
                <RevealedCard card={activePull} locale={locale} />
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

          {activePull ? (
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
          ) : null}

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

      <footer className="site-footer" id="footer">
        <div className="footer-brand">
          <a className="brand" href="/" aria-label="Iruka home">
            <DolphinLogo />
            <span>Iruka</span>
          </a>
          <p>{t.footer.body}</p>
        </div>

        <nav className="footer-column" aria-label={t.footer.about}>
          <h2>{t.footer.about}</h2>
          <button onClick={() => showView("marketplace")} type="button">
            {t.footer.links.marketplace}
          </button>
          <button onClick={() => showView("vault")} type="button">
            {t.footer.links.vault}
          </button>
          <button onClick={() => showView("roadmap")} type="button">
            {t.footer.links.roadmap}
          </button>
        </nav>

        <nav className="footer-column" aria-label={t.footer.quickLinks}>
          <h2>{t.footer.quickLinks}</h2>
          <button onClick={() => showView("marketplace")} type="button">
            {t.footer.links.home}
          </button>
          <button onClick={() => showView("marketplace")} type="button">
            {t.footer.links.drops}
          </button>
          <button onClick={() => showView("marketplace")} type="button">
            {t.nav.chase}
          </button>
          <button onClick={() => showView("vault")} type="button">
            {t.nav.vault}
          </button>
        </nav>

        <nav className="footer-column" aria-label={t.footer.support}>
          <h2>{t.footer.support}</h2>
          <a href="mailto:hello@playiruka.io">{t.footer.links.contact}</a>
          <a href={DOCS_URL} rel="noreferrer" target="_blank">
            {t.footer.links.documentation}
          </a>
          <a href="#footer">{t.footer.links.terms}</a>
          <a href="#footer">{t.footer.links.privacy}</a>
        </nav>

        <div className="footer-column footer-social">
          <h2>{t.footer.social}</h2>
          <p>{t.footer.socialBody}</p>
          <div className="footer-social-list" aria-label={t.footer.social}>
            {t.footer.socialItems.map((item) => {
              return item === "GitBook" ? (
                <a href={DOCS_URL} key={item} rel="noreferrer" target="_blank">
                  {item}
                </a>
              ) : (
                <span key={item}>{item}</span>
              );
            })}
          </div>
        </div>
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
