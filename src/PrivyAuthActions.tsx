import {
  useConnectWallet,
  useLogin,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import { LogIn, LogOut, UserPlus, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AuthActionsProps } from "./AuthActions";
import { IrukaBeam } from "./IrukaBeam";
import { ProfileMenu } from "./ProfileMenu";
import {
  clearExternalWalletSession,
  getExternalWalletSessionAddress,
  getExternalLoginWalletAddress,
  getTransactionGiwaWallet,
  getWalletPromptAction,
  saveExternalWalletSession,
} from "./walletConnection";

export function PrivyAuthActions({
  connectSignal,
  labels,
  locale,
  onAuthenticatedChange,
  onLocaleChange,
  onOpenAccount,
  onWalletChange
}: Omit<AuthActionsProps, "mode">) {
  const [externalWalletSessionAddress, setExternalWalletSessionAddress] = useState(
    getExternalWalletSessionAddress
  );
  const { authenticated, logout, ready, user } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { login } = useLogin({
    onComplete: ({ loginAccount, wasAlreadyAuthenticated }) => {
      const address = getExternalLoginWalletAddress(
        wasAlreadyAuthenticated,
        loginAccount
      );
      if (!address) return;

      saveExternalWalletSession(address);
      setExternalWalletSessionAddress(address);
    }
  });
  const { connectWallet } = useConnectWallet({
    onSuccess: ({ wallet }) => {
      if (wallet.type !== "ethereum" || wallet.walletClientType === "privy") return;
      saveExternalWalletSession(wallet.address);
      setExternalWalletSessionAddress(wallet.address);
    }
  });
  const handledConnectSignalRef = useRef(0);
  const transactionWallet = getTransactionGiwaWallet(
    authenticated,
    walletsReady,
    wallets,
    externalWalletSessionAddress
  );
  const identity = user?.google?.name?.trim()
    || user?.email?.address
    || labels.connected;

  function beginLogin() {
    clearExternalWalletSession();
    setExternalWalletSessionAddress(undefined);
    login({ walletChainType: "ethereum-only" });
  }

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
      onWalletChange(undefined);
      return;
    }

    if (walletsReady) onWalletChange(transactionWallet);
  }, [authenticated, onAuthenticatedChange, onWalletChange, transactionWallet, walletsReady]);

  useEffect(() => {
    const promptAction = getWalletPromptAction(
      connectSignal,
      handledConnectSignalRef.current,
      ready,
      authenticated
    );
    if (!promptAction) return;

    handledConnectSignalRef.current = connectSignal;
    if (promptAction === "login") beginLogin();
  }, [authenticated, connectSignal, login, ready]);

  if (!authenticated) {
    return (
      <div className="auth-actions">
        <button className="auth-button auth-button-secondary" disabled={!ready} onClick={beginLogin} type="button">
          <LogIn size={15} />
          {ready ? labels.login : labels.connecting}
        </button>
        <IrukaBeam active={ready} className="auth-primary-beam" variant="action">
          <button className="auth-button auth-button-primary iruka-action-button" disabled={!ready} onClick={beginLogin} type="button">
            <UserPlus size={15} />
            {labels.signUp}
          </button>
        </IrukaBeam>
      </div>
    );
  }

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
    <ProfileMenu
      identity={identity}
      labels={{
        account: labels.account,
        language: labels.language,
        network: labels.network,
        settings: labels.settings,
        signOut: labels.disconnect
      }}
      locale={locale}
      onLocaleChange={onLocaleChange}
      onOpenAccount={onOpenAccount}
      onSignOut={() => void signOutUser()}
    />
  );
}
