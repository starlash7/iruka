import { PackageOpen } from "lucide-react";
import type { ReactNode } from "react";
import { AccountDepositDialog } from "./AccountDepositDialog";
import { AccountProfileHero } from "./AccountProfileHero";
import { AccountStats } from "./AccountStats";
import { AccountWalletPanel } from "./AccountWalletPanel";

export type AccountCopy = {
  account: string;
  address: string;
  balance: string;
  balanceError: string;
  cards: string;
  cardsCollected: string;
  close: string;
  collectionSummary: string;
  copied: string;
  copyAddress: string;
  deposit: string;
  empty: string;
  faucet: string;
  inventory: string;
  inventoryValue: string;
  listed: string;
  loadingBalance: string;
  network: string;
  overview: string;
  retry: string;
  shipping: string;
  signOut: string;
  testEth: string;
  wallet: string;
  walletDetails: string;
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
  copied?: boolean;
  copy: AccountCopy;
  depositOpen: boolean;
  inventory: AccountInventorySummary;
  inventoryContent: ReactNode;
  onCloseDeposit: () => void;
  onCopyAddress: () => void;
  onDeposit: () => void;
  onRetryBalance: () => void;
};

export function AccountPage({
  address,
  balance,
  copied = false,
  copy,
  depositOpen,
  inventory,
  inventoryContent,
  onCloseDeposit,
  onCopyAddress,
  onDeposit,
  onRetryBalance
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
              onCopyAddress={onCopyAddress}
              onDeposit={onDeposit}
              onRetryBalance={onRetryBalance}
            />
          </section>
        </div>

        <article className="account-inventory-panel" id="account-inventory">
          <header>
            <h2>{copy.inventory}</h2>
            <span className="account-inventory-icon">
              <PackageOpen size={20} />
            </span>
          </header>

          <div className="account-inventory-list">{inventoryContent}</div>
        </article>
      </div>

      <AccountDepositDialog
        address={address}
        copied={copied}
        copy={copy}
        onClose={onCloseDeposit}
        onCopyAddress={onCopyAddress}
        open={depositOpen}
      />
    </section>
  );
}
