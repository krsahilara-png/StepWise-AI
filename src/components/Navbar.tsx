import { useState } from 'react';
import { Footprints, LayoutDashboard, Loader2, LogOut, Menu, Plus, X } from 'lucide-react';
import { useRouter, type Route } from '../lib/router';
import { useAuth } from '../lib/auth';

const navLinks: { label: string; route: Route }[] = [
  { label: 'Dashboard', route: { name: 'dashboard' } },
];

export default function Navbar() {
  const { route, navigate } = useRouter();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const isActive = (r: Route) => route.name === r.name;

  const go = (r: Route) => {
    navigate(r);
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    setMobileOpen(false);
    await signOut();
    setSigningOut(false);
    navigate({ name: 'home' });
  };

  const userButton = (mobile = false) => {
    if (!user) {
      return mobile ? (
        <button onClick={() => go({ name: 'auth' })} className="btn-secondary w-full">
          Sign in
        </button>
      ) : (
        <button onClick={() => go({ name: 'auth' })} className="btn-ghost ml-2 !px-5 !py-2.5">
          Sign in
        </button>
      );
    }
    return (
      <div className={mobile ? 'flex items-center gap-3' : 'flex items-center gap-2 ml-2'}>
        <span
          className={`min-w-0 truncate text-sm font-medium text-neutral-600 ${mobile ? 'flex-1' : 'max-w-[180px] hidden lg:block'}`}
          title={user.email ?? ''}
        >
          {user.email}
        </span>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-all hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-50"
        >
          {signingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Sign out
        </button>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <button
          onClick={() => go({ name: 'home' })}
          className="flex items-center gap-2"
          aria-label="Stepwise AI home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
            <Footprints className="h-5 w-5 text-primary" />
          </span>
          <span className="text-lg font-bold tracking-tight text-neutral-900">
            Stepwise <span className="text-primary">AI</span>
          </span>
        </button>

        <nav className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => go(link.route)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive(link.route)
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {link.label}
            </button>
          ))}
          <button onClick={() => go({ name: 'create' })} className="btn-primary ml-2 !px-5 !py-2.5">
            <Plus className="h-4 w-4" />
            Create new guide
          </button>
          {userButton()}
        </nav>

        <button
          className="rounded-lg p-2 text-neutral-700 hover:bg-neutral-100 md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-neutral-200 bg-white px-4 pb-4 pt-2 md:hidden">
          <button
            onClick={() => go({ name: 'dashboard' })}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
              isActive({ name: 'dashboard' }) ? 'bg-neutral-100' : 'text-neutral-700'
            }`}
          >
            <LayoutDashboard className="h-5 w-5 text-accent-blue" />
            Dashboard
          </button>
          <button
            onClick={() => go({ name: 'create' })}
            className="btn-primary mt-2 w-full"
          >
            <Plus className="h-4 w-4" />
            Create new guide
          </button>
          <div className="mt-3 border-t border-neutral-100 pt-3">{userButton(true)}</div>
        </div>
      )}
    </header>
  );
}
