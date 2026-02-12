import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { generateUserIdentity } from '../utils/userUtils';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, get additional data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setUser({
          uid: user.uid,
          email: user.email,
          metadata: user.metadata,
          ...userDoc.data()
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password, userData) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Generate anonymous identity for privacy
      const { username, avatarIcon } = generateUserIdentity();

      // Base user data
      const baseUserData = {
        email,
        username,
        avatarIcon,
        realName: userData.realName,
        createdAt: new Date().toISOString(),
        securityScores: [],
        completedGuides: [],
        accountType: userData.accountType || 'journalist'
      };

      // Add specialist-specific fields if account type is specialist
      if (userData.accountType === 'specialist') {
        baseUserData.verificationStatus = 'pending'; // pending, approved, rejected
        baseUserData.verificationData = {
          expertise: userData.expertise,
          credentials: userData.credentials,
          linkedinUrl: userData.linkedinUrl,
          organization: userData.organization,
          submittedAt: new Date().toISOString()
        };
        baseUserData.verificationDate = null; // Set when approved
        baseUserData.specialistProfile = {
          bio: '',
          expertiseAreas: [],
          certifications: []
        };
      }

      // Create user document in Firestore
      await setDoc(doc(db, 'users', result.user.uid), baseUserData);

      return result;
    } catch (error) {
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      return await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
