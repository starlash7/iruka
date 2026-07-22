import { ExternalLink, PackageOpen, Truck, Wallet } from "lucide-react";
import { formatUsdc, formatUsdcRange } from "./currency";
import type { GiwaPullReceipt } from "./giwaPull.ts";
import debutVendingMachineImage from "./assets/iruka-vending-machine-debut.png";
import encoreVendingMachineImage from "./assets/iruka-vending-machine-encore.png";
import grailVendingMachineImage from "./assets/iruka-vending-machine-grail.png";
import stageVendingMachineImage from "./assets/iruka-vending-machine-stage.png";
import { IrukaBeam } from "./IrukaBeam";
import type { PackDetail, PackTier, RarityTier } from "./vendingTypes";

type VendingPackDetailCopy = {
  batch: string;
  category: string;
  giwaReceipt: string;
  giwaTestnet?: string;
  openPack: string;
  opening: string;
  packLabel: string;
  packOdds: string;
  physicalRedemption: string;
  redemptionUnavailable: string;
  testPull?: string;
  viewTransaction: string;
  viewOdds: string;
};

type VendingPackDetailProps = {
  copy: VendingPackDetailCopy;
  isOpening: boolean;
  onOpenPack: () => void;
  onchainReceipt?: GiwaPullReceipt;
  pack: PackDetail;
  rarityLabels: Record<RarityTier, string>;
  testnetEnabled?: boolean;
  walletRequired: boolean;
};

function formatOdds(basisPoints: number) {
  return `${basisPoints / 100}%`;
}

const vendingMachineImages: Record<PackTier, string> = {
  Debut: debutVendingMachineImage,
  Stage: stageVendingMachineImage,
  Encore: encoreVendingMachineImage,
  Grail: grailVendingMachineImage
};

export function VendingPackDetail({
  copy,
  isOpening,
  onOpenPack,
  onchainReceipt,
  pack,
  rarityLabels,
  testnetEnabled = false,
  walletRequired
}: VendingPackDetailProps) {
  const tier = pack.tier.toLowerCase();
  const machineImage = vendingMachineImages[pack.tier];
  const actionLabel = isOpening
    ? copy.opening
    : testnetEnabled
      ? (copy.testPull ?? copy.openPack)
      : copy.openPack;

  return (
    <section className="vending-detail" id="drops">
      <div className="vending-detail-media" data-tier={tier}>
        <img
          alt="Iruka vending machine"
          className="vending-machine-base"
          decoding="async"
          src={machineImage}
        />
      </div>

      <div className="vending-purchase-panel">
        <div className="vending-trust-row">
          <span>{copy.category}</span>
          {testnetEnabled && copy.giwaTestnet ? <span>{copy.giwaTestnet}</span> : null}
          <span>
            <i className="vending-trust-icon" aria-hidden="true">
              <Truck size={15} strokeWidth={1.9} />
            </i>
            {pack.redemption.eligible ? copy.physicalRedemption : copy.redemptionUnavailable}
          </span>
        </div>

        <div className="vending-title-block">
          <h1>{pack.name} {copy.packLabel}</h1>
          <span>{copy.batch} {pack.batchId}</span>
        </div>

        <div className="vending-price-row">
          <strong>{formatUsdc(pack.priceUsdc)}</strong>
        </div>

        <IrukaBeam active={!isOpening} className="vending-primary-beam" variant="action">
          <button
            className="iruka-action-button vending-primary-action"
            disabled={isOpening}
            onClick={onOpenPack}
            type="button"
          >
            {walletRequired ? <Wallet size={19} /> : <PackageOpen size={19} />}
            {actionLabel}
          </button>
        </IrukaBeam>

        {onchainReceipt ? (
          <a
            className="vending-chain-receipt"
            href={onchainReceipt.explorerUrl}
            rel="noreferrer"
            target="_blank"
          >
            <span>{copy.giwaReceipt}</span>
            <strong>#{onchainReceipt.requestId.toString()}</strong>
            <ExternalLink aria-hidden="true" size={14} />
            <span className="sr-only">{copy.viewTransaction}</span>
          </a>
        ) : null}

        <div className="vending-odds-summary">
          <div className="vending-odds-heading">
            <h2>{copy.packOdds}</h2>
          </div>
          <div className="vending-odds-list">
            {pack.rarityOdds.map((odds) => (
              <div className={`vending-odds-row rarity-${odds.tier.toLowerCase()}`} key={odds.tier}>
                <span>{rarityLabels[odds.tier]}</span>
                <small>{formatUsdcRange(odds.estimatedValueRangeUsdc)}</small>
                <strong>{formatOdds(odds.basisPoints)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
