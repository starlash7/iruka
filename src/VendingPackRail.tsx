import type { PackDetail } from "./vendingTypes";

type VendingPackRailProps = {
  onSelectPack: (packId: string) => void;
  packs: readonly PackDetail[];
  selectedPackId: string;
};

export function VendingPackRail({
  onSelectPack,
  packs,
  selectedPackId
}: VendingPackRailProps) {
  return (
    <nav aria-label="Pack tiers" className="vending-tier-rail">
      {packs.map((pack) => {
        const isSelected = pack.id === selectedPackId;
        const tier = pack.tier.toLowerCase();

        return (
          <button
            aria-pressed={isSelected}
            className={`vending-tier-option ${isSelected ? "is-selected" : ""}`}
            data-tier={tier}
            key={pack.id}
            onClick={() => onSelectPack(pack.id)}
            type="button"
          >
            <span className="vending-tier-media" aria-hidden="true">
              <img alt="" src={pack.media.railIconUrl} />
            </span>
            <strong>{pack.tier}</strong>
          </button>
        );
      })}
    </nav>
  );
}
