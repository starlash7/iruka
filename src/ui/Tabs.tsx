import { useId, type ReactNode } from 'react';

export type TabItem = { id: string; label: string; content: ReactNode };
export function Tabs({ label, items, value, onChange }: {
  label: string; items: readonly TabItem[]; value: string; onChange: (id: string) => void;
}) {
  const id = useId();
  return <div className="ui-tabs">
    <div role="tablist" aria-label={label}>
      {items.map((item, index) => <button key={item.id} type="button" role="tab"
        id={`${id}-tab-${item.id}`} aria-controls={`${id}-panel-${item.id}`}
        aria-selected={item.id === value} tabIndex={item.id === value ? 0 : -1}
        onClick={() => onChange(item.id)} onKeyDown={event => {
          const next = event.key === 'ArrowRight' ? (index + 1) % items.length
            : event.key === 'ArrowLeft' ? (index - 1 + items.length) % items.length
            : event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : undefined;
          if (next === undefined) return;
          event.preventDefault();
          onChange(items[next].id);
          document.getElementById(`${id}-tab-${items[next].id}`)?.focus();
        }}>{item.label}</button>)}
    </div>
    {items.map(item => <div key={item.id} role="tabpanel" id={`${id}-panel-${item.id}`}
      aria-labelledby={`${id}-tab-${item.id}`} hidden={item.id !== value} tabIndex={0}>{item.content}</div>)}
  </div>;
}
