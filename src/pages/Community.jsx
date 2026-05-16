import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MessageSquare, HelpCircle, Heart, Send,
  Plus, ArrowLeft, CheckCircle2, X, Search,
  Shield, Smartphone, Lock, Radio, Scale,
  AlertTriangle, Bookmark, BookmarkCheck,
  Pencil, Pen, Star, BadgeCheck, Trash2, Flag,
  Clock, ArrowUp, EyeOff
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection, getDocs, doc, updateDoc,
  arrayUnion, arrayRemove, query, where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import VerifiedBadge from '../components/VerifiedBadge';
import { getPublicProfile } from '../features/users/services/userService';
import {
  addCommunityComment,
  createCommunityPost,
  createCommunityReport,
  deleteCommunityPostWithComments,
  getPostCommentCount,
  listCommunityComments,
  listCommunityPosts,
  softDeleteCommunityComment,
  updateCommunityPostLike,
  updateCommunityPost,
} from '../features/community/services/communityService';
import { COLLECTIONS } from '../config/firebaseCollections';
import { logError } from '../utils/logger';
import { timeAgo } from '../utils/time';
import { NewsSidebar } from '../features/news/NewsSidebar';
import {
  NewsInput,
  NewsModalCard,
  NewsPage,
  NewsPanel,
  NewsRule,
  NewsSelect,
  NewsTextarea,
} from '../components/editorial/NewsPage';

const categories = [
  { id: 'all', name: 'all' },
  { id: 'device-security', name: 'devices', icon: Smartphone },
  { id: 'source-protection', name: 'sources', icon: Shield },
  { id: 'communication', name: 'comms', icon: Radio },
  { id: 'data-protection', name: 'data', icon: Lock },
  { id: 'physical-safety', name: 'physical', icon: Users },
  { id: 'legal-rights', name: 'legal', icon: Scale },
  { id: 'general', name: 'general', icon: MessageSquare },
];

const REPORT_REASONS = [
  { id: 'spam', label: 'spam or self-promotion' },
  { id: 'harassment', label: 'harassment or abuse' },
  { id: 'misinformation', label: 'misinformation or bad security advice' },
  { id: 'off-topic', label: 'off-topic' },
  { id: 'other', label: 'other' },
];

// ── Avatar helpers ────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#4361EE', '#A78BFA', '#2DD4BF', '#F59E0B', '#EF4444',
  '#10B981', '#EC4899', '#3B82F6', '#F97316', '#8B5CF6',
];
const getAvatarColor = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};
const AVATAR_SIZES = { xs: { dim: 20, icon: 10 }, sm: { dim: 28, icon: 13 }, md: { dim: 36, icon: 16 }, lg: { dim: 44, icon: 20 } };

const UserAvatar = ({ name = '', accountType = 'journalist', anonymous = false, size = 'md' }) => {
  const { dim, icon } = AVATAR_SIZES[size] ?? AVATAR_SIZES.md;
  const Icon = anonymous ? EyeOff : (accountType === 'specialist' ? Shield : Pen);
  const bg = anonymous ? '#374151' : getAvatarColor(name);
  return (
    <div
      style={{ width: dim, height: dim, backgroundColor: bg, flexShrink: 0 }}
      className="rounded-full flex items-center justify-center text-white"
    >
      <Icon style={{ width: icon, height: icon }} strokeWidth={2.5} />
    </div>
  );
};

// ── Author display resolution ──────────────────────────────────────
// Returns the values we should actually render for a post or comment.
const resolveAuthor = (item) => {
  if (item?.isAnonymous) {
    return {
      name: 'anonymous',
      type: 'journalist',
      anonymous: true,
      verified: false,
      status: null,
      clickable: false,
    };
  }
  const verified = item?.authorVerificationStatus === 'approved' || item?.isVerified === true;
  const isSpecialist = item?.authorType === 'specialist';
  return {
    name: item?.authorName || 'user',
    type: item?.authorType || 'journalist',
    anonymous: false,
    verified,
    status: isSpecialist ? (item?.authorVerificationStatus || (verified ? 'approved' : 'pending')) : null,
    clickable: !!item?.authorId,
  };
};

const AuthorLine = ({ item, onOpenProfile, className = '' }) => {
  const a = resolveAuthor(item);
  const clickable = a.clickable && onOpenProfile && !a.anonymous;
  const Inner = (
    <>
      <span className="text-xs font-semibold text-ink-soft lowercase">{a.name}</span>
      {a.type === 'specialist' && a.verified && <VerifiedBadge size="xs" />}
      {a.type === 'specialist' && !a.verified && (
        <span className="text-[9px] font-bold tracking-widest uppercase text-smoke bg-paper-soft/80 border border-ink/10 px-1.5 py-0.5 rounded">
          specialist · unverified
        </span>
      )}
      {a.type === 'journalist' && !a.anonymous && (
        <span className="text-[9px] font-bold tracking-widest uppercase text-smoke-dim">journalist</span>
      )}
      {a.anonymous && (
        <span className="text-[9px] font-bold tracking-widest uppercase text-smoke-dim">anonymous</span>
      )}
    </>
  );
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {clickable ? (
        <button onClick={(e) => { e.stopPropagation(); onOpenProfile(item.authorId, a.type); }} className="flex items-center gap-1.5 hover:opacity-75 transition-opacity">
          {Inner}
        </button>
      ) : Inner}
    </div>
  );
};

