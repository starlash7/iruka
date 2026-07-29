import {
  type CSSProperties,
  type PointerEvent,
  useEffect,
  useState
} from "react";
import { getRevealConfig, type RevealCard as RevealCardData } from "./revealConfig";

type RevealCardProps = {
  card: RevealCardData;
  face: "back" | "front";
  interactive: boolean;
  reducedMotion: boolean;
  revealed: boolean;
};

export function RevealCard({
  card,
  face,
  interactive,
  reducedMotion,
  revealed
}: RevealCardProps) {
  const [showBack, setShowBack] = useState(face === "back");
  const [imageFailed, setImageFailed] = useState(false);
  const config = getRevealConfig(card.rarity);

  useEffect(() => {
    if (!interactive) setShowBack(face === "back");
  }, [face, interactive]);

  useEffect(() => {
    setImageFailed(false);
  }, [card.imageUrl]);

  function moveCard(event: PointerEvent<HTMLButtonElement>) {
    if (reducedMotion || !interactive) return;

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
      aria-hidden={!interactive}
      aria-label={card.name}
      className="pack-reveal-dom-card"
      data-back={showBack}
      data-face={face}
      data-interactive={interactive}
      data-revealed={revealed}
      disabled={!interactive}
      onClick={() => interactive && setShowBack((value) => !value)}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerLeave={resetCard}
      onPointerMove={moveCard}
      style={{
        "--card-accent": config.accent,
        "--card-foil": config.foil
      } as CSSProperties}
      tabIndex={interactive ? 0 : -1}
      type="button"
    >
      <span className="pack-reveal-card-aura" aria-hidden="true" />
      <span className="pack-reveal-card-inner">
        <span className="pack-reveal-card-face pack-reveal-card-front">
          {imageFailed ? (
            <span
              aria-hidden="true"
              className="pack-reveal-card-image-fallback"
            >
              IRUKA
            </span>
          ) : (
            <img
              alt={card.name}
              draggable="false"
              onError={() => setImageFailed(true)}
              src={card.imageUrl}
            />
          )}
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
