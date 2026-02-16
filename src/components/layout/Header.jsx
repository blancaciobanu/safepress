import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, LogOut, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
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
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isInCrisis, activeScenario, deactivateCrisis, openOverlay, toggleOverlay, overlayOpen } = useCrisis();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);
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

      {/* ── Main header ───────────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="bg-dark-900/95 backdrop-blur-xl border-b border-white/[0.06]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Top bar — logo centred, auth right */}
          <div className="py-4 flex justify-between items-center border-b border-white/[0.04]">

            {/* Left spacer */}
            <div className="hidden md:block w-48" />

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-midnight-400/10 border border-midnight-400/20 group-hover:bg-midnight-400/15 transition-colors">
                <Shield className="w-3.5 h-3.5 text-midnight-400" />
              </div>
              <span className="text-lg font-display font-semibold tracking-tight" style={{ color: '#EAE7E0' }}>
                safe<span className="text-midnight-400">press</span>
              </span>
            </Link>

            {/* Auth */}
            <div className="flex items-center gap-2 w-48 justify-end">
              {user ? (
                <>
                  <Link
                    to="/settings"
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm"
                  >
                    <span className="text-base leading-none">{user.avatarIcon || '🔒'}</span>
                    <span className="text-xs font-medium text-gray-400">{user.username || user.email}</span>
                    {isVerified && <VerifiedBadge size="xs" />}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all text-xs font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-1.5 bg-midnight-400 hover:bg-midnight-500 text-white rounded-md text-sm font-medium transition-all"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Nav bar */}
          <nav className="flex items-center justify-center py-0">
            <div className="hidden lg:flex items-center">

              {/* Regular nav items */}
              <div className="flex items-center gap-7">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative py-3.5 group"
                  >
                    <span
                      className={`text-[11px] font-semibold tracking-[0.12em] uppercase transition-colors duration-200 ${
                        isActive(item.path)
                          ? 'text-white'
                          : 'text-gray-500 group-hover:text-gray-300'
                      }`}
                    >
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

              {/* Crisis toggle — always visible, separated */}
              <div className="flex items-center gap-2.5 ml-8 pl-8 border-l border-white/[0.08] py-3.5">
                <span className={`text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${
                  isInCrisis ? 'text-crimson-400' : 'text-gray-600'
                }`}>
                  {isInCrisis ? 'Crisis Active' : 'Crisis'}
                </span>
                <button
                  onClick={toggleOverlay}
                  role="switch"
                  aria-checked={overlayOpen}
                  className="relative flex-shrink-0 w-10 h-[22px] rounded-full transition-colors duration-200 focus:outline-none"
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
                    className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-transform duration-200"
                    style={{
                      left: 2,
                      transform: overlayOpen ? 'translateX(18px)' : 'translateX(0)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
                    }}
                  />
                </button>
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
                    isActive(item.path)
                      ? 'text-white bg-white/5'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              {/* Mobile crisis toggle row */}
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className={`text-xs font-bold uppercase tracking-[0.1em] ${isInCrisis ? 'text-crimson-400' : 'text-gray-500'}`}>
                  {isInCrisis ? 'Crisis Active' : 'Crisis Mode'}
                </span>
                <button
                  onClick={toggleOverlay}
                  role="switch"
                  aria-checked={overlayOpen}
                  className="relative flex-shrink-0 w-10 h-[22px] rounded-full transition-colors duration-200 focus:outline-none"
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
                    className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-transform duration-200"
                    style={{
                      left: 2,
                      transform: overlayOpen ? 'translateX(18px)' : 'translateX(0)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
                    }}
                  />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* ── Crisis banner — part of the fixed stack, no z-index fight ──────── */}
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
