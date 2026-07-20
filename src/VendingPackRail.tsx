import { IrukaBeam } from "./IrukaBeam";
import { formatUsdc } from "./currency";
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
          <IrukaBeam
            active={isSelected}
            className={`vending-pack-beam vending-pack-beam-${tier}`}
            key={pack.id}
            variant="selection"
          >
            <button
              aria-pressed={isSelected}
              className={`vending-tier-option ${isSelected ? "is-selected" : ""}`}
              data-tier={tier}
              onClick={() => onSelectPack(pack.id)}
              type="button"
            >
              <span className="vending-tier-media" aria-hidden="true">
                <img alt="" src={pack.media.packFrontUrl} />
              </span>
              <span className="vending-tier-copy">
                <strong>{pack.tier}</strong>
                <b>{formatUsdc(pack.priceUsdc)}</b>
              </span>
            </button>
          </IrukaBeam>
        );
      })}
    </nav>
  );
}
