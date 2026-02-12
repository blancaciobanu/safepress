import { motion } from 'framer-motion';
import { Shield, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Signup = () => {
  const navigate = useNavigate();
  const { user, signup } = useAuth();
  const [formData, setFormData] = useState({
    realName: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'journalist', // Default to journalist
    // Specialist-specific fields
    expertise: '',
    credentials: '',
    linkedinUrl: '',
    organization: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      return setError('passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('password must be at least 6 characters');
    }

    // Specialist-specific validation
    if (formData.accountType === 'specialist') {
      if (!formData.expertise || !formData.credentials || !formData.organization) {
        return setError('please fill in all required specialist fields');
      }
    }

    setLoading(true);

    try {
      await signup(formData.email, formData.password, formData);
      // Don't navigate immediately - let the useEffect handle it after user state loads
      // This prevents the "flash" of signup page when redirecting before user data is loaded
    } catch (error) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('an account with this email already exists');
      } else if (error.code === 'auth/invalid-email') {
        setError('invalid email address');
      } else if (error.code === 'auth/weak-password') {
        setError('password is too weak. use at least 6 characters');
      } else {
        setError('failed to create account. please try again.');
      }
      setLoading(false); // Only turn off loading on error
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Show loading state while creating account
  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-midnight-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400 lowercase">creating your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-midnight-400/10 border border-midnight-400/20 mb-6">
            <Shield className="w-8 h-8 text-midnight-400" />
          </div>

          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 lowercase">
            create account
          </h1>

          <p className="text-lg text-gray-400 font-sans lowercase leading-relaxed">
            join thousands of journalists staying safe
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          onSubmit={handleSubmit}
          className="glass-card p-8"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-crimson-500/10 border border-crimson-500/20 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-crimson-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-crimson-400 lowercase">{error}</p>
            </motion.div>
          )}

          {/* Privacy Notice */}
          <div className="mb-6 p-4 bg-olive-500/10 border border-olive-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-olive-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-olive-400 font-semibold lowercase mb-1">
                  anonymous by default
                </p>
                <p className="text-xs text-gray-400 lowercase leading-relaxed">
                  you'll be assigned a random username (like "SecureReporter_4829") and avatar icon 🦊 to protect your identity. your real name stays private.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                full name <span className="text-crimson-500">*</span>
                <span className="text-xs text-gray-500 ml-2">(kept private)</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  name="realName"
                  value={formData.realName}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-midnight-400 transition-colors lowercase"
                  placeholder="jane doe"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 lowercase">only used for account recovery</p>
            </div>

            <div>
              <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                email <span className="text-crimson-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-midnight-400 transition-colors"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                password <span className="text-crimson-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-midnight-400 transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 lowercase">at least 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                confirm password <span className="text-crimson-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-midnight-400 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Account Type Selection */}
            <div className="pt-6 border-t border-white/10">
              <label className="block text-sm font-sans text-gray-400 mb-3 lowercase">
                account type <span className="text-crimson-500">*</span>
              </label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="radio"
                    name="accountType"
                    value="journalist"
                    checked={formData.accountType === 'journalist'}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 text-midnight-400 focus:ring-midnight-400"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white lowercase mb-1">journalist</p>
                    <p className="text-xs text-gray-400 lowercase leading-relaxed">
                      for journalists seeking digital security guidance and resources
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="radio"
                    name="accountType"
                    value="specialist"
                    checked={formData.accountType === 'specialist'}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 text-midnight-400 focus:ring-midnight-400"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white lowercase mb-1">security specialist</p>
                    <p className="text-xs text-gray-400 lowercase leading-relaxed">
                      for verified cybersecurity experts who can provide guidance to journalists
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Specialist Verification Fields */}
            {formData.accountType === 'specialist' && (
              <div className="pt-6 border-t border-white/10 space-y-6">
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-400 font-semibold lowercase mb-1">
                        verification required
                      </p>
                      <p className="text-xs text-gray-400 lowercase leading-relaxed">
                        your account will be reviewed by our team. once approved, you'll receive a verified badge and can provide guidance to journalists.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                    area of expertise <span className="text-crimson-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="expertise"
                    value={formData.expertise}
                    onChange={handleChange}
                    required={formData.accountType === 'specialist'}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-midnight-400 transition-colors lowercase"
                    placeholder="e.g., digital security, encryption, opsec"
                  />
                </div>

                <div>
                  <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                    credentials <span className="text-crimson-500">*</span>
                  </label>
                  <textarea
                    name="credentials"
                    value={formData.credentials}
                    onChange={handleChange}
                    required={formData.accountType === 'specialist'}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-midnight-400 transition-colors lowercase resize-none"
                    placeholder="certifications, degrees, relevant experience..."
                  />
                  <p className="text-xs text-gray-500 mt-2 lowercase">
                    list your qualifications (e.g., CISSP, CEH, security researcher at...)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                    organization <span className="text-crimson-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    required={formData.accountType === 'specialist'}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-midnight-400 transition-colors lowercase"
                    placeholder="company, university, or independent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                    linkedin profile url
                  </label>
                  <input
                    type="url"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-midnight-400 transition-colors"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                  <p className="text-xs text-gray-500 mt-2 lowercase">
                    optional but recommended for faster verification
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Security Features */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-gray-400 font-sans lowercase mb-3">
              <span className="text-white font-semibold">your data is secure:</span>
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle2 className="w-3 h-3 text-olive-500" />
                <span className="lowercase">encrypted with firebase</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle2 className="w-3 h-3 text-olive-500" />
                <span className="lowercase">no third-party tracking</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle2 className="w-3 h-3 text-olive-500" />
                <span className="lowercase">journalist-focused privacy</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 inline-flex items-center justify-center gap-2 px-8 py-4 bg-midnight-400 hover:bg-midnight-500 text-white rounded-lg font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed lowercase"
          >
            {loading ? 'creating account...' : 'create account'}
          </button>

          <p className="text-sm text-gray-500 font-sans text-center mt-6 lowercase">
            already have an account?{' '}
            <Link to="/login" className="text-midnight-400 hover:underline">
              login
            </Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
};

export default Signup;
