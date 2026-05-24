import { motion } from 'framer-motion';
import {
  AlertCircle, Award, CheckCircle2, Clock, Trash2, Upload, XCircle,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  deleteUser,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

import { useAuth } from '../contexts/AuthContext';
import VerifiedBadge from '../components/VerifiedBadge';
import { db, auth, storage } from '../firebase/config';
import { createOrUpdatePublicProfile, deletePublicProfile } from '../features/users/services/userService';
import { SPECIALIST_VERIFICATION_STATUSES } from '../features/users/verification';
import { COLLECTIONS } from '../config/firebaseCollections';
import {
  getPasswordRequirementMessage,
  isStrongPassword,
} from '../config/security';
import { getInitials } from '../utils/userUtils';
import { logError } from '../utils/logger';
import {
  NewsButton,
  NewsField,
  NewsNotice,
  NewsPage,
  NewsRule,
} from '../components/editorial/NewsPage';

/* Personnel record — quiet, administrative.
   Top: name on file / account type / verification (typographic, no folder tab).
   Body: left section nav (§ 01–03) + right form pane.
   Vocabulary: .f-row, .btn, .italic-ox, .eyebrow, .news-notice.
   Color tokens come from Tailwind via @theme — text-ink, text-oxblood,
   bg-paper-soft, border-ink/12, etc. */

const SECTIONS = [
  { id: 'profile',  n: '01', label: 'Profile' },
  { id: 'security', n: '02', label: 'Security' },
  { id: 'danger',   n: '03', label: 'Danger zone' },
];

const Settings = () => {
  const { user, logout, resendVerificationEmail, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const [adminName, setAdminName] = useState(user.displayName || user.username || '');
  const [adminNameSaving, setAdminNameSaving] = useState(false);

  const handleAdminNameSave = async () => {
    const trimmed = adminName.trim();
    if (!trimmed || !user.isAdmin) return;
    setAdminNameSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), { displayName: trimmed });
      await refreshUser();
      setMessage({ type: 'success', text: 'Display name updated.' });
    } catch (err) {
      logError('Admin display name save error:', err);
      setMessage({ type: 'error', text: 'Could not save display name.' });
    } finally {
      setAdminNameSaving(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    if (!file || !user) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setMessage({ type: 'error', text: 'Please upload a JPG, PNG, or WebP image.' });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Photo must be under 3 MB.' });
      return;
    }
    setAvatarUploading(true);
    setMessage({ type: '', text: '' });
    try {
      const storageRef = ref(storage, `specialist-avatars/${user.uid}`);
      await uploadBytes(storageRef, file);
      const avatarUrl = await getDownloadURL(storageRef);
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), { avatarUrl });
      await createOrUpdatePublicProfile(user.uid, { ...user, avatarUrl });
      await refreshUser();
      setMessage({ type: 'success', text: 'Photo updated.' });
    } catch (err) {
      logError('Avatar upload error:', err);
      setMessage({ type: 'error', text: 'Photo could not be uploaded. Please try again.' });
    } finally {
      setAvatarUploading(false);
    }
  };
  const [sendingVerificationEmail, setSendingVerificationEmail] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const authProviders = auth.currentUser?.providerData?.map((entry) => entry.providerId) || [];
  const usesPasswordProvider = authProviders.includes('password');
  const usesGoogleProvider = authProviders.includes('google.com');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (!isStrongPassword(passwordData.newPassword)) {
      setMessage({ type: 'error', text: getPasswordRequirementMessage() });
      return;
    }

    setLoading(true);

    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        passwordData.currentPassword,
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, passwordData.newPassword);
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      logError('Password change error:', error);
      if (error.code === 'auth/wrong-password') {
        setMessage({ type: 'error', text: 'Current password is incorrect' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update password' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setMessage({ type: 'error', text: 'Please type DELETE to confirm' });
      return;
    }
    if (usesPasswordProvider && !deletePassword.trim()) {
      setMessage({ type: 'error', text: 'Enter your current password to delete this account.' });
      return;
    }

    setLoading(true);
    try {
      if (usesPasswordProvider) {
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email,
          deletePassword,
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
      } else if (usesGoogleProvider) {
        await reauthenticateWithPopup(auth.currentUser, new GoogleAuthProvider());
      }

      if (user.avatarUrl) {
        try {
          await deleteObject(ref(storage, `specialist-avatars/${user.uid}`));
        } catch (storageError) {
          if (storageError?.code !== 'storage/object-not-found') {
            throw storageError;
          }
        }
      }

      await deleteDoc(doc(db, COLLECTIONS.USERS, user.uid));
      await deletePublicProfile(user.uid);
      await deleteUser(auth.currentUser);
      await logout();
      navigate('/');
    } catch (error) {
      logError('Delete account error:', error);
      setMessage({
        type: 'error',
        text: usesPasswordProvider
          ? 'Failed to delete account. Check your password and try again.'
          : 'Failed to delete account. Please try logging in again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerificationEmail = async () => {
    setSendingVerificationEmail(true);
    try {
      const result = await resendVerificationEmail();
      setMessage({
        type: result.sent ? 'success' : 'error',
        text: result.sent
          ? 'Verification email sent.'
          : result.reason === 'already-verified'
            ? 'Your email is already verified.'
            : result.reason === 'provider-managed'
              ? 'This account signs in through Google, so it does not use SafePress verification emails.'
              : 'No signed-in account was found for email verification.',
      });
    } catch (error) {
      logError('Verification email resend error:', error);
      const code = error?.code || error?.cause?.code;
      const text = code === 'auth/too-many-requests'
        ? 'Firebase is rate-limiting verification emails right now. Wait a bit, then try again.'
        : code === 'auth/network-request-failed'
          ? 'The verification email could not be sent because the network request failed.'
          : `Failed to send verification email${code ? ` (${code})` : ''}.`;
      setMessage({ type: 'error', text });
    } finally {
      setSendingVerificationEmail(false);
    }
  };

  const accountTypeLabel =
    user.accountType === 'specialist' ? 'Security specialist' : 'Journalist';

  const currentSection = SECTIONS.find((s) => s.id === section);

  return (
    <NewsPage >
      {/* Personnel header — typographic only. No manila tab, no shadow stack. */}
      <motion.header
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-baseline justify-between pb-3">
          <span className="eyebrow sm">Personnel · {user.username || 'Unverified'}</span>
          <span className="eyebrow sm">Account file</span>
        </div>
        <NewsRule />

        <div className="mt-6 mb-8 max-w-prose">
          <h1 className="display text-3xl md:text-4xl leading-none">
            Account settings<span className="italic-ox">.</span>
          </h1>
          <p className="mt-3 text-base leading-relaxed text-smoke">
            Manage your profile and security preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-ink/12">
          <div>
            <p className="eyebrow sm">Name on file</p>
            <p className="display-soft text-2xl mt-2 leading-tight">
              {user.realName || user.username || 'Private'}
            </p>
            <p className="eyebrow text-[10px] mt-1 text-smoke normal-case">
              Public identity · {user.accountType === 'specialist' ? (user.realName || user.username) : user.username || 'unverified'}
            </p>
          </div>
          <div>
            <p className="eyebrow sm">Account type</p>
            <div className="flex items-center gap-2 mt-2">
              <p className="display-soft text-xl leading-tight">{accountTypeLabel}</p>
              {user.accountType === 'specialist' &&
                user.verificationStatus === 'approved' && <VerifiedBadge size="sm" />}
            </div>
            {user.metadata?.creationTime && (
              <p className="eyebrow text-[10px] mt-1 text-smoke normal-case">
                Enrolled{' '}
                {new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
          <div>
            <p className="eyebrow sm">Verification</p>
            <p
              className={`display-soft text-xl mt-2 leading-tight ${
                user.emailVerified ? 'text-ink' : 'text-oxblood'
              }`}
            >
              {user.emailVerified ? 'Email confirmed' : 'Unverified'}
            </p>
            {!user.emailVerified && (
              <button
                type="button"
                onClick={handleResendVerificationEmail}
                disabled={sendingVerificationEmail}
                className="eyebrow text-[10px] mt-1 normal-case text-oxblood hover:underline disabled:opacity-50"
              >
                {sendingVerificationEmail
                  ? 'Sending...'
                  : 'Resend verification email'}
              </button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Message banner — composes the editorial .news-notice class. */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`news-notice mt-6 ${
            message.type === 'success' ? 'news-notice--brass' : 'news-notice--danger'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="news-notice__icon" />
          ) : (
            <AlertCircle className="news-notice__icon" />
          )}
          <p className="text-sm text-ink-soft">{message.text}</p>
        </motion.div>
      )}

      {/* Body — two columns */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-0">
        {/* Left section nav */}
        <aside className="md:border-r md:border-ink/15 md:pr-6 pt-1.5">
          <p className="eyebrow sm pb-2 border-b border-ink/12">Sections</p>
          <ul className="list-none p-0 m-0">
            {SECTIONS.map((s) => {
              const active = section === s.id;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => {
                      setSection(s.id);
                      setMessage({ type: '', text: '' });
                    }}
                    className={`w-full text-left flex items-baseline justify-between py-3.5 border-b border-ink/12 font-mono uppercase text-[11px] tracking-[0.16em] transition-colors ${
                      active ? 'text-ink' : 'text-smoke'
                    }`}
                  >
                    <span>
                      <span className="mr-2 text-ink">§{s.n}</span>
                      {s.label}
                    </span>
                    {active && <span className="text-oxblood">›</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Right form pane */}
        <motion.section
          key={section}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="md:pl-10 pt-1.5"
        >
          <p className="eyebrow sm text-oxblood">§ {currentSection.n}</p>
          <h2 className="display text-3xl md:text-4xl mt-2.5 leading-none">
            {currentSection.label}<span className="italic-ox">.</span>
          </h2>

          {section === 'profile' && (
            <ProfileSection
              user={user}
              avatarUploading={avatarUploading}
              avatarInputRef={avatarInputRef}
              onAvatarUpload={handleAvatarUpload}
              adminName={adminName}
              setAdminName={setAdminName}
              adminNameSaving={adminNameSaving}
              onAdminNameSave={handleAdminNameSave}
            />
          )}

          {section === 'security' && (
            <SecuritySection
              passwordData={passwordData}
              setPasswordData={setPasswordData}
              onSubmit={handlePasswordChange}
              loading={loading}
            />
          )}

          {section === 'danger' && (
            <DangerSection onOpenDelete={() => setShowDeleteModal(true)} />
          )}

          <div className="mt-12 pt-4 border-t border-ink/22 flex items-baseline justify-between">
            <span className="eyebrow sm">File · {currentSection.label}</span>
          </div>
        </motion.section>
      </div>

      {/* Delete confirm modal — paper aesthetic, not glass. */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => {
            setShowDeleteModal(false);
            setDeleteConfirm('');
            setDeletePassword('');
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full p-7 bg-paper-soft border border-ink/16 border-l-2 border-l-oxblood"
          >
            <p className="eyebrow sm text-oxblood">Caution</p>
            <h2 className="display text-2xl md:text-3xl mt-2 leading-none">
              Delete account<span className="italic-ox">?</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              This will permanently delete your account, all quiz history, and
              data. This action cannot be undone.
            </p>

            <div className="mt-6">
              <NewsField
                label={
                  <>
                    Type <span className="font-bold text-ink">DELETE</span> to confirm
                  </>
                }
              >
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                />
              </NewsField>
            </div>

            {usesPasswordProvider && (
              <div className="mt-4">
                <NewsField label="Current password">
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your current password"
                  />
                </NewsField>
              </div>
            )}

            {usesGoogleProvider && !usesPasswordProvider && (
              <p className="eyebrow text-[10px] mt-4 normal-case text-smoke-dim">
                You&apos;ll be asked to confirm with Google before the account is removed.
              </p>
            )}

            <div className="flex gap-3 mt-7">
              <NewsButton
                variant="mono"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm('');
                  setDeletePassword('');
                }}
                className="flex-1 justify-center"
              >
                Cancel
              </NewsButton>
              <NewsButton
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirm !== 'DELETE'}
                className="flex-1 justify-center bg-oxblood disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                {loading ? 'Deleting...' : 'Delete account'}
              </NewsButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </NewsPage>
  );
};

/* ─── Profile section ────────────────────────────────────────────────── */

const ProfileSection = ({ user, avatarUploading, avatarInputRef, onAvatarUpload, adminName, setAdminName, adminNameSaving, onAdminNameSave }) => (
  <div className="mt-7 flex flex-col gap-8">
    {user.isAdmin && (
      <div className="p-5 border border-oxblood/20 bg-oxblood/[0.03]">
        <p className="eyebrow sm text-oxblood mb-4">Admin · Display name</p>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            placeholder="Your display name"
            className="flex-1"
            maxLength={60}
          />
          <NewsButton
            type="button"
            onClick={onAdminNameSave}
            disabled={adminNameSaving || !adminName.trim()}
          >
            {adminNameSaving ? 'Saving…' : 'Save'}
          </NewsButton>
        </div>
        <p className="eyebrow text-[10px] mt-2 normal-case text-smoke-dim">
          Shown in the header and dropdown. Not tied to your codename or role — free text.
        </p>
      </div>
    )}

    {user.accountType === 'journalist' ? (
      <NewsNotice tone="brass">
        <p className="eyebrow sm text-brass">Field note</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          You appear as your anonymous codename everywhere on the platform. Your real name is never shown.
        </p>
        <Link to="/specialist-verification" className="inline-block mt-3 text-sm text-oxblood hover:text-ink transition-colors">
          Apply as specialist →
        </Link>
      </NewsNotice>
    ) : (
      <NewsNotice tone="brass">
        <p className="eyebrow sm text-brass">Field note</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Journalists see your real name, photo, organization, and credentials when you are assigned to their case.
        </p>
      </NewsNotice>
    )}

    {user.accountType === 'specialist' && (
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 bg-paper-soft border border-ink/20 flex items-center justify-center font-display font-bold text-2xl text-ink flex-shrink-0 overflow-hidden">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.realName || user.username} className="w-full h-full object-cover" />
          ) : (
            getInitials(user.realName || user.username || '')
          )}
        </div>
        <div>
          <p className="eyebrow sm mb-3">Profile photo</p>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onAvatarUpload(file);
              e.target.value = '';
            }}
          />
          <NewsButton
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
          >
            <Upload className="w-4 h-4" />
            {avatarUploading ? 'Uploading…' : user.avatarUrl ? 'Replace photo' : 'Upload photo'}
          </NewsButton>
          <p className="eyebrow text-[10px] mt-2 normal-case text-smoke-dim">JPG, PNG, or WebP · max 3 MB</p>
        </div>
      </div>
    )}

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <NewsField no="01" label={user.accountType === 'specialist' ? 'Display name' : 'Anonymous codename'}>
        <input
          type="text"
          value={user.accountType === 'specialist' ? (user.realName || user.username || '') : (user.username || '')}
          disabled
          className="opacity-60 cursor-not-allowed"
        />
      </NewsField>

      {user.accountType === 'specialist' && (
        <NewsField no="02" label="Codename (system)">
          <input
            type="text"
            value={user.username || ''}
            disabled
            className="opacity-60 cursor-not-allowed"
          />
        </NewsField>
      )}

      <NewsField
        no={user.accountType === 'specialist' ? '03' : '02'}
        label="Email address"
      >
        <input
          type="email"
          value={user.email || ''}
          disabled
          className="opacity-60 cursor-not-allowed"
        />
      </NewsField>
    </div>

    {/* Verification status — specialist-only flows */}
    {user.accountType === 'specialist' && (
      <div className="flex flex-col gap-3">
        <p className="eyebrow sm">Verification status</p>

        {user.verificationStatus === SPECIALIST_VERIFICATION_STATUSES.PENDING_DETAILS && (
          <NewsNotice tone="brass" icon={Clock}>
            <p className="eyebrow sm text-brass">Verification file incomplete</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              Your basic application is saved, but the review desk still needs a fuller verification dossier before it can assess case readiness.
            </p>
            <Link to="/specialist-verification" className="inline-block mt-3 text-sm text-oxblood hover:text-ink transition-colors">
              Complete verification →
            </Link>
          </NewsNotice>
        )}

        {user.verificationStatus === SPECIALIST_VERIFICATION_STATUSES.PENDING_REVIEW && (
          <NewsNotice tone="brass" icon={Clock}>
            <p className="eyebrow sm text-brass">Verification pending</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              Your specialist account is under review. You'll be notified once
              approved.
            </p>
          </NewsNotice>
        )}

        {user.verificationStatus === SPECIALIST_VERIFICATION_STATUSES.NEEDS_MORE_INFO && (
          <NewsNotice tone="danger" icon={AlertCircle}>
            <p className="eyebrow sm text-oxblood">More detail requested</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              {user.verificationReviewNote || 'The review desk asked for a stronger verification file before it can approve your account.'}
            </p>
            <Link to="/specialist-verification" className="inline-block mt-3 text-sm text-oxblood hover:text-ink transition-colors">
              Revise verification →
            </Link>
          </NewsNotice>
        )}

        {user.verificationStatus === SPECIALIST_VERIFICATION_STATUSES.APPROVED && (
          <NewsNotice tone="brass" icon={Award}>
            <p className="eyebrow sm text-brass">Verified specialist</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              Your credentials have been verified. You can now provide guidance
              to journalists.
            </p>
            {user.verificationDate && (
              <p className="eyebrow text-[10px] mt-2 normal-case text-smoke">
                Verified on{' '}
                {new Date(user.verificationDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            )}
          </NewsNotice>
        )}

        {user.verificationStatus === SPECIALIST_VERIFICATION_STATUSES.REJECTED && (
          <NewsNotice tone="danger" icon={XCircle}>
            <p className="eyebrow sm text-oxblood">Verification not approved</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              {user.verificationRejectionReason || 'Your specialist application was not approved.'}
            </p>
            <Link to="/specialist-verification" className="inline-block mt-3 text-sm text-oxblood hover:text-ink transition-colors">
              Build a new file →
            </Link>
          </NewsNotice>
        )}
      </div>
    )}
  </div>
);

/* ─── Security section ───────────────────────────────────────────────── */

const SecuritySection = ({ passwordData, setPasswordData, onSubmit, loading }) => (
  <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-6">
    <NewsField no="01" label="Current password">
      <input
        type="password"
        value={passwordData.currentPassword}
        onChange={(e) =>
          setPasswordData({ ...passwordData, currentPassword: e.target.value })
        }
        required
        placeholder="••••••••"
      />
    </NewsField>

    <NewsField no="02" label="New password">
      <input
        type="password"
        value={passwordData.newPassword}
        onChange={(e) =>
          setPasswordData({ ...passwordData, newPassword: e.target.value })
        }
        required
        placeholder="••••••••"
      />
      <p className="eyebrow text-[10px] mt-1 normal-case text-smoke-dim">
        At least 6 characters
      </p>
    </NewsField>

    <NewsField no="03" label="Confirm new password">
      <input
        type="password"
        value={passwordData.confirmPassword}
        onChange={(e) =>
          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
        }
        required
        placeholder="••••••••"
      />
    </NewsField>

    <div className="pt-2">
      <NewsButton
        type="submit"
        disabled={loading}
        className="disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Updating password...' : 'Update password'}
      </NewsButton>
    </div>
  </form>
);

/* ─── Danger zone section ────────────────────────────────────────────── */

const DangerSection = ({ onOpenDelete }) => (
  <div className="mt-7 flex flex-col gap-7">
    <p className="text-base leading-relaxed text-ink-soft max-w-prose">
      Permanently delete your account and all associated data. This action
      cannot be undone.
    </p>

    <NewsNotice tone="danger" className="items-start justify-between gap-6">
      <div>
        <p className="eyebrow sm text-oxblood">Close the file</p>
        <p className="display-soft text-lg mt-2 leading-tight">Delete account</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
      </div>
      <NewsButton
        variant="mono"
        onClick={onOpenDelete}
        className="border-oxblood text-oxblood self-start flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete account
      </NewsButton>
    </NewsNotice>
  </div>
);

export default Settings;
