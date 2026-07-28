import type { ReactNode } from "react";
import { AccountAddFundsDialog } from "./AccountAddFundsDialog";
import { AccountProfileHero } from "./AccountProfileHero";
import { AccountStats } from "./AccountStats";
import { AccountWalletPanel } from "./AccountWalletPanel";
import { AccountWithdrawDialog } from "./AccountWithdrawDialog";
import type { GiwaTransferReceipt } from "./giwaTransfer";

export type AccountCopy = {
  account: string;
  addFunds: string;
  address: string;
  amount: string;
  back: string;
  balance: string;
  balanceError: string;
  cards: string;
  cardsCollected: string;
  chain: string;
  close: string;
  collectionSummary: string;
  comingSoon: string;
  connectExchange: string;
  connectWallet: string;
  copied: string;
  copyAddress: string;
  destination: string;
  enterAmount: string;
  enterRecipient: string;
  empty: string;
  ethereum: string;
  faucet: string;
  fromConnectedWallet: string;
  giwaSepolia: string;
  inventory: string;
  inventoryValue: string;
  listed: string;
  loadingBalance: string;
  network: string;
  networkFee: string;
  overview: string;
  receiveChain: string;
  receiveToken: string;
  retry: string;
  shownInWallet: string;
  shipping: string;
  signOut: string;
  testEth: string;
  token: string;
  transfer: string;
  transferCrypto: string;
  transferFailed: string;
  transferring: string;
  upbit: string;
  viewTransaction: string;
  wallet: string;
  walletDetails: string;
  withdraw: string;
  youWillReceive: string;
};

export type AccountBalance =
  | { status: "loading" }
  | { label: string; status: "ready" }
  | { status: "error" };

export type AccountInventorySummary = {
  estimatedValue: number;
  listed: number;
  shipping: number;
  total: number;
};

type AccountPageProps = {
  address: string;
  balance: AccountBalance;
  addFundsOpen: boolean;
  copied?: boolean;
  copy: AccountCopy;
  externalWalletAddress?: string;
  inventory: AccountInventorySummary;
  inventoryContent: ReactNode;
  onAddFunds: () => void;
  onAddFundsTransfer: (amount: string) => Promise<GiwaTransferReceipt>;
  onCloseAddFunds: () => void;
  onCloseWithdraw: () => void;
  onConnectExternalWallet: () => void;
  onCopyAddress: () => void;
  onRetryBalance: () => void;
  onTransferComplete: () => void;
  onWithdraw: () => void;
  onWithdrawTransfer: (
    destination: string,
    amount: string
  ) => Promise<GiwaTransferReceipt>;
  transferPending?: boolean;
  withdrawOpen: boolean;
};

export function AccountPage({
  address,
  addFundsOpen,
  balance,
  copied = false,
  copy,
  externalWalletAddress,
  inventory,
  inventoryContent,
  onAddFunds,
  onAddFundsTransfer,
  onCloseAddFunds,
  onCloseWithdraw,
  onConnectExternalWallet,
  onCopyAddress,
  onRetryBalance,
  onTransferComplete,
  onWithdraw,
  onWithdrawTransfer,
  transferPending = false,
  withdrawOpen
}: AccountPageProps) {
  return (
    <section className="account-section" id="account">
      <AccountProfileHero
        accountLabel={copy.account}
        inventoryLabel={copy.inventory}
        overviewLabel={copy.overview}
      />

      <div className="account-layout">
        <div className="account-overview-content" id="account-overview">
          <section
            aria-label={copy.collectionSummary}
            className="account-summary-grid"
          >
            <AccountStats copy={copy} inventory={inventory} />
            <AccountWalletPanel
              address={address}
              balance={balance}
              copied={copied}
              copy={copy}
              onAddFunds={onAddFunds}
              onCopyAddress={onCopyAddress}
              onRetryBalance={onRetryBalance}
              onWithdraw={onWithdraw}
              transferPending={transferPending}
            />
          </section>
        </div>

        <article className="account-inventory-panel" id="account-inventory">
          <header>
            <span className="account-inventory-icon">
              <img alt="" aria-hidden="true" src="/assets/iruka-icon-inventory.png" />
            </span>
            <h2>{copy.inventory}</h2>
          </header>

          <div className="account-inventory-list">{inventoryContent}</div>
        </article>
      </div>

      <AccountAddFundsDialog
        address={address}
        balance={balance}
        copied={copied}
        copy={copy}
        externalWalletAddress={externalWalletAddress}
        onClose={onCloseAddFunds}
        onConnectWallet={onConnectExternalWallet}
        onCopyAddress={onCopyAddress}
        onTransfer={onAddFundsTransfer}
        onTransferComplete={onTransferComplete}
        open={addFundsOpen}
      />
      <AccountWithdrawDialog
        balance={balance}
        copy={copy}
        onClose={onCloseWithdraw}
        onTransfer={onWithdrawTransfer}
        onTransferComplete={onTransferComplete}
        open={withdrawOpen}
      />
    </section>
  );
}
