import type { ReactNode } from "react";
import type { Locale } from "./appTypes";
import { VaultCardList } from "./VaultCardList";
import { VaultGuide } from "./VaultGuide";
import type { CardPull, Rarity, VaultStatus } from "./vendingTypes";

type VaultViewProps = {
  cards: CardPull[];
  copy: {
    cards: string;
    empty: string;
    redeem: string;
    sold: string;
    title: string;
    vaultEmpty: string;
  };
  formatValue: (card: CardPull) => string;
  getCardImageUrl: (card: CardPull) => string;
  locale: Locale;
  onSelectCard: (card: CardPull) => void;
  pullActions: ReactNode;
  rarityClassNames: Readonly<Record<Rarity, string>>;
  statusLabels: Readonly<Record<VaultStatus, string>>;
};

export function VaultView({
  cards,
  copy,
  formatValue,
  getCardImageUrl,
  locale,
  onSelectCard,
  pullActions,
  rarityClassNames,
  statusLabels
}: VaultViewProps) {
  const soldCount = cards.filter((card) => card.vaultStatus === "Sold").length;
  const redeemCount = cards.filter((card) => card.vaultStatus === "Redeem queued").length;

  return (
    <section className="vault-section" id="vault">
      <div className="section-heading">
        <h2>{copy.title}</h2>
        <span>{cards.length > 0 ? `${cards.length} ${copy.cards}` : copy.empty}</span>
      </div>

      <VaultCardList
        cards={cards}
        emptyLabel={copy.vaultEmpty}
        formatValue={formatValue}
        getCardImageUrl={getCardImageUrl}
        onSelectCard={onSelectCard}
        rarityClassNames={rarityClassNames}
        statusLabels={statusLabels}
      />

      {pullActions}

      {soldCount > 0 || redeemCount > 0 ? (
        <div className="vault-ops" id="redeem">
          {soldCount > 0 ? <span>{copy.sold} {soldCount}</span> : null}
          {redeemCount > 0 ? <span>{copy.redeem} {redeemCount}</span> : null}
        </div>
      ) : null}

      <VaultGuide locale={locale} statusLabels={statusLabels} />
    </section>
  );
}
