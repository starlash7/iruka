import type { ReactNode } from 'react';
export function Page({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return <section className="page-surface"><header className="page-heading"><h1>{title}</h1>
    {description && <p>{description}</p>}</header>{children}</section>;
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><span className="ui-chip">준비 중</span><h2>{title}</h2><p>{description}</p></div>;
}
