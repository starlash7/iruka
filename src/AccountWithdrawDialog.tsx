import { useEffect, useState, type FormEvent } from "react";
import { AccountAssetField } from "./AccountAssetField";
import type { AccountBalance, AccountCopy } from "./AccountPage";
import {
  FundsDialogHeader,
  TransferComplete,
  TransferStatus,
  type FundsDialogState
} from "./AccountFundsDialogShared";
import type { GiwaTransferReceipt } from "./giwaTransfer";
import { MarketplaceDialog } from "./MarketplaceDialog";

type AccountWithdrawDialogProps = {
  balance: AccountBalance;
  copy: AccountCopy;
  onClose: () => void;
  onTransfer: (
    destination: string,
    amount: string
  ) => Promise<GiwaTransferReceipt>;
  onTransferComplete: () => void;
  open: boolean;
};

export function AccountWithdrawDialog({
  balance,
  copy,
  onClose,
  onTransfer,
  onTransferComplete,
  open
}: AccountWithdrawDialogProps) {
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [state, setState] = useState<FundsDialogState>({ status: "idle" });
  const balanceLabel = balance.status === "ready" ? balance.label : "—";
  const trimmedAmount = amount.trim();
  const trimmedDestination = destination.trim();
  const actionLabel = !trimmedDestination
    ? copy.enterRecipient
    : !trimmedAmount
      ? copy.enterAmount
      : copy.withdraw;

  useEffect(() => {
    if (open) {
      setDestination("");
      return;
    }

    setAmount("");
    setState({ status: "idle" });
  }, [open]);

  async function submitTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "pending" });

    try {
      const receipt = await onTransfer(destination, amount);
      setState({ ...receipt, status: "complete" });
      onTransferComplete();
    } catch {
      setState({ status: "error" });
    }
  }

  return (
    <MarketplaceDialog
      className="account-funds-dialog"
      labelId="account-withdraw-title"
      onRequestClose={onClose}
      open={open}
    >
      <div className="account-funds-panel">
        <FundsDialogHeader
          copy={copy}
          onClose={onClose}
          subtitle={`${copy.wallet} · ${balanceLabel}`}
          title={copy.withdraw}
          titleId="account-withdraw-title"
        />
        {state.status === "complete" ? (
          <TransferComplete
            amount={amount}
            copy={copy}
            explorerUrl={state.explorerUrl}
            onDone={onClose}
          />
        ) : (
          <form className="account-withdraw-form" onSubmit={submitTransfer}>
            <label className="account-input-field">
              <span>{copy.destination}</span>
              <input
                data-autofocus
                onChange={(event) => setDestination(event.target.value)}
                placeholder="0x..."
                required
                value={destination}
              />
            </label>
            <label className="account-input-field">
              <span>{copy.amount}</span>
              <div className="account-amount-control">
                <input
                  inputMode="decimal"
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                  required
                  value={amount}
                />
                <span>ETH</span>
              </div>
            </label>

            <div className="account-withdraw-balance">
              <span>{copy.balance}</span>
              <strong>{balanceLabel}</strong>
            </div>

            <div className="account-asset-grid">
              <AccountAssetField
                copy={copy}
                label={copy.receiveToken}
                type="token"
              />
              <AccountAssetField
                copy={copy}
                label={copy.receiveChain}
                type="chain"
              />
            </div>

            <dl className="account-transfer-summary">
              <div>
                <dt>{copy.youWillReceive}</dt>
                <dd>{trimmedAmount ? `${trimmedAmount} ETH` : "—"}</dd>
              </div>
              <div>
                <dt>{copy.networkFee}</dt>
                <dd>{copy.shownInWallet}</dd>
              </div>
            </dl>

            <TransferStatus copy={copy} state={state} />
            <button
              className="account-withdraw-submit iruka-action-button"
              disabled={
                state.status === "pending" ||
                !trimmedDestination ||
                !trimmedAmount
              }
              type="submit"
            >
              {state.status === "pending" ? copy.transferring : actionLabel}
            </button>
          </form>
        )}
      </div>
    </MarketplaceDialog>
  );
}
