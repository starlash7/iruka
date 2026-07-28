import { Copy, ExternalLink, Wallet } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AccountAssetField } from "./AccountAssetField";
import {
  TransferStatus,
  type FundsDialogState
} from "./AccountFundsDialogShared";
import type { AccountCopy } from "./AccountPage";
import type { GiwaTransferReceipt } from "./giwaTransfer";

export const GIWA_FAUCET_URL = "https://faucet.giwa.io";

type AccountCryptoDepositPanelProps = {
  address: string;
  copied: boolean;
  copy: AccountCopy;
  externalWalletAddress?: string;
  onConnectWallet: () => void;
  onCopyAddress: () => void;
  onTransfer: (amount: string) => Promise<GiwaTransferReceipt>;
  onTransferComplete: () => void;
};

export function AccountCryptoDepositPanel({
  address,
  copied,
  copy,
  externalWalletAddress,
  onConnectWallet,
  onCopyAddress,
  onTransfer,
  onTransferComplete
}: AccountCryptoDepositPanelProps) {
  const [amount, setAmount] = useState("");
  const [state, setState] = useState<FundsDialogState>({ status: "idle" });

  async function submitTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "pending" });

    try {
      const receipt = await onTransfer(amount);
      setState({ ...receipt, status: "complete" });
      onTransferComplete();
    } catch {
      setState({ status: "error" });
    }
  }

  return (
    <div className="account-crypto-deposit">
      <div className="account-asset-grid">
        <AccountAssetField copy={copy} label={copy.token} type="token" />
        <AccountAssetField copy={copy} label={copy.chain} type="chain" />
      </div>

      <section className="account-deposit-address">
        <span>{copy.address}</span>
        <code>{address}</code>
        <button
          autoFocus={!externalWalletAddress}
          className="account-copy-action iruka-secondary-button"
          onClick={onCopyAddress}
          type="button"
        >
          <Copy size={17} />
          {copied ? copy.copied : copy.copyAddress}
        </button>
      </section>

      {externalWalletAddress ? (
        <section className="account-connected-transfer">
          <h3>{copy.fromConnectedWallet}</h3>
          <form className="account-transfer-form" onSubmit={submitTransfer}>
            <label>
              <span>{copy.amount}</span>
              <div className="account-amount-control">
                <input
                  autoFocus
                  inputMode="decimal"
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                  required
                  value={amount}
                />
                <span>ETH</span>
              </div>
            </label>
            <button
              className="iruka-action-button"
              disabled={state.status === "pending"}
              type="submit"
            >
              {state.status === "pending" ? copy.transferring : copy.transfer}
            </button>
          </form>
        </section>
      ) : (
        <button
          className="account-connect-wallet iruka-action-button"
          onClick={onConnectWallet}
          type="button"
        >
          <Wallet size={17} />
          {copy.connectWallet}
        </button>
      )}

      <TransferStatus copy={copy} state={state} />
      <a
        className="account-faucet-action iruka-secondary-button"
        href={GIWA_FAUCET_URL}
        rel="noreferrer"
        target="_blank"
      >
        {copy.faucet}
        <ExternalLink size={16} />
      </a>
    </div>
  );
}
