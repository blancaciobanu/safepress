import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
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

const buildSessionUser = async (firebaseUser) => {
  const [userDoc, initialTokenResult] = await Promise.all([
    getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid)),
    getIdTokenResult(firebaseUser),
  ]);

  let profile = userDoc.exists() ? userDoc.data() : {};
  let tokenResult = initialTokenResult;

  const issuedAtMs = new Date(tokenResult.issuedAtTime).getTime();
  if (claimsUpdatedAtMs(profile) > issuedAtMs) {
    tokenResult = await getIdTokenResult(firebaseUser, true);
  }

  if (
    profile.accountType === 'specialist'
    && profile.verificationStatus === 'pending-email-verification'
    && firebaseUser.emailVerified
  ) {
    await updateDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
      verificationStatus: 'pending',
    });
    profile = {
      ...profile,
      verificationStatus: 'pending',
    };
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
  const signup = async (email, password, userData) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const { username } = generateUserIdentity();

    const accountType = ['journalist', 'specialist'].includes(userData?.accountType)
      ? userData.accountType
      : 'journalist';

    const profile = {
      email,
      username,
      createdAt: new Date().toISOString(),
      securityScores: [],
      accountType,
    };

    if (accountType === 'specialist') {
      profile.realName = userData.realName;
      profile.verificationStatus = 'pending-email-verification';
      profile.verificationData = {
        expertise: userData.expertise,
        credentials: userData.credentials,
        linkedinUrl: userData.linkedinUrl,
        organization: userData.organization,
        submittedAt: new Date().toISOString(),
      };
      profile.verificationDate = null;
      profile.verificationRejectionReason = null;
      profile.specialistProfile = { bio: '', expertiseAreas: [], certifications: [] };
    }

    await setDoc(doc(db, COLLECTIONS.USERS, result.user.uid), profile);
    try {
      await createOrUpdatePublicProfile(result.user.uid, profile);
    } catch (error) {
      logError('Public profile sync failed after signup:', error);
    }
    await sendEmailVerification(result.user);
    await refreshUser();
    return result;
  };

  /* ── Google sign-in ──────────────────────────────────────────────────── */
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result   = await signInWithPopup(auth, provider);

    // First time with Google? Create a Firestore profile automatically.
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, result.user.uid));
    if (!userDoc.exists()) {
      const { username } = generateUserIdentity();
      const journalistProfile = {
        email: result.user.email,
        username,
        createdAt: new Date().toISOString(),
        securityScores: [],
        accountType: 'journalist',
      };
      await setDoc(doc(db, COLLECTIONS.USERS, result.user.uid), journalistProfile);
      try {
        await createOrUpdatePublicProfile(result.user.uid, journalistProfile);
      } catch (error) {
        logError('Public profile sync failed after Google signup:', error);
      }
      sessionStorage.setItem('safepress:new-user', '1');
    } else {
      try {
        await createOrUpdatePublicProfile(result.user.uid, userDoc.data());
      } catch (error) {
        logError('Public profile sync failed after Google login:', error);
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
    if (!auth.currentUser) return false;
    await reload(auth.currentUser);
    if (auth.currentUser.emailVerified) return false;
    await sendEmailVerification(auth.currentUser);
    return true;
  };

  const refreshUser = async () => {
    if (!auth.currentUser) return null;
    await reload(auth.currentUser);
    const refreshedUser = await buildSessionUser(auth.currentUser);
    setUser(refreshedUser);
    return refreshedUser;
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
