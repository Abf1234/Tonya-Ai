import { Gauge, LogIn, LogOut, Menu, ShieldCheck, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useBandwidth } from '../context/BandwidthContext';
import Brand from './Brand';

const navigation = [
  { label: 'Home', to: '/' },
  { label: 'Verify', to: '/verify' },
  { label: 'Truth Guardian', to: '/truth-guardian' },
  { label: 'Report', to: '/report' },
  { label: 'Alerts', to: '/alerts' },
  { label: 'Fact Checks', to: '/fact-checks' },
  { label: 'Verified Information', to: '/verified-information' },
  { label: 'Trusted Sources', to: '/sources' },
  { label: 'Learn', to: '/learn' },
  { label: 'About', to: '/about' },
];

function navClass({ isActive }) {
  return `inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold transition-[background-color,color,transform] duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 ${
    isActive
      ? 'bg-guardian-50 text-guardian-800'
      : 'text-slate-600 hover:bg-slate-100 hover:text-guardian-800'
  }`;
}

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { liteMode, toggleLiteMode } = useBandwidth();
  const { loading: authLoading, signOut, user } = useAuth();
  const displayName = user?.name || user?.email || 'Account';

  const closeMenu = () => setMenuOpen(false);
  const handleSignOut = () => {
    void signOut().catch(() => {});
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur">
      <div className="page-shell flex min-h-[4.5rem] items-center justify-between gap-3 py-3">
        <Brand compact />

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass} end={item.to === '/'}>
              {item.label}
            </NavLink>
          ))}
          {user ? (
            <NavLink to="/official" className={navClass}>
              Official Portal
            </NavLink>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLiteMode}
            className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-guardian-300 hover:text-guardian-800 sm:inline-flex"
            aria-pressed={liteMode}
            title="Reduce motion and visual weight"
          >
            <Gauge className="h-4 w-4" aria-hidden="true" />
            {liteMode ? 'Lite on' : 'Lite mode'}
          </button>
          <NavLink
            to="/verify"
            className="hidden items-center gap-2 rounded-lg bg-guardian-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-guardian-900 md:inline-flex"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Verify now
          </NavLink>
          {authLoading ? (
            <span className="hidden text-xs font-semibold text-slate-500 lg:inline">Checking session…</span>
          ) : user ? (
            <div className="hidden items-center gap-2 lg:flex">
              <NavLink
                to="/account"
                className="inline-flex max-w-40 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{displayName}</span>
              </NavLink>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="hidden items-center gap-2 rounded-lg border border-guardian-300 px-3 py-2 text-xs font-bold text-guardian-800 hover:bg-guardian-50 lg:inline-flex"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Sign in
            </NavLink>
          )}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 xl:hidden"
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div id="mobile-navigation" className="animate-fade-in border-t border-slate-200 bg-white shadow-lg xl:hidden">
          <nav className="page-shell grid gap-1 py-4" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg min-h-11 px-3 py-2.5 text-sm font-semibold ${
                    isActive
                      ? 'bg-guardian-50 text-guardian-800'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
                end={item.to === '/'}
                onClick={closeMenu}
              >
                {item.label}
              </NavLink>
            ))}
            {user ? (
              <NavLink
                to="/official"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `rounded-lg min-h-11 px-3 py-2.5 text-sm font-semibold ${
                    isActive ? 'bg-guardian-50 text-guardian-800' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                Official Portal
              </NavLink>
            ) : null}
            {authLoading ? (
              <span className="mt-2 text-center text-sm font-semibold text-slate-500">Checking session…</span>
            ) : user ? (
              <>
                <NavLink
                  to="/account"
                  onClick={closeMenu}
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 min-h-11 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  {displayName}
                </NavLink>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    handleSignOut();
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 min-h-11 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                onClick={closeMenu}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-guardian-300 min-h-11 px-3 py-2.5 text-sm font-bold text-guardian-800 hover:bg-guardian-50"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Sign in
              </NavLink>
            )}
            <button
              type="button"
              onClick={toggleLiteMode}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 min-h-11 px-3 py-2.5 text-sm font-bold text-slate-700 sm:hidden"
              aria-pressed={liteMode}
            >
              <Gauge className="h-4 w-4" aria-hidden="true" />
              {liteMode ? 'Disable Lite Mode' : 'Enable Lite Mode'}
            </button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
