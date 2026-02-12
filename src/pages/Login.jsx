import { motion } from 'framer-motion';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      // Don't navigate immediately - let the useEffect handle it after user state loads
      // This prevents the "flash" of login page when redirecting before user data is loaded
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('no account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        setError('incorrect password');
      } else if (error.code === 'auth/invalid-email') {
        setError('invalid email address');
      } else {
        setError('failed to login. please try again.');
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

  // Show loading state while logging in
  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-midnight-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400 lowercase">logging in...</p>
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
            welcome back
          </h1>

          <p className="text-lg text-gray-400 font-sans lowercase leading-relaxed">
            login to continue protecting your work
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

          <div className="space-y-6">
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
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 inline-flex items-center justify-center gap-2 px-8 py-4 bg-midnight-400 hover:bg-midnight-500 text-white rounded-lg font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed lowercase"
          >
            {loading ? 'logging in...' : 'login'}
          </button>

          <p className="text-sm text-gray-500 font-sans text-center mt-6 lowercase">
            don't have an account?{' '}
            <Link to="/signup" className="text-midnight-400 hover:underline">
              sign up
            </Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
};

export default Login;
