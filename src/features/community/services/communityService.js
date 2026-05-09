import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { COLLECTIONS } from '../../../config/firebaseCollections';

const COMMUNITY_POSTS_COLLECTION = COLLECTIONS.COMMUNITY_POSTS;
const COMMUNITY_REPORTS_COLLECTION = COLLECTIONS.COMMUNITY_REPORTS;

const getCommentsCollection = (postId) =>
  collection(db, COMMUNITY_POSTS_COLLECTION, postId, 'comments');

const mapSnapshotDocs = (snapshot) =>
  snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));

export const getPostCommentCount = (post = {}) =>
  post.commentCount ?? post.comments?.length ?? 0;

export const listCommunityPosts = async () => {
  const snapshot = await getDocs(collection(db, COMMUNITY_POSTS_COLLECTION));
  return mapSnapshotDocs(snapshot)
    .map((post) => ({ ...post, commentCount: getPostCommentCount(post) }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const createCommunityPost = async (postData) => {
  const payload = {
    ...postData,
    commentCount: 0,
    acceptedCommentId: null,
  };
  const docRef = await addDoc(collection(db, COMMUNITY_POSTS_COLLECTION), payload);
  return { id: docRef.id, ...payload };
};

export const listCommunityComments = async (postId, legacyComments = []) => {
  const commentsQuery = query(getCommentsCollection(postId), orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(commentsQuery);
  const subcollectionComments = mapSnapshotDocs(snapshot);

  const legacyMapped = (legacyComments || []).map((comment) => ({
    ...comment,
    id: comment.id || `${comment.authorId || 'legacy'}-${comment.createdAt || Math.random()}`,
  }));

  const merged = [...legacyMapped, ...subcollectionComments];
  const seen = new Set();
  return merged
    .filter((comment) => {
      if (seen.has(comment.id)) return false;
      seen.add(comment.id);
      return true;
    })
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

export const addCommunityComment = async ({ postId, comment, fallbackCount = 0 }) => {
  const postRef = doc(db, COMMUNITY_POSTS_COLLECTION, postId);
  const commentRef = doc(db, COMMUNITY_POSTS_COLLECTION, postId, 'comments', comment.id);

  await runTransaction(db, async (transaction) => {
    const postSnapshot = await transaction.get(postRef);
    if (!postSnapshot.exists()) throw new Error('post-not-found');

    const postData = postSnapshot.data() || {};
    const currentCount = postData.commentCount ?? postData.comments?.length ?? fallbackCount;

    transaction.set(commentRef, comment);
    transaction.update(postRef, {
      commentCount: currentCount + 1,
      lastCommentAt: comment.createdAt,
    });
  });
};

export const softDeleteCommunityComment = async ({ postId, commentId }) => {
  await updateDoc(doc(db, COMMUNITY_POSTS_COLLECTION, postId, 'comments', commentId), {
    content: '[deleted]',
    authorName: 'deleted',
    authorId: null,
    deleted: true,
    authorType: 'journalist',
    isVerified: false,
    authorVerificationStatus: null,
  });
};

export const deleteCommunityPostWithComments = async (postId) => {
  const commentsSnapshot = await getDocs(getCommentsCollection(postId));
  await Promise.all(commentsSnapshot.docs.map((entry) => deleteDoc(entry.ref)));
  await deleteDoc(doc(db, COMMUNITY_POSTS_COLLECTION, postId));
};

export const createCommunityReport = async (reportData) => {
  const docRef = await addDoc(collection(db, COMMUNITY_REPORTS_COLLECTION), reportData);
  return docRef.id;
};

export const getCommunityComment = async (postId, commentId) => {
  const snapshot = await getDoc(doc(db, COMMUNITY_POSTS_COLLECTION, postId, 'comments', commentId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const countNewCommunityComments = async ({ postId, lastSeen, currentUserId, legacyComments = [] }) => {
  const commentsQuery = query(getCommentsCollection(postId), where('createdAt', '>', lastSeen));
  const snapshot = await getDocs(commentsQuery);
  const subcollectionMatches = mapSnapshotDocs(snapshot).filter((comment) => comment.authorId !== currentUserId);
  const legacyMatches = (legacyComments || []).filter(
    (comment) => comment.createdAt > lastSeen && comment.authorId !== currentUserId
  );

  const merged = [...legacyMatches, ...subcollectionMatches].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  return {
    count: merged.length,
    latestTime: merged.length ? merged[merged.length - 1].createdAt : null,
  };
};

export const updateCommunityPostLike = async ({ postId, alreadyLiked, userId }) => {
  const postRef = doc(db, COMMUNITY_POSTS_COLLECTION, postId);
  await updateDoc(postRef, alreadyLiked
    ? { likes: increment(-1), likedBy: arrayRemove(userId) }
    : { likes: increment(1), likedBy: arrayUnion(userId) }
  );
};

export const updateCommunityPost = async (postId, payload) => {
  await updateDoc(doc(db, COMMUNITY_POSTS_COLLECTION, postId), payload);
};

export const getCommunityPost = async (postId) => {
  const snapshot = await getDoc(doc(db, COMMUNITY_POSTS_COLLECTION, postId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data(), commentCount: getPostCommentCount(snapshot.data()) } : null;
};
