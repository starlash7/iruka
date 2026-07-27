import type {
  ConnectedWallet,
  LinkedAccountWithMetadata,
} from "@privy-io/react-auth";

const externalWalletSessionKey = "iruka-external-wallet-session";

export function shouldHandleWalletPrompt(
  connectSignal: number,
  handledConnectSignal: number,
  ready: boolean
) {
  return ready && connectSignal > handledConnectSignal;
}

export function getWalletPromptAction(
  connectSignal: number,
  handledConnectSignal: number,
  ready: boolean,
  authenticated: boolean
) {
  if (!shouldHandleWalletPrompt(connectSignal, handledConnectSignal, ready)) {
    return undefined;
  }

  return authenticated ? "none" : "login";
}

export function getExternalLoginWalletAddress(
  wasAlreadyAuthenticated: boolean,
  loginAccount: LinkedAccountWithMetadata | null
) {
  if (
    wasAlreadyAuthenticated ||
    loginAccount?.type !== "wallet" ||
    loginAccount.chainType !== "ethereum" ||
    loginAccount.walletClientType?.startsWith("privy")
  ) {
    return undefined;
  }

  return loginAccount.address;
}

export function getIrukaAccountWallet(
  authenticated: boolean,
  walletsReady: boolean,
  wallets: readonly ConnectedWallet[]
) {
  if (!authenticated || !walletsReady) return undefined;

  return wallets.find(
    (wallet) =>
      wallet.type === "ethereum" &&
      wallet.linked &&
      wallet.walletClientType?.startsWith("privy")
  );
}

export function getExternalGiwaWallet(
  authenticated: boolean,
  walletsReady: boolean,
  wallets: readonly ConnectedWallet[],
  externalWalletAddress?: string
) {
  if (!authenticated || !walletsReady || !externalWalletAddress) return undefined;

  const normalizedExternalAddress = externalWalletAddress.toLowerCase();

  return wallets.find(
    (wallet) =>
      wallet.type === "ethereum" &&
      !wallet.walletClientType?.startsWith("privy") &&
      wallet.address.toLowerCase() === normalizedExternalAddress
  );
}

export function getExternalWalletSessionAddress() {
  if (typeof window === "undefined") return undefined;
  return window.sessionStorage.getItem(externalWalletSessionKey) ?? undefined;
}

export function saveExternalWalletSession(address: string) {
  window.sessionStorage.setItem(externalWalletSessionKey, address);
}

export function clearExternalWalletSession() {
  window.sessionStorage.removeItem(externalWalletSessionKey);
}
