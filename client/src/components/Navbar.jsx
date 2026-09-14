import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo.jsx';
import { Icon } from './ui.jsx';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
    isActive ? 'text-brand-700' : 'text-ink-600 hover:text-ink-900'
  }`;

export default function Navbar() {
  const { user, logout, isOrganization } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => setOpen(false), [location.pathname]);

  // Give the bar a border + shadow once the page scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Role-aware navigation.
  const links = [
    { to: '/opportunities', label: 'Explore' },
    ...(user ? [{ to: '/dashboard', label: 'Dashboard' }] : [{ to: '/#how-it-works', label: 'How It Works', hash: true }]),
    ...(isOrganization ? [{ to: '/opportunities/new', label: 'Post an opportunity' }] : []),
  ];

  return (
    <header
      className={`sticky top-0 z-40 bg-white/85 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? 'border-b border-ink-200/70 shadow-soft' : 'border-b border-transparent'
      }`}
    >
      <nav className="shell flex h-16 items-center justify-between gap-4">
        <Logo />

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) =>
            l.hash ? (
              <a key={l.to} href={l.to} className={linkClass({ isActive: false })}>
                {l.label}
              </a>
            ) : (
              <NavLink key={l.to} to={l.to} className={linkClass}>
                {l.label}
              </NavLink>
            )
          )}

          <span className="mx-2 h-5 w-px bg-ink-200" aria-hidden="true" />

          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right leading-tight">
                <p className="text-sm font-semibold text-ink-900">{user.name}</p>
                <p className="text-xs capitalize text-ink-400">{user.role}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
                aria-label="Log out"
                title="Log out"
              >
                <Icon name="logout" className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost">
                Log in
              </Link>
              <Link to="/register" className="btn-primary">
                Get started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="rounded-lg p-2 text-ink-600 transition hover:bg-ink-100 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
        >
          <Icon name={open ? 'close' : 'menu'} className="h-5 w-5" />
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="animate-fade-in border-t border-ink-200/70 bg-white md:hidden">
          <div className="shell space-y-1 py-4">
            {links.map((l) =>
              l.hash ? (
                <a
                  key={l.to}
                  href={l.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
                >
                  {l.label}
                </a>
              ) : (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              )
            )}

            <div className="divider !mt-3 pt-3">
              {user ? (
                <>
                  <p className="px-3 text-xs text-ink-400">
                    Signed in as {user.name} · <span className="capitalize">{user.role}</span>
                  </p>
                  <button type="button" onClick={handleLogout} className="btn-outline mt-2 w-full">
                    <Icon name="logout" className="h-4 w-4" />
                    Log out
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="btn-outline flex-1">
                    Log in
                  </Link>
                  <Link to="/register" className="btn-primary flex-1">
                    Get started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
