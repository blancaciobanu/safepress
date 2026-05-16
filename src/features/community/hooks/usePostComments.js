import { useState, useEffect } from 'react';
import { listCommunityComments } from '../services/communityService';
import { logError } from '../../../utils/logger';

export const usePostComments = (post) => {
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    if (!post?.id) { setComments([]); return; }
    const fetchComments = async () => {
      setCommentsLoading(true);
      try {
        setComments(await listCommunityComments(post.id, post.comments || []));
      } catch (err) {
        logError('Error fetching comments:', err);
        setComments(post.comments || []);
      } finally {
        setCommentsLoading(false);
      }
    };
    fetchComments();
  }, [post?.id, post?.comments]);

  return { comments, setComments, commentsLoading };
};
