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
  { id: 'all', name: 'all' },
  { id: 'device-security', name: 'devices', icon: Smartphone },
  { id: 'source-protection', name: 'sources', icon: Shield },
  { id: 'communication', name: 'comms', icon: Radio },
  { id: 'data-protection', name: 'data', icon: Lock },
  { id: 'physical-safety', name: 'physical', icon: Users },
  { id: 'legal-rights', name: 'legal', icon: Scale },
  { id: 'general', name: 'general', icon: MessageSquare },
];


const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { posts, setPosts, loading } = useCommunityPosts();
  const { followedPosts, toggleFollow } = useFollowedPosts(user);
  const { authorProfile, setAuthorProfile, openProfile } = useAuthorProfile();
  const { reportDialog, setReportDialog, submitReport } = useReportDialog(user);
  const [activeTab, setActiveTab] = useState('discussions');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState('newest');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const isQA = activeTab === 'qa';
  const currentTabType = isQA ? 'question' : 'discussion';
  const {
    newPost, setNewPost,
    showNewPost, openNewPost, closeNewPost,
    submitting, error,
    handleCreatePost,
  } = useNewPost(user, currentTabType, setPosts);

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

  const handleLike = async (e, postId) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const alreadyLiked = post.likedBy?.includes(user.uid);
    const newLikedBy = alreadyLiked
      ? (post.likedBy || []).filter(uid => uid !== user.uid)
      : [...(post.likedBy || []), user.uid];
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, likes: newLikedBy.length, likedBy: newLikedBy } : p
    ));
    try {
      await updateCommunityPostLike({ postId, alreadyLiked, userId: user.uid });
    } catch (err) {
      logError('Error liking post:', err);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await deleteCommunityPostWithComments(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      logError('Error deleting post:', err);
    }
  };

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
                  onClick={() => { setActiveTab(tab.id); setActiveCategory('all'); closeNewPost(); setSearchQuery(''); setSortMode('newest'); }}
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
                openNewPost();
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
                  <button type="button" onClick={closeNewPost}
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
                  <button type="button" onClick={closeNewPost}
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
                      onClick={() => navigate(`/community/${post.id}`)}
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
                    onClick={() => navigate(`/community/${post.id}`)}
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

      <DeleteConfirmModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async (t) => {
          if (t.type === 'post') await handleDeletePost(t.id);
        }}
      />
      <ReportModal
        target={reportDialog}
        onClose={() => setReportDialog(null)}
        onSubmit={submitReport}
      />
      <AuthorProfileModal
        profile={authorProfile}
        onClose={() => setAuthorProfile(null)}
        onSelectPost={(p) => {
          setAuthorProfile(null);
          navigate(`/community/${p.id}`);
        }}
      />
    </NewsPage>
  );
};

export default Community;
