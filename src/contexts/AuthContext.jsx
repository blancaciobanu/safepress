import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { generateUserIdentity } from '../utils/userUtils';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          metadata: firebaseUser.metadata,
          ...userDoc.data(),
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  /* ── Email / password signup ─────────────────────────────────────────── */
  const signup = async (email, password, userData) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const { username, avatarIcon } = generateUserIdentity();

    const profile = {
      email,
      username,
      avatarIcon,
      realName: userData.realName,
      createdAt: new Date().toISOString(),
      securityScores: [],
      accountType: userData.accountType || 'journalist',
    };

    if (userData.accountType === 'specialist') {
      profile.verificationStatus = 'pending';
      profile.verificationData = {
        expertise: userData.expertise,
        credentials: userData.credentials,
        linkedinUrl: userData.linkedinUrl,
        organization: userData.organization,
        submittedAt: new Date().toISOString(),
      };
      profile.verificationDate = null;
      profile.specialistProfile = { bio: '', expertiseAreas: [], certifications: [] };
    }

    await setDoc(doc(db, 'users', result.user.uid), profile);
    return result;
  };

  /* ── Google sign-in ──────────────────────────────────────────────────── */
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result   = await signInWithPopup(auth, provider);

    // First time with Google? Create a Firestore profile automatically.
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    if (!userDoc.exists()) {
      const { username, avatarIcon } = generateUserIdentity();
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        username,
        avatarIcon,
        realName: result.user.displayName ?? '',
        createdAt: new Date().toISOString(),
        securityScores: [],
        accountType: 'journalist',
      });
    }

    return result;
  };

  /* ── Email / password login ──────────────────────────────────────────── */
  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  /* ── Logout ──────────────────────────────────────────────────────────── */
  const logout = () => signOut(auth);

  const value = { user, loading, signup, login, loginWithGoogle, logout };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-midnight-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
