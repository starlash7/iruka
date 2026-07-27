import { CircleDollarSign, Images } from "lucide-react";
import { formatUsd } from "./currency";
import type { AccountCopy, AccountInventorySummary } from "./AccountPage";

type AccountStatsProps = {
  copy: AccountCopy;
  inventory: AccountInventorySummary;
};

export function AccountStats({ copy, inventory }: AccountStatsProps) {
  const stats = [
    {
      icon: CircleDollarSign,
      label: copy.inventoryValue,
      tone: "value",
      value: formatUsd(inventory.estimatedValue)
    },
    {
      icon: Images,
      label: copy.cardsCollected,
      tone: "cards",
      value: String(inventory.total)
    }
  ];

  return (
    <>
      {stats.map(({ icon: Icon, label, tone, value }) => (
        <div className={`account-stat account-stat-${tone}`} key={label}>
          <span className="account-stat-icon"><Icon size={18} /></span>
          <span className="account-stat-label">{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </>
  );
}
