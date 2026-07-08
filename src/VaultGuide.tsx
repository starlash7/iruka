import { Send, ShieldCheck, Store, Tag } from "lucide-react";
import { vaultContent, type VaultStatusKey } from "./vaultContent";

type VaultGuideProps = {
  locale: "en" | "ko";
  statusLabels: Record<VaultStatusKey, string>;
};

const actionIcons = [ShieldCheck, Store, Tag, Send];

export function VaultGuide({ locale, statusLabels }: VaultGuideProps) {
  const content = vaultContent[locale];

  return (
    <div className="vault-guide">
      <p className="section-intro">{content.intro}</p>

      <h3>{content.actionsTitle}</h3>
      <div className="vault-action-row">
        {content.actions.map((action, index) => {
          const Icon = actionIcons[index] ?? ShieldCheck;

          return (
            <span key={action}>
              <Icon size={15} />
              {action}
            </span>
          );
        })}
      </div>

      <h3>{content.statusTitle}</h3>
      <div className="vault-status-grid">
        {content.statuses.map((item) => (
          <article className="vault-status-card" key={item.status}>
            <i aria-hidden="true" />
            <strong>{statusLabels[item.status]}</strong>
            <p>{item.meaning}</p>
          </article>
        ))}
      </div>

      <div className="brand-callout">
        <span className="brand-callout-icon">
          <ShieldCheck size={20} />
        </span>
        <div>
          <strong>{content.principleTitle}</strong>
          <p>{content.principle}</p>
        </div>
      </div>
    </div>
  );
}
