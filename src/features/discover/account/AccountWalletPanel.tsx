import { ArrowDownToLine, ArrowUpFromLine, Copy, RefreshCw } from "lucide-react";
import type { AccountBalance, AccountCopy } from "./AccountPage";

type AccountWalletPanelProps = {
  address: string;
  balance: AccountBalance;
  copied: boolean;
  copy: AccountCopy;
  onCopyAddress: () => void;
  onAddFunds: () => void;
  onRetryBalance: () => void;
  onWithdraw: () => void;
  transferPending?: boolean;
};

export function AccountWalletPanel({
  address,
  balance,
  copied,
  copy,
  onCopyAddress,
  onAddFunds,
  onRetryBalance,
  onWithdraw,
  transferPending = false
}: AccountWalletPanelProps) {
  return (
    <article className="account-wallet-panel">
      <header className="account-wallet-heading">
        <span aria-hidden="true">
          <img alt="" src="/assets/iruka-icon-wallet.png" />
        </span>
        <h2>{copy.wallet}</h2>
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

      <div className="account-wallet-actions">
        <button
          className="account-add-funds-button iruka-action-button"
          disabled={transferPending}
          onClick={onAddFunds}
          type="button"
        >
          <ArrowDownToLine size={16} />
          {copy.addFunds}
        </button>
        <button
          className="account-withdraw-button iruka-secondary-button"
          disabled={transferPending}
          onClick={onWithdraw}
          type="button"
        >
          <ArrowUpFromLine size={16} />
          {copy.withdraw}
        </button>
      </div>
    </article>
  );
}
