import { Check, Copy, Download, X } from "lucide-react";
import { useState } from "react";

const brandColors = [
  { name: "Iruka Blue", hex: "#1677FF", usage: "Primary actions and links" },
  { name: "Ocean Aqua", hex: "#20C7DF", usage: "Accent and motion" },
  { name: "Iruka Ink", hex: "#101828", usage: "Headlines and key text" },
  { name: "Ice Sky", hex: "#EAF4FF", usage: "Soft backgrounds" },
  { name: "Surface", hex: "#FFFFFF", usage: "Cards and clear space" }
] as const;

const brandAssets = [
  {
    name: "Main logo",
    baseName: "iruka-main-logo",
    imageSrc: "/brand/iruka-main-logo.png",
    alt: "Iruka main logo",
    previewClass: "brand-kit-asset-preview-main"
  },
  {
    name: "Logomark",
    baseName: "iruka-logomark",
    imageSrc: "/brand/iruka-logomark.png",
    alt: "Iruka logomark",
    previewClass: "brand-kit-asset-preview-mark"
  },
  {
    name: "Wordmark",
    baseName: "iruka-wordmark",
    imageSrc: "/brand/iruka-wordmark.png",
    alt: "Iruka wordmark",
    previewClass: "brand-kit-asset-preview-wordmark"
  }
] as const;

function AssetDownload({
  baseName,
  format
}: {
  baseName: string;
  format: "PNG" | "SVG";
}) {
  const extension = format.toLowerCase();
  const fileName = `${baseName}.${extension}`;

  return (
    <a
      aria-label={`Download ${fileName}`}
      className="brand-kit-download"
      download={fileName}
      href={`/brand/${fileName}`}
    >
      <Download aria-hidden="true" size={15} strokeWidth={2.2} />
      {format}
    </a>
  );
}

export function BrandKitView() {
  const [copiedHex, setCopiedHex] = useState<string>();

  async function copyColor(hex: string) {
    if (!navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      window.setTimeout(() => setCopiedHex(undefined), 1600);
    } catch {
      setCopiedHex(undefined);
    }
  }

  return (
    <section className="brand-kit-page" aria-labelledby="brand-kit-title">
      <header className="brand-kit-hero">
        <div className="brand-kit-hero-copy">
          <p className="brand-kit-eyebrow">IRUKA / BRAND</p>
          <h1 id="brand-kit-title">Iruka brand essentials.</h1>
          <p className="brand-kit-lead">
            Core logos, colors, and usage rules for the Iruka product. Download
            the core marks and apply the same visual language across Iruka.
          </p>
        </div>
      </header>

      <section className="brand-kit-section" aria-labelledby="brand-assets-title">
        <div className="brand-kit-section-heading">
          <div>
            <p className="brand-kit-kicker">01</p>
            <h2 id="brand-assets-title">Logo assets</h2>
          </div>
          <p>Choose PNG or SVG for each core mark.</p>
        </div>

        <div className="brand-kit-asset-grid">
          {brandAssets.map((asset) => (
            <article className="brand-kit-asset-card" key={asset.baseName}>
              <div className={`brand-kit-asset-preview ${asset.previewClass}`}>
                <img src={asset.imageSrc} alt={asset.alt} />
              </div>
              <div className="brand-kit-asset-meta">
                <h3>{asset.name}</h3>
                <div className="brand-kit-downloads">
                  <AssetDownload baseName={asset.baseName} format="PNG" />
                  <AssetDownload baseName={asset.baseName} format="SVG" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="brand-kit-section" aria-labelledby="brand-colors-title">
        <div className="brand-kit-section-heading">
          <div>
            <p className="brand-kit-kicker">02</p>
            <h2 id="brand-colors-title">Color</h2>
          </div>
          <p>Use blue for action, aqua for energy, and ink for clarity.</p>
        </div>

        <div className="brand-kit-color-grid">
          {brandColors.map((color) => (
            <article className="brand-kit-color-card" key={color.hex}>
              <div
                className="brand-kit-color-swatch"
                style={{ backgroundColor: color.hex }}
              />
              <div className="brand-kit-color-meta">
                <div>
                  <h3>{color.name}</h3>
                  <p>{color.usage}</p>
                </div>
                <button
                  aria-label={`Copy ${color.name} hex value`}
                  className="brand-kit-copy"
                  onClick={() => void copyColor(color.hex)}
                  type="button"
                >
                  {copiedHex === color.hex ? (
                    <Check aria-hidden="true" size={15} />
                  ) : (
                    <Copy aria-hidden="true" size={15} />
                  )}
                  <span>{color.hex}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="brand-kit-section" aria-labelledby="brand-usage-title">
        <div className="brand-kit-section-heading">
          <div>
            <p className="brand-kit-kicker">03</p>
            <h2 id="brand-usage-title">Use it cleanly</h2>
          </div>
          <p>The mark stays simple so the collectible stays in focus.</p>
        </div>

        <div className="brand-kit-guidance-grid">
          <article>
            <span
              aria-hidden="true"
              className="brand-kit-guidance-icon brand-kit-guidance-icon-do"
            >
              <Check size={16} strokeWidth={2.5} />
            </span>
            <h3>Keep clear space</h3>
            <p>Leave breathing room around every side of the mark and wordmark.</p>
          </article>
          <article>
            <span
              aria-hidden="true"
              className="brand-kit-guidance-icon brand-kit-guidance-icon-do"
            >
              <Check size={16} strokeWidth={2.5} />
            </span>
            <h3>Keep the artwork</h3>
            <p>Use the supplied files at their original proportions and colors.</p>
          </article>
          <article>
            <span
              aria-hidden="true"
              className="brand-kit-guidance-icon brand-kit-guidance-icon-avoid"
            >
              <X size={16} strokeWidth={2.5} />
            </span>
            <h3>Do not stretch</h3>
            <p>Do not add outlines, shadows, gradients, or low-contrast treatments.</p>
          </article>
        </div>
      </section>
    </section>
  );
}
