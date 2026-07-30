import type { ReactNode, Ref } from "react";
import type { GiwaPullReceipt } from "./giwaPull.ts";
import type {
  CardPull,
  PackAvailability,
  PackDetail,
  Rarity,
  RarityTier
} from "./vendingTypes";
import { VendingPackDetail } from "./VendingPackDetail";
import { VendingPackInventory } from "./VendingPackInventory";
import { VendingPackRail } from "./VendingPackRail";

type VendingViewCopy = {
  category: string;
  hero: {
    openPack: string;
    opening: string;
    packLabel: string;
    resumeOpening: string;
  };
  inventory: {
    allRarities: string;
    individualOdds: string;
    insidePack: string;
    loadError: string;
    loadMore: string;
    redeemable: string;
    showFeatured: string;
    viewAllCards: string;
    viewBack: string;
    viewFront: string;
  };
  labels: {
    batch: string;
    giwaReceipt: string;
    giwaTestnet: string;
    packOdds: string;
    physicalRedemption: string;
    redemptionUnavailable: string;
    recentPulls: string;
    viewTransaction: string;
    yourPull: string;
  };
  rarities: Record<RarityTier, string>;
  statusLabels: Record<PackAvailability, string>;
};

type VendingViewProps = {
  activePull?: CardPull;
  copy: VendingViewCopy;
  getCardImageUrl: (card: CardPull) => string;
  isAwaitingFulfillment: boolean;
  isOpening: boolean;
  onOpenPack: () => void;
  onchainReceipt?: GiwaPullReceipt;
  onSelectPack: (packId: string) => void;
  packs: readonly PackDetail[];
  pullActions: ReactNode;
  pullCard: ReactNode;
  pullDisabled?: boolean;
  recentPulls: readonly CardPull[];
  resultRef: Ref<HTMLElement>;
  selectedPack: PackDetail;
  testnetConfigured: boolean;
  testnetEnabled: boolean;
  testnetPriceWei?: bigint;
  walletRequired: boolean;
};

function getRarityClass(rarity: Rarity) {
  return `rarity-${rarity.toLowerCase()}`;
}

export function VendingView({
  activePull,
  copy,
  getCardImageUrl,
  isAwaitingFulfillment,
  isOpening,
  onOpenPack,
  onchainReceipt,
  onSelectPack,
  packs,
  pullActions,
  pullCard,
  pullDisabled = false,
  recentPulls,
  resultRef,
  selectedPack,
  testnetConfigured,
  testnetEnabled,
  testnetPriceWei,
  walletRequired
}: VendingViewProps) {
  const visiblePull = activePull?.packId === selectedPack.id ? activePull : undefined;
  const visibleRecentPulls = recentPulls.slice(0, 6);

  return (
    <div className="view-panel vending-page" data-view="pull">
      <VendingPackRail
        onSelectPack={onSelectPack}
        packs={packs}
        selectedPackId={selectedPack.id}
      />

      <VendingPackDetail
        copy={{
          batch: copy.labels.batch,
          category: copy.category,
          comingSoon: copy.statusLabels["coming-soon"],
          giwaReceipt: copy.labels.giwaReceipt,
          giwaTestnet: copy.labels.giwaTestnet,
          openPack: copy.hero.openPack,
          opening: copy.hero.opening,
          packLabel: copy.hero.packLabel,
          packOdds: copy.labels.packOdds,
          physicalRedemption: copy.labels.physicalRedemption,
          redemptionUnavailable: copy.labels.redemptionUnavailable,
          resumeOpening: copy.hero.resumeOpening,
          viewTransaction: copy.labels.viewTransaction
        }}
        isAwaitingFulfillment={isAwaitingFulfillment}
        isOpening={isOpening}
        onOpenPack={onOpenPack}
        onchainReceipt={onchainReceipt}
        pack={selectedPack}
        pullDisabled={pullDisabled}
        rarityLabels={copy.rarities}
        testnetConfigured={testnetConfigured}
        testnetEnabled={testnetEnabled}
        testnetPriceWei={testnetPriceWei}
        walletRequired={walletRequired}
      />

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

      <VendingPackInventory
        copy={copy.inventory}
        key={selectedPack.id}
        pack={selectedPack}
        rarityLabels={copy.rarities}
      />

      {visibleRecentPulls.length > 0 ? (
        <section className="vending-recent-section">
          <div className="vending-section-heading">
            <h2>{copy.labels.recentPulls}</h2>
          </div>
          <div className="vending-recent-grid">
            {visibleRecentPulls.map((card) => (
              <article className="vending-recent-card" key={card.id}>
                <img alt="" loading="lazy" src={getCardImageUrl(card)} />
                <div>
                  <span className={getRarityClass(card.rarity)}>{copy.rarities[card.rarity]}</span>
                  <strong>{card.member}</strong>
                  <small>{card.group}</small>
                </div>
                <p>
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
