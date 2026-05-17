import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { COLLECTIONS } from '../../../config/firebaseCollections';
import { SPECIALIST_VERIFICATION_STATUSES } from '../verification';

const USERS_COLLECTION = COLLECTIONS.USERS;
const PUBLIC_PROFILES_COLLECTION = COLLECTIONS.PUBLIC_PROFILES;

export const buildPublicProfile = (privateProfile = {}) => ({
  username: privateProfile.username || 'user',
  realName: privateProfile.realName || null,
  avatarUrl: privateProfile.avatarUrl || null,
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
    verificationStatus: SPECIALIST_VERIFICATION_STATUSES.PENDING_REVIEW,
    verificationRejectionReason: null,
    verificationReviewNote: null,
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

export const submitSpecialistVerificationDossier = async (userId, dossier) => {
  const snapshot = await getDoc(doc(db, USERS_COLLECTION, userId));
  if (!snapshot.exists()) {
    throw new Error('specialist profile not found');
  }

  const current = snapshot.data();
  const submittedAt = new Date().toISOString();
  const supportAreas = Array.isArray(dossier.supportAreas) ? dossier.supportAreas : [];

  const verificationData = {
    ...(current.verificationData || {}),
    expertise: dossier.expertise || '',
    credentials: dossier.credentials || '',
    linkedinUrl: dossier.linkedinUrl || null,
    organization: dossier.organization || '',
    portfolioUrl: dossier.portfolioUrl || null,
    certifications: dossier.certifications || '',
    secureContactMethod: dossier.secureContactMethod || '',
    secureContactHandle: dossier.secureContactHandle || '',
    region: dossier.region || '',
    languages: dossier.languages || '',
    availability: dossier.availability || '',
    supportAreas,
    notes: dossier.notes || null,
    submittedAt: current.verificationData?.submittedAt || submittedAt,
    dossierSubmittedAt: submittedAt,
  };

  const specialistProfile = {
    ...(current.specialistProfile || {}),
    bio: dossier.notes || current.specialistProfile?.bio || '',
    expertiseAreas: supportAreas,
    certifications: dossier.certifications ? [dossier.certifications] : [],
  };

  await updateDoc(doc(db, USERS_COLLECTION, userId), {
    accountType: 'specialist',
    realName: dossier.realName || current.realName || '',
    verificationStatus: SPECIALIST_VERIFICATION_STATUSES.PENDING_REVIEW,
    verificationDate: null,
    verificationRejectionReason: null,
    verificationReviewNote: null,
    verificationData,
    specialistProfile,
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
