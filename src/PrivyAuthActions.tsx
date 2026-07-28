import {
  useConnectWallet,
  useCreateWallet,
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
  getExternalGiwaWallet,
  getExternalWalletSessionAddress,
  getExternalLoginWalletAddress,
  getIrukaAccountWallet,
  getWalletPromptAction,
  saveExternalWalletSession,
} from "./walletConnection";

export function PrivyAuthActions({
  connectSignal,
  externalConnectSignal,
  labels,
  locale,
  onAuthenticatedChange,
  onExternalWalletChange,
  onLocaleChange,
  onOpenAccount,
  onWalletChange
}: Omit<AuthActionsProps, "mode">) {
  const [externalWalletSessionAddress, setExternalWalletSessionAddress] = useState(
    getExternalWalletSessionAddress
  );
  const { authenticated, logout, ready, user } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { createWallet } = useCreateWallet();
  const walletSetupAttemptRef = useRef<string>();
  const handledExternalConnectSignalRef = useRef(0);
  const { connectWallet } = useConnectWallet({
    onSuccess: ({ wallet }) => {
      if (
        wallet.type !== "ethereum"
        || wallet.walletClientType.startsWith("privy")
      ) {
        return;
      }

      saveExternalWalletSession(wallet.address);
      setExternalWalletSessionAddress(wallet.address);
    }
  });
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
  const handledConnectSignalRef = useRef(0);
  const accountWallet = getIrukaAccountWallet(
    authenticated,
    walletsReady,
    wallets
  );
  const externalWallet = getExternalGiwaWallet(
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

  function setupAccountWallet() {
    if (!user?.id) return;
    walletSetupAttemptRef.current = user.id;
    void createWallet().catch(() => {
      walletSetupAttemptRef.current = undefined;
    });
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
      onExternalWalletChange(undefined);
      return;
    }

    if (walletsReady) {
      onWalletChange(accountWallet);
      onExternalWalletChange(externalWallet);
    }
  }, [
    accountWallet,
    authenticated,
    externalWallet,
    onAuthenticatedChange,
    onExternalWalletChange,
    onWalletChange,
    walletsReady
  ]);

  useEffect(() => {
    if (
      !authenticated ||
      !walletsReady ||
      accountWallet ||
      !user?.id ||
      walletSetupAttemptRef.current === user.id
    ) {
      return;
    }

    setupAccountWallet();
  }, [accountWallet, authenticated, createWallet, user?.id, walletsReady]);

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

  useEffect(() => {
    if (
      !authenticated
      || !walletsReady
      || externalWallet
      || externalConnectSignal <= handledExternalConnectSignalRef.current
    ) {
      return;
    }

    handledExternalConnectSignalRef.current = externalConnectSignal;
    connectWallet({
      walletChainType: "ethereum-only",
      walletList: ["phantom", "okx_wallet", "metamask"]
    });
  }, [
    authenticated,
    connectWallet,
    externalConnectSignal,
    externalWallet,
    walletsReady
  ]);

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

  if (authenticated && !walletsReady) {
    return (
      <div className="auth-actions">
        <button className="auth-button auth-button-secondary" disabled type="button">
          <Wallet size={15} />
          {labels.connecting}
        </button>
      </div>
    );
  }

  if (!accountWallet) {
    return (
      <div className="auth-actions">
        <button className="auth-button auth-button-secondary" onClick={() => void signOutUser()} type="button">
          <LogOut size={15} />
          {labels.disconnect}
        </button>
        <IrukaBeam className="auth-primary-beam" variant="action">
          <button className="auth-button auth-button-primary iruka-action-button" onClick={setupAccountWallet} type="button">
            <Wallet size={15} />
            {labels.setupWallet}
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
