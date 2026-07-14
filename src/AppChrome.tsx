import type { Dispatch, SetStateAction } from "react";
import type { AppCopy } from "./appCopy";
import type { AppView, Locale, WalletAuthMode } from "./appTypes";
import { AuthActions } from "./AuthActions";
import irukaWordmark from "./assets/iruka-wordmark.png";

export const MINTLIFY_DOCS_URL = "https://docs.playiruka.space/overview";

type ShowView = (view: AppView, targetId?: string) => void;

type AppHeaderProps = {
  activeView: AppView;
  connectSignal: number;
  copy: AppCopy["nav"];
  locale: Locale;
  onConnectedChange: Dispatch<SetStateAction<boolean>>;
  onLocaleChange: Dispatch<SetStateAction<Locale>>;
  onShowView: ShowView;
  walletAuth: WalletAuthMode;
};

export function AppHeader({
  activeView,
  connectSignal,
  copy,
  locale,
  onConnectedChange,
  onLocaleChange,
  onShowView,
  walletAuth
}: AppHeaderProps) {
  return (
    <header className="app-nav">
      <nav className="nav-links" aria-label="Primary navigation">
        <button
          aria-pressed={activeView === "home"}
          className={activeView === "home" ? "selected" : ""}
          onClick={() => onShowView("home")}
          type="button"
        >
          {copy.home}
        </button>
        <button
          aria-pressed={activeView === "pull"}
          className={activeView === "pull" ? "selected" : ""}
          onClick={() => onShowView("pull", "drops")}
          type="button"
        >
          {copy.pull}
        </button>
        <button
          aria-pressed={activeView === "marketplace"}
          className={activeView === "marketplace" ? "selected" : ""}
          onClick={() => onShowView("marketplace")}
          type="button"
        >
          {copy.marketplace}
        </button>
        <button
          aria-pressed={activeView === "events"}
          className={activeView === "events" ? "selected" : ""}
          onClick={() => onShowView("events")}
          type="button"
        >
          {copy.event}
        </button>
      </nav>

      <a className="header-wordmark" href="/" aria-label="Iruka home">
        <img src={irukaWordmark} alt="Iruka" />
      </a>

      <div className="nav-actions">
        <div className="language-toggle" aria-label={copy.language}>
          {(["en", "ko"] as const).map((item) => (
            <button
              aria-pressed={locale === item}
              className={locale === item ? "selected" : ""}
              key={item}
              onClick={() => onLocaleChange(item)}
              type="button"
            >
              {item === "en" ? "EN" : "KO"}
            </button>
          ))}
        </div>
        <AuthActions
          connectSignal={connectSignal}
          labels={{
            connected: copy.walletConnected,
            connecting: copy.walletConnecting,
            disconnect: copy.walletDisconnect,
            login: copy.login,
            signUp: copy.signUp,
            unavailable: copy.wallet
          }}
          mode={walletAuth}
          onConnectedChange={onConnectedChange}
          onOpenVault={() => onShowView("vault")}
        />
      </div>
    </header>
  );
}

type AppFooterProps = {
  copy: AppCopy["footer"];
  onShowView: ShowView;
  pullLabel: string;
};

export function AppFooter({ copy, onShowView, pullLabel }: AppFooterProps) {
  return (
    <footer className="site-footer" id="footer">
      <div className="footer-brand">
        <a className="footer-brand-link" href="/" aria-label="Iruka home">
          <span className="logo-mark" aria-hidden="true">
            <img src="/iruka-logo.png" alt="" />
          </span>
          <img src={irukaWordmark} alt="Iruka" />
        </a>
        <p>{copy.body}</p>
      </div>

      <nav className="footer-column" aria-label={copy.about}>
        <h2>{copy.about}</h2>
        <button onClick={() => onShowView("home")} type="button">
          {copy.links.home}
        </button>
        <button onClick={() => onShowView("pull")} type="button">
          {pullLabel}
        </button>
        <button onClick={() => onShowView("marketplace")} type="button">
          {copy.links.marketplace}
        </button>
      </nav>

      <nav className="footer-column" aria-label={copy.quickLinks}>
        <h2>{copy.quickLinks}</h2>
        <button onClick={() => onShowView("events")} type="button">
          {copy.links.event}
        </button>
        <button onClick={() => onShowView("roadmap")} type="button">
          {copy.links.roadmap}
        </button>
        <a href={MINTLIFY_DOCS_URL} target="_blank" rel="noreferrer">
          {copy.links.documentation}
        </a>
      </nav>

      <nav className="footer-column" aria-label={copy.support}>
        <h2>{copy.support}</h2>
        <a href="mailto:hello@playiruka.space">{copy.links.contact}</a>
      </nav>
    </footer>
  );
}
