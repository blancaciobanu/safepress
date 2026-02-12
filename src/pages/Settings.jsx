import { motion } from 'framer-motion';
import {
  User, Mail, Lock, Shield, Trash2, AlertCircle,
  CheckCircle2, Save, LogOut, Award, Clock, XCircle
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import VerifiedBadge from '../components/VerifiedBadge';
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser
} from 'firebase/auth';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Delete account state
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'new passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'password must be at least 6 characters' });
      return;
    }

    setLoading(true);

    try {
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update password
      await updatePassword(auth.currentUser, passwordData.newPassword);

      setMessage({ type: 'success', text: 'password updated successfully' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Password change error:', error);
      if (error.code === 'auth/wrong-password') {
        setMessage({ type: 'error', text: 'current password is incorrect' });
      } else {
        setMessage({ type: 'error', text: 'failed to update password' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setMessage({ type: 'error', text: 'please type DELETE to confirm' });
      return;
    }

    setLoading(true);

    try {
      // Delete user data from Firestore
      await deleteDoc(doc(db, 'users', user.uid));

      // Delete user account
      await deleteUser(auth.currentUser);

      // Logout and redirect
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Delete account error:', error);
      setMessage({ type: 'error', text: 'failed to delete account. please try logging in again.' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'profile', icon: User },
    { id: 'security', label: 'security', icon: Lock },
    { id: 'danger', label: 'danger zone', icon: AlertCircle }
  ];

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 lowercase">
            account settings
          </h1>
          <p className="text-lg text-gray-400 lowercase leading-relaxed">
            manage your profile and security preferences
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex gap-4 mb-8 border-b border-white/10"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMessage({ type: '', text: '' });
                }}
                className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors relative lowercase ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-midnight-400"
                  />
                )}
              </button>
            );
          })}
        </motion.div>

        {/* Message Display */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              message.type === 'success'
                ? 'bg-olive-500/10 border border-olive-500/20'
                : 'bg-crimson-500/10 border border-crimson-500/20'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-olive-500 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-crimson-500 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm lowercase ${
              message.type === 'success' ? 'text-olive-400' : 'text-crimson-400'
            }`}>
              {message.text}
            </p>
          </motion.div>
        )}

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="glass-card p-8">
              <h2 className="text-2xl font-display font-bold mb-6 lowercase">
                profile information
              </h2>

              {/* Privacy Notice */}
              <div className="mb-6 p-4 bg-olive-500/10 border border-olive-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-olive-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-olive-400 font-semibold lowercase mb-1">
                      your identity is protected
                    </p>
                    <p className="text-xs text-gray-400 lowercase leading-relaxed">
                      you appear as your anonymous username everywhere. your real name is encrypted and only used for account recovery.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                    anonymous username
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                      {user.avatarIcon || '🔒'}
                    </span>
                    <input
                      type="text"
                      value={user.username || ''}
                      disabled
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white lowercase opacity-60 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 lowercase">this is what others see</p>
                </div>

                <div>
                  <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                    real name <span className="text-xs text-gray-500">(private)</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={user.realName || ''}
                      disabled
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white lowercase opacity-60 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 lowercase">only you can see this</p>
                </div>

                <div>
                  <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                    email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white opacity-60 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Account Type */}
                <div className="pt-4 border-t border-white/10">
                  <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                    account type
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white lowercase">
                      {user.accountType === 'specialist' ? 'security specialist' : 'journalist'}
                    </span>
                    {user.accountType === 'specialist' && user.verificationStatus === 'approved' && (
                      <VerifiedBadge size="sm" />
                    )}
                  </div>
                </div>

                {/* Verification Status for Specialists */}
                {user.accountType === 'specialist' && (
                  <div>
                    <label className="block text-sm font-sans text-gray-400 mb-3 lowercase">
                      verification status
                    </label>

                    {user.verificationStatus === 'pending' && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-amber-400 font-semibold lowercase mb-1">
                              verification pending
                            </p>
                            <p className="text-xs text-gray-400 lowercase leading-relaxed">
                              your specialist account is under review. you'll be notified once approved.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {user.verificationStatus === 'approved' && (
                      <div className="p-4 bg-olive-500/10 border border-olive-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Award className="w-5 h-5 text-olive-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-olive-400 font-semibold lowercase mb-1">
                              verified specialist
                            </p>
                            <p className="text-xs text-gray-400 lowercase leading-relaxed">
                              your credentials have been verified. you can now provide guidance to journalists.
                            </p>
                            {user.verificationDate && (
                              <p className="text-xs text-gray-500 mt-2 lowercase">
                                verified on {new Date(user.verificationDate).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {user.verificationStatus === 'rejected' && (
                      <div className="p-4 bg-crimson-500/10 border border-crimson-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-crimson-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-crimson-400 font-semibold lowercase mb-1">
                              verification not approved
                            </p>
                            <p className="text-xs text-gray-400 lowercase leading-relaxed">
                              your specialist application was not approved. please contact support for more information.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-500 lowercase">
                    account created: {new Date(user.metadata?.creationTime).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="glass-card p-8">
              <h2 className="text-2xl font-display font-bold mb-6 lowercase">
                change password
              </h2>

              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                    current password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-midnight-400 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                    new password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-midnight-400 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 lowercase">at least 6 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                    confirm new password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-midnight-400 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-midnight-400 hover:bg-midnight-500 text-white rounded-lg font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed lowercase"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'updating password...' : 'update password'}
                </button>
              </form>
            </div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <div className="glass-card p-8 border-crimson-500/20">
              <h2 className="text-2xl font-display font-bold mb-6 lowercase text-crimson-500">
                danger zone
              </h2>

              <div className="space-y-6">
                <div className="p-6 bg-crimson-500/10 border border-crimson-500/20 rounded-lg">
                  <div className="flex items-start gap-4 mb-4">
                    <AlertCircle className="w-6 h-6 text-crimson-500 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-display font-semibold mb-2 lowercase">
                        delete account
                      </h3>
                      <p className="text-sm text-gray-400 lowercase mb-4">
                        permanently delete your account and all associated data. this action cannot be undone.
                      </p>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-crimson-500 hover:bg-crimson-600 text-white rounded-lg font-semibold transition-all hover:scale-[1.02] lowercase"
                      >
                        <Trash2 className="w-4 h-4" />
                        delete account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-8 max-w-md w-full border-crimson-500/20"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-crimson-500/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-crimson-500" />
                </div>
                <h2 className="text-2xl font-display font-bold lowercase">
                  delete account?
                </h2>
              </div>

              <p className="text-gray-400 mb-6 lowercase">
                this will permanently delete your account, all quiz history, and data. this action cannot be undone.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                  type <span className="text-white font-bold">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-crimson-500 transition-colors"
                  placeholder="DELETE"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirm('');
                  }}
                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg font-semibold transition-all lowercase"
                >
                  cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading || deleteConfirm !== 'DELETE'}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-crimson-500 hover:bg-crimson-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed lowercase"
                >
                  <Trash2 className="w-4 h-4" />
                  {loading ? 'deleting...' : 'delete account'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Settings;
