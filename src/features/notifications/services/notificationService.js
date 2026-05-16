import { getDoc, getDocs, doc, query, where, collection, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import {
  countNewCommunityComments,
  listCommunityPostsByIds,
} from '../../community/services/communityService';
import { COLLECTIONS } from '../../../config/firebaseCollections';

const needsCommentRefresh = (post, lastSeen) => {
  const latestCommentAt = post?.lastCommentAt || null;
  if (!latestCommentAt) {
    return (post?.comments || []).some((comment) => comment.createdAt > lastSeen);
  }
  return latestCommentAt > lastSeen;
};

export const getNotificationCount = async (user) => {
  if (!user) return 0;

  const userSnap = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
  const userData = userSnap.data() || {};
  const lastSeen = userData.notifLastSeen || new Date(0).toISOString();
  const followedPostIds = userData.followedPosts || [];

  let count = 0;

  const reqSnap = await getDocs(
    query(collection(db, COLLECTIONS.SUPPORT_REQUESTS), where('requesterId', '==', user.uid))
  );
  reqSnap.docs.forEach((entry) => {
    const req = entry.data();
    if (req.status === 'claimed' && req.claimedBy) count++;
    if (req.status === 'resolved') count++;
  });

  const followedPosts = await listCommunityPostsByIds(followedPostIds);
  for (const post of followedPosts) {
    if (!needsCommentRefresh(post, lastSeen)) continue;
    const { count: replyCount } = await countNewCommunityComments({
      postId: post.id,
      lastSeen,
      currentUserId: user.uid,
      legacyComments: post.comments || [],
    });
    if (replyCount > 0) count++;
  }

  return count;
};

export const getNotifications = async (user) => {
  if (!user) return [];

  const userRef = doc(db, COLLECTIONS.USERS, user.uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data() || {};
  const lastSeen = userData.notifLastSeen || new Date(0).toISOString();
  const followedPostIds = userData.followedPosts || [];

  const notifs = [];

  const reqSnap = await getDocs(
    query(collection(db, COLLECTIONS.SUPPORT_REQUESTS), where('requesterId', '==', user.uid))
  );
  reqSnap.docs.forEach(d => {
    const req = d.data();
    if (req.status === 'claimed' && req.claimedBy) {
      notifs.push({ id: d.id + '-c', text: 'a specialist picked up your support request', time: null });
    }
    if (req.status === 'resolved') {
      notifs.push({ id: d.id + '-r', text: 'your support request has been resolved', time: null });
    }
  });

  const followedPosts = await listCommunityPostsByIds(followedPostIds);
  for (const post of followedPosts) {
    if (!needsCommentRefresh(post, lastSeen)) continue;
    const { count, latestTime } = await countNewCommunityComments({
      postId: post.id,
      lastSeen,
      currentUserId: user.uid,
      legacyComments: post.comments || [],
    });
    if (count > 0) {
      notifs.push({
        id: post.id,
        text: `${count} new ${count === 1 ? 'reply' : 'replies'} on "${post.title}"`,
        time: latestTime,
      });
    }
  }

  notifs.sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return new Date(b.time) - new Date(a.time);
  });

  await updateDoc(userRef, { notifLastSeen: new Date().toISOString() });

  return notifs;
};
