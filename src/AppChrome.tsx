import type { Dispatch, SetStateAction } from "react";
import type { AppCopy } from "./appCopy";
import type { AppView, Locale, WalletAuthMode } from "./appTypes";
import { AuthActions } from "./AuthActions";
import irukaWordmark from "./assets/iruka-wordmark.png";
import type { GiwaWallet } from "./giwaPull.ts";

export const MINTLIFY_DOCS_URL = "https://docs.playiruka.space/overview";

type ShowView = (view: AppView, targetId?: string) => void;

type AppHeaderProps = {
  activeView: AppView;
  authenticated: boolean;
  connectSignal: number;
  externalConnectSignal: number;
  copy: AppCopy["nav"];
  locale: Locale;
  onAuthenticatedChange: Dispatch<SetStateAction<boolean>>;
  onExternalWalletChange: Dispatch<SetStateAction<GiwaWallet | undefined>>;
  onLocaleChange: Dispatch<SetStateAction<Locale>>;
  onShowView: ShowView;
  onWalletChange: Dispatch<SetStateAction<GiwaWallet | undefined>>;
  walletAuth: WalletAuthMode;
};

export function AppHeader({
  activeView,
  authenticated,
  connectSignal,
  externalConnectSignal,
  copy,
  locale,
  onAuthenticatedChange,
  onExternalWalletChange,
  onLocaleChange,
  onShowView,
  onWalletChange,
  walletAuth
}: AppHeaderProps) {
  return (
    <header
      className={`app-nav${
        walletAuth === "privy" && authenticated ? " app-nav-profile" : ""
      }`}
    >
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
          onClick={() => onShowView("pull")}
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

      <a
        className="header-wordmark"
        href="#home"
        aria-label="Iruka home"
        onClick={(event) => {
          event.preventDefault();
          onShowView("home");
        }}
      >
        <img src={irukaWordmark} alt="Iruka" />
      </a>

      <div
        className={`nav-actions${
          walletAuth === "privy" && authenticated ? " nav-actions-profile" : ""
        }`}
      >
        {(walletAuth !== "privy" || !authenticated) ? (
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
        ) : null}
        <AuthActions
          connectSignal={connectSignal}
          externalConnectSignal={externalConnectSignal}
          labels={{
            account: copy.account,
            connected: copy.walletConnected,
            connecting: copy.walletConnecting,
            disconnect: copy.walletDisconnect,
            language: copy.language,
            login: copy.login,
            network: copy.profileNetwork,
            settings: copy.settings,
            setupWallet: copy.setupWallet,
            signUp: copy.signUp,
            unavailable: copy.wallet
          }}
          locale={locale}
          mode={walletAuth}
          onAuthenticatedChange={onAuthenticatedChange}
          onExternalWalletChange={onExternalWalletChange}
          onLocaleChange={onLocaleChange}
          onOpenAccount={() => onShowView("account")}
          onWalletChange={onWalletChange}
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
        <a
          className="footer-brand-link"
          href="#home"
          aria-label="Iruka home"
          onClick={(event) => {
            event.preventDefault();
            onShowView("home");
          }}
        >
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
