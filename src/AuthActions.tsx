import { type ConnectedWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { LogIn, LogOut, UserPlus, Wallet } from "lucide-react";
import { useEffect } from "react";
import type { WalletAuthMode } from "./appTypes";
import type { GiwaWallet } from "./giwaPull.ts";
import { IrukaBeam } from "./IrukaBeam";

type AuthLabels = {
  connected: string;
  connecting: string;
  disconnect: string;
  login: string;
  signUp: string;
  unavailable: string;
};

type AuthActionsProps = {
  connectSignal: number;
  labels: AuthLabels;
  mode: WalletAuthMode;
  onConnectedChange: (connected: boolean) => void;
  onOpenVault: () => void;
  onWalletChange: (wallet: GiwaWallet | undefined) => void;
};

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getAuthenticatedGiwaWallet(
  authenticated: boolean,
  walletsReady: boolean,
  wallets: readonly ConnectedWallet[]
) {
  if (!authenticated || !walletsReady) return undefined;

  return wallets.find((wallet) => wallet.type === "ethereum" && wallet.linked);
}

export function AuthActions({
  connectSignal,
  labels,
  mode,
  onConnectedChange,
  onOpenVault,
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
      onConnectedChange={onConnectedChange}
      onOpenVault={onOpenVault}
      onWalletChange={onWalletChange}
    />
  );
}

function PrivyAuthActions({
  connectSignal,
  labels,
  onConnectedChange,
  onOpenVault,
  onWalletChange
}: Omit<AuthActionsProps, "mode">) {
  const { authenticated, login, logout, ready, user } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const connectedWallet = getAuthenticatedGiwaWallet(authenticated, walletsReady, wallets);
  const connectedAddress = connectedWallet?.address ?? user?.wallet?.address;
  const connectedLabel = connectedAddress ? formatAddress(connectedAddress) : labels.connected;

  useEffect(() => {
    onConnectedChange(authenticated);
    if (!authenticated || walletsReady) onWalletChange(connectedWallet);
  }, [authenticated, connectedWallet, onConnectedChange, onWalletChange, walletsReady]);

  useEffect(() => {
    if (connectSignal > 0 && ready && !authenticated) {
      login();
    }
  }, [authenticated, connectSignal, login, ready]);

  if (authenticated) {
    return (
      <div className="auth-actions">
        <button className="auth-button auth-button-secondary auth-button-connected" onClick={onOpenVault} type="button">
          <Wallet size={15} />
          {connectedLabel}
        </button>
        <button className="auth-button auth-button-primary" onClick={() => void logout()} type="button">
          <LogOut size={15} />
          {labels.disconnect}
        </button>
      </div>
    );
  }

  return (
    <div className="auth-actions">
      <button className="auth-button auth-button-secondary" disabled={!ready} onClick={() => login()} type="button">
        <LogIn size={15} />
        {ready ? labels.login : labels.connecting}
      </button>
      <IrukaBeam className="auth-primary-beam" strength={0.52}>
        <button className="auth-button auth-button-primary" disabled={!ready} onClick={() => login()} type="button">
          <UserPlus size={15} />
          {labels.signUp}
        </button>
      </IrukaBeam>
    </div>
  );
}
