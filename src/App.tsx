import { matchRoute, routePages } from './routes';
import { Page } from './ui';
import {useReader} from './features/discover/ReaderProvider';
import {ReaderAccountMenu} from './features/discover/ReaderAccountMenu';

export default function App({ authEnabled = false }: { authEnabled?: boolean }) {
  const {href}=useReader();
  const route = matchRoute(window.location.pathname);
  const RoutePage = route ? routePages[route.id] : null;
  const navigation = [
    { href: '/', label: '탐색', active: ['home', 'ranking', 'search', 'tag', 'work'] },
    { href: '/studio', label: '만들기', active: ['studio', 'editor'] },
    { href: '/account', label: '계정', active: ['account', 'personas', 'credits'] },
  ];
  return <div className="app-shell">
    <a className="skip-link" href="#main">본문으로 건너뛰기</a>
    <header className="app-header">
      <a className="brand" href={href("/")} aria-label="Iruka 홈">
        <img src="/brand/iruka-logomark.svg" alt="" width="36" height="36" /><span>Iruka</span>
      </a>
      <nav aria-label="주 메뉴">{navigation.map(item => <a key={item.href} href={href(item.href)}
        aria-current={route && item.active.includes(route.id) ? 'page' : undefined}>{item.label}</a>)}</nav>
      <ReaderAccountMenu/>
    </header>
    <main id="main" tabIndex={-1}>
      {route && RoutePage ? <RoutePage params={route.params} authEnabled={authEnabled} />
        : <Page title="페이지를 찾을 수 없어요"><a href={href("/")}>홈으로</a></Page>}
    </main>
  </div>;
}
