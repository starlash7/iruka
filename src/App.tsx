import {
  Box,
  Clock3,
  PackageOpen,
  Send,
  ShieldCheck,
  Store,
  Wallet
} from "lucide-react";
import { useMemo, useState } from "react";
import packProductImage from "./assets/iruka-pack-product.png";

type Rarity = "Common" | "Rare" | "Super Rare" | "Grail";
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

const packs: Pack[] = [
  {
    id: "girl-grail",
    name: "Girl Group Grail Pack",
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
      { rarity: "Rare", odds: 30, valueRange: [30000, 80000] },
      { rarity: "Super Rare", odds: 8, valueRange: [100000, 300000] },
      { rarity: "Grail", odds: 2, valueRange: [500000, 1200000] }
    ]
  },
  {
    id: "boy-grail",
    name: "Boy Group Grail Pack",
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
      { rarity: "Rare", odds: 31, valueRange: [35000, 90000] },
      { rarity: "Super Rare", odds: 9, valueRange: [120000, 340000] },
      { rarity: "Grail", odds: 2, valueRange: [650000, 1500000] }
    ]
  },
  {
    id: "ive-drop",
    name: "IVE Drop #001",
    shortName: "IVE #001",
    category: "K-pop",
    price: 59900,
    remaining: 31,
    total: 60,
    closeTime: "06:22:41",
    theme: "Group-only drop",
    tone: "cyan",
    chaseCards: ["Love Dive", "After Like", "Blue Blood"],
    odds: [
      { rarity: "Common", odds: 52, valueRange: [12000, 32000] },
      { rarity: "Rare", odds: 34, valueRange: [42000, 110000] },
      { rarity: "Super Rare", odds: 11, valueRange: [130000, 380000] },
      { rarity: "Grail", odds: 3, valueRange: [700000, 1600000] }
    ]
  },
  {
    id: "aespa-drop",
    name: "aespa Drop #001",
    shortName: "aespa #001",
    category: "K-pop",
    price: 54900,
    remaining: 44,
    total: 70,
    closeTime: "22:08:33",
    theme: "Group-only drop",
    tone: "mint",
    chaseCards: ["Synk Live", "Drama Unit", "Armageddon"],
    odds: [
      { rarity: "Common", odds: 54, valueRange: [10000, 30000] },
      { rarity: "Rare", odds: 33, valueRange: [38000, 105000] },
      { rarity: "Super Rare", odds: 10, valueRange: [125000, 360000] },
      { rarity: "Grail", odds: 3, valueRange: [650000, 1400000] }
    ]
  },
  {
    id: "pokemon-slab",
    name: "Pokemon Slab Pack",
    shortName: "Pokemon Slab",
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
      { rarity: "Rare", odds: 34, valueRange: [85000, 180000] },
      { rarity: "Super Rare", odds: 13, valueRange: [220000, 550000] },
      { rarity: "Grail", odds: 3, valueRange: [900000, 2400000] }
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
  "Super Rare": "rarity-super",
  Grail: "rarity-grail"
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
    group:
      pack.id === "ive-drop"
        ? "IVE"
        : pack.id === "aespa-drop"
          ? "aespa"
          : groups[randomInt(0, groups.length - 1)],
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

function DolphinLogo() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <svg viewBox="0 0 64 64" role="img">
        <path
          d="M13 36c7-13 21-20 38-19-5 4-8 8-9 12 4 1 8 4 11 8-8 0-14-1-20-5-4 6-10 10-18 12 3-2 5-5 6-8-3 1-6 1-8 0Z"
          fill="currentColor"
        />
        <path
          d="M25 22c-3-6-8-9-15-9 3 7 8 11 15 12v-3Z"
          fill="currentColor"
          opacity="0.72"
        />
        <circle cx="42" cy="23" r="2.1" fill="#0A0B0E" />
      </svg>
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

function TrustStrip() {
  return (
    <div className="trust-strip" aria-label="RWA trust signals">
      <ShieldCheck size={16} />
      <span>Verified physical cards. Vault, sell, or ship anytime.</span>
    </div>
  );
}

function RevealedCard({ card }: { card: CardPull }) {
  return (
    <article className={`revealed-card ${rarityStyles[card.rarity]} ${card.imageStyle}`}>
      <div className="revealed-top">
        <span>{card.category}</span>
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

function App() {
  const [selectedPackId, setSelectedPackId] = useState(packs[0].id);
  const [collection, setCollection] = useState<CardPull[]>([]);
  const [activePull, setActivePull] = useState<CardPull | undefined>();
  const [isOpening, setIsOpening] = useState(false);

  const selectedPack = useMemo(
    () => packs.find((pack) => pack.id === selectedPackId) ?? packs[0],
    [selectedPackId]
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

  function openPack() {
    if (isOpening || selectedRemaining === 0) return;

    setIsOpening(true);
    window.setTimeout(() => {
      const pull = createPull(selectedPack);
      setActivePull(pull);
      setCollection((items) => [pull, ...items]);
      setIsOpening(false);
    }, 960);
  }

  function updateCardStatus(id: string, vaultStatus: VaultStatus) {
    setCollection((items) =>
      items.map((item) => (item.id === id ? { ...item, vaultStatus } : item))
    );
    setActivePull((card) => (card?.id === id ? { ...card, vaultStatus } : card));
  }

  return (
    <main className="product-shell">
      <header className="app-nav">
        <a className="brand" href="/" aria-label="Iruka home">
          <DolphinLogo />
          <span>Iruka</span>
        </a>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#drops">Drops</a>
          <a href="#chase">Chase</a>
          <a href="#vault">Vault</a>
        </nav>
        <div className="nav-ticker" aria-label="Live market ticker">
          <span>24h {formatWon(18400000)}</span>
          <span>1,284 in vault</span>
          <span>GIWA ready</span>
        </div>
        <button className="wallet-button" type="button">
          <Wallet size={16} />
          Wallet
        </button>
      </header>

      <section className={`drop-hero tone-${selectedPack.tone}`} id="drops">
        <div className="hero-art" aria-hidden="true">
          <PackVisual pack={selectedPack} />
        </div>

        <div className="hero-panel">
          <div className="drop-label-row">
            <span>{selectedPack.category}</span>
            <span>
              <Clock3 size={15} />
              {selectedPack.closeTime}
            </span>
          </div>

          <h1>{selectedPack.name}</h1>

          <div className="hero-price-row">
            <div>
              <span>Pack price</span>
              <strong>{formatWon(selectedPack.price)}</strong>
            </div>
            <div>
              <span>Remaining</span>
              <strong>
                {selectedRemaining}/{selectedPack.total}
              </strong>
            </div>
          </div>

          <div className="supply-meter" aria-label="Pack supply sold">
            <span style={{ width: `${supplyProgress}%` }} />
          </div>

          <button
            className={`primary-action ${isOpening ? "opening" : ""}`}
            disabled={isOpening || selectedRemaining === 0}
            onClick={openPack}
            type="button"
          >
            <PackageOpen size={19} />
            {isOpening ? "Opening" : "Open pack"}
          </button>

          <TrustStrip />
        </div>

        {isOpening ? (
          <div className="reveal-flash" aria-hidden="true">
            <span />
          </div>
        ) : null}
      </section>

      <section className="drop-rail-section" aria-label="Other live drops">
        <div className="section-heading">
          <h2>Live drops</h2>
          <span>{packs.length} active</span>
        </div>
        <div className="drop-rail">
          {packs.map((pack) => {
            const opened = collection.filter((card) => card.packId === pack.id).length;
            const remaining = Math.max(pack.remaining - opened, 0);

            return (
              <button
                className={`drop-tile ${selectedPack.id === pack.id ? "selected" : ""}`}
                key={pack.id}
                onClick={() => setSelectedPackId(pack.id)}
                type="button"
              >
                <PackVisual pack={pack} compact />
                <span>{pack.category}</span>
                <strong>{pack.name}</strong>
                <small>
                  {formatWon(pack.price)} · {remaining} left
                </small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="reveal-section">
        <div className="reveal-stage">
          <div className="section-heading">
            <h2>Reveal</h2>
            <span>{activePull ? activePull.serial : "Ready"}</span>
          </div>
          {activePull ? (
            <RevealedCard card={activePull} />
          ) : (
            <div className="sealed-stage">
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
            <h2>Settlement</h2>
            <span>{formatWon(selectedPack.price)}</span>
          </div>
          <div className="order-lines">
            <div>
              <span>Payment</span>
              <strong>Wallet</strong>
            </div>
            <div>
              <span>Delivery</span>
              <strong>Vault first</strong>
            </div>
            <div>
              <span>Cashout</span>
              <strong>82%</strong>
            </div>
          </div>
          <div className="odds-list">
            {selectedPack.odds.map((item) => (
              <div className="odds-row" key={item.rarity}>
                <span className={rarityStyles[item.rarity]}>{item.rarity}</span>
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
          <h2>Chase cards</h2>
          <span>Highest FMV</span>
        </div>
        <div className="chase-grid">
          {selectedPack.chaseCards.map((chase, index) => (
            <article className="chase-card" key={chase}>
              <span className="rarity-grail">Grail</span>
              <strong>{chase}</strong>
              <small>{selectedPack.shortName}</small>
              <b>{formatWon(selectedPack.odds[3].valueRange[index % 2])}</b>
            </article>
          ))}
        </div>
      </section>

      <section className="vault-section" id="vault">
        <div className="section-heading">
          <h2>Vault</h2>
          <span>
            {collection.length > 0
              ? `${collection.length} cards`
              : "Empty"}
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
                <span>{card.vaultStatus}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="vault-empty">
            <Box size={28} />
            <strong>Vault empty</strong>
          </div>
        )}

        {activePull ? (
          <div className="asset-actions">
            <button onClick={() => updateCardStatus(activePull.id, "Vaulted")} type="button">
              <ShieldCheck size={16} />
              Vault
            </button>
            <button onClick={() => updateCardStatus(activePull.id, "Sold")} type="button">
              <Store size={16} />
              Sell now
            </button>
            <button
              onClick={() => updateCardStatus(activePull.id, "Redeem queued")}
              type="button"
            >
              <Send size={16} />
              Ship
            </button>
          </div>
        ) : null}

        {hasVaultOps ? (
          <div className="vault-ops" id="redeem">
            {soldCount > 0 ? <span>Sold {soldCount}</span> : null}
            {redeemQueue.length > 0 ? <span>Redeem {redeemQueue.length}</span> : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default App;
