import { usePrivy, useWallets } from "@privy-io/react-auth";
import { LogIn, LogOut, UserPlus, Wallet } from "lucide-react";
import { useEffect } from "react";

type WalletAuthMode = "disabled" | "privy";

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
};

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function AuthActions({
  connectSignal,
  labels,
  mode,
  onConnectedChange
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
    />
  );
}

function PrivyAuthActions({
  connectSignal,
  labels,
  onConnectedChange
}: Omit<AuthActionsProps, "mode">) {
  const { authenticated, login, logout, ready, user } = usePrivy();
  const { wallets } = useWallets();
  const connectedAddress = user?.wallet?.address ?? wallets[0]?.address;
  const connectedLabel = connectedAddress ? formatAddress(connectedAddress) : labels.connected;

  useEffect(() => {
    onConnectedChange(authenticated);
  }, [authenticated, onConnectedChange]);

  useEffect(() => {
    if (connectSignal > 0 && ready && !authenticated) {
      login();
    }
  }, [authenticated, connectSignal, login, ready]);

  if (authenticated) {
    return (
      <div className="auth-actions">
        <button className="auth-button auth-button-secondary auth-button-connected" disabled type="button">
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
      <button className="auth-button auth-button-primary" disabled={!ready} onClick={() => login()} type="button">
        <UserPlus size={15} />
        {labels.signUp}
      </button>
    </div>
  );
}
