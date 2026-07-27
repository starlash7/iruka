import { useEffect, useState } from "react";
import { AccountCryptoDepositPanel } from "./AccountCryptoDepositPanel";
import { AccountFundingMethods } from "./AccountFundingMethods";
import { FundsDialogHeader } from "./AccountFundsDialogShared";
import type { AccountBalance, AccountCopy } from "./AccountPage";
import type { GiwaTransferReceipt } from "./giwaTransfer";
import { MarketplaceDialog } from "./MarketplaceDialog";

type AccountAddFundsDialogProps = {
  address: string;
  balance: AccountBalance;
  copied: boolean;
  copy: AccountCopy;
  externalWalletAddress?: string;
  onClose: () => void;
  onCopyAddress: () => void;
  onTransfer: (amount: string) => Promise<GiwaTransferReceipt>;
  onTransferComplete: () => void;
  open: boolean;
};

export function AccountAddFundsDialog({
  address,
  balance,
  copied,
  copy,
  externalWalletAddress,
  onClose,
  onCopyAddress,
  onTransfer,
  onTransferComplete,
  open
}: AccountAddFundsDialogProps) {
  const [view, setView] = useState<"methods" | "crypto">("methods");
  const balanceLabel = balance.status === "ready" ? balance.label : "—";

  useEffect(() => {
    if (open) return;
    setView("methods");
  }, [open]);

  return (
    <MarketplaceDialog
      className="account-funds-dialog"
      labelId="account-add-funds-title"
      onRequestClose={onClose}
      open={open}
    >
      <div className="account-funds-panel">
        <FundsDialogHeader
          copy={copy}
          onBack={view === "crypto" ? () => setView("methods") : undefined}
          onClose={onClose}
          subtitle={`${copy.wallet} · ${balanceLabel}`}
          title={view === "crypto" ? copy.transferCrypto : copy.addFunds}
          titleId="account-add-funds-title"
        />

        {view === "methods" ? (
          <AccountFundingMethods
            copy={copy}
            onSelectCrypto={() => setView("crypto")}
          />
        ) : (
          <AccountCryptoDepositPanel
            address={address}
            copied={copied}
            copy={copy}
            externalWalletAddress={externalWalletAddress}
            onCopyAddress={onCopyAddress}
            onTransfer={onTransfer}
            onTransferComplete={onTransferComplete}
          />
        )}
      </div>
    </MarketplaceDialog>
  );
}
