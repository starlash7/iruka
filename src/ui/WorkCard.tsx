export type WorkCardProps = {
  id: string; title: string; description: string; mode: 'character' | 'story'; imageUrl?: string;
};
export function WorkCard({ id, title, description, mode, imageUrl }: WorkCardProps) {
  return <article className="ui-work-card">
    {imageUrl && <img src={imageUrl} alt="" loading="lazy" />}
    <div><span className="ui-chip">{mode === 'character' ? '캐릭터' : '스토리'}</span>
      <h3><a href={`/works/${encodeURIComponent(id)}`}>{title}</a></h3><p>{description}</p>
    </div>
  </article>;
}
