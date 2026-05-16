import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, LogOut, AlertCircle, ShieldCheck, ArrowRight,
  Bell, Settings, ChevronDown,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCrisis } from '../../contexts/CrisisContext';
import VerifiedBadge from '../VerifiedBadge';
import { useNotifications } from '../../features/notifications/hooks/useNotifications';
import { logError } from '../../utils/logger';

/* Paths where the page below the header is on the editorial paper system.
   Add a path here when you migrate that page off the legacy dark surfaces.
   Remaining legacy pages: /dashboard and any route not listed below. */
const PAPER_SURFACE_PATHS = new Set([
  '/',
  '/login',
  '/signup',
  '/resources',
  '/settings',
  '/request-support',
  '/secure-setup',
  '/source-protection',
  '/simulations',
  '/security-score',
  '/community',
  '/specialist-dashboard',
  '/admin',
  '/ai-advisor',
  '/threat-model',
]);

const notifTimeAgo = (iso) => {
  const sec = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
};

const SCENARIO_LABELS = {
  hacked:   "I've been hacked",
  source:   "Source exposed",
  doxxed:   "Being doxxed",
  phishing: "Phishing attempt",
};

const Header = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, loading, logout } = useAuth();
  const { isInCrisis, activeScenario, deactivateCrisis, openOverlay, toggleOverlay, overlayOpen } = useCrisis();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen,   setUserMenuOpen]   = useState(false);
  const [notifOpen,      setNotifOpen]      = useState(false);

  const { notifications, notifCount, notifLoading, onOpen: openNotifications } = useNotifications();

  const userMenuRef = useRef(null);
  const notifRef    = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notifRef.current    && !notifRef.current.contains(e.target))    setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      logError('Logout error:', error);
    }
  };

  const isAdmin    = !!user?.isAdmin;
  const isVerified = user?.accountType === 'specialist' && user?.verificationStatus === 'approved';

  const navItems = [
    ...(isVerified ? [{ name: 'Dashboard', path: '/specialist-dashboard' }] : []),
    { name: 'Security Score', path: '/security-score' },
    { name: 'Secure Setup',   path: '/secure-setup' },
    { name: 'Manual',         path: '/resources' },
    { name: 'Simulations',    path: '/simulations' },
    { name: 'Community',      path: '/community' },
    ...(user ? [{ name: 'AI Advisor', path: '/ai-advisor' }] : []),
    ...(user ? [{ name: 'Threat Model', path: '/threat-model' }] : []),
    ...(isAdmin ? [{ name: 'Admin', path: '/admin' }] : []),
  ];

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  // ─── Surface-aware palette ────────────────────────────────────────────
  // Paper surfaces render under the editorial header; legacy product surfaces
  // stay on the dark canvas until they are migrated.
  // Exact match OR nested path (e.g. /community/post-id still counts as paper).
  const isPaperSurface = [...PAPER_SURFACE_PATHS].some(
    (p) => location.pathname === p || location.pathname.startsWith(p + '/'),
  );

  const t = isPaperSurface
    ? {
        headerBg:     'bg-[color:var(--color-paper)]/95 backdrop-blur-md',
        headerBorder: 'border-[color:var(--color-ink)]/10',
        wordmark:     'text-[color:var(--color-ink)]',
        navText:      'text-[color:var(--color-smoke)] group-hover:text-[color:var(--color-ink)]',
        navTextActive:'text-[color:var(--color-ink)]',
        navRule:      'var(--color-ink)',
        controlBg:    'bg-transparent hover:bg-[color:var(--color-ink)]/[0.04]',
        controlBorder:'border-[color:var(--color-ink)]/15',
        controlIcon:  'text-[color:var(--color-ink-soft)]',
        userText:     'text-[color:var(--color-ink-soft)]',
        userChevron:  'text-[color:var(--color-smoke)]',
        dropdownBg:   'bg-[color:var(--color-paper-soft)]',
        dropdownBorder:'border-[color:var(--color-ink)]/10',
        dropdownText: 'text-[color:var(--color-ink-soft)]',
        dropdownHover:'hover:bg-[color:var(--color-ink)]/[0.04] hover:text-[color:var(--color-ink)]',
        dropdownDivider:'border-[color:var(--color-ink)]/10',
        dropdownLabel:'text-[color:var(--color-smoke)]',
        badgeBg:      'bg-[color:var(--color-oxblood)]',
      }
    : {
        headerBg:     'bg-dark-900/95 backdrop-blur-md',
        headerBorder: 'border-white/[0.06]',
        wordmark:     'text-[color:var(--color-paper)]',
        navText:      'text-gray-500 group-hover:text-gray-200',
        navTextActive:'text-white',
        navRule:      'var(--color-paper)',
        controlBg:    'bg-transparent hover:bg-white/[0.05]',
        controlBorder:'border-white/15',
        controlIcon:  'text-gray-400',
        userText:     'text-gray-300',
        userChevron:  'text-gray-500',
        dropdownBg:   'bg-dark-800',
        dropdownBorder:'border-white/[0.08]',
        dropdownText: 'text-gray-300',
        dropdownHover:'hover:bg-white/[0.04] hover:text-white',
        dropdownDivider:'border-white/[0.06]',
        dropdownLabel:'text-gray-500',
        badgeBg:      'bg-[color:var(--color-oxblood)]',
      };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">

      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <Motion.header
        initial={{ y: -32, opacity: 0 }}
        animate={{ y: 0,    opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`${t.headerBg} border-b ${t.headerBorder} px-6 md:px-10 lg:px-14`}
      >
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between h-16">

            {/* ── Wordmark ───────────────────────────────────────────── */}
            <Link
              to="/"
              className={`display flex items-baseline ${t.wordmark} hover:opacity-80 transition-opacity`}
              style={{ fontWeight: 500, fontSize: '1.5rem', lineHeight: 1 }}
            >
              <em className="italic" style={{ fontStyle: 'italic' }}>Safe</em>
              <span>Press</span>
            </Link>

            {/* ── Right cluster: nav + auth ──────────────────────────── */}
            <div className="flex items-center gap-7 lg:gap-9">

              {/* Desktop nav */}
              <nav className="hidden lg:flex items-center gap-7">
                {navItems.map((item) => (
                  <Link key={item.path} to={item.path} className="relative py-5 group">
                    <span className={`font-mono text-[11px] tracking-[0.18em] uppercase transition-colors duration-200 ${
                      isActive(item.path) ? t.navTextActive : t.navText
                    }`}>
                      {item.name}
                    </span>
                    {isActive(item.path) && (
                      <Motion.div
                        layoutId="nav-rule"
                        className="absolute bottom-3 left-0 right-0 h-px"
                        style={{ background: t.navRule }}
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                  </Link>
                ))}
              </nav>

              {/* Auth cluster */}
              <div className="flex items-center gap-2">

                {loading ? (
                  <div className={`w-24 h-8 rounded-sm ${t.controlBg} border ${t.controlBorder} animate-pulse`} />
                ) : user ? (
                  <>
                    {/* Notifications */}
                    <div className="relative" ref={notifRef}>
                      <button
                        onClick={() => {
                          const opening = !notifOpen;
                          setNotifOpen(o => !o);
                          setUserMenuOpen(false);
                          if (opening) openNotifications();
                        }}
                        className={`relative w-9 h-9 flex items-center justify-center rounded-sm ${t.controlBg} border ${t.controlBorder} ${t.controlIcon} transition-all`}
                        aria-label="Notifications"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        {notifCount > 0 && (
                          <span className={`absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 ${t.badgeBg} rounded-full text-[9px] font-mono font-medium text-white flex items-center justify-center leading-none`}>
                            {notifCount > 9 ? '9+' : notifCount}
                          </span>
                        )}
                      </button>

                      <AnimatePresence>
                        {notifOpen && (
                          <Motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{    opacity: 0, y: -6 }}
                            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                            className={`absolute top-full right-0 mt-3 w-80 ${t.dropdownBg} border ${t.dropdownBorder} overflow-hidden`}
                          >
                            <div className={`px-5 py-4 border-b ${t.dropdownDivider}`}>
                              <p className={`font-mono text-[10px] uppercase tracking-[0.2em] ${t.dropdownLabel}`}>
                                Notifications
                              </p>
                            </div>
                            {notifLoading ? (
                              <div className="px-5 py-8 flex justify-center">
                                <div className={`w-4 h-4 border-2 ${isPaperSurface ? 'border-[color:var(--color-ink)]' : 'border-white'} border-t-transparent rounded-full animate-spin`} />
                              </div>
                            ) : notifications.length === 0 ? (
                              <div className="px-5 py-8 text-center">
                                <p className={`font-mono text-[11px] uppercase tracking-[0.15em] ${t.dropdownLabel}`}>
                                  No new notifications
                                </p>
                              </div>
                            ) : (
                              <div className={`max-h-72 overflow-y-auto divide-y ${t.dropdownDivider}`}>
                                {notifications.map(n => (
                                  <div key={n.id} className={`px-5 py-4 ${t.dropdownHover} transition-colors`}>
                                    <p className={`text-sm leading-snug ${t.dropdownText}`}>{n.text}</p>
                                    {n.time && (
                                      <p className={`font-mono text-[10px] uppercase tracking-[0.15em] mt-1.5 ${t.dropdownLabel}`}>
                                        {notifTimeAgo(n.time)}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </Motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* User menu */}
                    <div className="relative" ref={userMenuRef}>
                      <button
                        onClick={() => { setUserMenuOpen(o => !o); setNotifOpen(false); }}
                        className={`flex items-center gap-2 pl-2 pr-3 h-9 rounded-sm ${t.controlBg} border ${t.controlBorder} transition-all`}
                      >
                        <span className="text-base leading-none">{user.avatarIcon || '·'}</span>
                        <span className={`hidden sm:inline font-mono text-[11px] tracking-[0.1em] truncate max-w-[100px] ${t.userText}`}>
                          {user.username || user.email}
                        </span>
                        {isVerified && <VerifiedBadge size="xs" />}
                        <ChevronDown className={`w-3 h-3 ${t.userChevron} transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {userMenuOpen && (
                          <Motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{    opacity: 0, y: -6 }}
                            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                            className={`absolute top-full right-0 mt-3 w-56 ${t.dropdownBg} border ${t.dropdownBorder} overflow-hidden`}
                          >
                            <div className={`px-5 py-4 border-b ${t.dropdownDivider}`}>
                              <p className={`text-sm ${t.dropdownText} truncate`}>
                                {user.avatarIcon} {user.username}
                              </p>
                              <p className={`font-mono text-[10px] uppercase tracking-[0.2em] mt-1 ${t.dropdownLabel}`}>
                                {user.accountType}
                              </p>
                            </div>
                            <Link
                              to="/settings"
                              onClick={() => setUserMenuOpen(false)}
                              className={`flex items-center gap-3 px-5 py-3 text-sm ${t.dropdownText} ${t.dropdownHover} transition-all`}
                            >
                              <Settings className="w-3.5 h-3.5" />
                              Settings
                            </Link>
                            <button
                              onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                              className={`flex items-center gap-3 w-full px-5 py-3 text-sm ${t.dropdownText} ${t.dropdownHover} transition-all border-t ${t.dropdownDivider}`}
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              Log out
                            </button>
                          </Motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <Link
                      to="/login"
                      className={`font-mono text-[11px] uppercase tracking-[0.18em] ${t.navText.replace('group-', '')} transition-colors`}
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      className={`font-mono text-[11px] uppercase tracking-[0.18em] px-3.5 h-9 inline-flex items-center border ${isPaperSurface ? 'border-[color:var(--color-ink)] text-[color:var(--color-ink)] hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)]' : 'border-white/40 text-white hover:bg-white hover:text-dark-900'} transition-colors`}
                    >
                      Sign up
                    </Link>
                  </div>
                )}

                {/* Mobile menu toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`lg:hidden ml-1 w-9 h-9 flex items-center justify-center ${t.controlIcon}`}
                  aria-label="Menu"
                >
                  {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile nav */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <Motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{    opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className={`lg:hidden overflow-hidden border-t ${t.headerBorder}`}
              >
                <div className="py-4 space-y-0">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-1 py-3 font-mono text-[11px] tracking-[0.18em] uppercase transition-colors ${
                        isActive(item.path) ? t.navTextActive : t.navText.replace('group-', '')
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
      </Motion.header>

      {/* ── Crisis banner ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isInCrisis && (
          <Motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{    height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden bg-[color:var(--color-oxblood)] border-b border-[color:var(--color-oxblood-soft)] px-6 md:px-10 lg:px-14"
          >
            <div className="max-w-[1400px] mx-auto py-2.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <AlertCircle className="w-3.5 h-3.5 text-white flex-shrink-0 animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white whitespace-nowrap">
                  Crisis mode
                </span>
                <span className="text-white/30 hidden sm:inline">·</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/85 truncate hidden sm:block">
                  {SCENARIO_LABELS[activeScenario] ?? activeScenario}
                </span>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <button
                  onClick={openOverlay}
                  className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/85 hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  View steps <ArrowRight className="w-3 h-3" />
                </button>
                <div className="w-px h-3 bg-white/25" />
                <button
                  onClick={deactivateCrisis}
                  className="inline-flex items-center gap-1.5 px-3 h-7 bg-white/15 hover:bg-white/25 text-white font-mono text-[10px] uppercase tracking-[0.18em] transition-all"
                >
                  <ShieldCheck className="w-3 h-3" />
                  I'm safe
                </button>
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* ── Crisis toggle — anchored as a footer pill, not a floating overlay ── */}
      <div
        className="fixed bottom-4 right-4 md:bottom-5 md:right-6 z-[60] flex items-center gap-3 px-3.5 py-2 backdrop-blur-md transition-colors"
        style={{
          backgroundColor: isPaperSurface
            ? 'rgba(248, 244, 236, 0.92)'
            : 'rgba(15, 14, 13, 0.88)',
          border: isPaperSurface
            ? '1px solid rgba(21,17,12,0.12)'
            : '1px solid rgba(255,255,255,0.10)',
          boxShadow: isPaperSurface
            ? '0 8px 24px -12px rgba(21,17,12,0.18)'
            : '0 8px 24px -12px rgba(0,0,0,0.55)',
        }}
      >
        <span
          className={`hidden sm:inline font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
            isInCrisis
              ? 'text-[color:var(--color-oxblood)]'
              : isPaperSurface ? 'text-[color:var(--color-smoke)]' : 'text-gray-400'
          }`}
        >
          {isInCrisis ? 'Crisis · active' : 'Crisis mode'}
        </span>
        <button
          onClick={toggleOverlay}
          role="switch"
          aria-checked={overlayOpen}
          className="relative flex-shrink-0 w-14 h-7 transition-colors duration-200 focus:outline-none"
          style={{
            backgroundColor: overlayOpen
              ? 'var(--color-oxblood)'
              : isInCrisis
                ? 'rgba(107,31,31,0.32)'
                : isPaperSurface
                  ? 'rgba(21,17,12,0.10)'
                  : 'rgba(255,255,255,0.12)',
            border: !overlayOpen && isInCrisis
              ? '1px solid rgba(107,31,31,0.55)'
              : isPaperSurface
                ? '1px solid rgba(21,17,12,0.22)'
                : '1px solid rgba(255,255,255,0.18)',
          }}
        >
          <span
            className="absolute w-[22px] h-[22px] transition-transform duration-200"
            style={{
              left: 3,
              top: '50%',
              transform: overlayOpen ? 'translate(28px, -50%)' : 'translate(0, -50%)',
              backgroundColor: overlayOpen ? '#fff' : isPaperSurface ? 'var(--color-ink)' : '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            }}
          />
        </button>
      </div>
    </div>
  );
};

export default Header;
