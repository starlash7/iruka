import { Copy, RefreshCw, WalletCards } from "lucide-react";
import type { AccountBalance, AccountCopy } from "./AccountPage";

type AccountWalletPanelProps = {
  address: string;
  balance: AccountBalance;
  copied: boolean;
  copy: AccountCopy;
  onCopyAddress: () => void;
  onDeposit: () => void;
  onRetryBalance: () => void;
};

export function AccountWalletPanel({
  address,
  balance,
  copied,
  copy,
  onCopyAddress,
  onDeposit,
  onRetryBalance
}: AccountWalletPanelProps) {
  return (
    <article className="account-wallet-panel">
      <header className="account-wallet-heading">
        <h2>{copy.wallet}</h2>
        <span aria-hidden="true"><WalletCards size={20} /></span>
      </header>

      <div className="account-wallet-balance">
        {balance.status === "loading" ? (
          <div
            aria-label={copy.loadingBalance}
            className="account-balance-skeleton"
            role="status"
          />
        ) : null}
        {balance.status === "ready" ? (
          <strong className="account-balance-value">{balance.label}</strong>
        ) : null}
        {balance.status === "error" ? (
          <div className="account-balance-error" role="status">
            <span>{copy.balanceError}</span>
            <button className="iruka-secondary-button" onClick={onRetryBalance} type="button">
              {copy.retry}
            </button>
          </div>
        ) : null}
        <button
          aria-label={copy.retry}
          className="account-refresh-button"
          onClick={onRetryBalance}
          title={copy.retry}
          type="button"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      <div className="account-wallet-address">
        <button
          aria-label={copied ? copy.copied : copy.copyAddress}
          className="account-address-button iruka-secondary-button"
          onClick={onCopyAddress}
          title={copied ? copy.copied : copy.copyAddress}
          type="button"
        >
          <code>{address}</code>
          <Copy size={16} />
        </button>
      </div>

      <button
        className="account-deposit-button iruka-action-button"
        onClick={onDeposit}
        type="button"
      >
        {copy.deposit}
      </button>
    </article>
  );
}