const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('discussions');
  const [activeCategory, setActiveCategory] = useState('all');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [discussionForm, setDiscussionForm] = useState({ title: '', content: '', category: 'general', isAnonymous: false });
  const [questionForm, setQuestionForm] = useState({ title: '', content: '', category: 'general', isAnonymous: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [followedPosts, setFollowedPosts] = useState(new Set());
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [authorProfile, setAuthorProfile] = useState(null);
  const [sortMode, setSortMode] = useState('newest');
  const [deleteTarget, setDeleteTarget] = useState(null); // {type: 'post'|'comment', id, commentId?}
  const [reportDialog, setReportDialog] = useState(null); // {type, postId, commentId?}
  const [reportReason, setReportReason] = useState('spam');
  const [reportNote, setReportNote] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [selectedComments, setSelectedComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    setFollowedPosts(new Set(user?.followedPosts || []));
  }, [user?.followedPosts, user?.uid]);

  const isQA = activeTab === 'qa';
  const currentTabType = isQA ? 'question' : 'discussion';
  const newPost = isQA ? questionForm : discussionForm;
  const setNewPost = isQA ? setQuestionForm : setDiscussionForm;

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const fetchedPosts = await listCommunityPosts();
        setPosts(fetchedPosts);
      } catch (err) {
        logError('Error fetching posts:', err);
      }
      setLoading(false);
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    const fetchSelectedComments = async () => {
      if (!selectedPost?.id) {
        setSelectedComments([]);
        return;
      }
      setCommentsLoading(true);
      try {
        const comments = await listCommunityComments(selectedPost.id, selectedPost.comments || []);
        setSelectedComments(comments);
      } catch (err) {
        logError('Error fetching comments:', err);
        setSelectedComments(selectedPost.comments || []);
      } finally {
        setCommentsLoading(false);
      }
    };
    fetchSelectedComments();
  }, [selectedPost?.comments, selectedPost?.id]);

  const filteredPosts = (() => {
    const base = posts.filter(post => {
      const matchesType = post.type === currentTabType;
      const matchesCategory = activeCategory === 'all' || post.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        post.title.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q);
      return matchesType && matchesCategory && matchesSearch;
    });

    if (sortMode === 'top') {
      return [...base].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
    if (sortMode === 'unanswered' && isQA) {
      return base.filter((post) => getPostCommentCount(post) === 0);
    }
    return base;
  })();

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
      const authorVerificationStatus = user.accountType === 'specialist'
        ? (user.verificationStatus || 'pending')
        : null;
      const postData = {
        type: currentTabType,
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        authorId: user.uid,
        authorName: anon ? 'anonymous' : (user.username || 'anonymous'),
        authorIcon: anon ? '🕶️' : (user.avatarIcon || '🔒'),
        authorType: user.accountType || 'journalist',
        isVerified: user.verificationStatus === 'approved',
        authorVerificationStatus,
        isAnonymous: anon,
        category: newPost.category,
        createdAt: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        resolved: false,
      };
      const createdPost = await createCommunityPost(postData);
      setPosts(prev => [createdPost, ...prev]);
      setNewPost({ title: '', content: '', category: 'general', isAnonymous: false });
      setShowNewPost(false);
    } catch (err) {
      logError('Error creating post:', err);
      setError('failed to create post.');
    }
    setSubmitting(false);
  };

  const handleLike = async (e, postId) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const alreadyLiked = post.likedBy?.includes(user.uid);

    const updateLikeState = (prev) => {
      const newLikedBy = alreadyLiked
        ? (prev.likedBy || []).filter(uid => uid !== user.uid)
        : [...(prev.likedBy || []), user.uid];
      return { ...prev, likes: newLikedBy.length, likedBy: newLikedBy };
    };

    setPosts(prev => prev.map(p => p.id === postId ? updateLikeState(p) : p));
    if (selectedPost?.id === postId) setSelectedPost(updateLikeState);

    try {
      await updateCommunityPostLike({ postId, alreadyLiked, userId: user.uid });
    } catch (err) {
      logError('Error liking post:', err);
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim() || !selectedPost) return;
    if (!user.emailVerified) {
      setError('verify your email before replying in the community.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const comment = {
        id: `${user.uid}-${Date.now()}`,
        authorId: user.uid,
        authorName: user.username || 'anonymous',
        authorIcon: user.avatarIcon || '🔒',
        authorType: user.accountType || 'journalist',
        isVerified: user.verificationStatus === 'approved',
        authorVerificationStatus: user.accountType === 'specialist' ? (user.verificationStatus || 'pending') : null,
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
        deleted: false,
      };
      await addCommunityComment({
        postId: selectedPost.id,
        comment,
        fallbackCount: getPostCommentCount(selectedPost),
      });
      const nextCount = getPostCommentCount(selectedPost) + 1;
      const updatedPost = {
        ...selectedPost,
        commentCount: nextCount,
        lastCommentAt: comment.createdAt,
      };
      setSelectedComments(prev => [...prev, comment]);
      setSelectedPost(updatedPost);
      setPosts(prev => prev.map(p =>
        p.id === selectedPost.id
          ? { ...p, commentCount: nextCount, lastCommentAt: comment.createdAt }
          : p
      ));
      setNewComment('');
    } catch (err) {
      logError('Error adding comment:', err);
      setError('failed to add comment.');
    }
    setSubmitting(false);
  };

  const handleResolve = async (postId) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post || post.authorId !== user.uid) return;
    try {
      await updateCommunityPost(postId, { resolved: !post.resolved });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, resolved: !p.resolved } : p));
      if (selectedPost?.id === postId) setSelectedPost(prev => ({ ...prev, resolved: !prev.resolved }));
    } catch (err) {
      logError('Error resolving post:', err);
    }
  };

  const handleAcceptAnswer = async (commentId) => {
    if (!selectedPost || selectedPost.authorId !== user?.uid) return;
    const newAccepted = selectedPost.acceptedCommentId === commentId ? null : commentId;
    try {
      await updateCommunityPost(selectedPost.id, {
        acceptedCommentId: newAccepted,
      });
      const updated = { ...selectedPost, acceptedCommentId: newAccepted };
      setSelectedPost(updated);
      setPosts(prev => prev.map(p => p.id === selectedPost.id ? updated : p));
    } catch (err) {
      logError('Error accepting answer:', err);
    }
  };

  const toggleFollow = async (e, postId) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    const isFollowing = followedPosts.has(postId);
    setFollowedPosts(prev => {
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
      setFollowedPosts(prev => {
        const next = new Set(prev);
        if (isFollowing) next.add(postId); else next.delete(postId);
        return next;
      });
    }
  };

  const handleEditPost = async () => {
    if (!selectedPost || !editForm.title.trim() || !editForm.content.trim()) return;
    setSubmitting(true);
    try {
      await updateCommunityPost(selectedPost.id, {
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        edited: true,
        editedAt: new Date().toISOString(),
      });
      const updated = { ...selectedPost, title: editForm.title.trim(), content: editForm.content.trim(), edited: true, editedAt: new Date().toISOString() };
      setSelectedPost(updated);
      setPosts(prev => prev.map(p => p.id === selectedPost.id ? updated : p));
      setEditMode(false);
    } catch (err) {
      logError('Error editing post:', err);
      setError('failed to save edit — check your connection.');
    }
    setSubmitting(false);
  };

  const handleDeletePost = async (postId) => {
    try {
      await deleteCommunityPostWithComments(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      if (selectedPost?.id === postId) setSelectedPost(null);
    } catch (err) {
      logError('Error deleting post:', err);
      setError('failed to delete — check your permissions.');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    const target = selectedComments.find((comment) => comment.id === commentId);
    if (!target || target.authorId !== user?.uid) return;
    try {
      await softDeleteCommunityComment({ postId, commentId });
      setSelectedComments(prev => prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, content: '[deleted]', authorName: 'deleted', authorId: null, deleted: true, authorType: 'journalist', isVerified: false, authorVerificationStatus: null }
          : comment
      ));
    } catch (err) {
      logError('Error deleting comment:', err);
    }
  };

  const submitReport = async () => {
    if (!user || !reportDialog) return;
    if (!user.emailVerified) {
      setError('verify your email before filing community reports.');
      return;
    }
    setReportSubmitting(true);
    try {
      await createCommunityReport({
        postId: reportDialog.postId,
        commentId: reportDialog.commentId ?? null,
        reportedBy: user.uid,
        reason: reportReason,
        note: reportNote.trim(),
        status: 'open',
        createdAt: new Date().toISOString(),
      });
      setReportSuccess(true);
      setTimeout(() => {
        setReportDialog(null);
        setReportSuccess(false);
        setReportReason('spam');
        setReportNote('');
      }, 1500);
    } catch (err) {
      logError('Error filing report:', err);
    }
    setReportSubmitting(false);
  };

  const openProfile = async (uid, type = 'journalist') => {
    if (!uid) return;
    setAuthorProfile({ uid, loading: true, type });
    try {
      const publicData = await getPublicProfile(uid) || {};

      // Journalist or specialist post count + recent posts
      const postsSnap = await getDocs(query(collection(db, COLLECTIONS.COMMUNITY_POSTS), where('authorId', '==', uid)));
      const userPosts = postsSnap.docs.map((entry) => {
        const data = entry.data();
        return { id: entry.id, ...data, commentCount: getPostCommentCount(data) };
      });
      const visiblePosts = userPosts.filter(p => !p.isAnonymous);
      const recentPosts = visiblePosts
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);

      setAuthorProfile({
        uid,
        loading: false,
        type: publicData.accountType || type,
        username: publicData.username || 'user',
        avatarIcon: publicData.avatarIcon || '🔒',
        bio: publicData.specialistProfile?.bio || '',
        specializations: publicData.specialistProfile?.expertiseAreas || [],
        verified: publicData.verificationStatus === 'approved',
        createdAt: publicData.createdAt,
        postCount: visiblePosts.length,
        recentPosts,
        resolvedCount: 0,
        avgRating: null,
        recentFeedback: [],
        supportStatsVisible: false,
      });
    } catch (err) {
      logError('Error loading profile:', err);
      setAuthorProfile(null);
    }
  };

  // ── Modals (rendered once at root) ─────────────────────────────────
  const Modals = () => (
    <>
      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            onClick={() => setDeleteTarget(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <NewsModalCard
              as={motion.div}
              borderColor="rgba(107, 31, 31, 0.2)"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative w-full max-w-sm p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-crimson-500/15 border border-crimson-500/25 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-oxblood" />
                </div>
                <h3 className="text-base font-semibold text-ink lowercase">
                  delete {deleteTarget.type === 'post' ? 'post' : 'comment'}?
                </h3>
              </div>
              <p className="text-sm text-smoke lowercase leading-relaxed mb-4">
                {deleteTarget.type === 'post'
                  ? 'this will permanently remove your post and all replies.'
                  : 'the comment will be replaced with "[deleted]" so the thread stays readable.'}
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 text-smoke hover:text-ink text-xs font-semibold tracking-wide uppercase transition-colors"
                >
                  cancel
                </button>
                <button
                  onClick={async () => {
                    if (deleteTarget.type === 'post') {
                      await handleDeletePost(deleteTarget.id);
                    } else {
                      await handleDeleteComment(deleteTarget.id, deleteTarget.commentId);
                    }
                    setDeleteTarget(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-oxblood hover:bg-oxblood-soft text-ink rounded-lg text-xs font-semibold uppercase tracking-wide transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  delete
                </button>
              </div>
            </NewsModalCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report dialog */}
      <AnimatePresence>
        {reportDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            onClick={() => !reportSubmitting && setReportDialog(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <NewsModalCard
              as={motion.div}
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative w-full max-w-md p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-brass/30 flex items-center justify-center">
                  <Flag className="w-5 h-5 text-brass" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink lowercase">report {reportDialog.type}</h3>
                  <p className="text-[11px] text-smoke lowercase">an admin will review your report</p>
                </div>
              </div>

              {reportSuccess ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="w-10 h-10 text-olive-500 mx-auto mb-2" />
                  <p className="text-sm text-ink lowercase">report filed — thank you</p>
                </div>
              ) : (
                <>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-smoke mb-2">reason</p>
                  <div className="space-y-1.5 mb-4">
                    {REPORT_REASONS.map(r => (
                      <label
                        key={r.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                          reportReason === r.id
                            ? 'bg-amber-500/[0.06] border-brass/30'
                            : 'bg-paper-soft/40 border-ink/8 hover:border-ink/16'
                        }`}
                      >
                        <input
                          type="radio"
                          name="report-reason"
                          value={r.id}
                          checked={reportReason === r.id}
                          onChange={() => setReportReason(r.id)}
                          className="accent-amber-400"
                        />
                        <span className="text-sm text-ink-soft lowercase">{r.label}</span>
                      </label>
                    ))}
                  </div>
                  <NewsTextarea
                    value={reportNote}
                    onChange={e => setReportNote(e.target.value)}
                    rows="2"
                    placeholder="optional: add context..."
                    className="lowercase mb-4"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setReportDialog(null)}
                      disabled={reportSubmitting}
                      className="px-4 py-2 text-smoke hover:text-ink text-xs font-semibold tracking-wide uppercase transition-colors disabled:opacity-50"
                    >
                      cancel
                    </button>
                    <button
                      onClick={submitReport}
                      disabled={reportSubmitting}
                      className="flex items-center gap-1.5 px-4 py-2 btn text-ink rounded-lg text-xs font-semibold uppercase tracking-wide transition-all disabled:opacity-50"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      {reportSubmitting ? 'filing...' : 'file report'}
                    </button>
                  </div>
                </>
              )}
            </NewsModalCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Author profile modal (journalist + specialist) */}
      <AnimatePresence>
        {authorProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            onClick={() => setAuthorProfile(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <NewsModalCard
              as={motion.div}
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-md overflow-hidden max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setAuthorProfile(null)} className="absolute top-4 right-4 text-smoke-dim hover:text-ink transition-colors z-10">
                <X className="w-4 h-4" />
              </button>

              {authorProfile.loading ? (
                <div className="p-10 flex justify-center">
                  <div className="w-5 h-5 border-2 border-midnight-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="px-6 pt-6 pb-4 border-b border-ink/8">
                    <div className="flex items-center gap-3 mb-4">
                      <UserAvatar name={authorProfile.username} accountType={authorProfile.type} size="lg" />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-base font-semibold text-ink lowercase">{authorProfile.username}</span>
                          {authorProfile.type === 'specialist' && authorProfile.verified && <BadgeCheck className="w-4 h-4 text-oxblood" />}
                        </div>
                        <p className="text-[11px] text-smoke lowercase mt-0.5">
                          {authorProfile.type === 'specialist'
                            ? (authorProfile.verified ? 'verified security specialist' : 'specialist (unverified)')
                            : 'journalist'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 flex-wrap">
                      <div>
                        <p className="text-xl font-bold text-ink">{authorProfile.postCount}</p>
                        <p className="text-[10px] text-smoke-dim lowercase">community posts</p>
                      </div>
                      {authorProfile.type === 'specialist' && authorProfile.supportStatsVisible && (
                        <>
                          <div>
                            <p className="text-xl font-bold text-ink">{authorProfile.resolvedCount}</p>
                            <p className="text-[10px] text-smoke-dim lowercase">cases resolved</p>
                          </div>
                          {authorProfile.avgRating && (
                            <div>
                              <p className="text-xl font-bold text-ink flex items-center gap-1">
                                {authorProfile.avgRating}
                                <Star className="w-3.5 h-3.5 text-brass fill-current" />
                              </p>
                              <p className="text-[10px] text-smoke-dim lowercase">avg rating</p>
                            </div>
                          )}
                        </>
                      )}
                      {authorProfile.createdAt && (
                        <div>
                          <p className="text-sm font-semibold text-ink-soft">{new Date(authorProfile.createdAt).toLocaleDateString()}</p>
                          <p className="text-[10px] text-smoke-dim lowercase">joined</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {authorProfile.bio && (
                    <div className="px-6 py-4 border-b border-ink/8">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-smoke-dim mb-2">about</p>
                      <p className="text-sm text-smoke lowercase leading-relaxed">{authorProfile.bio}</p>
                    </div>
                  )}

                  {authorProfile.specializations?.length > 0 && (
                    <div className="px-6 py-4 border-b border-ink/8">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-smoke-dim mb-2">specializations</p>
                      <div className="flex flex-wrap gap-1.5">
                        {authorProfile.specializations.map((s, i) => (
                          <span key={i} className="px-2 py-1 rounded-md bg-midnight-400/10 border border-midnight-400/20 text-[11px] text-midnight-300 lowercase">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {authorProfile.recentPosts?.length > 0 && (
                    <div className="px-6 py-4 border-b border-ink/8">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-smoke-dim mb-2">recent posts</p>
                      <div className="space-y-2">
                        {authorProfile.recentPosts.map(p => (
                          <button
                            key={p.id}
                            onClick={() => { setAuthorProfile(null); setSelectedPost(p); }}
                            className="w-full text-left flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-paper-soft/80 transition-colors"
                          >
                            <span className="text-[10px] font-bold tracking-widest uppercase text-smoke-dim mt-1 flex-shrink-0">
                              {p.type === 'question' ? 'q' : 'd'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-ink-soft lowercase line-clamp-1">{p.title}</p>
                              <p className="text-[10px] text-smoke-dim lowercase">{timeAgo(p.createdAt)}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {authorProfile.type === 'specialist' && authorProfile.recentFeedback?.length > 0 && (
                    <div className="px-6 py-4 border-b border-ink/8">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-smoke-dim mb-3">recent feedback</p>
                      <div className="space-y-3">
                        {authorProfile.recentFeedback.map((r, i) => (
                          <div key={i}>
                            <div className="flex items-center gap-0.5 mb-1">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-3 h-3 ${s <= r.feedback.rating ? 'text-brass fill-current' : 'text-smoke-dim'}`} />
                              ))}
                            </div>
                            <p className="text-xs text-smoke lowercase italic">"{r.feedback.comment}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {authorProfile.type === 'specialist' && authorProfile.verified && (
                    <div className="px-6 py-4">
                      <Link
                        to="/request-support"
                        onClick={() => setAuthorProfile(null)}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-ink hover:bg-ink-soft text-paper rounded-lg text-xs font-semibold uppercase tracking-wide transition-all"
                      >
                        request support from this specialist
                      </Link>
                    </div>
                  )}
                </>
              )}
            </NewsModalCard>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  // ── Post Detail View ──────────────────────────────────────────────
  if (selectedPost) {
    const isQuestion = selectedPost.type === 'question';
    const liked = selectedPost.likedBy?.includes(user?.uid);
    const commentCount = Math.max(getPostCommentCount(selectedPost), selectedComments.length);
    const isAuthor = selectedPost.authorId === user?.uid;

    const orderedComments = (() => {
      const list = [...selectedComments];
      const acceptedId = selectedPost.acceptedCommentId;
      if (!acceptedId) return list;
      const accepted = list.find(c => c.id === acceptedId);
      const rest = list.filter(c => c.id !== acceptedId);
      return accepted ? [accepted, ...rest] : list;
    })();

    return (
      <>
      <NewsPage>
        <div>
          <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
          <div className="min-w-0">

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 mb-5 flex-wrap"
          >
            <button
              onClick={() => { setSelectedPost(null); setError(''); }}
              className="flex items-center gap-1.5 text-smoke hover:text-ink transition-colors text-xs lowercase flex-shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              back
            </button>
            <span className="text-smoke-dim text-xs">·</span>
            {isQuestion && (
              <>
                <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded ${
                  selectedPost.resolved ? 'bg-brass/12 text-brass' : 'bg-oxblood/8 text-oxblood'
                }`}>
                  {selectedPost.resolved ? 'resolved' : 'open'}
                </span>
                <span className="text-smoke-dim text-xs">·</span>
              </>
            )}
            <span className="text-[10px] font-bold tracking-widest uppercase text-smoke-dim">
              {categories.find(c => c.id === selectedPost.category)?.name || selectedPost.category}
            </span>
            <span className="text-smoke-dim text-xs">·</span>
            <span className="text-[10px] text-smoke-dim lowercase">{timeAgo(selectedPost.createdAt)}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`bg-paper-soft border border-ink/12 p-5 mb-4 border-l-4 ${
              isQuestion
                ? selectedPost.resolved ? 'border-l-brass/50' : 'border-l-oxblood/30'
                : 'border-l-ink/20'
            }`}
          >
            {/* Author row */}
            <div className="flex items-center gap-3 mb-4">
              <UserAvatar
                name={selectedPost.authorName}
                accountType={selectedPost.authorType}
                anonymous={selectedPost.isAnonymous}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <AuthorLine item={selectedPost} onOpenProfile={openProfile} />
                <p className="text-[11px] text-smoke-dim lowercase mt-0.5">
                  {selectedPost.isAnonymous
                    ? 'posted anonymously'
                    : (selectedPost.authorType === 'specialist' ? 'security specialist' : 'journalist')}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isAuthor && (
                  <>
                    <button
                      onClick={() => {
                        if (editMode) setEditMode(false);
                        else { setEditMode(true); setEditForm({ title: selectedPost.title, content: selectedPost.content }); }
                      }}
                      className="flex items-center gap-1 text-[11px] text-smoke-dim hover:text-ink transition-colors lowercase"
                    >
                      {editMode ? <X className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                      {editMode ? 'cancel' : 'edit'}
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: 'post', id: selectedPost.id })}
                      className="flex items-center gap-1 text-[11px] text-smoke-dim hover:text-oxblood transition-colors lowercase"
                    >
                      <Trash2 className="w-3 h-3" />
                      delete
                    </button>
                  </>
                )}
                {!isAuthor && user && (
                  <button
                    onClick={() => { setReportDialog({ type: 'post', postId: selectedPost.id }); setReportReason('spam'); setReportNote(''); }}
                    className="flex items-center gap-1 text-[11px] text-smoke-dim hover:text-brass transition-colors lowercase"
                  >
                    <Flag className="w-3 h-3" />
                    report
                  </button>
                )}
              </div>
            </div>

            {editMode ? (
              <>
                <input
                  value={editForm.title}
                  onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-0 py-2 bg-transparent border-b border-ink/10 text-ink text-xl font-display font-bold placeholder-smoke focus:outline-none focus:border-ink/40 transition-colors mb-3"
                />
                <textarea
                  value={editForm.content}
                  onChange={e => setEditForm(p => ({ ...p, content: e.target.value }))}
                  rows="4"
                  className="w-full px-0 py-2 bg-transparent text-sm text-ink-soft placeholder-smoke focus:outline-none transition-colors resize-none leading-relaxed mb-3"
                />
                <div className="flex items-start gap-2 px-3 py-2.5 mb-4 rounded-lg bg-amber-500/[0.08] border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-brass/80 lowercase leading-relaxed">
                    once saved, an "edited" label will be visible to all community members.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleEditPost}
                    disabled={submitting || !editForm.title.trim() || !editForm.content.trim()}
                    className="px-4 py-1.5 btn disabled:opacity-40 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all"
                  >
                    {submitting ? 'saving...' : 'save'}
                  </button>
                  <button onClick={() => setEditMode(false)} className="px-4 py-1.5 text-smoke hover:text-ink text-xs font-semibold uppercase tracking-wide transition-colors">
                    cancel
                  </button>
                </div>
                {error && <p className="text-xs text-oxblood mt-2 lowercase">{error}</p>}
              </>
            ) : (
              <>
                <h1 className="text-xl font-display font-bold mb-3 leading-snug text-ink">
                  {selectedPost.title}
                  {selectedPost.edited && (
                    <span className="ml-2 text-[10px] font-normal text-smoke-dim lowercase align-middle">(edited)</span>
                  )}
                </h1>
                <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-wrap mb-4">
                  {selectedPost.content}
                </p>
              </>
            )}

            <div className="flex items-center gap-4 pt-3 border-t border-ink/8">
              <button
                onClick={(e) => handleLike(e, selectedPost.id)}
                className={`flex items-center gap-1.5 text-xs transition-colors lowercase ${
                  liked ? 'text-oxblood' : 'text-smoke hover:text-oxblood'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                {selectedPost.likes || 0}
              </button>
              <span className="flex items-center gap-1.5 text-xs text-smoke lowercase">
                <MessageSquare className="w-3.5 h-3.5" />
                {commentCount} {commentCount === 1 ? 'reply' : 'replies'}
              </span>
              <button
                onClick={(e) => toggleFollow(e, selectedPost.id)}
                className={`flex items-center gap-1.5 text-xs transition-colors lowercase ${
                  followedPosts.has(selectedPost.id) ? 'text-brass' : 'text-smoke hover:text-brass'
                }`}
              >
                {followedPosts.has(selectedPost.id)
                  ? <BookmarkCheck className="w-3.5 h-3.5" />
                  : <Bookmark className="w-3.5 h-3.5" />
                }
                {followedPosts.has(selectedPost.id) ? 'following' : 'follow'}
              </button>
              {isQuestion && isAuthor && (
                <button
                  onClick={() => handleResolve(selectedPost.id)}
                  className={`flex items-center gap-1.5 text-xs transition-colors lowercase ml-auto ${
                    selectedPost.resolved ? 'text-olive-400' : 'text-smoke hover:text-olive-400'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {selectedPost.resolved ? 'resolved' : 'mark resolved'}
                </button>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            {user ? (
              <NewsPanel className="p-4 mb-4">
                <div className="flex gap-3 items-start">
                  <UserAvatar name={user.username || ''} accountType={user.accountType} size="sm" />
                  <div className="flex-1 min-w-0">
                    <NewsTextarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={isQuestion ? 'write your answer...' : 'add a reply...'}
                      rows="2"
                      className="leading-relaxed"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || submitting}
                        className="flex items-center gap-1.5 px-3 py-1.5 btn disabled:opacity-40 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all"
                      >
                        <Send className="w-3 h-3" />
                        {submitting ? '...' : isQuestion ? 'answer' : 'reply'}
                      </button>
                    </div>
                  </div>
                </div>
                {error && <p className="text-xs text-oxblood mt-2 lowercase">{error}</p>}
              </NewsPanel>
            ) : (
              <NewsPanel muted className="flex items-center justify-between gap-4 px-5 py-3.5 mb-4 rounded-xl">
                <p className="text-xs text-smoke lowercase">log in to join the conversation</p>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-1.5 bg-ink hover:bg-ink-soft text-paper rounded-lg text-xs font-semibold tracking-wide uppercase transition-all flex-shrink-0"
                >
                  log in
                </button>
              </NewsPanel>
            )}

            {commentCount > 0 && (
              <p className="text-[10px] font-bold tracking-widest uppercase text-smoke-dim mb-3 px-1">
                {commentCount} {commentCount === 1 ? 'reply' : 'replies'}
              </p>
            )}

            <div className="space-y-2">
              {commentsLoading && (
                <div className="flex justify-center py-2">
                  <div className="w-4 h-4 border-2 border-midnight-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {orderedComments.map((comment) => {
                const isAccepted = selectedPost.acceptedCommentId && comment.id === selectedPost.acceptedCommentId;
                const canAccept = isQuestion && isAuthor && !comment.deleted;
                const canDelete = user && comment.authorId === user.uid && !comment.deleted;
                const canReport = user && comment.authorId && comment.authorId !== user.uid && !comment.deleted;
                return (
                  <div
                    key={comment.id ?? comment.createdAt ?? comment.content}
                    className={`bg-paper-soft border border-ink/12 px-4 py-3 border-l-4 ${
                      isAccepted ? 'border-l-olive-500' : 'border-l-ink/10'
                    }`}
                  >
                    {isAccepted && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-olive-500" />
                        <span className="text-[10px] font-bold tracking-widest uppercase text-olive-400">accepted answer</span>
                      </div>
                    )}
                    <div className="flex gap-3 items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        <UserAvatar
                          name={comment.authorName}
                          accountType={comment.authorType}
                          anonymous={comment.deleted}
                          size="sm"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          {comment.deleted ? (
                            <span className="text-xs font-semibold text-smoke-dim lowercase italic">deleted</span>
                          ) : (
                            <AuthorLine item={comment} onOpenProfile={openProfile} />
                          )}
                          <span className="text-[10px] text-smoke-dim lowercase ml-auto">{timeAgo(comment.createdAt)}</span>
                        </div>
                        <p className={`text-sm leading-relaxed ${comment.deleted ? 'text-smoke-dim italic' : 'text-smoke'}`}>
                          {comment.content}
                        </p>
                        {(canAccept || canDelete || canReport) && (
                          <div className="flex items-center gap-3 mt-2">
                            {canAccept && (
                              <button
                                onClick={() => handleAcceptAnswer(comment.id)}
                                className={`flex items-center gap-1 text-[11px] transition-colors lowercase ${
                                  isAccepted ? 'text-olive-400' : 'text-smoke-dim hover:text-olive-400'
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                {isAccepted ? 'unmark answer' : 'mark as answer'}
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => setDeleteTarget({ type: 'comment', id: selectedPost.id, commentId: comment.id })}
                                className="flex items-center gap-1 text-[11px] text-smoke-dim hover:text-oxblood transition-colors lowercase"
                              >
                                <Trash2 className="w-3 h-3" />
                                delete
                              </button>
                            )}
                            {canReport && (
                              <button
                                onClick={() => { setReportDialog({ type: 'comment', postId: selectedPost.id, commentId: comment.id }); setReportReason('spam'); setReportNote(''); }}
                                className="flex items-center gap-1 text-[11px] text-smoke-dim hover:text-brass transition-colors lowercase"
                              >
                                <Flag className="w-3 h-3" />
                                report
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {commentCount === 0 && (
                <p className="text-center text-smoke-dim text-xs lowercase py-6">
                  no {isQuestion ? 'answers' : 'replies'} yet — be the first
                </p>
              )}
            </div>
          </motion.div>

          </div>

          <div className="hidden lg:block">
            <div className="lg:sticky lg:top-32 space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSearchQuery(sidebarSearch);
                  setSelectedPost(null);
                }}
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-smoke-dim pointer-events-none" />
                  <NewsInput
                    type="text"
                    value={sidebarSearch}
                    onChange={e => setSidebarSearch(e.target.value)}
                    placeholder="search discussions..."
                    className="pl-9 pr-4 py-2.5 rounded-xl lowercase"
                  />
                </div>
              </form>
              <NewsSidebar />
            </div>
          </div>

          </div>

          <div className="lg:hidden mt-10">
            <NewsSidebar />
          </div>

        </div>
      </NewsPage>

      <Modals />
      </>
    );
  }

  // ── Main Feed View ────────────────────────────────────────────────
  return (
    <NewsPage>
      <div>
        <motion.header
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-baseline justify-between pb-3">
            <span className="eyebrow sm text-oxblood">The newsroom board</span>
            <span className="eyebrow sm">{!loading && `${posts.length} posts`}</span>
          </div>
          <NewsRule />
          <div className="mt-8 max-w-prose">
            <h1 className="display text-4xl md:text-6xl leading-none">
              Letters to <em className="italic-ox">the editor.</em>
            </h1>
            <p className="mt-4 text-base md:text-lg text-ink-soft leading-relaxed">
              Security discussions and expert answers for journalists.
            </p>
          </div>

          {/* Editorial tab strip */}
          <div className="flex border-b border-ink/14 mt-8 mb-0">
            {[
              { id: 'discussions', label: 'Discussions', type: 'discussion' },
              { id: 'qa',          label: 'Q&A',          type: 'question'  },
            ].map((tab, i) => {
              const active = activeTab === tab.id;
              const count = posts.filter(p => p.type === tab.type).length;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setActiveCategory('all'); setShowNewPost(false); setSearchQuery(''); setSortMode('newest'); }}
                  className={`relative px-4 py-3 font-mono uppercase text-[11px] tracking-[0.16em] transition-colors mr-1 ${i === 0 ? 'pl-0' : ''} ${active ? 'text-ink' : 'text-smoke hover:text-ink-soft'}`}
                >
                  {tab.label}
                  {!loading && count > 0 && <span className="ml-1.5 eyebrow text-[9px] normal-case">{count}</span>}
                  {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink" />}
                </button>
              );
            })}
          </div>
        </motion.header>

        {/* Search + new post + category pills */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-3 mb-6"
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-smoke-dim pointer-events-none" />
              <NewsInput
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`search ${isQA ? 'questions' : 'discussions'}...`}
                className="pl-9 pr-4 py-2 lowercase"
              />
            </div>
            <button
              onClick={() => {
                if (!user) { navigate('/login'); return; }
                setShowNewPost(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-ink hover:bg-ink-soft text-paper rounded-lg text-xs font-semibold tracking-wide uppercase transition-all flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              {isQA ? 'ask' : 'post'}
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map((cat) => {
              const CatIcon = cat.icon;
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all lowercase border ${
                    active
                      ? 'bg-ink/8 border-ink/20 text-ink'
                      : 'border-transparent text-smoke-dim hover:text-ink-soft hover:bg-paper-soft/80'
                  }`}
                >
                  {CatIcon && <CatIcon className="w-3 h-3" />}
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold tracking-widest uppercase text-smoke-dim mr-1">sort</span>
            {[
              { id: 'newest', label: 'newest', icon: Clock },
              { id: 'top', label: 'top', icon: ArrowUp },
              ...(isQA ? [{ id: 'unanswered', label: 'unanswered', icon: HelpCircle }] : []),
            ].map(opt => {
              const OptIcon = opt.icon;
              const active = sortMode === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSortMode(opt.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all lowercase border ${
                    active
                      ? 'bg-paper-soft border-ink/20 text-ink'
                      : 'border-transparent text-smoke-dim hover:text-ink-soft hover:bg-paper-soft/60'
                  }`}
                >
                  <OptIcon className="w-3 h-3" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* New Post Form */}
        <AnimatePresence>
          {showNewPost && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <NewsPanel as="form" onSubmit={handleCreatePost} className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[10px] font-bold tracking-widest uppercase text-smoke">
                    {isQA ? 'ask a question' : 'new discussion'}
                  </h3>
                  <button type="button" onClick={() => { setShowNewPost(false); setError(''); }}
                    className="text-smoke-dim hover:text-ink transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={isQA ? 'your question...' : 'title...'}
                  required
                  className="w-full px-0 py-3 bg-transparent border-b border-ink/10 text-ink text-lg font-display font-bold placeholder-smoke focus:outline-none focus:border-ink/40 transition-colors mb-4"
                />

                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={isQA ? 'add context to your question...' : 'share your experience or thoughts...'}
                  required
                  rows="4"
                  className="w-full px-0 py-2 bg-transparent text-ink text-sm placeholder-smoke focus:outline-none transition-colors resize-none leading-relaxed"
                />

                {error && <p className="text-xs text-oxblood mb-3 lowercase">{error}</p>}

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-ink/8 flex-wrap">
                  <NewsSelect
                    value={newPost.category}
                    onChange={(e) => setNewPost(prev => ({ ...prev, category: e.target.value }))}
                    className="w-auto px-3 py-1.5 text-xs lowercase"
                  >
                    {categories.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id} className="bg-dark-900">{cat.name}</option>
                    ))}
                  </NewsSelect>

                  {!isQA && (
                    <label className="flex items-center gap-2 text-xs text-smoke lowercase cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!newPost.isAnonymous}
                        onChange={(e) => setNewPost(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                        className="accent-ink"
                      />
                      <EyeOff className="w-3.5 h-3.5" />
                      post anonymously
                    </label>
                  )}

                  <div className="flex-1" />
                  <button type="button" onClick={() => { setShowNewPost(false); setError(''); }}
                    className="px-4 py-2 text-smoke hover:text-ink text-xs font-semibold tracking-wide uppercase transition-colors">
                    cancel
                  </button>
                  <button type="submit" disabled={submitting || !newPost.title.trim() || !newPost.content.trim()}
                    className="flex items-center gap-2 px-5 py-2 btn disabled:opacity-40 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all">
                    <Send className="w-3.5 h-3.5" />
                    {submitting ? 'posting...' : isQA ? 'ask' : 'post'}
                  </button>
                </div>

                {!isQA && newPost.isAnonymous && (
                  <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-purple-500/[0.06] border border-ink/20">
                    <EyeOff className="w-3.5 h-3.5 text-oxblood flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-smoke lowercase leading-relaxed">
                      your username and avatar will be hidden from the community. you can still delete this post later.
                    </p>
                  </div>
                )}
              </NewsPanel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Two-Column Layout: Posts + News Sidebar */}
        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
        <div className="min-w-0">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-6 h-6 border-2 border-midnight-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-smoke-dim text-[10px] tracking-widest uppercase">loading</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-2xl bg-paper-soft/60 border border-ink/8 flex items-center justify-center mx-auto mb-4">
                {searchQuery.trim() ? <Search className="w-5 h-5 text-smoke-dim" /> : isQA ? <HelpCircle className="w-5 h-5 text-smoke-dim" /> : <MessageSquare className="w-5 h-5 text-smoke-dim" />}
              </div>
              <p className="text-smoke text-sm lowercase mb-1">
                {sortMode === 'unanswered'
                  ? 'no unanswered questions'
                  : searchQuery.trim()
                    ? `no results for "${searchQuery.trim()}"`
                    : activeCategory !== 'all' ? 'nothing here yet' : `no ${isQA ? 'questions' : 'discussions'} yet`}
              </p>
              <p className="text-smoke-dim text-xs lowercase">
                {searchQuery.trim()
                  ? 'try different keywords or clear the search'
                  : `be the first to ${isQA ? 'ask something' : 'start a conversation'}`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map((post) => {
                const liked = post.likedBy?.includes(user?.uid);
                const categoryName = categories.find(c => c.id === post.category)?.name;

                if (isQA) {
                  return (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className={`group relative border border-l-4 rounded-xl p-5 cursor-pointer transition-all hover:bg-paper-soft/60 ${
                        post.resolved
                          ? 'border-olive-500/20 border-l-brass/50 bg-olive-500/[0.02]'
                          : 'border-ink/10 border-l-oxblood/30'
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-1 pt-0.5 min-w-[48px]">
                          <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded ${
                            post.resolved
                              ? 'bg-brass/12 text-brass'
                              : 'bg-oxblood/8 text-oxblood'
                          }`}>
                            {post.resolved ? '✓' : '?'}
                          </span>
                          <span className="text-sm text-smoke mt-1 font-semibold">{getPostCommentCount(post)}</span>
                          <span className="text-[10px] text-smoke-dim lowercase">
                            {getPostCommentCount(post) === 1 ? 'answer' : 'answers'}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-ink mb-1.5 group-hover:text-oxblood transition-colors leading-snug">
                            {post.title}
                            {post.edited && <span className="ml-2 text-[10px] font-normal text-smoke-dim align-middle">(edited)</span>}
                          </h3>
                          <p className="text-sm text-smoke line-clamp-2 mb-4 leading-relaxed">
                            {post.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-smoke lowercase flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <UserAvatar name={post.authorName} accountType={post.authorType} anonymous={post.isAnonymous} size="xs" />
                              <AuthorLine item={post} onOpenProfile={openProfile} />
                            </div>
                            <span>{timeAgo(post.createdAt)}</span>
                            <span>{categoryName}</span>
                            <button onClick={(e) => handleLike(e, post.id)}
                              className={`flex items-center gap-1.5 ml-auto transition-colors ${liked ? 'text-oxblood' : 'hover:text-oxblood'}`}>
                              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                              {post.likes || 0}
                            </button>
                            <button
                              onClick={(e) => toggleFollow(e, post.id)}
                              className={`flex items-center gap-1.5 transition-colors ${
                                followedPosts.has(post.id) ? 'text-brass' : 'hover:text-brass'
                              }`}
                            >
                              {followedPosts.has(post.id)
                                ? <BookmarkCheck className="w-3.5 h-3.5" />
                                : <Bookmark className="w-3.5 h-3.5" />
                              }
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="group border border-l-4 border-ink/10 border-l-ink/20 rounded-xl p-5 cursor-pointer transition-all hover:bg-paper-soft/60 hover:border-ink/16"
                  >
                    <div className="flex items-start gap-3.5">
                      <UserAvatar name={post.authorName} accountType={post.authorType} anonymous={post.isAnonymous} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <AuthorLine item={post} onOpenProfile={openProfile} />
                          <span className="text-[10px] text-smoke-dim">·</span>
                          <span className="text-xs text-smoke-dim lowercase">{timeAgo(post.createdAt)}</span>
                          <span className="text-[10px] font-bold tracking-widest uppercase text-smoke-dim ml-auto">
                            {categoryName}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-ink mb-1.5 group-hover:text-oxblood transition-colors leading-snug">
                          {post.title}
                          {post.edited && <span className="ml-2 text-[10px] font-normal text-smoke-dim align-middle">(edited)</span>}
                        </h3>
                        <p className="text-sm text-smoke line-clamp-2 leading-relaxed mb-4">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-4 pt-3 border-t border-ink/8">
                          <button onClick={(e) => handleLike(e, post.id)}
                            className={`flex items-center gap-1.5 text-xs transition-colors lowercase ${liked ? 'text-oxblood' : 'text-smoke hover:text-oxblood'}`}>
                            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                            {post.likes || 0}
                          </button>
                          <span className="flex items-center gap-1.5 text-xs text-smoke lowercase">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {getPostCommentCount(post)}
                          </span>
                          <button
                            onClick={(e) => toggleFollow(e, post.id)}
                            className={`flex items-center gap-1.5 text-xs transition-colors lowercase ml-auto ${
                              followedPosts.has(post.id) ? 'text-brass' : 'text-smoke hover:text-brass'
                            }`}
                          >
                            {followedPosts.has(post.id)
                              ? <BookmarkCheck className="w-3.5 h-3.5" />
                              : <Bookmark className="w-3.5 h-3.5" />
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 pt-8 border-t border-ink/8"
          >
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-smoke-dim flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] tracking-widest uppercase font-bold text-smoke-dim mb-2">
                  community guidelines
                </p>
                <p className="text-xs text-smoke-dim lowercase leading-relaxed">
                  never share identifying details of sources · keep discussions focused on security · be respectful · report suspicious activity
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="hidden lg:block">
          <NewsSidebar />
        </div>
        </div>

        <div className="lg:hidden mt-10">
          <NewsSidebar />
        </div>
      </div>

      <Modals />
    </NewsPage>
  );
};

export default Community;
