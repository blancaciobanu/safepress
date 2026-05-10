import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../../firebase/config';
import { buildPublicProfile } from '../../users/services/userService';
import { COLLECTIONS } from '../../../config/firebaseCollections';

const USERS_COLLECTION = COLLECTIONS.USERS;
const PUBLIC_PROFILES_COLLECTION = COLLECTIONS.PUBLIC_PROFILES;
const POSTS_COLLECTION = COLLECTIONS.COMMUNITY_POSTS;
const REPORTS_COLLECTION = COLLECTIONS.COMMUNITY_REPORTS;

export const getVerificationDashboardData = async () => {
  const pendingQuery = query(
    collection(db, USERS_COLLECTION),
    where('accountType', '==', 'specialist'),
    where('verificationStatus', '==', 'pending')
  );
  const approvedQuery = query(
    collection(db, USERS_COLLECTION),
    where('accountType', '==', 'specialist'),
    where('verificationStatus', '==', 'approved')
  );
  const rejectedQuery = query(
    collection(db, USERS_COLLECTION),
    where('accountType', '==', 'specialist'),
    where('verificationStatus', '==', 'rejected')
  );

  const [pendingSnapshot, approvedSnapshot, rejectedSnapshot] = await Promise.all([
    getDocs(pendingQuery),
    getDocs(approvedQuery),
    getDocs(rejectedQuery),
  ]);

  return {
    pendingVerifications: pendingSnapshot.docs.map((entry) => ({
      id: entry.id,
      ...entry.data(),
    })),
    approvedCount: approvedSnapshot.size,
    rejectedCount: rejectedSnapshot.size,
  };
};

export const getCommunityReports = async () => {
  const reportsSnapshot = await getDocs(collection(db, REPORTS_COLLECTION));

  const reports = await Promise.all(
    reportsSnapshot.docs.map(async (entry) => {
      const data = { id: entry.id, ...entry.data() };

      try {
        const postSnapshot = await getDoc(doc(db, POSTS_COLLECTION, data.postId));
        if (!postSnapshot.exists()) {
          return { ...data, postMissing: true };
        }

        const post = postSnapshot.data();
        const comment =
          data.commentId !== null && data.commentId !== undefined
            ? await getDoc(doc(db, POSTS_COLLECTION, data.postId, 'comments', data.commentId))
            : null;
        return {
          ...data,
          postTitle: post.title,
          postType: post.type,
          postAuthor: post.authorName,
          commentContent: comment?.exists() ? comment.data()?.content : undefined,
        };
      } catch {
        return { ...data, postMissing: true };
      }
    })
  );

  return reports.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
};

export const approveSpecialist = async (userId) => {
  const verificationDate = new Date().toISOString();
  const userSnapshot = await getDoc(doc(db, USERS_COLLECTION, userId));

  await updateDoc(doc(db, USERS_COLLECTION, userId), {
    verificationStatus: 'approved',
    verificationDate,
  });
  await setDoc(doc(db, PUBLIC_PROFILES_COLLECTION, userId), {
    ...buildPublicProfile({ ...(userSnapshot.data() || {}), verificationStatus: 'approved' }),
  });

  return verificationDate;
};

export const rejectSpecialist = async (userId, rejectionReason) => {
  const verificationDate = new Date().toISOString();
  const userSnapshot = await getDoc(doc(db, USERS_COLLECTION, userId));

  await updateDoc(doc(db, USERS_COLLECTION, userId), {
    verificationStatus: 'rejected',
    verificationDate,
    verificationRejectionReason: rejectionReason.trim() || null,
  });
  await setDoc(doc(db, PUBLIC_PROFILES_COLLECTION, userId), {
    ...buildPublicProfile({ ...(userSnapshot.data() || {}), verificationStatus: 'rejected' }),
  });

  return verificationDate;
};

export const markCommunityReportReviewed = async (reportId) => {
  const reviewedAt = new Date().toISOString();

  await updateDoc(doc(db, REPORTS_COLLECTION, reportId), {
    status: 'reviewed',
    reviewedAt,
  });

  return reviewedAt;
};

export const deleteCommunityReport = async (reportId) => {
  await deleteDoc(doc(db, REPORTS_COLLECTION, reportId));
};

export const setAdminClaim = async ({ targetUid, admin }) => {
  const callable = httpsCallable(functions, 'setAdminClaim');
  const result = await callable({ targetUid, admin });
  return result.data;
};

export const deleteReportedCommunityPost = async (postId, reportId) => {
  const commentsSnapshot = await getDocs(collection(db, POSTS_COLLECTION, postId, 'comments'));
  await Promise.all(commentsSnapshot.docs.map((entry) => deleteDoc(entry.ref)));
  await deleteDoc(doc(db, POSTS_COLLECTION, postId));

  if (!reportId) return null;

  const reviewedAt = new Date().toISOString();
  await updateDoc(doc(db, REPORTS_COLLECTION, reportId), {
    status: 'reviewed',
    reviewedAt,
    actionTaken: 'post-deleted',
  });

  return reviewedAt;
};
