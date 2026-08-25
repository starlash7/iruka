import homeIdolStage from "./assets/home-idol-stage-cutout.png";
import irukaWordmark from "./assets/iruka-wordmark.png";
import { HomePixelUnfold } from "./HomePixelUnfold";
import { HomeScrambleText } from "./HomeScrambleText";

type HomeEntryProps = {
  canEnter?: boolean;
  onEnter: () => void;
};

export function HomeEntry({ canEnter = true, onEnter }: HomeEntryProps) {
  return (
    <main className="iruka-entry">
      <HomePixelUnfold />
      <h1 className="sr-only">Iruka</h1>
      <img alt="Iruka" className="iruka-entry-wordmark" src={irukaWordmark} />
      <div className="iruka-entry-stage" aria-hidden="true">
        <img alt="" src={homeIdolStage} />
      </div>
      <div className="iruka-entry-actions">
        <HomeScrambleText className="iruka-entry-prompt" text="Find your next favorite" />
        <button
          className="iruka-action-button iruka-entry-action"
          disabled={canEnter === false}
          onClick={onEnter}
          type="button"
        >
          <span>Play Iruka!</span>
        </button>
      </div>
    </main>
  );
}
