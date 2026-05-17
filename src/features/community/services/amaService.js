import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { COLLECTIONS } from '../../../config/firebaseCollections';
import { getDisplayName } from '../../../utils/userUtils';

const POSTS = COLLECTIONS.COMMUNITY_POSTS;

export const listAMAs = async () => {
  const snap = await getDocs(query(collection(db, POSTS), where('type', '==', 'ama')));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const ta = a.lastCommentAt || a.createdAt || '';
      const tb = b.lastCommentAt || b.createdAt || '';
      return tb > ta ? 1 : -1;
    });
};

export const createAMA = async (user, bio = '') => {
  const payload = {
    type: 'ama',
    title: `Ask ${getDisplayName(user) || 'me'} anything`,
    content: bio.trim() || "I'm a verified security specialist on SafePress. Ask me anything.",
    authorId: user.uid,
    authorName: getDisplayName(user) || 'Anonymous',
    authorType: user.accountType,
    specialistId: user.uid,
    specialistBio: bio.trim(),
    isVerified: user.verificationStatus === 'approved',
    authorVerificationStatus: user.accountType === 'specialist' ? (user.verificationStatus || 'pending') : null,
    isAnonymous: false,
    category: 'general',
    createdAt: new Date().toISOString(),
    commentCount: 0,
    likes: 0,
    likedBy: [],
    resolved: false,
    acceptedCommentId: null,
    lastCommentAt: null,
  };
  const ref = await addDoc(collection(db, POSTS), payload);
  return { id: ref.id, ...payload };
};
