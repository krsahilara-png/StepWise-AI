import { createContext, useContext } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'auth' }
  | { name: 'create' }
  | { name: 'guide'; guideId: string }
  | { name: 'dashboard' };

interface RouterContextValue {
  route: Route;
  navigate: (route: Route) => void;
}

export const RouterContext = createContext<RouterContextValue | null>(null);

export function useRouter(): RouterContextValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used inside RouterContext.Provider');
  return ctx;
}
