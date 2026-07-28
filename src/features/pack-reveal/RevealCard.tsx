import {
  type CSSProperties,
  type PointerEvent,
  useEffect,
  useState
} from "react";
import { getRevealConfig, type RevealCard as RevealCardData } from "./revealConfig";

type RevealCardProps = {
  card: RevealCardData;
  reducedMotion: boolean;
  revealed: boolean;
};

export function RevealCard({
  card,
  reducedMotion,
  revealed
}: RevealCardProps) {
  const [showBack, setShowBack] = useState(false);
  const config = getRevealConfig(card.rarity);

  useEffect(() => {
    if (!revealed) setShowBack(false);
  }, [revealed]);

  function moveCard(event: PointerEvent<HTMLButtonElement>) {
    if (reducedMotion || !revealed) return;

    const cardElement = event.currentTarget;
    const bounds = cardElement.getBoundingClientRect();
    const horizontal = (event.clientX - bounds.left) / bounds.width;
    const vertical = (event.clientY - bounds.top) / bounds.height;

    cardElement.style.setProperty("--card-tilt-x", `${(0.5 - vertical) * 9}deg`);
    cardElement.style.setProperty("--card-tilt-y", `${(horizontal - 0.5) * 11}deg`);
    cardElement.style.setProperty("--card-glare-x", `${horizontal * 100}%`);
    cardElement.style.setProperty("--card-glare-y", `${vertical * 100}%`);
  }

  function resetCard(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.style.setProperty("--card-tilt-x", "0deg");
    event.currentTarget.style.setProperty("--card-tilt-y", "0deg");
    event.currentTarget.style.setProperty("--card-glare-x", "50%");
    event.currentTarget.style.setProperty("--card-glare-y", "50%");
  }

  return (
    <button
      aria-hidden={!revealed}
      aria-label={card.name}
      className="pack-reveal-dom-card"
      data-back={showBack}
      data-revealed={revealed}
      disabled={!revealed}
      onClick={() => revealed && setShowBack((value) => !value)}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerLeave={resetCard}
      onPointerMove={moveCard}
      style={{
        "--card-accent": config.accent,
        "--card-foil": config.foil
      } as CSSProperties}
      tabIndex={revealed ? 0 : -1}
      type="button"
    >
      <span className="pack-reveal-card-aura" aria-hidden="true" />
      <span className="pack-reveal-card-inner">
        <span className="pack-reveal-card-face pack-reveal-card-front">
          <img alt={card.name} draggable="false" src={card.imageUrl} />
          <span className="pack-reveal-card-edge" aria-hidden="true" />
          <span className="pack-reveal-card-foil" aria-hidden="true" />
          <span className="pack-reveal-card-glare" aria-hidden="true" />
        </span>
        <span className="pack-reveal-card-face pack-reveal-card-back" aria-hidden="true">
          <span>IRUKA</span>
        </span>
      </span>
    </button>
  );
}
