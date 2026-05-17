import { getDoc, getDocs, doc, query, where, collection, onSnapshot, updateDoc } from 'firebase/firestore';
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

const getSupportNotifications = ({ requests = [], lastSeen }) => {
  return requests.flatMap((entry) => {
    const req = entry.data ? entry.data() : entry;
    const requestId = entry.id || req.id;
    const crisisLabel = req.crisisType === 'hacked'
      ? 'support case'
      : 'case';

    if (req.caseReport?.updatedAt && req.caseReport.updatedAt > lastSeen) {
      return [{
        id: `${requestId}-report`,
        text: 'your specialist filed a resolution report',
        time: req.caseReport.updatedAt,
        path: `/support-cases/${requestId}`,
      }];
    }

    if (req.status === 'resolved' && req.resolvedAt && req.resolvedAt > lastSeen) {
      return [{
        id: `${requestId}-resolved`,
        text: 'your support case has been resolved',
        time: req.resolvedAt,
        path: `/support-cases/${requestId}`,
      }];
    }

    if (req.status === 'claimed' && req.claimedAt && req.claimedAt > lastSeen) {
      return [{
        id: `${requestId}-claimed`,
        text: 'a specialist picked up your support request',
        time: req.claimedAt,
        path: `/support-cases/${requestId}`,
      }];
    }

    if (
      req.status !== 'open'
      && req.lastCaseActivityAt
      && req.lastCaseActivityAt > lastSeen
    ) {
      return [{
        id: `${requestId}-activity`,
        text: `new activity in your ${crisisLabel}`,
        time: req.lastCaseActivityAt,
        path: `/support-cases/${requestId}`,
      }];
    }

    return [];
  });
};

const getUserNotificationContext = async (user) => {
  const userRef = doc(db, COLLECTIONS.USERS, user.uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data() || {};

  return {
    userRef,
    userData,
    lastSeen: userData.notifLastSeen || new Date(0).toISOString(),
    followedPostIds: userData.followedPosts || [],
  };
};

export const subscribeToSupportNotificationCount = (user, onData, onError) => {
  if (!user) return () => {};

  let lastSeen = new Date(0).toISOString();
  let requests = [];

  const publish = () => {
    const supportCount = getSupportNotifications({ requests, lastSeen }).length;
    onData?.(supportCount);
  };

  const unsubscribeUser = onSnapshot(
    doc(db, COLLECTIONS.USERS, user.uid),
    (snapshot) => {
      const userData = snapshot.data() || {};
      lastSeen = userData.notifLastSeen || new Date(0).toISOString();
      publish();
    },
    onError
  );

  const unsubscribeSupport = onSnapshot(
    query(collection(db, COLLECTIONS.SUPPORT_REQUESTS), where('requesterId', '==', user.uid)),
    (snapshot) => {
      requests = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
      publish();
    },
    onError
  );

  return () => {
    unsubscribeUser();
    unsubscribeSupport();
  };
};

export const getCommunityNotificationCount = async (user) => {
  if (!user) return 0;

  const { lastSeen, followedPostIds } = await getUserNotificationContext(user);
  const followedPosts = await listCommunityPostsByIds(followedPostIds);
  const replyBatches = await Promise.all(
    followedPosts
      .filter((post) => needsCommentRefresh(post, lastSeen))
      .map((post) =>
        countNewCommunityComments({
          postId: post.id,
          lastSeen,
          currentUserId: user.uid,
          legacyComments: post.comments || [],
        })
      )
  );

  return replyBatches.reduce((sum, result) => sum + (result.count > 0 ? 1 : 0), 0);
};

export const getNotificationCount = async (user) => {
  if (!user) return 0;

  const [{ lastSeen }, reqSnap, communityCount] = await Promise.all([
    getUserNotificationContext(user),
    getDocs(query(collection(db, COLLECTIONS.SUPPORT_REQUESTS), where('requesterId', '==', user.uid))),
    getCommunityNotificationCount(user),
  ]);

  const supportCount = getSupportNotifications({
    requests: reqSnap.docs.map((entry) => ({ id: entry.id, ...entry.data() })),
    lastSeen,
  }).length;

  return supportCount + communityCount;
};

export const getNotifications = async (user) => {
  if (!user) return [];

  const { userRef, lastSeen, followedPostIds } = await getUserNotificationContext(user);

  const [reqSnap, followedPosts] = await Promise.all([
    getDocs(query(collection(db, COLLECTIONS.SUPPORT_REQUESTS), where('requesterId', '==', user.uid))),
    listCommunityPostsByIds(followedPostIds),
  ]);

  const notifs = [
    ...getSupportNotifications({
      requests: reqSnap.docs.map((entry) => ({ id: entry.id, ...entry.data() })),
      lastSeen,
    }),
  ];

  const communityNotifications = await Promise.all(
    followedPosts
      .filter((post) => needsCommentRefresh(post, lastSeen))
      .map(async (post) => {
        const { count, latestTime } = await countNewCommunityComments({
          postId: post.id,
          lastSeen,
          currentUserId: user.uid,
          legacyComments: post.comments || [],
        });

        if (count <= 0) return null;

        return {
          id: post.id,
          text: `${count} new ${count === 1 ? 'reply' : 'replies'} on "${post.title}"`,
          time: latestTime,
          path: `/community/${post.id}`,
        };
      })
  );

  notifs.push(...communityNotifications.filter(Boolean));

  notifs.sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return new Date(b.time) - new Date(a.time);
  });

  await updateDoc(userRef, { notifLastSeen: new Date().toISOString() });

  return notifs;
};
