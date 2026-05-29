import { motion as Motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPostAuthPath } from '../features/users/accountRouting';
import {
  NewsPage, NewsField, NewsButton, NewsNotice,
} from '../components/editorial/NewsPage';
import RotatingType from '../components/editorial/RotatingType';
import PageLoader from '../components/PageLoader';

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const LOGIN_LINES = [
  'Protect your reporting before the pressure starts.',
  'Keep sources harder to trace when the work gets sensitive.',
  'Ask for specialist support before a bad day becomes a breach.',
];

const Login = () => {
  const navigate = useNavigate();
  const { user, login, loginWithGoogle, authError, clearAuthError } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    navigate(getPostAuthPath(user), { replace: true });
  }, [user, navigate]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); clearAuthError(); setLoading(true);
    try {
      await login(formData.email, formData.password);
    } catch (err) {
      setError(err.code === 'auth/invalid-email' ? 'Invalid email address.' : 'Incorrect email or password.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(''); clearAuthError(); setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      const msgs = {
        'auth/unauthorized-domain': 'Google sign-in is blocked for this domain.',
        'auth/popup-blocked': 'The browser blocked the Google sign-in popup.',
        'auth/cancelled-popup-request': 'A previous popup was interrupted — please try again.',
        'auth/operation-not-allowed': 'Google sign-in is not enabled.',
      };
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(msgs[err.code] ?? `Google sign-in failed (${err.code ?? 'unknown error'}).`);
      }
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <NewsPage>
        <PageLoader text="Signing in…" />
      </NewsPage>
    );
  }

  return (
    <NewsPage>
      <Motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="login-split"
      >
        <section className="login-split__editorial">
          <p className="eyebrow sm text-oxblood">SafePress · secure login</p>
          <div className="login-split__brandline">
            <h1 className="broadsheet-wordmark login-split__wordmark">
              <em>Safe</em>Press
            </h1>
          </div>
          <p className="login-split__lede">
            A calmer entry into source protection, drills, case support, and the field manual.
          </p>
          <div className="login-split__typebox">
            <p className="display-soft login-split__typecopy">
              <RotatingType lines={LOGIN_LINES} />
            </p>
          </div>
        </section>

        <section className="login-split__formpanel">
          <div className="login-split__formhead">
            <p className="eyebrow sm text-oxblood">Sign in</p>
            <h2 className="display-soft text-[1.7rem] leading-tight text-ink mt-2">
              Return to your file.
            </h2>
          </div>

          {(error || authError) && (
            <NewsNotice tone="danger" icon={AlertCircle}>
              <p className="text-sm text-ink-soft">{error || authError}</p>
            </NewsNotice>
          )}

          <div className="space-y-8">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="btn ghost w-full justify-center gap-2.5"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-ink/[0.12]" />
              <span className="eyebrow sm text-smoke">Or sign in with email</span>
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
        </section>
      </Motion.div>
    </NewsPage>
  );
};

export default Login;
