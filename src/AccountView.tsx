import { flushSync } from "react-dom";
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
import {
  clearPendingGiwaTransfer,
  createPendingGiwaTransfer,
  getPendingGiwaTransfer,
  savePendingGiwaTransfer,
  type PendingGiwaTransfer
} from "./giwaPendingTransfer.ts";
import {
  GiwaTransferRevertedError,
  sendGiwaNativeTransfer,
  waitForGiwaNativeTransfer
} from "./giwaTransfer.ts";
import type { CardPull } from "./vendingTypes";

export { AccountPage };

type AccountViewProps = {
  cards: readonly CardPull[];
  copy: AccountCopy;
  externalWallet?: GiwaWallet;
  inventoryContent: ReactNode;
  onConnectExternalWallet: () => void;
  onTransferBusyChange?: (busy: boolean) => void;
  wallet: GiwaWallet;
  transferLock?: { current: boolean };
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
  transferLock,
  onTransferBusyChange,
  cards,
  copy,
  externalWallet,
  inventoryContent,
  onConnectExternalWallet,
  wallet
}: AccountViewProps) {
  const walletAddress = wallet.address;
  const [balance, setBalance] = useState<AccountBalance>({ status: "loading" });
  const [copied, setCopied] = useState(false);
  const [fundsDialog, setFundsDialog] = useState<"add" | "withdraw">();
  const [pendingTransfer, setPendingTransfer] = useState<PendingGiwaTransfer>();
  const [isTransferBusy, setIsTransferBusy] = useState(false);
  const localTransferLock = useRef(false);
  const transferBusyRef = transferLock ?? localTransferLock;
  const pendingTransferRef = useRef<PendingGiwaTransfer>();
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
    const storedTransfer = pendingTransfer?.walletAddress.toLowerCase() === walletAddress.toLowerCase()
      ? pendingTransfer
      : getPendingGiwaTransfer(undefined, walletAddress);
    pendingTransferRef.current = storedTransfer;
    setPendingTransfer(storedTransfer);
    if (!storedTransfer) return;

    const transactionHash = storedTransfer.transactionHash;
    let active = true;
    let retryTimer: ReturnType<typeof window.setTimeout> | undefined;
    async function confirmTransfer() {
      try {
        await waitForGiwaNativeTransfer(transactionHash);
        if (!active) return;
        clearPendingGiwaTransfer(undefined, walletAddress, transactionHash);
        pendingTransferRef.current = undefined;
        setPendingTransfer(undefined);
        void loadBalance();
      } catch (error) {
        if (!active) return;
        if (error instanceof GiwaTransferRevertedError) {
          clearPendingGiwaTransfer(undefined, walletAddress, transactionHash);
          pendingTransferRef.current = undefined;
          setPendingTransfer(undefined);
        } else {
          retryTimer = window.setTimeout(() => void confirmTransfer(), 5000);
        }
      }
    }
    void confirmTransfer();

    return () => {
      active = false;
      window.clearTimeout(retryTimer);
    };
  }, [loadBalance, walletAddress, pendingTransfer?.transactionHash]);

  useEffect(() => {
    function refreshBalance() {
      void loadBalance();
      const storedTransfer = getPendingGiwaTransfer(undefined, walletAddress);
      if (storedTransfer && storedTransfer.transactionHash !== pendingTransferRef.current?.transactionHash) {
        pendingTransferRef.current = storedTransfer;
        setPendingTransfer(storedTransfer);
      }
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

  async function transferGiwaFunds(
    direction: PendingGiwaTransfer["direction"],
    sender: GiwaWallet,
    destination: string,
    amount: string
  ) {
    const storedTransfer = getPendingGiwaTransfer(undefined, walletAddress);
    if (storedTransfer) {
      pendingTransferRef.current = storedTransfer;
      setPendingTransfer(storedTransfer);
    }
    if (transferBusyRef.current || pendingTransferRef.current) {
      throw new Error("A GIWA transfer is already confirming");
    }

    transferBusyRef.current = true;
    setIsTransferBusy(true);
    onTransferBusyChange?.(true);
    try {
      const receipt = await sendGiwaNativeTransfer(
        sender,
        destination,
        amount,
        {
          onSubmitted: (transactionHash) => {
            const transfer = createPendingGiwaTransfer({
              direction,
              transactionHash,
              walletAddress
            });
            pendingTransferRef.current = transfer;
            savePendingGiwaTransfer(undefined, transfer);
            setPendingTransfer(transfer);
          }
        }
      );
      clearPendingGiwaTransfer(
        undefined,
        walletAddress,
        receipt.transactionHash
      );
      pendingTransferRef.current = undefined;
      setPendingTransfer(undefined);
      return receipt;
    } catch (error) {
      if (error instanceof GiwaTransferRevertedError) {
        const transfer = getPendingGiwaTransfer(
          undefined,
          walletAddress
        );
        if (transfer) {
          clearPendingGiwaTransfer(
            undefined,
            transfer.walletAddress,
            transfer.transactionHash
          );
          pendingTransferRef.current = undefined;
          setPendingTransfer(undefined);
        }
      }
      throw error;
    } finally {
      transferBusyRef.current = false;
      setIsTransferBusy(false);
      onTransferBusyChange?.(false);
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
        return transferGiwaFunds(
          "deposit",
          externalWallet,
          walletAddress,
          amount
        );
      }}
      onCloseAddFunds={() => {
        setCopied(false);
        setFundsDialog(undefined);
      }}
      onCloseWithdraw={() => setFundsDialog(undefined)}
      onConnectExternalWallet={() => {
        // Privy's wallet picker is portalled outside the native funding dialog.
        flushSync(() => setFundsDialog(undefined));
        onConnectExternalWallet();
      }}
      onCopyAddress={() => void copyAddress()}
      onRetryBalance={() => void loadBalance()}
      onTransferComplete={() => void loadBalance()}
      onWithdraw={() => setFundsDialog("withdraw")}
      onWithdrawTransfer={(destination, amount) =>
        transferGiwaFunds("withdraw", wallet, destination, amount)}
      transferPending={isTransferBusy || transferBusyRef.current || Boolean(pendingTransfer)}
      withdrawOpen={fundsDialog === "withdraw"}
    />
  );
}
