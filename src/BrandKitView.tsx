import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";

const brandColors = [
  { name: "Iruka Blue", hex: "#1677FF", usage: "Primary actions and links" },
  { name: "Ocean Aqua", hex: "#20C7DF", usage: "Accent and motion" },
  { name: "Iruka Ink", hex: "#101828", usage: "Headlines and key text" },
  { name: "Ice Sky", hex: "#EAF4FF", usage: "Soft backgrounds" },
  { name: "Surface", hex: "#FFFFFF", usage: "Cards and clear space" }
] as const;

function AssetDownload({
  download,
  href,
  label
}: {
  download: string;
  href: string;
  label: string;
}) {
  return (
    <a className="brand-kit-download" download={download} href={href}>
      <Download aria-hidden="true" size={15} strokeWidth={2.2} />
      {label}
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
        <div>
          <p className="brand-kit-eyebrow">IRUKA / BRAND KIT</p>
          <h1 id="brand-kit-title">A clear system for Iruka.</h1>
          <p className="brand-kit-lead">
            Use the supplied mark, wordmark, and color tokens to keep every Iruka
            touchpoint bright, calm, and recognisable.
          </p>
        </div>
        <div className="brand-kit-hero-mark" aria-hidden="true">
          <img src="/brand/iruka-mark.png" alt="" />
        </div>
      </header>

      <section className="brand-kit-section" aria-labelledby="brand-assets-title">
        <div className="brand-kit-section-heading">
          <div>
            <p className="brand-kit-kicker">01</p>
            <h2 id="brand-assets-title">Logo assets</h2>
          </div>
          <p>PNG files with transparent artwork. Keep the original proportions.</p>
        </div>

        <div className="brand-kit-asset-grid">
          <article className="brand-kit-asset-card">
            <div className="brand-kit-asset-preview brand-kit-asset-preview-mark">
              <img src="/brand/iruka-mark.png" alt="Iruka dolphin logo" />
            </div>
            <div className="brand-kit-asset-meta">
              <div>
                <h3>Dolphin mark</h3>
                <p>iruka-mark.png · 2048 × 2048</p>
              </div>
              <AssetDownload
                download="iruka-mark.png"
                href="/brand/iruka-mark.png"
                label="Download"
              />
            </div>
          </article>

          <article className="brand-kit-asset-card">
            <div className="brand-kit-asset-preview brand-kit-asset-preview-wordmark">
              <img src="/brand/iruka-wordmark.png" alt="Iruka wordmark" />
            </div>
            <div className="brand-kit-asset-meta">
              <div>
                <h3>Iruka wordmark</h3>
                <p>iruka-wordmark.png · 4096 × 1273</p>
              </div>
              <AssetDownload
                download="iruka-wordmark.png"
                href="/brand/iruka-wordmark.png"
                label="Download"
              />
            </div>
          </article>
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
            <span className="brand-kit-guidance-icon brand-kit-guidance-icon-do">✓</span>
            <h3>Keep clear space</h3>
            <p>Leave breathing room around every side of the mark and wordmark.</p>
          </article>
          <article>
            <span className="brand-kit-guidance-icon brand-kit-guidance-icon-do">✓</span>
            <h3>Keep the artwork</h3>
            <p>Use the supplied files at their original proportions and colors.</p>
          </article>
          <article>
            <span className="brand-kit-guidance-icon brand-kit-guidance-icon-avoid">×</span>
            <h3>Do not stretch</h3>
            <p>Do not add outlines, shadows, gradients, or low-contrast treatments.</p>
          </article>
        </div>
      </section>
    </section>
  );
}
