import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo.jsx';
import { Avatar, Icon } from './ui.jsx';

/**
 * The masthead. It sits on the linen ground with no border until the page
 * scrolls, at which point a single hairline appears — that's the whole effect.
 */
export default function Navbar() {
  const { user, logout, isOrganization, isVolunteer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The mobile sheet is tall enough to need the page behind it held still.
  useEffect(() => {
    if (!open) return undefined;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const links = [
    { to: '/opportunities', label: 'Opportunities' },
    { to: '/about', label: 'About' },
    ...(user ? [{ to: '/dashboard', label: isOrganization ? 'Your desk' : 'Your shelf' }] : []),
    ...(isVolunteer ? [{ to: '/checkin', label: 'Check in' }] : []),
    ...(isOrganization ? [{ to: '/opportunities/new', label: 'Post an opportunity' }] : []),
  ];

  const linkClass = ({ isActive }) =>
    `relative py-1 text-sm transition-colors duration-200 ${
      isActive
        ? 'text-bark-800 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-sage-500'
        : 'text-bark-500 hover:text-bark-800'
    }`;

  return (
    <header
      className={`sticky top-0 z-40 bg-linen/90 backdrop-blur-md transition-colors duration-300 ${
        scrolled ? 'border-b border-bark-200/70' : 'border-b border-transparent'
      }`}
    >
      <nav className="shell flex h-[4.5rem] items-center justify-between gap-6">
        <Logo />

        {/* Desktop */}
        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}

          <span className="h-5 w-px bg-bark-200" aria-hidden="true" />

          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="flex items-center gap-2.5" title="Go to your dashboard">
                <Avatar name={user.name} className="h-8 w-8" />
                <span className="text-right leading-tight">
                  <span className="block text-sm text-bark-800">{user.name.split(' ')[0]}</span>
                  <span className="block text-[0.7rem] capitalize text-bark-400">{user.role}</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full p-2 text-bark-400 transition hover:bg-bark-100 hover:text-bark-700"
                aria-label="Sign out"
                title="Sign out"
              >
                <Icon name="logout" className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm text-bark-500 transition-colors hover:text-bark-800">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary btn-sm">
                Join HelpHop
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="-mr-2 rounded-full p-2 text-bark-600 transition hover:bg-bark-100 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          <Icon name={open ? 'close' : 'menu'} className="h-5 w-5" />
        </button>
      </nav>

      {/* Mobile sheet — full-width list, sized for thumbs rather than a shrunk desktop bar */}
      {open && (
        <div className="animate-appear border-t border-bark-200/70 bg-linen md:hidden">
          <div className="shell flex flex-col gap-1 py-5">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-field px-3 py-3 font-serif text-lg transition-colors ${
                    isActive ? 'bg-sage-50 text-sage-800' : 'text-bark-700 hover:bg-bark-100/60'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}

            <div className="rule mt-4 pt-4">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-3 pb-4">
                    <Avatar name={user.name} className="h-9 w-9" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-bark-800">{user.name}</p>
                      <p className="text-xs capitalize text-bark-400">{user.role}</p>
                    </div>
                  </div>
                  <button type="button" onClick={handleLogout} className="btn-outline w-full">
                    <Icon name="logout" className="h-4 w-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/register" className="btn-primary w-full">
                    Join HelpHop
                  </Link>
                  <Link to="/login" className="btn-outline w-full">
                    Sign in
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
