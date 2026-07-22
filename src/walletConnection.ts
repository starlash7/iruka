import type { ConnectedWallet } from "@privy-io/react-auth";

const externalWalletSessionKey = "iruka-external-wallet-session";

export function getAuthenticatedGiwaWallet(
  authenticated: boolean,
  walletsReady: boolean,
  wallets: readonly ConnectedWallet[]
) {
  if (!authenticated || !walletsReady) return undefined;

  return wallets.find((wallet) => wallet.type === "ethereum" && wallet.linked);
}

export function getTransactionGiwaWallet(
  authenticated: boolean,
  walletsReady: boolean,
  wallets: readonly ConnectedWallet[],
  externalWalletAddress?: string
) {
  if (!authenticated || !walletsReady) return undefined;

  const linkedEvmWallets = wallets.filter(
    (wallet) => wallet.type === "ethereum" && wallet.linked
  );

  return linkedEvmWallets.find(
    (wallet) => wallet.walletClientType !== "privy" && wallet.address === externalWalletAddress
  ) ?? linkedEvmWallets.find((wallet) => wallet.walletClientType === "privy");
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
