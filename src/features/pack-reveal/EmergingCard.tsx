import { useEffect, useState } from "react";

type EmergingCardProps = {
  imageUrl: string;
};

export function EmergingCard({ imageUrl }: EmergingCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <div aria-hidden="true" className="pack-reveal-emerging-card">
      {imageFailed ? (
        <span className="pack-reveal-emerging-card-fallback">IRUKA</span>
      ) : (
        <img
          alt=""
          decoding="async"
          draggable="false"
          loading="eager"
          onError={() => setImageFailed(true)}
          src={imageUrl}
        />
      )}
      <span className="pack-reveal-emerging-card-edge" />
    </div>
  );
}
