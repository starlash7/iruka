import { type CSSProperties, useEffect, useRef, useState } from "react";
import type { RevealPhase } from "./revealMachine";

export type RevealMedia = {
  desktopVideoUrl?: string;
  mobileVideoUrl?: string;
  posterUrl?: string;
};

type RevealTearProps = {
  media?: RevealMedia;
  phase: RevealPhase;
};

const packFragments = [
  { angle: -68, distance: 92, delay: 0 },
  { angle: -42, distance: 116, delay: 35 },
  { angle: -18, distance: 104, delay: 70 },
  { angle: 16, distance: 112, delay: 20 },
  { angle: 40, distance: 124, delay: 55 },
  { angle: 66, distance: 96, delay: 90 }
] as const;

export function RevealTear({ media, phase }: RevealTearProps) {
  const [mediaFailed, setMediaFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasVideo = Boolean(media?.desktopVideoUrl || media?.mobileVideoUrl);

  useEffect(() => {
    setMediaFailed(false);
  }, [media?.desktopVideoUrl, media?.mobileVideoUrl]);

  useEffect(() => {
    if (phase !== "tear" || mediaFailed || !videoRef.current) return;

    videoRef.current.currentTime = 0;
    void videoRef.current.play().catch(() => setMediaFailed(true));
  }, [mediaFailed, phase]);

  return (
    <div
      className="pack-reveal-tear"
      data-fallback={!hasVideo || mediaFailed}
      data-phase={phase}
      style={{
        "--pack-poster": media?.posterUrl ? `url("${media.posterUrl}")` : "none"
      } as CSSProperties}
    >
      {hasVideo && !mediaFailed ? (
        <video
          className="pack-reveal-tear-video"
          muted
          onError={() => setMediaFailed(true)}
          playsInline
          preload="auto"
          ref={videoRef}
        >
          {media?.mobileVideoUrl ? (
            <source media="(max-width: 760px)" src={media.mobileVideoUrl} />
          ) : null}
          {media?.desktopVideoUrl ? <source src={media.desktopVideoUrl} /> : null}
        </video>
      ) : null}

      <div className="pack-reveal-tear-fallback" aria-hidden="true">
        <div className="pack-reveal-pack-shell">
          <i className="pack-reveal-pack-core" />
          <div className="pack-reveal-pack-piece pack-reveal-pack-top">
            {media?.posterUrl ? <img alt="" src={media.posterUrl} /> : <span>IRUKA</span>}
            <i className="pack-reveal-pack-foil" />
          </div>
          <div className="pack-reveal-pack-piece pack-reveal-pack-bottom">
            {media?.posterUrl ? <img alt="" src={media.posterUrl} /> : <span>IRUKA</span>}
            <i className="pack-reveal-pack-foil" />
          </div>
          <i className="pack-reveal-seal-edge pack-reveal-seal-top" />
          <i className="pack-reveal-seal-edge pack-reveal-seal-bottom" />
          <div className="pack-reveal-fragments">
            {packFragments.map(({ angle, delay, distance }) => (
              <i
                className="pack-reveal-fragment"
                key={angle}
                style={{
                  "--fragment-angle": `${angle}deg`,
                  "--fragment-delay": `${delay}ms`,
                  "--fragment-distance": `${distance}px`
                } as CSSProperties}
              />
            ))}
          </div>
          <i className="pack-reveal-tear-line" />
        </div>
      </div>
    </div>
  );
}
