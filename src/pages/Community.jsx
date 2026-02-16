import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MessageSquare, HelpCircle, Heart, Send,
  Plus, ArrowLeft, CheckCircle2, X, Search,
  Shield, Smartphone, Lock, Radio, Scale,
  Newspaper, ExternalLink, AlertTriangle, Bookmark, BookmarkCheck,
  Pencil, Star, BadgeCheck
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  collection, addDoc, getDocs, getDoc, doc, updateDoc,
  arrayUnion, arrayRemove, increment, query, where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import VerifiedBadge from '../components/VerifiedBadge';

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
const AVATAR_SIZES = { xs: [20, 9], sm: [28, 11], md: [36, 14], lg: [44, 18] };
const UserAvatar = ({ name = '', size = 'md' }) => {
  const [dim, fs] = AVATAR_SIZES[size] ?? AVATAR_SIZES.md;
  return (
    <div
      style={{ width: dim, height: dim, backgroundColor: getAvatarColor(name), fontSize: fs, flexShrink: 0 }}
      className="rounded-full flex items-center justify-center font-bold text-white select-none"
    >
      {(name.charAt(0) || '?').toUpperCase()}
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
  const [discussionForm, setDiscussionForm] = useState({ title: '', content: '', category: 'general' });
  const [questionForm, setQuestionForm] = useState({ title: '', content: '', category: 'general' });
  const [newsArticles, setNewsArticles] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [followedPosts,     setFollowedPosts]     = useState(new Set());
  const [editMode,          setEditMode]          = useState(false);
  const [editForm,          setEditForm]          = useState({ title: '', content: '' });
  const [specialistProfile, setSpecialistProfile] = useState(null);
  const [profileLoading,    setProfileLoading]    = useState(false);

  useEffect(() => {
    setFollowedPosts(new Set(user?.followedPosts || []));
  }, [user?.uid]);

  const isQA = activeTab === 'qa';
  const currentTabType = isQA ? 'question' : 'discussion';
  const newPost = isQA ? questionForm : discussionForm;
  const setNewPost = isQA ? setQuestionForm : setDiscussionForm;

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'community-posts'));
        const fetchedPosts = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPosts(fetchedPosts);
      } catch (err) {
        console.error('Error fetching posts:', err);
      }
      setLoading(false);
    };
    fetchPosts();
  }, []);

  // Fetch cybersecurity news from RSS feeds
  useEffect(() => {
    const fetchNews = async () => {
      setNewsLoading(true);
      try {
        const feeds = [
          'https://api.rss2json.com/v1/api.json?rss_url=https://thehackernews.com/feeds/posts/default',
          'https://api.rss2json.com/v1/api.json?rss_url=https://www.bleepingcomputer.com/feed/'
        ];
        const results = await Promise.allSettled(feeds.map(url => fetch(url).then(r => r.json())));
        const articles = results
          .filter(r => r.status === 'fulfilled' && r.value.status === 'ok')
          .flatMap(r => r.value.items.map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            source: r.value.feed?.title?.includes('Hacker') ? 'The Hacker News' : 'BleepingComputer'
          })))
          .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
          .slice(0, 8);
        setNewsArticles(articles);
      } catch (err) {
        console.error('Error fetching news:', err);
      }
      setNewsLoading(false);
    };
    fetchNews();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesType = post.type === currentTabType;
    const matchesCategory = activeCategory === 'all' || post.category === activeCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      post.title.toLowerCase().includes(q) ||
      post.content.toLowerCase().includes(q);
    return matchesType && matchesCategory && matchesSearch;
  });

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!user || !newPost.title.trim() || !newPost.content.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const postData = {
        type: currentTabType,
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        authorId: user.uid,
        authorName: user.username || 'anonymous',
        authorIcon: user.avatarIcon || '🔒',
        authorType: user.accountType || 'journalist',
        isVerified: user.verificationStatus === 'approved',
        category: newPost.category,
        createdAt: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        comments: [],
        resolved: false
      };
      const docRef = await addDoc(collection(db, 'community-posts'), postData);
      setPosts(prev => [{ id: docRef.id, ...postData }, ...prev]);
      setNewPost({ title: '', content: '', category: 'general' });
      setShowNewPost(false);
    } catch (err) {
      console.error('Error creating post:', err);
      setError('failed to post — check your firestore rules allow writes for authenticated users.');
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
      const postRef = doc(db, 'community-posts', postId);
      await updateDoc(postRef, alreadyLiked
        ? { likes: increment(-1), likedBy: arrayRemove(user.uid) }
        : { likes: increment(1), likedBy: arrayUnion(user.uid) }
      );
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim() || !selectedPost) return;
    setSubmitting(true);
    setError('');
    try {
      const comment = {
        authorId: user.uid,
        authorName: user.username || 'anonymous',
        authorIcon: user.avatarIcon || '🔒',
        authorType: user.accountType || 'journalist',
        isVerified: user.verificationStatus === 'approved',
        content: newComment.trim(),
        createdAt: new Date().toISOString()
      };
      const postRef = doc(db, 'community-posts', selectedPost.id);
      await updateDoc(postRef, { comments: arrayUnion(comment) });
      const updatedPost = { ...selectedPost, comments: [...(selectedPost.comments || []), comment] };
      setSelectedPost(updatedPost);
      setPosts(prev => prev.map(p => p.id === selectedPost.id ? updatedPost : p));
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('failed to add comment.');
    }
    setSubmitting(false);
  };

  const handleResolve = async (postId) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post || post.authorId !== user.uid) return;
    try {
      const postRef = doc(db, 'community-posts', postId);
      await updateDoc(postRef, { resolved: !post.resolved });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, resolved: !p.resolved } : p));
      if (selectedPost?.id === postId) setSelectedPost(prev => ({ ...prev, resolved: !prev.resolved }));
    } catch (err) {
      console.error('Error resolving post:', err);
    }
  };

  const toggleFollow = async (e, postId) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    const isFollowing = followedPosts.has(postId);
    setFollowedPosts(prev => {
      const next = new Set(prev);
      isFollowing ? next.delete(postId) : next.add(postId);
      return next;
    });
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        followedPosts: isFollowing ? arrayRemove(postId) : arrayUnion(postId),
      });
    } catch (err) {
      console.error('Error toggling follow:', err);
      setFollowedPosts(prev => {
        const next = new Set(prev);
        isFollowing ? next.add(postId) : next.delete(postId);
        return next;
      });
    }
  };

  const handleEditPost = async () => {
    if (!selectedPost || !editForm.title.trim() || !editForm.content.trim()) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'community-posts', selectedPost.id), {
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
      console.error('Error editing post:', err);
      setError('failed to save edit — check your connection.');
    }
    setSubmitting(false);
  };

  const openProfile = async (uid) => {
    if (!uid) return;
    setSpecialistProfile({ uid, loading: true });
    setProfileLoading(true);
    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      const userData = userSnap.data() || {};
      const reqSnap = await getDocs(
        query(collection(db, 'support-requests'), where('claimedBy', '==', uid), where('status', '==', 'resolved'))
      );
      const resolvedReqs = reqSnap.docs.map(d => d.data());
      const ratings = resolvedReqs.filter(r => r.feedback?.rating).map(r => r.feedback.rating);
      const avgRating = ratings.length ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1) : null;
      const recentFeedback = resolvedReqs.filter(r => r.feedback?.comment).slice(-3).reverse();
      setSpecialistProfile({
        uid,
        loading: false,
        username: userData.username || 'specialist',
        avatarIcon: userData.avatarIcon || '🔒',
        bio: userData.bio || '',
        specializations: userData.specializations || [],
        resolvedCount: resolvedReqs.length,
        avgRating,
        recentFeedback,
      });
    } catch (err) {
      console.error('Error loading profile:', err);
      setSpecialistProfile(null);
    }
    setProfileLoading(false);
  };

  const timeAgo = (dateString) => {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateString).toLocaleDateString();
  };

  // ── News Sidebar Component ────────────────────────────────────────
  const NewsSidebar = () => (
    <motion.aside
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="lg:sticky lg:top-32"
    >
      <div className="border border-white/[0.08] rounded-2xl p-5 bg-white/[0.02]">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-crimson-500/10 border border-crimson-500/20 flex items-center justify-center">
            <Newspaper className="w-3.5 h-3.5 text-crimson-400" />
          </div>
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
            latest threats
          </h3>
        </div>

        {newsLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-3 bg-white/[0.05] rounded w-full mb-2" />
                <div className="h-3 bg-white/[0.05] rounded w-3/4 mb-1.5" />
                <div className="h-2 bg-white/[0.03] rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : newsArticles.length === 0 ? (
          <div className="text-center py-6">
            <AlertTriangle className="w-5 h-5 text-gray-700 mx-auto mb-2" />
            <p className="text-xs text-gray-600 lowercase">couldn't load news feed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {newsArticles.map((article, i) => (
              <a
                key={i}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <p className="text-[13px] text-gray-300 leading-snug lowercase group-hover:text-white transition-colors mb-1.5 line-clamp-2">
                  {article.title}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-gray-600">
                  <span className="lowercase">{article.source}</span>
                  <span>·</span>
                  <span className="lowercase">{timeAgo(article.pubDate)}</span>
                  <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-gray-500" />
                </div>
              </a>
            ))}
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-white/[0.06]">
          <p className="text-[10px] text-gray-700 lowercase leading-relaxed">
            powered by the hacker news & bleepingcomputer rss feeds
          </p>
        </div>
      </div>
    </motion.aside>
  );

  // ── Post Detail View ──────────────────────────────────────────────
  if (selectedPost) {
    const isQuestion = selectedPost.type === 'question';
    const liked = selectedPost.likedBy?.includes(user?.uid);
    const commentCount = selectedPost.comments?.length || 0;
    return (
      <>
      <div className="min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">

          {/* ── Main column ── */}
          <div className="min-w-0">

          {/* Nav row: back + meta */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 mb-5"
          >
            <button
              onClick={() => { setSelectedPost(null); setError(''); }}
              className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-xs lowercase flex-shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              back
            </button>
            <span className="text-gray-700 text-xs">·</span>
            {isQuestion && (
              <>
                <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded ${
                  selectedPost.resolved ? 'bg-olive-500/15 text-olive-400' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {selectedPost.resolved ? 'resolved' : 'open'}
                </span>
                <span className="text-gray-700 text-xs">·</span>
              </>
            )}
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-600">
              {categories.find(c => c.id === selectedPost.category)?.name || selectedPost.category}
            </span>
            <span className="text-gray-700 text-xs">·</span>
            <span className="text-[10px] text-gray-600 lowercase">{timeAgo(selectedPost.createdAt)}</span>
          </motion.div>

          {/* Post card */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`glass-card p-5 mb-4 border-l-4 ${
              isQuestion
                ? selectedPost.resolved ? 'border-l-olive-500/50' : 'border-l-amber-500/40'
                : 'border-l-purple-500/30'
            }`}
          >
            {/* Author row */}
            <div className="flex items-center gap-2 mb-3">
              {selectedPost.isVerified ? (
                <button
                  onClick={() => openProfile(selectedPost.authorId)}
                  className="flex items-center gap-2 hover:opacity-75 transition-opacity"
                >
                  <UserAvatar name={selectedPost.authorName} size="lg" />
                  <span className="text-xs font-semibold text-gray-300 lowercase">{selectedPost.authorName}</span>
                  <VerifiedBadge size="xs" />
                </button>
              ) : (
                <>
                  <UserAvatar name={selectedPost.authorName} size="lg" />
                  <span className="text-xs font-semibold text-gray-300 lowercase">{selectedPost.authorName}</span>
                </>
              )}
              {selectedPost.authorId === user?.uid && (
                <button
                  onClick={() => {
                    if (editMode) { setEditMode(false); }
                    else { setEditMode(true); setEditForm({ title: selectedPost.title, content: selectedPost.content }); }
                  }}
                  className="ml-auto flex items-center gap-1 text-[11px] text-gray-600 hover:text-white transition-colors lowercase"
                >
                  {editMode ? <X className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                  {editMode ? 'cancel' : 'edit'}
                </button>
              )}
            </div>

            {editMode ? (
              <>
                {/* Edit form */}
                <input
                  value={editForm.title}
                  onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-0 py-2 bg-transparent border-b border-white/[0.08] text-white text-xl font-display font-bold placeholder-gray-700 focus:outline-none focus:border-midnight-400/50 transition-colors mb-3"
                />
                <textarea
                  value={editForm.content}
                  onChange={e => setEditForm(p => ({ ...p, content: e.target.value }))}
                  rows="4"
                  className="w-full px-0 py-2 bg-transparent text-sm text-gray-300 placeholder-gray-700 focus:outline-none transition-colors resize-none leading-relaxed mb-3"
                />
                {/* Edit disclaimer */}
                <div className="flex items-start gap-2 px-3 py-2.5 mb-4 rounded-lg bg-amber-500/[0.08] border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-400/80 lowercase leading-relaxed">
                    once saved, an "edited" label will be visible to all community members. edit history is not publicly shown, but may be reviewed by admins.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleEditPost}
                    disabled={submitting || !editForm.title.trim() || !editForm.content.trim()}
                    className="px-4 py-1.5 bg-midnight-400 hover:bg-midnight-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold uppercase tracking-wide transition-all"
                  >
                    {submitting ? 'saving...' : 'save'}
                  </button>
                  <button onClick={() => setEditMode(false)} className="px-4 py-1.5 text-gray-500 hover:text-white text-xs font-semibold uppercase tracking-wide transition-colors">
                    cancel
                  </button>
                </div>
                {error && <p className="text-xs text-crimson-400 mt-2 lowercase">{error}</p>}
              </>
            ) : (
              <>
                {/* Title */}
                <h1 className="text-xl font-display font-bold mb-3 leading-snug text-white">
                  {selectedPost.title}
                  {selectedPost.edited && (
                    <span className="ml-2 text-[10px] font-normal text-gray-600 lowercase align-middle">(edited)</span>
                  )}
                </h1>
                {/* Body */}
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">
                  {selectedPost.content}
                </p>
              </>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-3 border-t border-white/[0.06]">
              <button
                onClick={(e) => handleLike(e, selectedPost.id)}
                className={`flex items-center gap-1.5 text-xs transition-colors lowercase ${
                  liked ? 'text-crimson-400' : 'text-gray-500 hover:text-crimson-400'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                {selectedPost.likes || 0}
              </button>
              <span className="flex items-center gap-1.5 text-xs text-gray-500 lowercase">
                <MessageSquare className="w-3.5 h-3.5" />
                {commentCount} {commentCount === 1 ? 'reply' : 'replies'}
              </span>
              <button
                onClick={(e) => toggleFollow(e, selectedPost.id)}
                className={`flex items-center gap-1.5 text-xs transition-colors lowercase ${
                  followedPosts.has(selectedPost.id) ? 'text-amber-400' : 'text-gray-500 hover:text-amber-400'
                }`}
              >
                {followedPosts.has(selectedPost.id)
                  ? <BookmarkCheck className="w-3.5 h-3.5" />
                  : <Bookmark className="w-3.5 h-3.5" />
                }
                {followedPosts.has(selectedPost.id) ? 'following' : 'follow'}
              </button>
              {isQuestion && selectedPost.authorId === user?.uid && (
                <button
                  onClick={() => handleResolve(selectedPost.id)}
                  className={`flex items-center gap-1.5 text-xs transition-colors lowercase ml-auto ${
                    selectedPost.resolved ? 'text-olive-400' : 'text-gray-500 hover:text-olive-400'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {selectedPost.resolved ? 'resolved' : 'mark resolved'}
                </button>
              )}
            </div>
          </motion.div>

          {/* ── Reply box ── */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            {user ? (
              <div className="glass-card p-4 mb-4">
                <div className="flex gap-2.5 items-start">
                  <UserAvatar name={user.username || ''} size="md" />
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={isQuestion ? 'write your answer...' : 'add a reply...'}
                    rows="2"
                    className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-midnight-400/40 transition-colors resize-none leading-relaxed"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || submitting}
                    className="flex items-center gap-1.5 px-3 py-2 bg-midnight-400 hover:bg-midnight-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold uppercase tracking-wide transition-all flex-shrink-0 mt-0.5"
                  >
                    <Send className="w-3 h-3" />
                    {submitting ? '...' : isQuestion ? 'answer' : 'reply'}
                  </button>
                </div>
                {error && <p className="text-xs text-crimson-400 mt-2 lowercase pl-9">{error}</p>}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4 px-5 py-3.5 mb-4 border border-white/[0.06] rounded-xl bg-white/[0.02]">
                <p className="text-xs text-gray-500 lowercase">log in to join the conversation</p>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-1.5 bg-midnight-400 hover:bg-midnight-500 text-white rounded-lg text-xs font-semibold tracking-wide uppercase transition-all flex-shrink-0"
                >
                  log in
                </button>
              </div>
            )}

            {/* Thread label */}
            {commentCount > 0 && (
              <p className="text-[10px] font-bold tracking-widest uppercase text-gray-600 mb-3 px-1">
                {commentCount} {commentCount === 1 ? 'reply' : 'replies'}
              </p>
            )}

            {/* Comments thread */}
            <div className="space-y-2">
              {(selectedPost.comments || []).map((comment, index) => (
                <div
                  key={index}
                  className="glass-card px-4 py-3 border-l-4 border-l-white/[0.06]"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {comment.isVerified ? (
                      <button
                        onClick={() => openProfile(comment.authorId)}
                        className="flex items-center gap-2 hover:opacity-75 transition-opacity"
                      >
                        <UserAvatar name={comment.authorName} size="sm" />
                        <span className="text-xs font-semibold text-gray-300 lowercase">{comment.authorName}</span>
                        <VerifiedBadge size="xs" />
                      </button>
                    ) : (
                      <>
                        <UserAvatar name={comment.authorName} size="sm" />
                        <span className="text-xs font-semibold text-gray-300 lowercase">{comment.authorName}</span>
                      </>
                    )}
                    <span className="text-[10px] text-gray-600 lowercase ml-auto">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed pl-9">{comment.content}</p>
                </div>
              ))}

              {commentCount === 0 && (
                <p className="text-center text-gray-600 text-xs lowercase py-6">
                  no {isQuestion ? 'answers' : 'replies'} yet — be the first
                </p>
              )}
            </div>
          </motion.div>

          </div>{/* end main column */}

          {/* ── Sidebar (desktop) ── */}
          <div className="hidden lg:block">
            <div className="lg:sticky lg:top-32 space-y-4">

              {/* Search bar — navigates back to feed */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSearchQuery(sidebarSearch);
                  setSelectedPost(null);
                }}
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
                  <input
                    type="text"
                    value={sidebarSearch}
                    onChange={e => setSidebarSearch(e.target.value)}
                    placeholder="search discussions..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-midnight-400/40 transition-colors lowercase"
                  />
                </div>
              </form>

              <NewsSidebar />
            </div>
          </div>

          </div>{/* end grid */}

          {/* ── Mobile sidebar (below comments) ── */}
          <div className="lg:hidden mt-10">
            <NewsSidebar />
          </div>

        </div>
      </div>

      {/* ── Specialist profile modal ── */}
      <AnimatePresence>
        {specialistProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            onClick={() => setSpecialistProfile(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-md glass-card rounded-2xl border border-white/[0.1] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setSpecialistProfile(null)} className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>

              {specialistProfile.loading ? (
                <div className="p-10 flex justify-center">
                  <div className="w-5 h-5 border-2 border-midnight-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl">{specialistProfile.avatarIcon}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-base font-semibold text-white lowercase">{specialistProfile.username}</span>
                          <BadgeCheck className="w-4 h-4 text-midnight-400" />
                        </div>
                        <p className="text-[11px] text-gray-500 lowercase mt-0.5">verified security specialist</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-xl font-bold text-white">{specialistProfile.resolvedCount}</p>
                        <p className="text-[10px] text-gray-600 lowercase">cases resolved</p>
                      </div>
                      {specialistProfile.avgRating && (
                        <div>
                          <p className="text-xl font-bold text-white flex items-center gap-1">
                            {specialistProfile.avgRating}
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                          </p>
                          <p className="text-[10px] text-gray-600 lowercase">avg rating</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {specialistProfile.bio && (
                    <div className="px-6 py-4 border-b border-white/[0.06]">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-gray-600 mb-2">about</p>
                      <p className="text-sm text-gray-400 lowercase leading-relaxed">{specialistProfile.bio}</p>
                    </div>
                  )}

                  {specialistProfile.specializations.length > 0 && (
                    <div className="px-6 py-4 border-b border-white/[0.06]">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-gray-600 mb-2">specializations</p>
                      <div className="flex flex-wrap gap-1.5">
                        {specialistProfile.specializations.map((s, i) => (
                          <span key={i} className="px-2 py-1 rounded-md bg-midnight-400/10 border border-midnight-400/20 text-[11px] text-midnight-300 lowercase">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {specialistProfile.recentFeedback.length > 0 && (
                    <div className="px-6 py-4 border-b border-white/[0.06]">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-gray-600 mb-3">recent feedback</p>
                      <div className="space-y-3">
                        {specialistProfile.recentFeedback.map((r, i) => (
                          <div key={i}>
                            <div className="flex items-center gap-0.5 mb-1">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-3 h-3 ${s <= r.feedback.rating ? 'text-amber-400 fill-current' : 'text-gray-700'}`} />
                              ))}
                            </div>
                            <p className="text-xs text-gray-400 lowercase italic">"{r.feedback.comment}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="px-6 py-4">
                    <a
                      href="/request-support"
                      onClick={() => setSpecialistProfile(null)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-midnight-400 hover:bg-midnight-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wide transition-all"
                    >
                      request support from this specialist
                    </a>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
    );
  }

  // ── Main Feed View ────────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-5">
            <Users className="w-7 h-7 text-purple-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 lowercase">
            community
          </h1>
          <p className="text-base text-gray-500 lowercase max-w-md mx-auto leading-relaxed"
            style={{ letterSpacing: '0.03em' }}
          >
            security discussions and expert answers for journalists
          </p>
        </motion.div>

        {/* Tab Switcher — compact pill bar */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center mb-4"
        >
          <div className="flex gap-1 bg-white/[0.03] border border-white/[0.07] rounded-xl p-1">
            {[
              { id: 'discussions', label: 'discussions', icon: MessageSquare, color: '#A78BFA', type: 'discussion' },
              { id: 'qa',          label: 'q&a',         icon: HelpCircle,   color: '#FBBF24', type: 'question'  },
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              const count = posts.filter(p => p.type === tab.type).length;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setActiveCategory('all'); setShowNewPost(false); setSearchQuery(''); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all lowercase"
                  style={active ? {
                    backgroundColor: `${tab.color}18`,
                    color: 'white',
                  } : {
                    color: '#6b7280',
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: active ? tab.color : undefined }} />
                  {tab.label}
                  {!loading && count > 0 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                      style={{
                        backgroundColor: active ? `${tab.color}25` : 'rgba(255,255,255,0.06)',
                        color: active ? tab.color : '#6b7280',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Search + new post + category pills */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-3 mb-6"
        >
          {/* Search row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`search ${isQA ? 'questions' : 'discussions'}...`}
                className="w-full pl-9 pr-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-midnight-400/40 transition-colors lowercase"
              />
            </div>
            <button
              onClick={() => {
                if (!user) { navigate('/login'); return; }
                setShowNewPost(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-midnight-400 hover:bg-midnight-500 text-white rounded-lg text-xs font-semibold tracking-wide uppercase transition-all flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              {isQA ? 'ask' : 'post'}
            </button>
          </div>

          {/* Category pills */}
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
                      ? 'bg-purple-500/10 border-purple-500/20 text-purple-300'
                      : 'border-transparent text-gray-600 hover:text-gray-300 hover:bg-white/[0.04]'
                  }`}
                >
                  {CatIcon && <CatIcon className="w-3 h-3" />}
                  {cat.name}
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
              <form onSubmit={handleCreatePost} className="border border-white/[0.08] rounded-2xl p-6 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                    {isQA ? 'ask a question' : 'new discussion'}
                  </h3>
                  <button type="button" onClick={() => { setShowNewPost(false); setError(''); }}
                    className="text-gray-600 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={isQA ? 'your question...' : 'title...'}
                  required
                  className="w-full px-0 py-3 bg-transparent border-b border-white/[0.08] text-white text-lg font-display font-bold placeholder-gray-700 focus:outline-none focus:border-midnight-400/50 transition-colors mb-4"
                />

                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={isQA ? 'add context to your question...' : 'share your experience or thoughts...'}
                  required
                  rows="4"
                  className="w-full px-0 py-2 bg-transparent text-white text-sm placeholder-gray-700 focus:outline-none transition-colors resize-none leading-relaxed"
                />

                {error && <p className="text-xs text-crimson-400 mb-3 lowercase">{error}</p>}

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/[0.06]">
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost(prev => ({ ...prev, category: e.target.value }))}
                    className="px-3 py-1.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-xs focus:outline-none focus:border-midnight-400/50 transition-colors lowercase"
                  >
                    {categories.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id} className="bg-dark-900">{cat.name}</option>
                    ))}
                  </select>
                  <div className="flex-1" />
                  <button type="button" onClick={() => { setShowNewPost(false); setError(''); }}
                    className="px-4 py-2 text-gray-500 hover:text-white text-xs font-semibold tracking-wide uppercase transition-colors">
                    cancel
                  </button>
                  <button type="submit" disabled={submitting || !newPost.title.trim() || !newPost.content.trim()}
                    className="flex items-center gap-2 px-5 py-2 bg-midnight-400 hover:bg-midnight-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold tracking-wide uppercase transition-all">
                    <Send className="w-3.5 h-3.5" />
                    {submitting ? 'posting...' : isQA ? 'ask' : 'post'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Two-Column Layout: Posts + News Sidebar */}
        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
        {/* Posts Feed */}
        <div className="min-w-0">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-6 h-6 border-2 border-midnight-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 text-[10px] tracking-widest uppercase">loading</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                {searchQuery.trim() ? <Search className="w-5 h-5 text-gray-600" /> : isQA ? <HelpCircle className="w-5 h-5 text-gray-600" /> : <MessageSquare className="w-5 h-5 text-gray-600" />}
              </div>
              <p className="text-gray-500 text-sm lowercase mb-1">
                {searchQuery.trim()
                  ? `no results for "${searchQuery.trim()}"`
                  : activeCategory !== 'all' ? 'nothing here yet' : `no ${isQA ? 'questions' : 'discussions'} yet`}
              </p>
              <p className="text-gray-600 text-xs lowercase">
                {searchQuery.trim()
                  ? 'try different keywords or clear the search'
                  : `be the first to ${isQA ? 'ask something' : 'start a conversation'}`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map((post, index) => {
                const liked = post.likedBy?.includes(user?.uid);

                if (isQA) {
                  // ── Q&A Card: bordered, structured, status-first ──
                  return (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className={`group relative border border-l-4 rounded-xl p-5 cursor-pointer transition-all hover:bg-white/[0.03] ${
                        post.resolved
                          ? 'border-olive-500/20 border-l-olive-500/50 bg-olive-500/[0.02]'
                          : 'border-white/[0.08] border-l-amber-500/40'
                      }`}
                    >
                      <div className="flex gap-4">
                        {/* status column */}
                        <div className="flex flex-col items-center gap-1 pt-0.5 min-w-[48px]">
                          <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded ${
                            post.resolved
                              ? 'bg-olive-500/15 text-olive-400'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {post.resolved ? '✓' : '?'}
                          </span>
                          <span className="text-sm text-gray-400 mt-1 font-semibold">{post.comments?.length || 0}</span>
                          <span className="text-[10px] text-gray-600 lowercase">
                            {(post.comments?.length || 0) === 1 ? 'answer' : 'answers'}
                          </span>
                        </div>

                        {/* content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-white mb-1.5 group-hover:text-midnight-400 transition-colors leading-snug">
                            {post.title}
                            {post.edited && <span className="ml-2 text-[10px] font-normal text-gray-600 align-middle">(edited)</span>}
                          </h3>
                          <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                            {post.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 lowercase">
                            {post.isVerified ? (
                              <button
                                onClick={e => { e.stopPropagation(); openProfile(post.authorId); }}
                                className="flex items-center gap-1.5 hover:opacity-75 transition-opacity"
                              >
                                <UserAvatar name={post.authorName} size="xs" />
                                <span className="text-gray-300 font-semibold">{post.authorName}</span>
                                <VerifiedBadge size="xs" />
                              </button>
                            ) : (
                              <span className="flex items-center gap-1.5">
                                <UserAvatar name={post.authorName} size="xs" />
                                {post.authorName}
                              </span>
                            )}
                            <span>{timeAgo(post.createdAt)}</span>
                            <span>{categories.find(c => c.id === post.category)?.name}</span>
                            <button onClick={(e) => handleLike(e, post.id)}
                              className={`flex items-center gap-1.5 ml-auto transition-colors ${liked ? 'text-crimson-400' : 'hover:text-crimson-400'}`}>
                              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                              {post.likes || 0}
                            </button>
                            <button
                              onClick={(e) => toggleFollow(e, post.id)}
                              className={`flex items-center gap-1.5 transition-colors ${
                                followedPosts.has(post.id) ? 'text-amber-400' : 'hover:text-amber-400'
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

                // ── Discussion Card ──
                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="group border border-l-4 border-white/[0.08] border-l-purple-500/30 rounded-xl p-5 cursor-pointer transition-all hover:bg-white/[0.03] hover:border-white/[0.12]"
                  >
                    <div className="flex items-start gap-3.5">
                      <UserAvatar name={post.authorName} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          {post.isVerified ? (
                            <button
                              onClick={e => { e.stopPropagation(); openProfile(post.authorId); }}
                              className="flex items-center gap-1.5 hover:opacity-75 transition-opacity"
                            >
                              <span className="text-xs font-semibold text-gray-300 lowercase">{post.authorName}</span>
                              <VerifiedBadge size="xs" />
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-gray-300 lowercase">{post.authorName}</span>
                          )}
                          <span className="text-[10px] text-gray-700">·</span>
                          <span className="text-xs text-gray-600 lowercase">{timeAgo(post.createdAt)}</span>
                          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-600 ml-auto">
                            {categories.find(c => c.id === post.category)?.name}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-white mb-1.5 group-hover:text-purple-400 transition-colors leading-snug">
                          {post.title}
                          {post.edited && <span className="ml-2 text-[10px] font-normal text-gray-600 align-middle">(edited)</span>}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-4 pt-3 border-t border-white/[0.05]">
                          <button onClick={(e) => handleLike(e, post.id)}
                            className={`flex items-center gap-1.5 text-xs transition-colors lowercase ${liked ? 'text-crimson-400' : 'text-gray-500 hover:text-crimson-400'}`}>
                            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                            {post.likes || 0}
                          </button>
                          <span className="flex items-center gap-1.5 text-xs text-gray-500 lowercase">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {post.comments?.length || 0}
                          </span>
                          <button
                            onClick={(e) => toggleFollow(e, post.id)}
                            className={`flex items-center gap-1.5 text-xs transition-colors lowercase ml-auto ${
                              followedPosts.has(post.id) ? 'text-amber-400' : 'text-gray-500 hover:text-amber-400'
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

          {/* Guidelines */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 pt-8 border-t border-white/[0.05]"
          >
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-gray-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] tracking-widest uppercase font-bold text-gray-600 mb-2">
                  community guidelines
                </p>
                <p className="text-xs text-gray-600 lowercase leading-relaxed">
                  never share identifying details of sources · keep discussions focused on security · be respectful · report suspicious activity
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* News Sidebar (desktop) */}
        <div className="hidden lg:block">
          <NewsSidebar />
        </div>
        </div>

        {/* News Sidebar (mobile — below posts) */}
        <div className="lg:hidden mt-10">
          <NewsSidebar />
        </div>
      </div>

      {/* ── Specialist profile modal ── */}
      <AnimatePresence>
        {specialistProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            onClick={() => setSpecialistProfile(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-md glass-card rounded-2xl border border-white/[0.1] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setSpecialistProfile(null)} className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>

              {specialistProfile.loading ? (
                <div className="p-10 flex justify-center">
                  <div className="w-5 h-5 border-2 border-midnight-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl">{specialistProfile.avatarIcon}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-base font-semibold text-white lowercase">{specialistProfile.username}</span>
                          <BadgeCheck className="w-4 h-4 text-midnight-400" />
                        </div>
                        <p className="text-[11px] text-gray-500 lowercase mt-0.5">verified security specialist</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-xl font-bold text-white">{specialistProfile.resolvedCount}</p>
                        <p className="text-[10px] text-gray-600 lowercase">cases resolved</p>
                      </div>
                      {specialistProfile.avgRating && (
                        <div>
                          <p className="text-xl font-bold text-white flex items-center gap-1">
                            {specialistProfile.avgRating}
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                          </p>
                          <p className="text-[10px] text-gray-600 lowercase">avg rating</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {specialistProfile.bio && (
                    <div className="px-6 py-4 border-b border-white/[0.06]">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-gray-600 mb-2">about</p>
                      <p className="text-sm text-gray-400 lowercase leading-relaxed">{specialistProfile.bio}</p>
                    </div>
                  )}

                  {specialistProfile.specializations.length > 0 && (
                    <div className="px-6 py-4 border-b border-white/[0.06]">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-gray-600 mb-2">specializations</p>
                      <div className="flex flex-wrap gap-1.5">
                        {specialistProfile.specializations.map((s, i) => (
                          <span key={i} className="px-2 py-1 rounded-md bg-midnight-400/10 border border-midnight-400/20 text-[11px] text-midnight-300 lowercase">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {specialistProfile.recentFeedback.length > 0 && (
                    <div className="px-6 py-4 border-b border-white/[0.06]">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-gray-600 mb-3">recent feedback</p>
                      <div className="space-y-3">
                        {specialistProfile.recentFeedback.map((r, i) => (
                          <div key={i}>
                            <div className="flex items-center gap-0.5 mb-1">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-3 h-3 ${s <= r.feedback.rating ? 'text-amber-400 fill-current' : 'text-gray-700'}`} />
                              ))}
                            </div>
                            <p className="text-xs text-gray-400 lowercase italic">"{r.feedback.comment}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="px-6 py-4">
                    <a
                      href="/request-support"
                      onClick={() => setSpecialistProfile(null)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-midnight-400 hover:bg-midnight-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wide transition-all"
                    >
                      request support from this specialist
                    </a>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Community;
