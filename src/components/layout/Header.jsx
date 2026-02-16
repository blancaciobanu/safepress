import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Menu, X, LogOut, AlertCircle, ShieldCheck, ArrowRight,
  Bell, Settings, ChevronDown,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCrisis } from '../../contexts/CrisisContext';
import VerifiedBadge from '../VerifiedBadge';

const ADMIN_EMAILS = ['ciobanubianca20@stud.ase.ro'];

const SCENARIO_LABELS = {
  hacked:   "I've Been Hacked",
  source:   "Source Exposed",
  doxxed:   "Being Doxxed",
  phishing: "Phishing Attempt",
};

const Header = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const { isInCrisis, activeScenario, deactivateCrisis, openOverlay, toggleOverlay, overlayOpen } = useCrisis();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen,   setUserMenuOpen]   = useState(false);
  const [notifOpen,      setNotifOpen]      = useState(false);

  const userMenuRef = useRef(null);
  const notifRef    = useRef(null);

  // Close dropdowns on outside click
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
      console.error('Logout error:', error);
    }
  };

  const isAdmin    = user && ADMIN_EMAILS.includes(user.email);
  const isVerified = user?.accountType === 'specialist' && user?.verificationStatus === 'approved';
  const dashboardPath = isVerified ? '/specialist-dashboard' : '/dashboard';

  const navItems = [
    { name: 'Dashboard',      path: dashboardPath },
    { name: 'Security Score', path: '/security-score' },
    { name: 'Secure Setup',   path: '/secure-setup' },
    { name: 'Resources',      path: '/resources' },
    { name: 'Community',      path: '/community' },
    ...(isAdmin ? [{ name: 'Admin', path: '/admin' }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">

      {/* ── Top-right: notification bell + user menu ───────────────────── */}
      <div className="fixed top-3 right-4 z-[60] flex items-center gap-2">

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(o => !o); setUserMenuOpen(false); }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-gray-500 hover:text-gray-300 transition-all"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0,  scale: 1     }}
                exit={{    opacity: 0, y: -6, scale: 0.97  }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-full right-0 mt-2 w-72 glass-card rounded-xl border border-white/[0.08] overflow-hidden"
                style={{ zIndex: 4 }}
              >
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500">notifications</p>
                </div>
                <div className="px-4 py-6 text-center">
                  <Bell className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 lowercase">no new notifications</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => { setUserMenuOpen(o => !o); setNotifOpen(false); }}
              className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
            >
              <span className="text-base leading-none">{user.avatarIcon || '🔒'}</span>
              <span className="hidden sm:inline text-[11px] text-gray-400 truncate max-w-[90px] lowercase">
                {user.username || user.email}
              </span>
              {isVerified && <VerifiedBadge size="xs" />}
              <ChevronDown className={`w-3 h-3 text-gray-600 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0,  scale: 1     }}
                  exit={{    opacity: 0, y: -6, scale: 0.97  }}
                  transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute top-full right-0 mt-2 w-48 glass-card rounded-xl border border-white/[0.08] overflow-hidden"
                  style={{ zIndex: 4 }}
                >
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-xs text-gray-400 lowercase truncate">{user.avatarIcon} {user.username}</p>
                    <p className="text-[10px] text-gray-600 lowercase mt-0.5">{user.accountType}</p>
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-xs text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all lowercase"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    settings
                  </Link>
                  <button
                    onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                    className="flex items-center gap-2.5 w-full px-4 py-3 text-xs text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all lowercase border-t border-white/[0.06]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    log out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-[11px] text-gray-500 hover:text-white transition-colors lowercase">
              log in
            </Link>
            <Link
              to="/signup"
              className="px-3 py-1 bg-midnight-400 hover:bg-midnight-500 text-white rounded text-[11px] font-medium transition-all lowercase"
            >
              sign up
            </Link>
          </div>
        )}
      </div>

      {/* ── Bottom-right: crisis toggle ────────────────────────────────── */}
      <div className="fixed bottom-4 right-4 z-[60] flex items-center gap-2">
        <span className={`hidden sm:inline text-xs font-bold uppercase tracking-[0.1em] transition-colors ${
          isInCrisis ? 'text-crimson-400' : 'text-gray-600'
        }`}>
          {isInCrisis ? 'Crisis Active' : 'Crisis'}
        </span>
        <button
          onClick={toggleOverlay}
          role="switch"
          aria-checked={overlayOpen}
          className="relative flex-shrink-0 w-20 h-10 rounded-full transition-colors duration-200 focus:outline-none"
          style={{
            backgroundColor: overlayOpen
              ? 'var(--crimson-500, #e53e3e)'
              : isInCrisis
                ? 'rgba(229,62,62,0.25)'
                : 'rgba(255,255,255,0.08)',
            border: !overlayOpen && isInCrisis ? '1px solid rgba(229,62,62,0.4)' : '1px solid transparent',
          }}
        >
          <span
            className="absolute top-[4px] w-8 h-8 rounded-full bg-white transition-transform duration-200"
            style={{
              left:      4,
              transform: overlayOpen ? 'translateX(40px)' : 'translateX(0)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
            }}
          />
        </button>
      </div>

      {/* ── Main header ───────────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0,    opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="bg-dark-900/95 backdrop-blur-xl border-b border-white/[0.06]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Top bar — logo centered, standalone */}
          <div className="py-4 flex items-center justify-center border-b border-white/[0.04]">
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-midnight-400/10 border border-midnight-400/20 group-hover:bg-midnight-400/15 transition-colors">
                <Shield className="w-3.5 h-3.5 text-midnight-400" />
              </div>
              <span className="text-lg font-display font-semibold tracking-tight" style={{ color: '#EAE7E0' }}>
                safe<span className="text-midnight-400">press</span>
              </span>
            </Link>
          </div>

          {/* Nav bar */}
          <nav className="flex items-center justify-center py-0">
            <div className="hidden lg:flex items-center">
              <div className="flex items-center gap-7">
                {navItems.map((item) => (
                  <Link key={item.path} to={item.path} className="relative py-3.5 group">
                    <span className={`text-[11px] font-semibold tracking-[0.12em] uppercase transition-colors duration-200 ${
                      isActive(item.path) ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
                    }`}>
                      {item.name}
                    </span>
                    {isActive(item.path) && (
                      <motion.div
                        layoutId="nav-underline"
                        className="absolute bottom-0 left-0 right-0 h-px"
                        style={{ background: 'var(--gold)' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-gray-400 hover:text-white transition-colors my-2"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </nav>

          {/* Mobile nav */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden pb-4 space-y-0.5 border-t border-white/[0.04] pt-2"
            >
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2.5 text-xs font-semibold tracking-[0.1em] uppercase rounded-md transition-colors ${
                    isActive(item.path) ? 'text-white bg-white/5' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* ── Crisis banner ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isInCrisis && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden bg-crimson-500 border-b border-crimson-600"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <AlertCircle className="w-3.5 h-3.5 text-white flex-shrink-0 animate-pulse" />
                <span className="text-[11px] font-bold text-white uppercase tracking-[0.14em] whitespace-nowrap">
                  Crisis Mode
                </span>
                <span className="text-white/40 text-xs hidden sm:block">—</span>
                <span className="text-white/85 text-xs font-medium truncate hidden sm:block">
                  {SCENARIO_LABELS[activeScenario] ?? activeScenario}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={openOverlay}
                  className="flex items-center gap-1 text-xs font-medium text-white/80 hover:text-white transition-colors"
                >
                  View Steps <ArrowRight className="w-3 h-3" />
                </button>
                <div className="w-px h-3.5 bg-white/25" />
                <button
                  onClick={deactivateCrisis}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold uppercase tracking-[0.08em] transition-all"
                >
                  <ShieldCheck className="w-3 h-3" />
                  I'm Safe
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Header;
