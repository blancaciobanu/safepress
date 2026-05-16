import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, HelpCircle, Heart, Send,
  Plus, X, Search,
  Shield, Smartphone, Lock, Radio, Scale,
  Bookmark, BookmarkCheck,
  Trash2, Flag, Users,
  Clock, ArrowUp, EyeOff,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  deleteCommunityPostWithComments,
  getPostCommentCount,
  updateCommunityPostLike,
} from '../features/community/services/communityService';
import { useCommunityPosts } from '../features/community/hooks/useCommunityPosts';
import { useFollowedPosts } from '../features/community/hooks/useFollowedPosts';
import { useAuthorProfile } from '../features/community/hooks/useAuthorProfile';
import { useNewPost } from '../features/community/hooks/useNewPost';
import { useReportDialog } from '../features/community/hooks/useReportDialog';
import { logError } from '../utils/logger';
import { timeAgo } from '../utils/time';
import { NewsSidebar } from '../features/news/NewsSidebar';
import { UserAvatar } from '../features/community/components/UserAvatar';
import { AuthorLine } from '../features/community/components/AuthorLine';
import { DeleteConfirmModal } from '../features/community/components/DeleteConfirmModal';
import { ReportModal } from '../features/community/components/ReportModal';
import { AuthorProfileModal } from '../features/community/components/AuthorProfileModal';
import {
  NewsInput,
  NewsPage,
  NewsPanel,
  NewsRule,
  NewsSelect,
} from '../components/editorial/NewsPage';

const categories = [
  { id: 'all',             name: 'all' },
  { id: 'device-security', name: 'devices',  icon: Smartphone },
  { id: 'source-protection',name: 'sources', icon: Shield     },
  { id: 'communication',   name: 'comms',    icon: Radio      },
  { id: 'data-protection', name: 'data',     icon: Lock       },
  { id: 'physical-safety', name: 'physical', icon: Users      },
  { id: 'legal-rights',    name: 'legal',    icon: Scale      },
  { id: 'general',         name: 'general',  icon: MessageSquare },
];

/* ─── Dispatch card (wire-service featured post) ─────────────────── */

