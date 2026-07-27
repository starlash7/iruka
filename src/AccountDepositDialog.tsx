import { Copy, ExternalLink, X } from "lucide-react";
import type { AccountCopy } from "./AccountPage";
import { MarketplaceDialog } from "./MarketplaceDialog";

export const GIWA_FAUCET_URL = "https://faucet.giwa.io";

type AccountDepositDialogProps = {
  address: string;
  copied: boolean;
  copy: AccountCopy;
  onClose: () => void;
  onCopyAddress: () => void;
  open: boolean;
};

export function AccountDepositDialog({
  address,
  copied,
  copy,
  onClose,
  onCopyAddress,
  open
}: AccountDepositDialogProps) {
  return (
    <MarketplaceDialog
      className="account-deposit-dialog"
      labelId="account-deposit-title"
      onRequestClose={onClose}
      open={open}
    >
      <div className="account-deposit-panel">
        <header>
          <div>
            <span>{copy.network} · {copy.testEth}</span>
            <h2 id="account-deposit-title">{copy.deposit}</h2>
          </div>
          <button
            aria-label={copy.close}
            data-autofocus
            onClick={onClose}
            title={copy.close}
            type="button"
          >
            <X size={20} />
          </button>
        </header>

        <div className="account-deposit-address">
          <span>{copy.address}</span>
          <code>{address}</code>
        </div>

        <button
          className="account-copy-action iruka-secondary-button"
          onClick={onCopyAddress}
          type="button"
        >
          <Copy size={17} />
          {copied ? copy.copied : copy.copyAddress}
        </button>
        <a
          className="account-faucet-action iruka-action-button"
          href={GIWA_FAUCET_URL}
          rel="noreferrer"
          target="_blank"
        >
          {copy.faucet}
          <ExternalLink size={17} />
        </a>
      </div>
    </MarketplaceDialog>
  );
}
