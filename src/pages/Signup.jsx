import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPasswordRequirementMessage, isStrongPassword } from '../config/security';
import { logError } from '../utils/logger';
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

const ROLE_OPTIONS = [
  { value: 'journalist', label: 'Journalist', desc: 'seeking security guidance' },
  { value: 'specialist', label: 'Security specialist', desc: 'providing expertise' },
];

const SIGNUP_COPY = {
  journalist: [
    'Open a quieter account before the reporting gets messy.',
    'Keep your public activity separate from your real identity.',
    'Start with drills, field notes, and support that does not expose your sources.',
  ],
  specialist: [
    'Apply with a clean record that can be reviewed, verified, and trusted.',
    'Join the desk with enough context to help journalists under pressure.',
    'Keep your expertise attached to the right file from the beginning.',
  ],
};

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signup, loginWithGoogle } = useAuth();
  const initialRole = searchParams.get('role') === 'specialist' ? 'specialist' : 'journalist';
  const [formData, setFormData] = useState({
    realName: '', email: '', password: '', confirmPassword: '',
    accountType: initialRole,
    expertise: '', credentials: '', linkedinUrl: '', organization: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const isNew = sessionStorage.getItem('safepress:new-user') === '1';
    navigate(isNew ? '/welcome' : '/');
  }, [user, navigate]);

  useEffect(() => {
    const nextRole = searchParams.get('role') === 'specialist' ? 'specialist' : 'journalist';
    setFormData((current) => (
      current.accountType === nextRole
        ? current
        : { ...current, accountType: nextRole }
    ));
  }, [searchParams]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleRoleSelect = (accountType) => {
    setFormData((prev) => ({ ...prev, accountType }));
    setSearchParams(accountType === 'specialist' ? { role: 'specialist' } : {});
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match.');
    if (!isStrongPassword(formData.password)) return setError(getPasswordRequirementMessage());
    if (formData.accountType === 'specialist') {
      if (!formData.expertise || !formData.credentials || !formData.organization)
        return setError('Please fill in all required specialist fields.');
    }
    setLoading(true);
    try {
      await signup(formData.email, formData.password, formData);
    } catch (err) {
      logError('Signup error:', err);
      setError(err.code === 'auth/invalid-email'
        ? 'Invalid email address.'
        : 'Unable to create account. If you already signed up, try logging in.');
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(''); setLoading(true);
    try { await loginWithGoogle(); }
    catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') setError('Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <NewsPage>
        <PageLoader text="Creating your account…" />
      </NewsPage>
    );
  }

  const isSpecialist = formData.accountType === 'specialist';
  const rotatingLines = SIGNUP_COPY[formData.accountType];

  return (
    <NewsPage >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="login-split"
      >
        <section className="login-split__editorial">
          <p className="eyebrow sm text-oxblood">SafePress · create account</p>
          <div className="login-split__brandline">
            <h1 className="broadsheet-wordmark login-split__wordmark">
              <em>Safe</em>Press
            </h1>
          </div>
          <p className="login-split__lede">
            {isSpecialist
              ? 'Apply with the information a review desk actually needs, then step into verified casework once your file is approved.'
              : 'Open a quieter account for source protection, drills, field guidance, and help that does not announce who you are.'}
          </p>
          <div className="login-split__typebox">
            <p className="display-soft login-split__typecopy">
              <RotatingType lines={rotatingLines} />
            </p>
          </div>
        </section>

        <section className="login-split__formpanel">
          <div className="login-split__formhead">
            <p className="eyebrow sm text-oxblood">Sign up</p>
            <h2 className="display-soft text-[1.7rem] leading-tight text-ink mt-2">
              {isSpecialist ? 'Open a reviewed file.' : 'Open a protected file.'}
            </h2>
          </div>

          {error && (
            <NewsNotice tone="danger" icon={AlertCircle}>
              <p className="text-sm text-ink-soft">{error}</p>
            </NewsNotice>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <p className="eyebrow sm text-smoke mb-3">I&apos;m signing up as</p>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleRoleSelect(opt.value)}
                    className={`block p-4 border text-left transition-colors ${
                      formData.accountType === opt.value
                        ? 'border-oxblood/50 bg-oxblood/[0.04]'
                        : 'border-ink/[0.12] hover:bg-paper-dim'
                    }`}
                  >
                    <span className={`display-soft text-base block leading-tight ${
                      formData.accountType === opt.value ? 'text-oxblood' : 'text-ink'
                    }`}>
                      {opt.label}
                    </span>
                    <span className="eyebrow sm text-smoke mt-1 block normal-case">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {!isSpecialist && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  className="btn ghost w-full justify-center gap-2.5"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>
                <p className="text-xs text-smoke-dim -mt-4">
                  Journalists only — specialists should use email so verification stays attached to the right account.
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex-1 border-t border-ink/[0.12]" />
                  <span className="eyebrow sm text-smoke">Or sign up with email</span>
                  <div className="flex-1 border-t border-ink/[0.12]" />
                </div>
              </>
            )}

            <div className="space-y-6">
              <NewsField no="01" label="Email address">
                <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="your@email.com" />
              </NewsField>
              <NewsField no="02" label="Password">
                <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" />
                <p className="eyebrow sm text-smoke mt-2 normal-case">{getPasswordRequirementMessage()}</p>
              </NewsField>
              <NewsField no="03" label="Confirm password">
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••" />
              </NewsField>
            </div>

            {isSpecialist && (
              <div className="space-y-6 pt-6 border-t border-ink/[0.12]">
                <NewsNotice tone="brass" icon={AlertCircle}>
                  <div>
                    <p className="eyebrow sm text-brass mb-1">Verification required</p>
                    <p className="text-sm text-ink-soft leading-relaxed">Your account will be reviewed before you can access the specialist dashboard and support queue.</p>
                  </div>
                </NewsNotice>

                <NewsField no="04" label="Full name (admin-only, used during verification)">
                  <input type="text" name="realName" value={formData.realName} onChange={handleChange} required={isSpecialist} placeholder="Jane Doe" />
                </NewsField>
                <NewsField no="05" label="Area of expertise">
                  <input type="text" name="expertise" value={formData.expertise} onChange={handleChange} required={isSpecialist} placeholder="e.g. digital security, encryption, OPSEC" />
                </NewsField>
                <NewsField no="06" label="Credentials">
                  <textarea name="credentials" value={formData.credentials} onChange={handleChange} required={isSpecialist} rows={3} placeholder="certifications, degrees, relevant experience…" />
                  <p className="eyebrow sm text-smoke mt-2 normal-case">List your qualifications — e.g. CISSP, CEH, security researcher at…</p>
                </NewsField>
                <NewsField no="07" label="Organization">
                  <input type="text" name="organization" value={formData.organization} onChange={handleChange} required={isSpecialist} placeholder="company, university, or independent" />
                </NewsField>
                <NewsField no="08" label="LinkedIn profile URL (optional)">
                  <input type="url" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} placeholder="https://linkedin.com/in/yourprofile" />
                  <p className="eyebrow sm text-smoke mt-2 normal-case">Recommended — speeds up verification.</p>
                </NewsField>
              </div>
            )}

            <div className="border border-ink/[0.12] bg-paper-soft p-4 flex gap-3">
              <Shield className="w-4 h-4 text-ink flex-shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="eyebrow sm text-ink">Protected by default</p>
                <p className="text-sm text-smoke leading-relaxed">
                  {isSpecialist
                    ? 'Your application details stay private while the review team verifies your file. Once approved, your casework identity stays consistent across the desk.'
                    : 'SafePress assigns you a codename so your activity can stay separate from your real identity. Email accounts must verify before posting or requesting specialist support.'}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {['Encrypted at rest', 'No third-party tracking', 'Journalist-focused privacy'].map((f) => (
                    <span key={f} className="inline-flex items-center gap-1.5 eyebrow sm text-smoke normal-case">
                      <CheckCircle2 className="w-3 h-3 text-ink" /> {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <NewsButton type="submit" className="w-full justify-center">
              {isSpecialist ? 'Submit application' : 'Create account'}
            </NewsButton>

            <p className="eyebrow sm text-smoke text-center">
              Already have an account?{' '}
              <Link
                to={isSpecialist ? '/login?role=specialist' : '/login'}
                className="text-oxblood hover:text-ink transition-colors"
              >
                Log in
              </Link>
            </p>
          </form>
        </section>
      </motion.div>
    </NewsPage>
  );
};

export default Signup;
