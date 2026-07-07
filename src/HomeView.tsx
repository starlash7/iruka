import { ArrowRight, PackageOpen, ShieldCheck, Sparkles } from "lucide-react";
import irukaLogo from "./assets/iruka-logo.png";

type HomeViewCopy = {
  action: string;
  eyebrow: string;
  featurePack: string;
  featureVault: string;
  leftBody: string;
  leftTitle: string;
  proof: string;
  rightBody: string;
  rightTitle: string;
  vendingMeta: string;
  vendingTitle: string;
};

type HomeViewProps = {
  copy: HomeViewCopy;
  onEnterVending: () => void;
};

export function HomeView({ copy, onEnterVending }: HomeViewProps) {
  return (
    <section className="home-showcase" aria-labelledby="home-title">
      <div className="home-copy home-copy-left">
        <span>{copy.eyebrow}</span>
        <h1 id="home-title">{copy.leftTitle}</h1>
        <p>{copy.leftBody}</p>
        <button onClick={onEnterVending} type="button">
          {copy.action}
          <ArrowRight size={17} />
        </button>
        <div className="home-proof">
          <Sparkles size={16} />
          <strong>{copy.proof}</strong>
        </div>
      </div>

      <div className="home-character" aria-hidden="true">
        <span className="home-character-halo" />
        <span className="home-character-card">
          <img alt="" src={irukaLogo} />
        </span>
      </div>

      <aside className="home-vending-card" aria-label={copy.vendingTitle}>
        <div className="home-vending-machine" aria-hidden="true">
          <span className="home-vending-glass">
            <i />
            <i />
            <i />
          </span>
          <span className="home-vending-slot" />
        </div>
        <div className="home-copy home-copy-right">
          <span>{copy.vendingMeta}</span>
          <h2>{copy.rightTitle}</h2>
          <p>{copy.rightBody}</p>
          <div className="home-feature-row">
            <span>
              <PackageOpen size={15} />
              {copy.featurePack}
            </span>
            <span>
              <ShieldCheck size={15} />
              {copy.featureVault}
            </span>
          </div>
        </div>
      </aside>
    </section>
  );
}
