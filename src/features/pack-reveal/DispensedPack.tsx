import { useEffect, useState } from "react";

type DispensedPackProps = {
  imageUrl?: string;
};

function PackArtwork({
  failed,
  imageUrl,
  onError
}: {
  failed: boolean;
  imageUrl?: string;
  onError: () => void;
}) {
  if (!imageUrl || failed) {
    return <span className="pack-reveal-pack-fallback">IRUKA</span>;
  }

  return (
    <img
      alt=""
      draggable="false"
      onError={onError}
      src={imageUrl}
    />
  );
}

export function DispensedPack({ imageUrl }: DispensedPackProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  const artwork = {
    failed,
    imageUrl,
    onError: () => setFailed(true)
  };

  return (
    <div aria-hidden="true" className="pack-reveal-dispensed-pack">
      <div className="pack-reveal-pack-body">
        <PackArtwork {...artwork} />
      </div>
      <div className="pack-reveal-pack-seal">
        <PackArtwork {...artwork} />
      </div>
      <span className="pack-reveal-pack-mouth" />
    </div>
  );
}
