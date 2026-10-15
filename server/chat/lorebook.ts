import type {PrivateWorkConfig} from '../../src/shared/contracts.ts';
type Entry = PrivateWorkConfig['lorebook'][number];
export const estimateTokens = (text: string) => Math.ceil(text.length / 1.5);
const normalize = (text: string) => text.normalize('NFKC').replace(/\s+/g, '').toLocaleLowerCase();
/** Literal keywords only: no untrusted regular expression execution. */
export function selectLorebook(entries: readonly Entry[], recent: readonly string[], budget: number, always = false): Entry[] {
  const text = normalize(recent.join('\n'));
  const matches = entries.filter(e => always ? e.alwaysOn : !e.alwaysOn && e.keywords.some(k => normalize(k) && text.includes(normalize(k))));
  matches.sort((a,b) => (b.priority ?? 0) - (a.priority ?? 0) || a.id.localeCompare(b.id));
  return matches.filter(e => { const cost = estimateTokens(e.content); if(cost > budget) return false; budget -= cost; return true; });
}
