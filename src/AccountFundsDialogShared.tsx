import { Check, ChevronLeft, ExternalLink, X } from "lucide-react";
import type { AccountCopy } from "./AccountPage";
import type { GiwaTransferReceipt } from "./giwaTransfer";

export type FundsDialogState =
  | { status: "idle" }
  | { status: "pending" }
  | ({ status: "complete" } & GiwaTransferReceipt)
  | { status: "error" };

export function FundsDialogHeader({
  copy,
  onBack,
  onClose,
  subtitle,
  title,
  titleId
}: {
  copy: AccountCopy;
  onBack?: () => void;
  onClose: () => void;
  subtitle?: string;
  title: string;
  titleId: string;
}) {
  return (
    <header className="account-funds-header">
      {onBack ? (
        <button
          aria-label={copy.back}
          onClick={onBack}
          title={copy.back}
          type="button"
        >
          <ChevronLeft size={20} />
        </button>
      ) : (
        <span aria-hidden="true" className="account-funds-header-spacer" />
      )}
      <div className="account-funds-title">
        <h2 id={titleId}>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <button
        aria-label={copy.close}
        onClick={onClose}
        title={copy.close}
        type="button"
      >
        <X size={20} />
      </button>
    </header>
  );
}

export function TransferStatus({
  copy,
  state
}: {
  copy: AccountCopy;
  state: FundsDialogState;
}) {
  if (state.status === "error") {
    return <p className="account-transfer-status account-transfer-error">{copy.transferFailed}</p>;
  }

  if (state.status !== "complete") return null;

  return (
    <a
      className="account-transfer-status account-transfer-complete"
      href={state.explorerUrl}
      rel="noreferrer"
      target="_blank"
    >
      {copy.viewTransaction}
      <ExternalLink size={15} />
    </a>
  );
}

export function TransferComplete({
  amount,
  copy,
  explorerUrl,
  onDone
}: {
  amount: string;
  copy: AccountCopy;
  explorerUrl: string;
  onDone: () => void;
}) {
  return (
    <section
      aria-live="polite"
      className="account-transfer-complete-view"
    >
      <span className="account-transfer-complete-mark">
        <Check aria-hidden="true" size={25} strokeWidth={2.4} />
      </span>
      <div>
        <h3>{copy.transferComplete}</h3>
        <strong>{amount.trim()} ETH</strong>
      </div>
      <div className="account-transfer-complete-actions">
        <a
          className="iruka-secondary-button"
          href={explorerUrl}
          rel="noreferrer"
          target="_blank"
        >
          {copy.viewTransaction}
          <ExternalLink size={15} />
        </a>
        <button
          className="iruka-action-button"
          onClick={onDone}
          type="button"
        >
          {copy.done}
        </button>
      </div>
    </section>
  );
}
