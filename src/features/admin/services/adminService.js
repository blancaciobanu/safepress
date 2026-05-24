import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../../firebase/config';
import { COLLECTIONS } from '../../../config/firebaseCollections';

const USERS_COLLECTION = COLLECTIONS.USERS;
const POSTS_COLLECTION = COLLECTIONS.COMMUNITY_POSTS;
const REPORTS_COLLECTION = COLLECTIONS.COMMUNITY_REPORTS;

export const getVerificationDashboardData = async () => {
  const pendingDetailsQuery = query(
    collection(db, USERS_COLLECTION),
    where('accountType', '==', 'specialist'),
    where('verificationStatus', '==', 'pending-details')
  );
  const pendingQuery = query(
    collection(db, USERS_COLLECTION),
    where('accountType', '==', 'specialist'),
    where('verificationStatus', '==', 'pending')
  );
  const needsMoreInfoQuery = query(
    collection(db, USERS_COLLECTION),
    where('accountType', '==', 'specialist'),
    where('verificationStatus', '==', 'needs-more-info')
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

  const [pendingDetailsSnapshot, pendingSnapshot, needsMoreInfoSnapshot, approvedSnapshot, rejectedSnapshot] = await Promise.all([
    getDocs(pendingDetailsQuery),
    getDocs(pendingQuery),
    getDocs(needsMoreInfoQuery),
    getDocs(approvedQuery),
    getDocs(rejectedQuery),
  ]);

  return {
    pendingDetailsVerifications: pendingDetailsSnapshot.docs.map((entry) => ({
      id: entry.id,
      ...entry.data(),
    })),
    pendingVerifications: pendingSnapshot.docs.map((entry) => ({
      id: entry.id,
      ...entry.data(),
    })),
    needsMoreInfoVerifications: needsMoreInfoSnapshot.docs.map((entry) => ({
      id: entry.id,
      ...entry.data(),
    })),
    pendingDetailsCount: pendingDetailsSnapshot.size,
    approvedCount: approvedSnapshot.size,
    needsMoreInfoCount: needsMoreInfoSnapshot.size,
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
  const callable = httpsCallable(functions, 'reviewSpecialistVerification');
  const result = await callable({ userId, action: 'approve' });
  return result.data?.verificationDate || null;
};

export const requestSpecialistMoreInfo = async (userId, reviewNote) => {
  const callable = httpsCallable(functions, 'reviewSpecialistVerification');
  await callable({ userId, action: 'needs-more-info', note: reviewNote.trim() });
};

export const rejectSpecialist = async (userId, rejectionReason) => {
  const callable = httpsCallable(functions, 'reviewSpecialistVerification');
  const result = await callable({ userId, action: 'reject', note: rejectionReason.trim() });
  return result.data?.verificationDate || null;
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
