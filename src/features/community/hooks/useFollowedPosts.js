import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { COLLECTIONS } from '../../../config/firebaseCollections';
import { logError } from '../../../utils/logger';

export const useFollowedPosts = (user) => {
  const navigate = useNavigate();
  const [followedPosts, setFollowedPosts] = useState(new Set());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFollowedPosts(new Set(user?.followedPosts || []));
  }, [user?.followedPosts, user?.uid]);

  const toggleFollow = async (e, postId) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    const isFollowing = followedPosts.has(postId);
    setFollowedPosts((prev) => {
      const next = new Set(prev);
      if (isFollowing) next.delete(postId); else next.add(postId);
      return next;
    });
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        followedPosts: isFollowing ? arrayRemove(postId) : arrayUnion(postId),
      });
    } catch (err) {
      logError('Error toggling follow:', err);
      setFollowedPosts((prev) => {
        const next = new Set(prev);
        if (isFollowing) next.add(postId); else next.delete(postId);
        return next;
      });
    }
  };

  return { followedPosts, toggleFollow };
};
