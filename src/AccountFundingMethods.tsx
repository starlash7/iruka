import { activeDeployment } from "./activeDeployment.ts";
import { ArrowDownToLine, Building2, ChevronRight } from "lucide-react";
import type { AccountCopy } from "./AccountPage";
import { AccountAssetMark } from "./AccountAssetMark";

export function AccountFundingMethods({
  copy,
  onSelectCrypto
}: {
  copy: AccountCopy;
  onSelectCrypto: () => void;
}) {
  return (
    <div className="account-funding-methods">
      <button
        className="account-funding-method"
        data-autofocus
        onClick={onSelectCrypto}
        type="button"
      >
        <span className="account-funding-method-icon">
          <ArrowDownToLine size={19} />
        </span>
        <span className="account-funding-method-copy">
          <strong>{copy.transferCrypto}</strong>
          <small>{copy.giwaSepolia} · {copy.testEth}</small>
        </span>
        <span className="account-funding-method-marks">
          <AccountAssetMark kind={activeDeployment.id === "monad" ? "monad" : "ethereum"} />
          {activeDeployment.id === "giwa" ? <AccountAssetMark kind="giwa" /> : null}
          <ChevronRight size={18} />
        </span>
      </button>

      <button
        className="account-funding-method account-funding-method-disabled"
        disabled
        type="button"
      >
        <span className="account-funding-method-icon">
          <Building2 size={19} />
        </span>
        <span className="account-funding-method-copy">
          <strong>{copy.connectExchange}</strong>
          <small>{copy.upbit} · {copy.comingSoon}</small>
        </span>
        <span className="account-funding-method-marks">
          <AccountAssetMark kind="upbit" />
        </span>
      </button>
    </div>
  );
}
