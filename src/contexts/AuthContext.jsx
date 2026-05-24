import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  getIdTokenResult,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  reload,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { generateUserIdentity } from '../utils/userUtils';
import { createOrUpdatePublicProfile } from '../features/users/services/userService';
import { SPECIALIST_VERIFICATION_STATUSES } from '../features/users/verification';
import { COLLECTIONS } from '../config/firebaseCollections';
import { isAdminFromClaims } from '../config/security';
import { logError } from '../utils/logger';

const AuthContext = createContext({});

const claimsUpdatedAtMs = (profile) => {
  const value = profile?.claimsUpdatedAt;
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value === 'string') return new Date(value).getTime();
  return 0;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildBaseJournalistProfile = (firebaseUser) => ({
  email: firebaseUser.email,
  username: generateUserIdentity().username,
  createdAt: new Date(firebaseUser.metadata?.creationTime || Date.now()).toISOString(),
  securityScores: [],
  accountType: 'journalist',
  welcomeCompletedAt: null,
});

const waitForUserProfile = async (uid, { attempts = 8, delayMs = 120 } = {}) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const snapshot = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    if (snapshot.exists()) return snapshot;
    if (attempt < attempts - 1) await sleep(delayMs);
  }
  return null;
};

const sendVerificationEmailWithRetry = async (firebaseUser) => {
  try {
    await sendEmailVerification(firebaseUser);
    return { sent: true, error: null };
  } catch (error) {
    logError('Verification email failed on first attempt:', error);
    try {
      await reload(firebaseUser);
      await sendEmailVerification(firebaseUser);
      return { sent: true, error: null };
    } catch (retryError) {
      logError('Verification email retry failed:', retryError);
      return { sent: false, error: retryError };
    }
  }
};

const ensureUserProfileShape = async (firebaseUser) => {
  const userRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
  const initialSnapshot = await getDoc(userRef);
  const snapshot = initialSnapshot.exists() ? initialSnapshot : await waitForUserProfile(firebaseUser.uid);

  if (!snapshot?.exists()) {
    const createdProfile = buildBaseJournalistProfile(firebaseUser);
    await setDoc(userRef, createdProfile);
    try {
      await createOrUpdatePublicProfile(firebaseUser.uid, createdProfile);
    } catch (error) {
      logError('Public profile sync failed after rebuilding missing profile:', error);
    }
    return createdProfile;
  }

  const profile = snapshot.data();
  const repairPatch = {};

  if (!profile.username) {
    repairPatch.username = generateUserIdentity().username;
  }
  if (!profile.createdAt) {
    repairPatch.createdAt = new Date(firebaseUser.metadata?.creationTime || Date.now()).toISOString();
  }
  if (!profile.accountType) {
    repairPatch.accountType = 'journalist';
  }
  if (!Object.prototype.hasOwnProperty.call(profile, 'welcomeCompletedAt')) {
    repairPatch.welcomeCompletedAt = null;
  }

  if (!Object.keys(repairPatch).length) {
    return profile;
  }

  const nextProfile = { ...profile, ...repairPatch };
  await updateDoc(userRef, repairPatch);
  try {
    await createOrUpdatePublicProfile(firebaseUser.uid, nextProfile);
  } catch (error) {
    logError('Public profile sync failed after repairing profile shape:', error);
  }
  return nextProfile;
};

