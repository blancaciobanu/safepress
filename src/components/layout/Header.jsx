import { motion } from 'framer-motion';
import { Shield, Menu, X, User, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import VerifiedBadge from '../VerifiedBadge';

// Admin emails
const ADMIN_EMAILS = [
  'ciobanubianca20@stud.ase.ro',
  // Add more admin emails as needed
];

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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

  const navItems = [
    { name: 'dashboard', path: '/dashboard' },
    { name: 'crisis mode', path: '/crisis' },
    { name: 'security score', path: '/security-score' },
    { name: 'secure setup', path: '/secure-setup' },
    { name: 'resources', path: '/resources' },
    { name: 'community', path: '/community' },
    ...(isAdmin ? [{ name: 'admin', path: '/admin' }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-dark-900/90 backdrop-blur-xl border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Logo - centered with auth buttons */}
        <div className="py-4 flex justify-between items-center border-b border-white/5">
          {/* Left spacer for balance */}
          <div className="hidden md:flex gap-3 w-40"></div>

          {/* Centered logo */}
          <Link to="/" className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-500" />
            <span className="text-xl font-display font-medium text-white lowercase tracking-tight">
              safepress
            </span>
          </Link>

          {/* Right auth buttons */}
          <div className="flex gap-3 text-xs items-center">
            {user ? (
              <>
                <Link
                  to="/settings"
                  className="hidden md:flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  <span className="text-lg">{user.avatarIcon || '🔒'}</span>
                  <span className="lowercase text-xs">{user.username || user.email}</span>
                  {isVerified && <VerifiedBadge size="xs" />}
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors lowercase tracking-wide flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors lowercase tracking-wide"
                >
                  login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-md text-white transition-all lowercase tracking-wide"
                >
                  sign up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Navigation - below logo, centered */}
        <nav className="py-3 flex items-center justify-center">
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="relative group"
              >
                <span
                  className={`text-xs font-medium uppercase tracking-wider transition-colors ${
                    isActive(item.path)
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </nav>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden pb-4 space-y-1 text-center"
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-sm uppercase tracking-wider transition-colors ${
                  isActive(item.path)
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default Header;
