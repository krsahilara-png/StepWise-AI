import { useMemo, useState } from 'react';
import { RouterContext, type Route } from './lib/router';
import { AuthProvider, useAuth } from './lib/auth';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import CreateGuidePage from './pages/CreateGuidePage';
import GuidePage from './pages/GuidePage';
import DashboardPage from './pages/DashboardPage';

const PROTECTED_ROUTES: Route['name'][] = ['create', 'dashboard'];

function AppShell() {
  const { user, initializing } = useAuth();
  const [route, setRoute] = useState<Route>({ name: 'home' });

  const navigate = (next: Route) => {
    setRoute(next);
    window.scrollTo({ top: 0 });
  };

  const value = useMemo(() => ({ route, navigate }), [route]);

  // While the session is being restored, render nothing to avoid flashing
  // the wrong screen (e.g. login briefly appearing for a signed-in user).
  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-primary" />
      </div>
    );
  }

  const needsAuth = !user && PROTECTED_ROUTES.includes(route.name);
  const onAuthPage = route.name === 'auth';

  // Redirect authenticated users away from the login screen and unauthenticated
  // users away from protected routes — as a render swap, not a state write,
  // so hooks stay order-stable.
  const effectiveRoute: Route = needsAuth ? { name: 'auth' } : user && onAuthPage ? { name: 'home' } : route;

  return (
    <RouterContext.Provider value={value}>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        {effectiveRoute.name === 'home' && <LandingPage />}
        {effectiveRoute.name === 'auth' && <AuthPage />}
        {effectiveRoute.name === 'create' && <CreateGuidePage />}
        {effectiveRoute.name === 'guide' && (
          <GuidePage key={effectiveRoute.guideId} guideId={effectiveRoute.guideId} />
        )}
        {effectiveRoute.name === 'dashboard' && <DashboardPage />}
        <Footer />
      </div>
    </RouterContext.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
