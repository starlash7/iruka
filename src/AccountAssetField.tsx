import { Check, ChevronDown } from "lucide-react";
import type { AccountCopy } from "./AccountPage";
import {
  AccountAssetMark,
  type AccountAssetMarkKind
} from "./AccountAssetMark";

type AccountAssetFieldProps = {
  copy: AccountCopy;
  label: string;
  type: "chain" | "token";
};

type AccountAssetOption = {
  available: boolean;
  id: string;
  kind: AccountAssetMarkKind;
  label: string;
};

export function AccountAssetField({
  copy,
  label,
  type
}: AccountAssetFieldProps) {
  const options: AccountAssetOption[] = type === "token"
    ? [
        { available: true, id: "eth", kind: "ethereum", label: copy.testEth },
        { available: false, id: "usdc", kind: "usdc", label: "USDC" },
        { available: false, id: "usdt", kind: "usdt", label: "USDT" }
      ]
    : [
        {
          available: true,
          id: "giwa-sepolia",
          kind: "giwa",
          label: copy.giwaSepolia
        },
        {
          available: false,
          id: "ethereum",
          kind: "ethereum",
          label: copy.ethereum
        }
      ];
  const selected = options[0];

  return (
    <div className="account-asset-field">
      <span>{label}</span>
      <details className="account-asset-menu" data-funds-menu={type}>
        <summary aria-label={label}>
          <AccountAssetMark kind={selected.kind} />
          <strong>{selected.label}</strong>
          <ChevronDown aria-hidden="true" size={16} />
        </summary>
        <div
          aria-label={`${label} options`}
          className="account-asset-options"
          role="listbox"
        >
          {options.map((option) => (
            <div
              aria-disabled={!option.available}
              aria-selected={option.available}
              className={`account-asset-option${
                option.available ? " account-asset-option-active" : ""
              }`}
              key={option.id}
              role="option"
            >
              <AccountAssetMark kind={option.kind} />
              <span>
                <strong>{option.label}</strong>
                {!option.available ? <small>{copy.comingSoon}</small> : null}
              </span>
              {option.available ? (
                <Check aria-hidden="true" size={16} />
              ) : null}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
