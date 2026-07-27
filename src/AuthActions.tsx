import { LogIn, UserPlus } from "lucide-react";
import type { Locale, WalletAuthMode } from "./appTypes";
import type { GiwaWallet } from "./giwaPull.ts";
import { PrivyAuthActions } from "./PrivyAuthActions";

export type AuthLabels = {
  account: string;
  connected: string;
  connecting: string;
  disconnect: string;
  language: string;
  login: string;
  network: string;
  settings: string;
  setupWallet: string;
  signUp: string;
  unavailable: string;
};

export type AuthActionsProps = {
  connectSignal: number;
  labels: AuthLabels;
  locale: Locale;
  mode: WalletAuthMode;
  onAuthenticatedChange: (authenticated: boolean) => void;
  onLocaleChange: (locale: Locale) => void;
  onOpenAccount: () => void;
  onExternalWalletChange: (wallet: GiwaWallet | undefined) => void;
  onWalletChange: (wallet: GiwaWallet | undefined) => void;
};

export function AuthActions({
  connectSignal,
  labels,
  locale,
  mode,
  onAuthenticatedChange,
  onExternalWalletChange,
  onLocaleChange,
  onOpenAccount,
  onWalletChange
}: AuthActionsProps) {
  if (mode !== "privy") {
    return (
      <div className="auth-actions">
        <button className="auth-button auth-button-secondary" disabled title={labels.unavailable} type="button">
          <LogIn size={15} />
          {labels.login}
        </button>
        <button className="auth-button auth-button-primary" disabled title={labels.unavailable} type="button">
          <UserPlus size={15} />
          {labels.signUp}
        </button>
      </div>
    );
  }

  return (
    <PrivyAuthActions
      connectSignal={connectSignal}
      labels={labels}
      locale={locale}
      onAuthenticatedChange={onAuthenticatedChange}
      onExternalWalletChange={onExternalWalletChange}
      onLocaleChange={onLocaleChange}
      onOpenAccount={onOpenAccount}
      onWalletChange={onWalletChange}
    />
  );
}
