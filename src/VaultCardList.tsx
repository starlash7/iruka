import { Box } from "lucide-react";
import type { CardPull, Rarity, VaultStatus } from "./vendingTypes";

type VaultCardListProps = {
  cards: readonly CardPull[];
  emptyLabel: string;
  formatValue: (card: CardPull) => string;
  getCardImageUrl: (card: CardPull) => string;
  onSelectCard: (card: CardPull) => void;
  rarityClassNames: Readonly<Record<Rarity, string>>;
  statusLabels: Readonly<Record<VaultStatus, string>>;
};

export function VaultCardList({
  cards,
  emptyLabel,
  formatValue,
  getCardImageUrl,
  onSelectCard,
  rarityClassNames,
  statusLabels
}: VaultCardListProps) {
  if (cards.length === 0) {
    return (
      <div className="vault-empty">
        <Box size={28} />
        <strong>{emptyLabel}</strong>
      </div>
    );
  }

  return (
    <div className="vault-table">
      {cards.map((card) => (
        <button
          className="vault-row"
          key={card.id}
          onClick={() => onSelectCard(card)}
          type="button"
        >
          <span className="vault-card-thumb">
            <img alt="" src={getCardImageUrl(card)} />
            <i className={`rarity-dot ${rarityClassNames[card.rarity]}`} />
          </span>
          <strong>{card.member}</strong>
          <span>{card.group}</span>
          <span>{formatValue(card)}</span>
          <span>{statusLabels[card.vaultStatus]}</span>
        </button>
      ))}
    </div>
  );
}
