import { useState } from 'react';
import { createCommunityPost } from '../services/communityService';
import { logError } from '../../../utils/logger';

const EMPTY_FORM = { title: '', content: '', category: 'general', isAnonymous: false };

export const useNewPost = (user, currentTabType, setPosts) => {
  const [discussionForm, setDiscussionForm] = useState({ ...EMPTY_FORM });
  const [questionForm, setQuestionForm] = useState({ ...EMPTY_FORM });
  const [showNewPost, setShowNewPost] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isQA = currentTabType === 'question';
  const newPost = isQA ? questionForm : discussionForm;
  const setNewPost = isQA ? setQuestionForm : setDiscussionForm;

  const openNewPost = () => setShowNewPost(true);
  const closeNewPost = () => { setShowNewPost(false); setError(''); };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!user || !newPost.title.trim() || !newPost.content.trim()) return;
    if (!user.emailVerified) {
      setError('verify your email before posting in the community.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const anon = newPost.isAnonymous && !isQA;
      const postData = {
        type: currentTabType,
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        authorId: user.uid,
        authorName: anon ? 'anonymous' : (user.username || 'anonymous'),
        authorIcon: anon ? '🕶️' : (user.avatarIcon || '🔒'),
        authorType: user.accountType || 'journalist',
        isVerified: user.verificationStatus === 'approved',
        authorVerificationStatus: user.accountType === 'specialist' ? (user.verificationStatus || 'pending') : null,
        isAnonymous: anon,
        category: newPost.category,
        createdAt: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        resolved: false,
      };
      const created = await createCommunityPost(postData);
      setPosts((prev) => [created, ...prev]);
      setNewPost({ ...EMPTY_FORM });
      setShowNewPost(false);
    } catch (err) {
      logError('Error creating post:', err);
      setError('failed to create post.');
    }
    setSubmitting(false);
  };

  return {
    newPost, setNewPost,
    showNewPost, openNewPost, closeNewPost,
    submitting, error,
    handleCreatePost,
  };
};
