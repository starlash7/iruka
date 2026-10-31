import type { ComponentType } from 'react';
import { routes, type RoutePageProps } from './paths';
import HomePage from '../features/discover/HomePage';
import RankingPage from '../features/discover/RankingPage';
import SearchPage from '../features/discover/SearchPage';
import TagPage from '../features/discover/TagPage';
import WorkPage from '../features/discover/WorkPage';
import ChatListPage from '../features/chat/ChatList';
import ChatPage from '../features/chat/ChatPage';
import StudioPage from '../features/studio/StudioPage';
import EditorPage from '../features/studio/EditorPage';
import PersonasPage from '../features/user/PersonasPage';
import CreditsPage from '../features/wallet/index';
import AccountPage from '../features/user/AccountPage';
import FavoritesPage from '../features/discover/FavoritesPage';

export { matchRoute, routes, type RoutePageProps } from './paths';
export const routePages: Record<typeof routes[number]['id'], ComponentType<RoutePageProps>> = {
  home: HomePage,
  ranking: RankingPage,
  search: SearchPage,
  tag: TagPage,
  work: WorkPage,
  chat: ChatPage,
  chats: ChatListPage,
  favorites: FavoritesPage,
  studio: StudioPage,
  editor: EditorPage,
  personas: PersonasPage,
  credits: CreditsPage,
  account: AccountPage,
};
