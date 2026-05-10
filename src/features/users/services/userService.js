import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { COLLECTIONS } from '../../../config/firebaseCollections';

const USERS_COLLECTION = COLLECTIONS.USERS;
const PUBLIC_PROFILES_COLLECTION = COLLECTIONS.PUBLIC_PROFILES;

export const buildPublicProfile = (privateProfile = {}) => ({
  username: privateProfile.username || 'user',
  avatarIcon: privateProfile.avatarIcon || '🔒',
  accountType: privateProfile.accountType || 'journalist',
  verificationStatus: privateProfile.verificationStatus || null,
  createdAt: privateProfile.createdAt || null,
  specialistProfile: privateProfile.specialistProfile || null,
});

export const getUserProfile = async (userId) => {
  const snapshot = await getDoc(doc(db, USERS_COLLECTION, userId));
  return snapshot.exists() ? snapshot.data() : null;
};

export const getPublicProfile = async (userId) => {
  const snapshot = await getDoc(doc(db, PUBLIC_PROFILES_COLLECTION, userId));
  return snapshot.exists() ? snapshot.data() : null;
};

export const createOrUpdatePublicProfile = async (userId, privateProfile) => {
  const publicProfile = buildPublicProfile(privateProfile);
  await setDoc(doc(db, PUBLIC_PROFILES_COLLECTION, userId), publicProfile);
  return publicProfile;
};

export const deletePublicProfile = async (userId) => {
  await deleteDoc(doc(db, PUBLIC_PROFILES_COLLECTION, userId));
};

export const reapplySpecialistVerification = async (userId) => {
  const submittedAt = new Date().toISOString();

  await updateDoc(doc(db, USERS_COLLECTION, userId), {
    verificationStatus: 'pending',
    verificationRejectionReason: null,
    'verificationData.submittedAt': submittedAt,
  });

  const updatedPrivateProfile = await getUserProfile(userId);
  if (updatedPrivateProfile) {
    await setDoc(
      doc(db, PUBLIC_PROFILES_COLLECTION, userId),
      buildPublicProfile(updatedPrivateProfile)
    );
  }

  return submittedAt;
};
