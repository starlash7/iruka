export type RoutePageProps = {
  params: Readonly<Record<string, string>>;
  authEnabled?: boolean;
};

export const routes = [
  { id: 'home', path: '/', owner: 'C' },
  { id: 'ranking', path: '/ranking', owner: 'C' },
  { id: 'search', path: '/search', owner: 'C' },
  { id: 'tag', path: '/tags/:tag', owner: 'C' },
  { id: 'work', path: '/works/:id', owner: 'C' },
  { id: 'chat', path: '/chat/:chatId', owner: 'A' },
  { id: 'studio', path: '/studio', owner: 'B' },
  { id: 'editor', path: '/studio/:workId', owner: 'B' },
  { id: 'account', path: '/account', owner: 'C' },
  { id: 'personas', path: '/personas', owner: 'C' },
  { id: 'credits', path: '/credits', owner: 'D' },
] as const;

export function matchRoute(pathname: string) {
  const segments = pathname.replace(/\/$/, '').split('/');
  for (const route of routes) {
    const pattern = route.path.replace(/\/$/, '').split('/');
    if (pattern.length !== segments.length) continue;
    const params: Record<string, string> = {};
    let matches = true;
    for (let index = 0; index < pattern.length; index++) {
      const part = pattern[index];
      if (part.startsWith(':')) {
        try {
          const value = decodeURIComponent(segments[index]);
          if (!value || value.includes('/')) { matches = false; break; }
          params[part.slice(1)] = value;
        } catch { matches = false; break; }
      } else if (part !== segments[index]) { matches = false; break; }
    }
    if (matches) return { ...route, params };
  }
  return null;
}