const buildSessionUser = async (firebaseUser) => {
  const [profileData, initialTokenResult] = await Promise.all([
    ensureUserProfileShape(firebaseUser),
    getIdTokenResult(firebaseUser),
  ]);

  let profile = profileData || {};
  let tokenResult = initialTokenResult;

  const issuedAtMs = new Date(tokenResult.issuedAtTime).getTime();
  if (claimsUpdatedAtMs(profile) > issuedAtMs) {
    tokenResult = await getIdTokenResult(firebaseUser, true);
  }

  if (
    profile.accountType === 'specialist'
    && profile.verificationStatus === SPECIALIST_VERIFICATION_STATUSES.PENDING_EMAIL
    && firebaseUser.emailVerified
  ) {
    await updateDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
      verificationStatus: SPECIALIST_VERIFICATION_STATUSES.PENDING_DETAILS,
    });
    profile = {
      ...profile,
      verificationStatus: SPECIALIST_VERIFICATION_STATUSES.PENDING_DETAILS,
    };
    try {
      await createOrUpdatePublicProfile(firebaseUser.uid, profile);
    } catch (error) {
      logError('Public profile sync failed after specialist email verification:', error);
    }
  }
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    emailVerified: firebaseUser.emailVerified,
    photoURL: firebaseUser.photoURL,
    metadata: firebaseUser.metadata,
    tokenClaims: tokenResult.claims,
    isAdmin: isAdminFromClaims(tokenResult.claims),
    ...profile,
  };
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          setUser(await buildSessionUser(firebaseUser));
          setAuthError(null);
        } catch (error) {
          logError('Failed to hydrate auth session:', error);
          setAuthError('we could not load your account. please sign in again.');
          try {
            await signOut(auth);
          } catch (signOutError) {
            logError('Sign-out after hydration failure failed:', signOutError);
          }
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const clearAuthError = () => setAuthError(null);

  /* ── Email / password signup ─────────────────────────────────────────── */
  const signup = async (email, password) => {
    try {
      const existingMethods = await fetchSignInMethodsForEmail(auth, email);
      if (existingMethods.length > 0) {
        const conflictError = new Error('An account already exists for this email.');
        conflictError.code = existingMethods.includes('google.com')
          ? 'auth/google-account-conflict'
          : 'auth/email-already-in-use';
        conflictError.signInMethods = existingMethods;
        throw conflictError;
      }

      const result = await createUserWithEmailAndPassword(auth, email, password);
      const profile = buildBaseJournalistProfile(result.user);

      await setDoc(doc(db, COLLECTIONS.USERS, result.user.uid), profile);
      try {
        await createOrUpdatePublicProfile(result.user.uid, profile);
      } catch (error) {
        logError('Public profile sync failed after signup:', error);
      }
      const { sent, error } = await sendVerificationEmailWithRetry(result.user);
      if (!sent) {
        logError('Verification email could not be sent automatically after signup.');
        if (error) logError('Automatic verification email error detail:', error);
      }
      await refreshUser();
      return result;
    } catch (error) {
      throw error;
    }
  };

  /* ── Google sign-in ──────────────────────────────────────────────────── */
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result   = await signInWithPopup(auth, provider);

    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, result.user.uid));
    if (!userDoc.exists()) {
      const profile = buildBaseJournalistProfile(result.user);
      await setDoc(doc(db, COLLECTIONS.USERS, result.user.uid), profile);
      try {
        await createOrUpdatePublicProfile(result.user.uid, profile);
      } catch (error) {
        logError('Public profile sync failed after Google signup:', error);
      }
    }

    await refreshUser();
    return result;
  };

  /* ── Email / password login ──────────────────────────────────────────── */
  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  /* ── Logout ──────────────────────────────────────────────────────────── */
  const logout = () => signOut(auth);

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) {
      return { sent: false, reason: 'no-user' };
    }
    await reload(auth.currentUser);
    if (auth.currentUser.emailVerified) {
      return { sent: false, reason: 'already-verified' };
    }

    const providerIds = auth.currentUser.providerData
      .map((entry) => entry.providerId)
      .filter(Boolean);

    if (!providerIds.includes('password')) {
      return {
        sent: false,
        reason: 'provider-managed',
        providers: providerIds,
      };
    }

    const { sent, error } = await sendVerificationEmailWithRetry(auth.currentUser);
    if (sent) {
      return { sent: true, reason: 'sent' };
    }

    const resendError = new Error('Failed to send verification email');
    resendError.code = error?.code || 'auth/verification-email-send-failed';
    resendError.cause = error;
    throw resendError;
  };

  const refreshUser = async () => {
    if (!auth.currentUser) return null;
    await reload(auth.currentUser);
    const refreshedUser = await buildSessionUser(auth.currentUser);
    setUser(refreshedUser);
    return refreshedUser;
  };

  const completeWelcomeChoice = async () => {
    if (!auth.currentUser) return null;
    await updateDoc(doc(db, COLLECTIONS.USERS, auth.currentUser.uid), {
      welcomeCompletedAt: new Date().toISOString(),
    });
    return refreshUser();
  };

  const value = {
    user,
    loading,
    authError,
    clearAuthError,
    signup,
    login,
    loginWithGoogle,
    logout,
    resendVerificationEmail,
    refreshUser,
    completeWelcomeChoice,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
