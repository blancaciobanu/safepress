import { motion } from 'framer-motion';
import { Shield, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  NewsPage, NewsHeader, NewsField, NewsButton, NewsNotice,
} from '../components/editorial/NewsPage';

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const { user, login, loginWithGoogle, authError, clearAuthError } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!user) return;
    const isNew = sessionStorage.getItem('safepress:new-user') === '1';
    navigate(isNew ? '/welcome' : '/');
  }, [user, navigate]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); clearAuthError(); setLoading(true);
    try {
      await login(formData.email, formData.password);
    } catch (err) {
      setError(err.code === 'auth/invalid-email' ? 'invalid email address.' : 'incorrect email or password.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(''); clearAuthError(); setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      const msgs = {
        'auth/unauthorized-domain': 'google sign-in is blocked for this domain.',
        'auth/popup-blocked': 'the browser blocked the google sign-in popup.',
        'auth/cancelled-popup-request': 'a previous popup was interrupted — please try again.',
        'auth/operation-not-allowed': 'google sign-in is not enabled.',
      };
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(msgs[err.code] ?? `google sign-in failed (${err.code ?? 'unknown error'}).`);
      }
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <NewsPage >
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Shield className="w-10 h-10 text-oxblood animate-pulse" />
          <p className="eyebrow sm text-smoke">signing in…</p>
        </div>
      </NewsPage>
    );
  }

  return (
    <NewsPage >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <NewsHeader
          kicker="SafePress · Sign in"
          title={<>Welcome <em className="italic-ox">back.</em></>}
          lede="Log in to continue protecting your work and your sources."
        />

        {(error || authError) && (
          <NewsNotice tone="danger" icon={AlertCircle}>
            <p className="text-sm text-ink-soft lowercase">{error || authError}</p>
          </NewsNotice>
        )}

        <div className="mt-6 space-y-8">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="btn ghost w-full justify-center gap-2.5 lowercase"
          >
            <GoogleIcon />
            continue with google
          </button>

          <div className="flex items-center gap-4">
            <div className="flex-1 border-t border-ink/[0.12]" />
            <span className="eyebrow sm text-smoke">or sign in with email</span>
            <div className="flex-1 border-t border-ink/[0.12]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <NewsField no="01" label="Email address">
              <input
                type="email" name="email" value={formData.email}
                onChange={handleChange} required placeholder="your@email.com"
              />
            </NewsField>

            <NewsField no="02" label="Password">
              <input
                type="password" name="password" value={formData.password}
                onChange={handleChange} required placeholder="••••••••"
              />
            </NewsField>

            <NewsButton type="submit" className="w-full justify-center mt-8">
              Log in
            </NewsButton>
          </form>

          <p className="eyebrow sm text-smoke text-center">
            No account?{' '}
            <Link to="/signup" className="text-oxblood hover:text-ink transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </NewsPage>
  );
};

export default Login;
