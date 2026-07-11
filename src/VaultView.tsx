import { Box } from "lucide-react";
import type { ReactNode } from "react";
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
  formatValue: (value: number) => string;
  locale: "en" | "ko";
  onSelectCard: (card: CardPull) => void;
  pullActions: ReactNode;
  rarityClassNames: Readonly<Record<Rarity, string>>;
  statusLabels: Readonly<Record<VaultStatus, string>>;
};

export function VaultView({
  cards,
  copy,
  formatValue,
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

      {cards.length > 0 ? (
        <div className="vault-table">
          {cards.map((card) => (
            <button
              className="vault-row"
              key={card.id}
              onClick={() => onSelectCard(card)}
              type="button"
            >
              <span className={`rarity-dot ${rarityClassNames[card.rarity]}`} />
              <strong>{card.member}</strong>
              <span>{card.group}</span>
              <span>{formatValue(card.estimatedValue)}</span>
              <span>{statusLabels[card.vaultStatus]}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="vault-empty">
          <Box size={28} />
          <strong>{copy.vaultEmpty}</strong>
        </div>
      )}

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
