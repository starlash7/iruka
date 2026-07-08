import { ArrowRight, PackageOpen, ShieldCheck, Sparkles } from "lucide-react";
import homeIdolStage from "./assets/home-idol-stage-cutout.png";
import { IrukaBeam } from "./IrukaBeam";

type HomeViewCopy = {
  action: string;
  brandSlogan: string;
  brandTitle: string;
  eyebrow: string;
  featurePack: string;
  featureVault: string;
  leftBody: string;
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

function renderSloganLine(line: string) {
  const words = line.split(" ");
  const keyword = words.pop();

  return (
    <>
      {words.length > 0 ? <span className="home-brandline-copy">{words.join(" ")}</span> : null}
      {keyword ? <span className="home-brandline-keyword">{keyword}</span> : null}
    </>
  );
}

export function HomeView({ copy, onEnterVending }: HomeViewProps) {
  return (
    <section className="home-showcase" aria-label={copy.eyebrow}>
      <div className="home-brandline">
        <span>{copy.brandTitle}</span>
        <strong>
          {copy.brandSlogan.split("\n").map((line, index) => (
            <span className={`home-brandline-line home-brandline-line-${index + 1}`} key={line}>
              {renderSloganLine(line)}
            </span>
          ))}
        </strong>
      </div>

      <div className="home-character" aria-hidden="true">
        <span className="home-character-card">
          <img alt="" src={homeIdolStage} />
        </span>
      </div>

      <div className="home-panel">
        <div className="home-copy home-copy-left">
          <span>{copy.eyebrow}</span>
          <h2>{copy.rightTitle}</h2>
          <p>{copy.leftBody}</p>
          <IrukaBeam className="home-action-beam">
            <button onClick={onEnterVending} type="button">
              {copy.action}
              <ArrowRight size={17} />
            </button>
          </IrukaBeam>
          <div className="home-proof">
            <Sparkles size={16} />
            <strong>{copy.proof}</strong>
          </div>
        </div>

        <aside className="home-panel-right" aria-label={copy.vendingTitle}>
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
          <span className="home-featured-label">{copy.vendingMeta}</span>
          <div className="home-featured-card">
            <div className="home-vending-machine" aria-hidden="true">
              <span className="home-vending-glass">
                <i />
                <i />
                <i />
              </span>
              <span className="home-vending-slot" />
            </div>
            <strong>{copy.vendingTitle}</strong>
            <p>{copy.rightBody}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
