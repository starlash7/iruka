import type { User } from "@privy-io/react-auth";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AccountPage,
  type AccountBalance,
  type AccountCopy,
  type AccountInventorySummary
} from "./AccountPage";
import {
  formatGiwaNativeBalance,
  getGiwaNativeBalance
} from "./giwaBalance.ts";
import type { GiwaWallet } from "./giwaPull.ts";
import { sendGiwaNativeTransfer } from "./giwaTransfer.ts";
import type { CardPull } from "./vendingTypes";

export { AccountPage };

type AccountViewProps = {
  cards: readonly CardPull[];
  copy: AccountCopy;
  externalWallet?: GiwaWallet;
  inventoryContent: ReactNode;
  wallet: GiwaWallet;
};

export function getAccountInventorySummary(
  cards: readonly Pick<CardPull, "estimatedValue" | "vaultStatus">[]
): AccountInventorySummary {
  const ownedCards = cards.filter((card) => card.vaultStatus !== "Sold");

  return {
    estimatedValue: ownedCards.reduce((total, card) => total + card.estimatedValue, 0),
    listed: ownedCards.filter((card) => card.vaultStatus === "Listed").length,
    shipping: ownedCards.filter((card) => card.vaultStatus === "Redeem queued").length,
    total: ownedCards.length
  };
}

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getAccountIdentity(
  user: Pick<User, "email" | "google"> | null,
  walletAddress: string
) {
  return user?.google?.name?.trim()
    || user?.email?.address
    || formatAddress(walletAddress);
}

export function createAccountBalanceLoader(
  readBalance: (address: string) => Promise<bigint> = getGiwaNativeBalance
) {
  let requestGeneration = 0;

  return async function loadAccountBalance(
    address: string,
    setBalance: (balance: AccountBalance) => void
  ) {
    const requestId = ++requestGeneration;
    setBalance({ status: "loading" });

    try {
      const nextBalance = await readBalance(address);
      if (requestId !== requestGeneration) return;
      setBalance({ label: formatGiwaNativeBalance(nextBalance), status: "ready" });
    } catch {
      if (requestId !== requestGeneration) return;
      setBalance({ status: "error" });
    }
  };
}

export function AccountView({
  cards,
  copy,
  externalWallet,
  inventoryContent,
  wallet
}: AccountViewProps) {
  const walletAddress = wallet.address;
  const [balance, setBalance] = useState<AccountBalance>({ status: "loading" });
  const [copied, setCopied] = useState(false);
  const [fundsDialog, setFundsDialog] = useState<"add" | "withdraw">();
  const walletAddressRef = useRef(walletAddress);
  walletAddressRef.current = walletAddress;
  const inventory = useMemo(() => getAccountInventorySummary(cards), [cards]);
  const loadLatestBalance = useMemo(() => createAccountBalanceLoader(), []);

  const loadBalance = useCallback(
    () => loadLatestBalance(walletAddress, (nextBalance) => {
      if (walletAddressRef.current === walletAddress) setBalance(nextBalance);
    }),
    [loadLatestBalance, walletAddress]
  );

  useEffect(() => {
    void loadBalance();
  }, [loadBalance]);

  useEffect(() => {
    function refreshBalance() {
      void loadBalance();
    }

    window.addEventListener("focus", refreshBalance);
    return () => window.removeEventListener("focus", refreshBalance);
  }, [loadBalance]);

  async function copyAddress() {
    try {
      await window.navigator.clipboard.writeText(walletAddress);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <AccountPage
      address={walletAddress}
      addFundsOpen={fundsDialog === "add"}
      balance={balance}
      copied={copied}
      copy={copy}
      externalWalletAddress={externalWallet?.address}
      inventory={inventory}
      inventoryContent={inventoryContent}
      onAddFunds={() => setFundsDialog("add")}
      onAddFundsTransfer={(amount) => {
        if (!externalWallet) return Promise.reject(new Error("No connected wallet"));
        return sendGiwaNativeTransfer(externalWallet, walletAddress, amount);
      }}
      onCloseAddFunds={() => {
        setCopied(false);
        setFundsDialog(undefined);
      }}
      onCloseWithdraw={() => setFundsDialog(undefined)}
      onCopyAddress={() => void copyAddress()}
      onRetryBalance={() => void loadBalance()}
      onTransferComplete={() => void loadBalance()}
      onWithdraw={() => setFundsDialog("withdraw")}
      onWithdrawTransfer={(destination, amount) =>
        sendGiwaNativeTransfer(wallet, destination, amount)}
      withdrawOpen={fundsDialog === "withdraw"}
    />
  );
}
