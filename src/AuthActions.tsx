import { useConnectWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { LogIn, LogOut, UserPlus, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { WalletAuthMode } from "./appTypes";
import type { GiwaWallet } from "./giwaPull.ts";
import { IrukaBeam } from "./IrukaBeam";
import {
  clearExternalWalletSession,
  getAuthenticatedGiwaWallet,
  getExternalWalletSessionAddress,
  getTransactionGiwaWallet,
  saveExternalWalletSession,
  shouldHandleWalletPrompt
} from "./walletConnection";

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
  onAuthenticatedChange: (authenticated: boolean) => void;
  onOpenVault: () => void;
  onWalletChange: (wallet: GiwaWallet | undefined) => void;
};

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function AuthActions({
  connectSignal,
  labels,
  mode,
  onAuthenticatedChange,
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
      onAuthenticatedChange={onAuthenticatedChange}
      onOpenVault={onOpenVault}
      onWalletChange={onWalletChange}
    />
  );
}

function PrivyAuthActions({
  connectSignal,
  labels,
  onAuthenticatedChange,
  onOpenVault,
  onWalletChange
}: Omit<AuthActionsProps, "mode">) {
  const { authenticated, login, logout, ready, user } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { connectWallet } = useConnectWallet({
    onSuccess: ({ wallet }) => {
      if (wallet.type !== "ethereum" || wallet.walletClientType === "privy") return;
      saveExternalWalletSession(wallet.address);
      setExternalWalletSessionAddress(wallet.address);
    }
  });
  const [externalWalletSessionAddress, setExternalWalletSessionAddress] = useState(
    getExternalWalletSessionAddress
  );
  const handledConnectSignalRef = useRef(0);
  const initialAuthenticationRef = useRef<boolean>();
  const linkedWallet = getAuthenticatedGiwaWallet(authenticated, walletsReady, wallets);
  const transactionWallet = getTransactionGiwaWallet(
    authenticated,
    walletsReady,
    wallets,
    externalWalletSessionAddress
  );
  const connectedAddress = transactionWallet?.address ?? user?.wallet?.address;
  const connectedLabel = connectedAddress ? formatAddress(connectedAddress) : labels.connected;

  function connectExternalWallet() {
    connectWallet({ walletChainType: "ethereum-only" });
  }

  async function signOutUser() {
    clearExternalWalletSession();
    setExternalWalletSessionAddress(undefined);
    await logout();
  }

  useEffect(() => {
    onAuthenticatedChange(authenticated);
    if (!authenticated) {
      clearExternalWalletSession();
      setExternalWalletSessionAddress(undefined);
      onWalletChange(undefined);
      return;
    }

    if (walletsReady) onWalletChange(transactionWallet);
  }, [authenticated, onAuthenticatedChange, onWalletChange, transactionWallet, walletsReady]);

  useEffect(() => {
    if (!ready || !walletsReady || initialAuthenticationRef.current !== undefined) return;
    initialAuthenticationRef.current = authenticated;
  }, [authenticated, ready, walletsReady]);

  useEffect(() => {
    if (
      !authenticated ||
      !walletsReady ||
      initialAuthenticationRef.current !== false ||
      !linkedWallet ||
      linkedWallet.walletClientType === "privy"
    ) return;

    saveExternalWalletSession(linkedWallet.address);
    setExternalWalletSessionAddress(linkedWallet.address);
  }, [authenticated, linkedWallet, walletsReady]);

  useEffect(() => {
    if (!shouldHandleWalletPrompt(
      connectSignal,
      handledConnectSignalRef.current,
      ready
    )) return;

    handledConnectSignalRef.current = connectSignal;

    if (!authenticated) {
      login();
      return;
    }

    if (walletsReady && !transactionWallet) connectExternalWallet();
  }, [authenticated, connectSignal, login, ready, transactionWallet, walletsReady]);

  if (authenticated) {
    if (!transactionWallet) {
      return (
        <div className="auth-actions">
          <button className="auth-button auth-button-secondary" onClick={() => void signOutUser()} type="button">
            <LogOut size={15} />
            {labels.disconnect}
          </button>
          <IrukaBeam className="auth-primary-beam" variant="action">
            <button className="auth-button auth-button-primary iruka-action-button" onClick={connectExternalWallet} type="button">
              <Wallet size={15} />
              {labels.unavailable}
            </button>
          </IrukaBeam>
        </div>
      );
    }

    return (
      <div className="auth-actions">
        <button className="auth-button auth-button-secondary auth-button-connected" onClick={onOpenVault} type="button">
          <Wallet size={15} />
          {connectedLabel}
        </button>
        <button className="auth-button auth-button-primary" onClick={() => void signOutUser()} type="button">
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
      <IrukaBeam active={ready} className="auth-primary-beam" variant="action">
        <button className="auth-button auth-button-primary iruka-action-button" disabled={!ready} onClick={() => login()} type="button">
          <UserPlus size={15} />
          {labels.signUp}
        </button>
      </IrukaBeam>
    </div>
  );
}
