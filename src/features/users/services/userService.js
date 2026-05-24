import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../../firebase/config';
import { COLLECTIONS } from '../../../config/firebaseCollections';

const USERS_COLLECTION = COLLECTIONS.USERS;
const PUBLIC_PROFILES_COLLECTION = COLLECTIONS.PUBLIC_PROFILES;

export const buildPublicProfile = (privateProfile = {}) => ({
  username: privateProfile.username ?? null,
  realName: privateProfile.realName ?? null,
  avatarUrl: privateProfile.avatarUrl ?? null,
  accountType: privateProfile.accountType ?? null,
  verificationStatus: privateProfile.verificationStatus ?? null,
  createdAt: privateProfile.createdAt ?? null,
  specialistProfile: privateProfile.specialistProfile ?? null,
});

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

export const submitSpecialistVerificationDossier = async (userId, dossier) => {
  const callable = httpsCallable(functions, 'submitSpecialistVerificationDossier');
  const result = await callable({ dossier: { ...dossier, userId } });
  return result.data?.submittedAt || null;
};
