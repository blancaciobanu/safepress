import { useState, useEffect } from 'react';
import { listCommunityPosts } from '../services/communityService';
import { logError } from '../../../utils/logger';

export const useCommunityPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        setPosts(await listCommunityPosts());
      } catch (err) {
        logError('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return { posts, setPosts, loading };
};
