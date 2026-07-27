import type { CSSProperties } from "react";
import type { RevealPhase } from "./revealMachine";

type RevealEffectsProps = {
  phase: RevealPhase;
};

const rayCount = 10;
const ringCount = 3;
const particleCount = 18;

export function RevealEffects({ phase }: RevealEffectsProps) {
  return (
    <div
      aria-hidden="true"
      className="pack-reveal-effects"
      data-phase={phase}
    >
      <div className="pack-reveal-atmosphere" />
      <div className="pack-reveal-rays">
        {Array.from({ length: rayCount }, (_, index) => (
          <i
            key={index}
            style={{
              "--ray-angle": `${index * (360 / rayCount)}deg`,
              "--ray-delay": `${(index % 5) * 45}ms`
            } as CSSProperties}
          />
        ))}
      </div>
      <div className="pack-reveal-rings">
        {Array.from({ length: ringCount }, (_, index) => (
          <i
            key={index}
            style={{ "--ring-index": index } as CSSProperties}
          />
        ))}
      </div>
      <div className="pack-reveal-particles">
        {Array.from({ length: particleCount }, (_, index) => (
          <i
            className="pack-reveal-particle"
            key={index}
            style={{
              "--particle-angle": `${index * (360 / particleCount)}deg`,
              "--particle-delay": `${(index % 6) * 40}ms`,
              "--particle-distance": `${120 + (index % 4) * 34}px`,
              "--particle-size": `${3 + (index % 3)}px`
            } as CSSProperties}
          />
        ))}
      </div>
      <div className="pack-reveal-burst" />
    </div>
  );
}
