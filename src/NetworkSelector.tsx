import { activeDeployment, supportedDeployments } from "./activeDeployment.ts";
import { getNetworkUrl, type NetworkId } from "./networkSelection.ts";
import type { Locale } from "./appTypes";
import "./network-selector.css";

export function NetworkSelector({ disabled, locale }: { disabled: boolean; locale: Locale }) {
  return (
    <select
      aria-label={locale === "ko" ? "네트워크" : "Network"}
      className="network-selector"
      disabled={disabled}
      onChange={(event) => {
        if (disabled) return;
        // Reload all RPC clients and chain-specific state together.
        window.location.assign(getNetworkUrl(window.location.href, event.target.value as NetworkId));
      }}
      value={activeDeployment.id}
    >
      {supportedDeployments.map(({ id, chain }) => (
        <option key={id} value={id}>{chain.name}</option>
      ))}
    </select>
  );
}
