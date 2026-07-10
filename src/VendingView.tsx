import { PackageCheck, PackageOpen, ShieldCheck, Wallet } from "lucide-react";
import type { ReactNode, Ref } from "react";
import { IrukaBeam } from "./IrukaBeam";
import type { CardPull, Category, Pack, PackCopy, Rarity } from "./vendingTypes";

type VendingViewCopy = {
  categories: Record<Category, string>;
  hero: {
    openPack: string;
    opening: string;
    packPrice: string;
    remaining: string;
    supplyLabel: string;
  };
  labels: {
    chaseCards: string;
    left: string;
    morePacks: string;
    packOdds: string;
    physicalRedemption: string;
    recentPulls: string;
    vaultEligible: string;
    yourPull: string;
  };
  rarities: Record<Rarity, string>;
};

type VendingViewProps = {
  activePull?: CardPull;
  collection: CardPull[];
  copy: VendingViewCopy;
  formatValue: (value: number) => string;
  getCardImageUrl: (card: CardPull) => string;
  isOpening: boolean;
  onOpenPack: () => void;
  onSelectPack: (packId: string) => void;
  packCopies: Record<string, PackCopy>;
  packs: Pack[];
  pullActions: ReactNode;
  pullCard: ReactNode;
  resultRef: Ref<HTMLElement>;
  selectedPack: Pack;
  selectedRemaining: number;
  supplyProgress: number;
  walletRequired: boolean;
};

function getRarityClass(rarity: Rarity) {
  return `rarity-${rarity.toLowerCase()}`;
}

export function VendingView({
  activePull,
  collection,
  copy,
  formatValue,
  getCardImageUrl,
  isOpening,
  onOpenPack,
  onSelectPack,
  packCopies,
  packs,
  pullActions,
  pullCard,
  resultRef,
  selectedPack,
  selectedRemaining,
  supplyProgress,
  walletRequired
}: VendingViewProps) {
  const selectedCopy = packCopies[selectedPack.id];
  const visiblePull = activePull?.packId === selectedPack.id ? activePull : undefined;
  const recentPulls = collection
    .filter((card) => packs.some((pack) => pack.id === card.packId))
    .slice(0, 6);

  function getRemaining(pack: Pack) {
    const opened = collection.filter((card) => card.packId === pack.id).length;
    return Math.max(pack.remaining - opened, 0);
  }

  return (
    <div className="view-panel vending-page" data-view="pull">
      <section className="vending-detail" id="drops">
        <div className="vending-detail-media">
          <img alt={selectedCopy.name} decoding="async" src={selectedPack.heroImage} />
        </div>

        <div className="vending-purchase-panel">
          <div className="vending-trust-row">
            <span>{copy.categories[selectedPack.category]}</span>
            <span>
              <ShieldCheck size={14} />
              {copy.labels.vaultEligible}
            </span>
            <span>
              <PackageCheck size={14} />
              {copy.labels.physicalRedemption}
            </span>
          </div>

          <h1>{selectedCopy.name}</h1>

          <div className="vending-price-row">
            <div>
              <span>{copy.hero.packPrice}</span>
              <strong>{formatValue(selectedPack.price)}</strong>
            </div>
            <div>
              <span>{copy.hero.remaining}</span>
              <strong>{selectedRemaining}/{selectedPack.total}</strong>
            </div>
          </div>

          <div className="vending-supply-meter" aria-label={copy.hero.supplyLabel}>
            <span style={{ width: `${supplyProgress}%` }} />
          </div>

          <IrukaBeam
            active={!isOpening && selectedRemaining > 0}
            className="vending-primary-beam"
          >
            <button
              className="vending-primary-action"
              disabled={isOpening || selectedRemaining === 0}
              onClick={onOpenPack}
              type="button"
            >
              {walletRequired ? <Wallet size={19} /> : <PackageOpen size={19} />}
              {isOpening ? copy.hero.opening : copy.hero.openPack}
            </button>
          </IrukaBeam>

          <div className="vending-odds">
            <h2>{copy.labels.packOdds}</h2>
            <div className="vending-odds-list">
              {selectedPack.odds.map((item) => (
                <div className="vending-odds-row" key={item.rarity}>
                  <span className={getRarityClass(item.rarity)}>
                    {copy.rarities[item.rarity]}
                  </span>
                  <small>{formatValue(item.valueRange[0])} - {formatValue(item.valueRange[1])}</small>
                  <strong>{item.odds}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="vending-pack-section" aria-label={copy.labels.morePacks}>
        <div className="vending-section-heading">
          <h2>{copy.labels.morePacks}</h2>
        </div>
        <div className="vending-pack-rail">
          {packs.map((pack) => {
            const isSelected = pack.id === selectedPack.id;
            const packCopy = packCopies[pack.id];

            return (
              <IrukaBeam
                active={isSelected}
                className="vending-pack-beam"
                key={pack.id}
                variant="selection"
              >
                <button
                  aria-pressed={isSelected}
                  className={`vending-pack-option ${isSelected ? "is-selected" : ""}`}
                  onClick={() => onSelectPack(pack.id)}
                  type="button"
                >
                  <img alt="" loading="lazy" src={pack.heroImage} />
                  <span>
                    <small>{copy.categories[pack.category]}</small>
                    <strong>{packCopy.name}</strong>
                    <b>{formatValue(pack.price)} · {getRemaining(pack)} {copy.labels.left}</b>
                  </span>
                </button>
              </IrukaBeam>
            );
          })}
        </div>
      </section>

      {visiblePull ? (
        <section className="vending-result-section" ref={resultRef}>
          <div className="vending-section-heading vending-result-heading">
            <h2>{copy.labels.yourPull}</h2>
            <span>{visiblePull.serial}</span>
          </div>
          <div className="vending-result-content">
            {pullCard}
            {pullActions}
          </div>
        </section>
      ) : null}

      <section className="vending-chase-section" id="chase">
        <div className="vending-section-heading">
          <h2>{copy.labels.chaseCards}</h2>
        </div>
        <div className="vending-chase-grid">
          {selectedPack.chaseCards.map((card, index) => (
            <article className="vending-chase-card" key={card.id}>
              <div className="vending-chase-media">
                <img alt="" loading="lazy" src={card.imageUrl} />
              </div>
              <div className="vending-chase-copy">
                <span className={getRarityClass(card.rarity)}>{copy.rarities[card.rarity]}</span>
                <strong>{selectedCopy.chaseCards[index] ?? card.id}</strong>
                <b>{formatValue(card.estimatedValue)}</b>
              </div>
            </article>
          ))}
        </div>
      </section>

      {recentPulls.length > 0 ? (
        <section className="vending-recent-section">
          <div className="vending-section-heading">
            <h2>{copy.labels.recentPulls}</h2>
          </div>
          <div className="vending-recent-grid">
            {recentPulls.map((card) => (
              <article className="vending-recent-card" key={card.id}>
                <img alt="" loading="lazy" src={getCardImageUrl(card)} />
                <div>
                  <span className={getRarityClass(card.rarity)}>{copy.rarities[card.rarity]}</span>
                  <strong>{card.member}</strong>
                  <small>{card.group}</small>
                </div>
                <p>
                  <strong>{formatValue(card.estimatedValue)}</strong>
                  <span>{card.pulledAt}</span>
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