const DispatchCard = ({ post, categories: cats, onNavigate }) => {
  if (!post) return null;
  const cat = cats.find((c) => c.id === post.category)?.name ?? '';
  const today = new Date()
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase();

  return (
    <motion.div className="mb-8" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
      {/* Masthead rules */}
      <div className="border-t-2 border-ink" />
      <div className="flex items-center justify-between py-1.5 border-b border-ink/40">
        <span className="eyebrow sm text-oxblood tracking-wider">Dispatch · Thread of the day</span>
        <span className="eyebrow sm text-smoke-dim">{today}</span>
      </div>
      {/* Body */}
      <div
        className="py-4 border-b border-ink/12 cursor-pointer group"
        onClick={() => onNavigate(post.id)}
      >
        {cat && <p className="eyebrow sm text-smoke-dim mb-3">{cat}</p>}
        <h2 className="display text-2xl md:text-3xl leading-tight mb-3 group-hover:text-oxblood transition-colors">
          {post.title}
        </h2>
        <p className="text-sm text-smoke leading-relaxed line-clamp-2 mb-4 italic">
          {post.content}
        </p>
        <div className="flex items-center gap-3 font-mono text-xs text-smoke-dim">
          <span className="text-smoke">{post.isAnonymous ? 'Anonymous' : (post.authorName || 'Anonymous')}</span>
          <span>·</span>
          <span>{timeAgo(post.createdAt)}</span>
          <span>·</span>
          <span>↑ {post.likes || 0}</span>
          <span>·</span>
          <span>{getPostCommentCount(post)} {getPostCommentCount(post) === 1 ? 'reply' : 'replies'}</span>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Tip of the day (corkboard post-it artifact) ────────────────── */

const TIPS = [
  { text: "Use Signal's disappearing messages for sensitive source conversations — set them to one week by default.", tag: "comms" },
  { text: "Assume all hotel and café WiFi is monitored. Use mobile data or a VPN for sensitive research.", tag: "device" },
  { text: "Strip EXIF metadata from photos before sharing — they can reveal your exact location and device.", tag: "data" },
  { text: "Never photograph sources' faces without explicit prior consent, even in casual settings.", tag: "physical" },
  { text: "Two-factor authentication stops 99.9% of automated account attacks. Enable it everywhere.", tag: "security" },
  { text: "A six-digit passcode takes seconds to brute-force. Use a full alphanumeric passphrase on your phone.", tag: "device" },
  { text: "Separate email accounts for sources and public work — never let them share an inbox.", tag: "comms" },
];

const TipCard = () => {
  const tip = TIPS[new Date().getDate() % TIPS.length];
  return (
    <div className="mb-6" style={{ transform: 'rotate(-0.8deg)', transformOrigin: 'top center' }}>
      <div className="border border-ink/22 bg-paper-soft p-4">
        <p className="eyebrow sm text-smoke-dim mb-3">tip of the day</p>
        <p className="text-sm leading-relaxed text-ink-soft"
          style={{ fontFamily: 'var(--font-display)', fontVariationSettings: 'var(--display-axes-soft)', fontWeight: 430, fontStyle: 'italic' }}>
          {tip.text}
        </p>
        <div className="mt-3 pt-3 border-t border-ink/10">
          <span className="eyebrow sm text-smoke-dim">{tip.tag}</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Community ──────────────────────────────────────────────────── */

const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { posts, setPosts, loading } = useCommunityPosts();
  const { followedPosts, toggleFollow } = useFollowedPosts(user);
  const { authorProfile, setAuthorProfile, openProfile } = useAuthorProfile();
  const { reportDialog, setReportDialog, submitReport } = useReportDialog(user);
  const [activeTab, setActiveTab]           = useState('discussions');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery]       = useState('');
  const [sortMode, setSortMode]             = useState('newest');
  const [deleteTarget, setDeleteTarget]     = useState(null);

  const isQA = activeTab === 'qa';
  const currentTabType = isQA ? 'question' : 'discussion';
  const {
    newPost, setNewPost,
    showNewPost, openNewPost, closeNewPost,
    submitting, error,
    handleCreatePost,
  } = useNewPost(user, currentTabType, setPosts);

  /* Pick the highest-voted post of the current tab for the dispatch */
  const dispatchPost = !loading
    ? [...posts].filter((p) => p.type === currentTabType).sort((a, b) => (b.likes || 0) - (a.likes || 0))[0] ?? null
    : null;

  const filteredPosts = (() => {
    const base = posts.filter((post) => {
      const matchesType     = post.type === currentTabType;
      const matchesCategory = activeCategory === 'all' || post.category === activeCategory;
      const q               = searchQuery.trim().toLowerCase();
      const matchesSearch   = !q || post.title.toLowerCase().includes(q) || post.content.toLowerCase().includes(q);
      return matchesType && matchesCategory && matchesSearch;
    });
    if (sortMode === 'top')                      return [...base].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    if (sortMode === 'unanswered' && isQA)       return base.filter((p) => getPostCommentCount(p) === 0);
    return base;
  })();

  /* Hide the dispatch post from the main feed to avoid duplication */
  const feedPosts = filteredPosts.filter((p) => p.id !== dispatchPost?.id);

  /* Count posts per category for the sidebar */
  const catCount = (catId) =>
    catId === 'all'
      ? posts.filter((p) => p.type === currentTabType).length
      : posts.filter((p) => p.type === currentTabType && p.category === catId).length;

  const handleLike = async (e, postId) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const alreadyLiked = post.likedBy?.includes(user.uid);
    const newLikedBy   = alreadyLiked
      ? (post.likedBy || []).filter((uid) => uid !== user.uid)
      : [...(post.likedBy || []), user.uid];
    setPosts((prev) => prev.map((p) =>
      p.id === postId ? { ...p, likes: newLikedBy.length, likedBy: newLikedBy } : p,
    ));
    try {
      await updateCommunityPostLike({ postId, alreadyLiked, userId: user.uid });
    } catch (err) { logError('Error liking post:', err); }
  };

  const handleDeletePost = async (postId) => {
    try {
      await deleteCommunityPostWithComments(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) { logError('Error deleting post:', err); }
  };

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <NewsPage>
      <div>

        {/* ── Header ─────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
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

          {/* Tab strip */}
          <div className="flex border-b border-ink/14 mt-8">
            {[
              { id: 'discussions', label: 'Discussions', type: 'discussion' },
              { id: 'qa',          label: 'Q&A',         type: 'question'  },
            ].map((tab, i) => {
              const active = activeTab === tab.id;
              const count  = posts.filter((p) => p.type === tab.type).length;
              return (
                <button key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setActiveCategory('all');
                    closeNewPost();
                    setSearchQuery('');
                    setSortMode('newest');
                  }}
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

        {/* ── Toolbar ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3 mt-5 mb-5"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-smoke-dim pointer-events-none" />
            <NewsInput
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`search ${isQA ? 'questions' : 'discussions'}...`}
              className="pl-8 pr-3 py-1.5 text-xs lowercase"
            />
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="eyebrow sm text-smoke-dim">sort</span>
            {[
              { id: 'newest', label: 'newest' },
              { id: 'top',    label: 'top'    },
              ...(isQA ? [{ id: 'unanswered', label: 'unanswered' }] : []),
            ].map((opt, i, arr) => {
              const active = sortMode === opt.id;
              return (
                <span key={opt.id} className="flex items-center gap-2">
                  <button onClick={() => setSortMode(opt.id)}
                    className={`font-mono text-[10px] tracking-widest uppercase transition-colors ${
                      active ? 'text-ink' : 'text-smoke-dim hover:text-ink-soft'
                    }`}>
                    {opt.label}
                  </button>
                  {i < arr.length - 1 && <span className="text-smoke-dim/40">·</span>}
                </span>
              );
            })}
          </div>

          <button
            onClick={() => { if (!user) { navigate('/login'); return; } openNewPost(); }}
            className="flex-shrink-0 flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 border border-ink/25 text-ink-soft hover:border-ink hover:text-ink transition-colors"
          >
            <Plus className="w-3 h-3" />
            {isQA ? 'ask' : 'post'}
          </button>
        </motion.div>

        {/* ── New post form ───────────────────────────────────────── */}
        <AnimatePresence>
          {showNewPost && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <NewsPanel as="form" onSubmit={handleCreatePost} className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="eyebrow sm text-smoke">
                    {isQA ? 'ask a question' : 'new discussion'}
                  </h3>
                  <button type="button" onClick={closeNewPost}
                    className="text-smoke-dim hover:text-ink transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={isQA ? 'your question...' : 'title...'}
                  required
                  className="w-full px-0 py-3 bg-transparent border-b border-ink/10 text-ink text-lg font-display font-bold placeholder-smoke focus:outline-none focus:border-ink/40 transition-colors mb-4"
                />
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder={isQA ? 'add context to your question...' : 'share your experience or thoughts...'}
                  required rows="4"
                  className="w-full px-0 py-2 bg-transparent text-ink text-sm placeholder-smoke focus:outline-none transition-colors resize-none leading-relaxed"
                />

                {error && <p className="text-xs text-oxblood mb-3 lowercase">{error}</p>}

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-ink/8 flex-wrap">
                  <NewsSelect
                    value={newPost.category}
                    onChange={(e) => setNewPost((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-auto px-3 py-1.5 text-xs lowercase"
                  >
                    {categories.filter((c) => c.id !== 'all').map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-paper">{cat.name}</option>
                    ))}
                  </NewsSelect>

                  {!isQA && (
                    <label className="flex items-center gap-2 text-xs text-smoke lowercase cursor-pointer">
                      <input type="checkbox" checked={!!newPost.isAnonymous}
                        onChange={(e) => setNewPost((prev) => ({ ...prev, isAnonymous: e.target.checked }))}
                        className="accent-ink" />
                      <EyeOff className="w-3.5 h-3.5" />
                      post anonymously
                    </label>
                  )}

                  <div className="flex-1" />
                  <button type="button" onClick={closeNewPost}
                    className="px-4 py-2 text-smoke hover:text-ink text-xs tracking-widest uppercase transition-colors font-mono">
                    cancel
                  </button>
                  <button type="submit"
                    disabled={submitting || !newPost.title.trim() || !newPost.content.trim()}
                    className="btn flex items-center gap-2 text-xs uppercase tracking-widest disabled:opacity-40">
                    <Send className="w-3.5 h-3.5" />
                    {submitting ? 'posting...' : isQA ? 'ask' : 'post'}
                  </button>
                </div>

                {!isQA && newPost.isAnonymous && (
                  <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-paper-soft/60 border border-ink/15">
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

        {/* ── Three-column layout ─────────────────────────────────── */}
        <div className="lg:grid lg:grid-cols-[176px_1fr_256px] lg:gap-8 lg:items-start">

          {/* ── Category sidebar (desktop) ───────────────────────── */}
          <aside className="hidden lg:block lg:sticky lg:top-28 pt-1">
            <p className="eyebrow sm text-smoke-dim mb-3 border-t border-ink/15 pt-4">Filter</p>
            {categories.map((cat) => {
              const active  = activeCategory === cat.id;
              const count   = catCount(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center justify-between py-1.5 pl-3 border-l-2 text-left transition-colors ${
                    active
                      ? 'border-ink text-ink'
                      : 'border-transparent text-smoke-dim hover:text-ink-soft hover:border-ink/25'
                  }`}
                >
                  <span className="font-mono text-[10px] tracking-widest uppercase">{cat.name}</span>
                  {count > 0 && (
                    <span className={`font-mono text-[9px] tabular-nums transition-colors ${active ? 'text-smoke' : 'text-smoke-dim'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </aside>

          {/* ── Main column ──────────────────────────────────────── */}
          <div className="min-w-0">

            {/* Mobile category strip */}
            <div className="lg:hidden flex items-center overflow-x-auto border-b border-ink/10 mb-4 gap-0 -mx-1 px-1">
              {categories.map((cat, i) => {
                const active = activeCategory === cat.id;
                return (
                  <button key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`relative flex-shrink-0 py-2 font-mono text-[10px] tracking-widest uppercase transition-colors ${
                      i === 0 ? 'pr-3 pl-0' : 'px-3'
                    } ${active ? 'text-ink' : 'text-smoke-dim'}`}
                  >
                    {cat.name}
                    {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink" />}
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="eyebrow sm text-smoke-dim">loading</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 bg-paper-soft/60 border border-ink/8 flex items-center justify-center mx-auto mb-4">
                  {searchQuery.trim()
                    ? <Search className="w-5 h-5 text-smoke-dim" />
                    : isQA ? <HelpCircle className="w-5 h-5 text-smoke-dim" /> : <MessageSquare className="w-5 h-5 text-smoke-dim" />}
                </div>
                <p className="text-smoke text-sm lowercase mb-1">
                  {sortMode === 'unanswered'
                    ? 'no unanswered questions'
                    : searchQuery.trim()
                      ? `no results for "${searchQuery.trim()}"`
                      : activeCategory !== 'all' ? 'nothing here yet'
                        : `no ${isQA ? 'questions' : 'discussions'} yet`}
                </p>
                <p className="text-smoke-dim text-xs lowercase">
                  {searchQuery.trim()
                    ? 'try different keywords or clear the search'
                    : `be the first to ${isQA ? 'ask something' : 'start a conversation'}`}
                </p>
              </div>
            ) : (
              <>
                {/* Dispatch — only when no active filter so context is clear */}
                {activeCategory === 'all' && !searchQuery.trim() && dispatchPost && (
                  <DispatchCard post={dispatchPost} categories={categories} onNavigate={(id) => navigate(`/community/${id}`)} />
                )}

                {/* Feed */}
                <div>
                  {feedPosts.map((post) => {
                    const liked        = post.likedBy?.includes(user?.uid);
                    const categoryName = categories.find((c) => c.id === post.category)?.name;

                    if (isQA) {
                      return (
                        <article key={post.id}
                          onClick={() => navigate(`/community/${post.id}`)}
                          className="group border-t border-ink/10 py-4 cursor-pointer hover:bg-paper-soft/25 transition-colors"
                        >
                          <div className="flex gap-5">
                            {/* Answer count column */}
                            <div className="flex flex-col items-center gap-1 pt-0.5 w-11 shrink-0">
                              <span className={`font-mono text-[10px] tracking-widest uppercase px-1.5 py-0.5 border font-bold ${
                                post.resolved ? 'border-brass/35 text-brass' : 'border-oxblood/28 text-oxblood'
                              }`}>
                                {post.resolved ? '✓' : '?'}
                              </span>
                              <span className="text-sm text-smoke mt-1 font-semibold">{getPostCommentCount(post)}</span>
                              <span className="eyebrow sm text-smoke-dim lowercase normal-case text-[9px]">
                                {getPostCommentCount(post) === 1 ? 'answer' : 'answers'}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Dateline */}
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {categoryName && <span className="eyebrow sm text-smoke-dim">{categoryName}</span>}
                                {categoryName && <span className="text-smoke-dim text-[10px]">·</span>}
                                <span className="eyebrow sm text-smoke-dim">{timeAgo(post.createdAt)}</span>
                                {post.edited && <span className="eyebrow sm text-smoke-dim">(edited)</span>}
                              </div>
                              {/* Title */}
                              <h3 className="display-soft text-base md:text-lg text-ink mb-1.5 group-hover:text-oxblood transition-colors leading-snug">
                                {post.title}
                              </h3>
                              <p className="text-sm text-smoke line-clamp-2 mb-4 leading-relaxed">{post.content}</p>
                              {/* Footer */}
                              <div className="flex items-center gap-4 text-xs text-smoke-dim lowercase flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <UserAvatar name={post.authorName} accountType={post.authorType} anonymous={post.isAnonymous} size="xs" />
                                  <AuthorLine item={post} onOpenProfile={openProfile} />
                                </div>
                                <button onClick={(e) => handleLike(e, post.id)}
                                  className={`flex items-center gap-1.5 ml-auto transition-colors ${liked ? 'text-oxblood' : 'hover:text-oxblood'}`}>
                                  <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                                  {post.likes || 0}
                                </button>
                                <button onClick={(e) => toggleFollow(e, post.id)}
                                  className={`flex items-center gap-1.5 transition-colors ${followedPosts.has(post.id) ? 'text-brass' : 'hover:text-brass'}`}>
                                  {followedPosts.has(post.id) ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    }

                    return (
                      <article key={post.id}
                        onClick={() => navigate(`/community/${post.id}`)}
                        className="group border-t border-ink/10 py-4 cursor-pointer hover:bg-paper-soft/25 transition-colors"
                      >
                        {/* Dateline */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <UserAvatar name={post.authorName} accountType={post.authorType} anonymous={post.isAnonymous} size="xs" />
                            <AuthorLine item={post} onOpenProfile={openProfile} />
                          </div>
                          <span className="text-smoke-dim text-[10px]">·</span>
                          <span className="eyebrow sm text-smoke-dim">{timeAgo(post.createdAt)}</span>
                          {categoryName && <><span className="text-smoke-dim text-[10px]">·</span><span className="eyebrow sm text-smoke-dim">{categoryName}</span></>}
                          {post.edited && <span className="eyebrow sm text-smoke-dim">(edited)</span>}
                        </div>

                        {/* Title in Fraunces */}
                        <h3 className="display-soft text-base md:text-lg text-ink mb-1.5 group-hover:text-oxblood transition-colors leading-snug">
                          {post.title}
                        </h3>
                        <p className="text-sm text-smoke line-clamp-2 leading-relaxed mb-4">
                          {post.content}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center gap-4 pt-3 border-t border-ink/8">
                          <button onClick={(e) => handleLike(e, post.id)}
                            className={`flex items-center gap-1.5 text-xs transition-colors lowercase ${liked ? 'text-oxblood' : 'text-smoke-dim hover:text-oxblood'}`}>
                            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                            {post.likes || 0}
                          </button>
                          <span className="flex items-center gap-1.5 text-xs text-smoke-dim lowercase">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {getPostCommentCount(post)}
                          </span>
                          <div className="flex-1" />
                          <button onClick={(e) => toggleFollow(e, post.id)}
                            className={`flex items-center gap-1.5 text-xs transition-colors lowercase ${followedPosts.has(post.id) ? 'text-brass' : 'text-smoke-dim hover:text-brass'}`}>
                            {followedPosts.has(post.id) ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Bottom rule */}
                <div className="mt-0 border-b border-ink/10" />
              </>
            )}

            {/* Community guidelines footer */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="mt-14 pt-8 border-t border-ink/8">
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-smoke-dim flex-shrink-0 mt-0.5" />
                <div>
                  <p className="eyebrow sm text-smoke-dim mb-2">community guidelines</p>
                  <p className="text-xs text-smoke-dim lowercase leading-relaxed">
                    never share identifying details of sources · keep discussions focused on security · be respectful · report suspicious activity
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Right sidebar ─────────────────────────────────────── */}
          <div className="hidden lg:block lg:sticky lg:top-28">
            <TipCard />
            <NewsSidebar />
          </div>
        </div>

      </div>

      {/* ── Modals ─────────────────────────────────────────────────── */}
      <DeleteConfirmModal
        target={deleteTarget}
        onConfirm={(t) => { handleDeletePost(t.id); setDeleteTarget(null); }}
        onClose={() => setDeleteTarget(null)}
      />
      <ReportModal
        target={reportDialog}
        onClose={() => setReportDialog(null)}
        onSubmit={submitReport}
      />
      {authorProfile && (
        <AuthorProfileModal profile={authorProfile} onClose={() => setAuthorProfile(null)} />
      )}
    </NewsPage>
  );
};

export default Community;
