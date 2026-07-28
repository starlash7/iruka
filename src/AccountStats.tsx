import { formatUsd } from "./currency";
import type { AccountCopy, AccountInventorySummary } from "./AccountPage";

type AccountStatsProps = {
  copy: AccountCopy;
  inventory: AccountInventorySummary;
};

export function AccountStats({ copy, inventory }: AccountStatsProps) {
  const stats = [
    {
      label: copy.inventoryValue,
      tone: "value",
      value: formatUsd(inventory.estimatedValue)
    },
    {
      label: copy.cardsCollected,
      tone: "cards",
      value: String(inventory.total)
    }
  ];

  return (
    <>
      {stats.map(({ label, tone, value }) => (
        <div className={`account-stat account-stat-${tone}`} key={label}>
          <span className="account-stat-label">{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </>
  );
}
