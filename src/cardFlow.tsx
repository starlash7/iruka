import { formatUsdcRange, formatUsd } from "./currency";
import type { IrukaRarity, RevealCard } from "./features/pack-reveal/revealConfig";
import type { CardPull, Rarity, VendingPull } from "./vendingTypes";

export function createVendingCardPull(
  pull: VendingPull,
  packName: string,
  packLabel = "Pack"
): CardPull {
  const { card } = pull;

  return {
    ...(pull.onchainReceipt ? { onchainReceipt: pull.onchainReceipt } : {}),
    id: pull.id,
    packId: pull.packId,
    category: "K-pop",
    group: `${packName} ${packLabel}`,
    member: card.title,
    rarity: card.tier,
    estimatedValue: Number(card.estimatedValueRangeUsdc[0]),
    estimatedValueRangeUsdc: card.estimatedValueRangeUsdc,
    vaultStatus: "Pulled",
    imageStyle: "card-style-1",
    imageUrl: card.media.frontUrl,
    inventoryCardId: card.id,
    redemption: card.redemption,
    serial: card.serial,
    pulledAt: new Date(pull.pulledAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    }),
    verificationId: card.verificationId
  };
}

export function isCardCustodyVerified(
  card: Pick<CardPull, "redemption" | "verificationId">
) {
  return Boolean(card.verificationId && card.redemption?.eligible);
}

export function formatCardPullValue(card: CardPull) {
  return card.estimatedValueRangeUsdc
    ? formatUsdcRange(card.estimatedValueRangeUsdc)
    : formatUsd(card.estimatedValue);
}

export function getSupplyProgress(remaining: number, total: number) {
  return Math.round(((total - remaining) / total) * 100);
}

function escapeSvgText(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function toRevealRarity(rarity: Rarity): IrukaRarity {
  return rarity.toLowerCase() as IrukaRarity;
}

export function createRevealImageUrl(
  card: CardPull,
  rarityLabel: string
) {
  const title = escapeSvgText(card.member);
  const subtitle = escapeSvgText(card.group);
  const serial = escapeSvgText(card.serial);
  const rarity = escapeSvgText(rarityLabel);
  const accent = {
    Common: "#98A2B3",
    Rare: "#12B76A",
    Epic: "#F04438",
    Legendary: "#F5C842",
    Iruka: "#6F8DFF"
  }[card.rarity];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 900">
      <defs>
        <linearGradient id="face" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#FFFFFF"/>
          <stop offset="0.48" stop-color="#EAF4FF"/>
          <stop offset="1" stop-color="${accent}"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="34%" r="60%">
          <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.92"/>
          <stop offset="0.45" stop-color="${accent}" stop-opacity="0.22"/>
          <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="640" height="900" rx="52" fill="#FFFFFF"/>
      <rect x="28" y="28" width="584" height="844" rx="42" fill="url(#face)" opacity="0.72"/>
      <rect x="62" y="80" width="516" height="560" rx="34" fill="#FFFFFF" opacity="0.62"/>
      <rect x="62" y="80" width="516" height="560" rx="34" fill="url(#glow)"/>
      <path d="M80 438 C190 400 274 456 384 410 C468 374 530 380 578 360 L578 640 L80 640 Z" fill="#FFFFFF" opacity="0.46"/>
      <circle cx="320" cy="330" r="78" fill="${accent}" opacity="0.58"/>
      <circle cx="320" cy="330" r="36" fill="#FFFFFF" opacity="0.5"/>
      <text x="320" y="116" text-anchor="middle" fill="#475467" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="800">${serial}</text>
      <text x="320" y="514" text-anchor="middle" fill="#101828" font-family="Inter, Arial, sans-serif" font-size="106" font-weight="800">${title.slice(0, 2).toUpperCase()}</text>
      <text x="86" y="716" fill="#101828" font-family="Inter, Arial, sans-serif" font-size="46" font-weight="900">${title}</text>
      <text x="86" y="766" fill="#667085" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700">${subtitle}</text>
      <text x="86" y="820" fill="${accent}" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="900">${rarity}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function createRevealCard(
  card: CardPull,
  rarityLabel: string
): RevealCard {
  return {
    imageUrl: card.imageUrl ?? createRevealImageUrl(card, rarityLabel),
    name: card.member,
    rarity: toRevealRarity(card.rarity),
    serial: card.serial
  };
}

type RevealedCardProps = {
  card: CardPull;
  categoryLabel: string;
  rarityClassName: string;
  rarityLabel: string;
};

export function RevealedCard({
  card,
  categoryLabel,
  rarityClassName,
  rarityLabel
}: RevealedCardProps) {
  return (
    <article className={`revealed-card ${rarityClassName} ${card.imageStyle}`}>
      <div className="revealed-top">
        <span>{categoryLabel}</span>
        <span>{card.serial}</span>
      </div>
      <div className="revealed-image">
        <img
          alt=""
          className="revealed-card-art"
          src={card.imageUrl ?? createRevealImageUrl(card, rarityLabel)}
        />
      </div>
      <div className="revealed-copy">
        <strong>{card.member}</strong>
        <span>{card.group}</span>
      </div>
    </article>
  );
}
