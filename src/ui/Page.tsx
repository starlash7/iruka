import {StateArtwork} from './StateArtwork';
import type { ReactNode } from 'react';
export function Page({ title, description, children, className='', actions }: { title: string; description?: string; children?: ReactNode; className?:string; actions?:ReactNode }) {
  return <section className={`page-surface ${className}`}><header className="page-heading"><div><h1>{title}</h1>
    {description && <p>{description}</p>}</div>{actions}</header>{children}</section>;
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><StateArtwork/><span className="ui-chip">준비 중</span><h2>{title}</h2><p>{description}</p></div>;
}
