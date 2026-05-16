import { motion } from 'framer-motion';
import {
  MessageSquare, Heart, Send, ArrowLeft, CheckCircle2, X,
  Search, Bookmark, BookmarkCheck, Pencil, Trash2, Flag,
  AlertTriangle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  addCommunityComment,
  createCommunityReport,
  deleteCommunityPostWithComments,
  getCommunityPost,
  getPostCommentCount,
  softDeleteCommunityComment,
  updateCommunityPost,
  updateCommunityPostLike,
} from '../features/community/services/communityService';
import { useFollowedPosts } from '../features/community/hooks/useFollowedPosts';
import { useAuthorProfile } from '../features/community/hooks/useAuthorProfile';
import { usePostComments } from '../features/community/hooks/usePostComments';
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
  NewsTextarea,
} from '../components/editorial/NewsPage';

const CATEGORY_NAMES = {
  'device-security': 'devices',
  'source-protection': 'sources',
  'communication': 'comms',
  'data-protection': 'data',
  'physical-safety': 'physical',
  'legal-rights': 'legal',
  'general': 'general',
};

const CommunityPostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const { followedPosts, toggleFollow: toggleFollowPost } = useFollowedPosts(user);
  const { authorProfile, setAuthorProfile, openProfile } = useAuthorProfile();
  const { comments, setComments, commentsLoading } = usePostComments(post);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [reportDialog, setReportDialog] = useState(null);
  const [sidebarSearch, setSidebarSearch] = useState('');

  useEffect(() => {
    if (!postId) return;
    const fetchPost = async () => {
      setPageLoading(true);
      try {
        const fetched = await getCommunityPost(postId);
        setPost(fetched);
      } catch (err) {
        logError('Error fetching post:', err);
      } finally {
        setPageLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    if (!post) return;
    const alreadyLiked = post.likedBy?.includes(user.uid);
    const newLikedBy = alreadyLiked
      ? (post.likedBy || []).filter((uid) => uid !== user.uid)
      : [...(post.likedBy || []), user.uid];
    setPost((prev) => ({ ...prev, likes: newLikedBy.length, likedBy: newLikedBy }));
    try {
      await updateCommunityPostLike({ postId: post.id, alreadyLiked, userId: user.uid });
    } catch (err) {
      logError('Error liking post:', err);
    }
  };

  const handleResolve = async () => {
    if (!user || !post || post.authorId !== user.uid) return;
    try {
      await updateCommunityPost(post.id, { resolved: !post.resolved });
      setPost((prev) => ({ ...prev, resolved: !prev.resolved }));
    } catch (err) {
      logError('Error resolving post:', err);
    }
  };

  const handleAcceptAnswer = async (commentId) => {
    if (!post || post.authorId !== user?.uid) return;
    const newAccepted = post.acceptedCommentId === commentId ? null : commentId;
    try {
      await updateCommunityPost(post.id, { acceptedCommentId: newAccepted });
      setPost((prev) => ({ ...prev, acceptedCommentId: newAccepted }));
    } catch (err) {
      logError('Error accepting answer:', err);
    }
  };

  const handleEditPost = async () => {
    if (!post || !editForm.title.trim() || !editForm.content.trim()) return;
    setSubmitting(true);
    try {
      const patch = {
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        edited: true,
        editedAt: new Date().toISOString(),
      };
      await updateCommunityPost(post.id, patch);
      setPost((prev) => ({ ...prev, ...patch }));
      setEditMode(false);
    } catch (err) {
      logError('Error editing post:', err);
      setError('failed to save edit — check your connection.');
    }
    setSubmitting(false);
  };

  const handleDeletePost = async (id) => {
    try {
      await deleteCommunityPostWithComments(id);
      navigate('/community');
    } catch (err) {
      logError('Error deleting post:', err);
      setError('failed to delete — check your permissions.');
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim() || !post) return;
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
        postId: post.id,
        comment,
        fallbackCount: getPostCommentCount(post),
      });
      const nextCount = getPostCommentCount(post) + 1;
      setComments((prev) => [...prev, comment]);
      setPost((prev) => ({ ...prev, commentCount: nextCount, lastCommentAt: comment.createdAt }));
      setNewComment('');
    } catch (err) {
      logError('Error adding comment:', err);
      setError('failed to add comment.');
    }
    setSubmitting(false);
  };

  const handleDeleteComment = async (pid, commentId) => {
    const target = comments.find((c) => c.id === commentId);
    if (!target || target.authorId !== user?.uid) return;
    try {
      await softDeleteCommunityComment({ postId: pid, commentId });
      setComments((prev) => prev.map((c) =>
        c.id === commentId
          ? { ...c, content: '[deleted]', authorName: 'deleted', authorId: null, deleted: true, authorType: 'journalist', isVerified: false, authorVerificationStatus: null }
          : c
      ));
    } catch (err) {
      logError('Error deleting comment:', err);
    }
  };

  const submitReport = async ({ reason, note }) => {
    if (!user || !reportDialog) return;
    if (!user.emailVerified) {
      setError('verify your email before filing community reports.');
      throw new Error('email not verified');
    }
    try {
      await createCommunityReport({
        postId: reportDialog.postId,
        commentId: reportDialog.commentId ?? null,
        reportedBy: user.uid,
        reason,
        note,
        status: 'open',
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      logError('Error filing report:', err);
      throw err;
    }
  };

  if (pageLoading) {
    return (
      <NewsPage>
        <div className="flex justify-center py-24">
          <div className="w-6 h-6 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
        </div>
      </NewsPage>
    );
  }

  if (!post) {
    return (
      <NewsPage>
        <div className="text-center py-24">
          <p className="text-smoke text-sm lowercase mb-3">post not found</p>
          <button
            onClick={() => navigate('/community')}
            className="text-xs text-smoke-dim hover:text-ink transition-colors lowercase"
          >
            ← back to community
          </button>
        </div>
      </NewsPage>
    );
  }

  const isQuestion = post.type === 'question';
  const liked = post.likedBy?.includes(user?.uid);
  const commentCount = Math.max(getPostCommentCount(post), comments.length);
  const isAuthor = post.authorId === user?.uid;

  const orderedComments = (() => {
    const list = [...comments];
    const acceptedId = post.acceptedCommentId;
    if (!acceptedId) return list;
    const accepted = list.find((c) => c.id === acceptedId);
    const rest = list.filter((c) => c.id !== acceptedId);
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
                  onClick={() => navigate('/community')}
                  className="flex items-center gap-1.5 text-smoke hover:text-ink transition-colors text-xs lowercase flex-shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  back
                </button>
                <span className="text-smoke-dim text-xs">·</span>
                {isQuestion && (
                  <>
                    <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded ${
                      post.resolved ? 'bg-brass/12 text-brass' : 'bg-oxblood/8 text-oxblood'
                    }`}>
                      {post.resolved ? 'resolved' : 'open'}
                    </span>
                    <span className="text-smoke-dim text-xs">·</span>
                  </>
                )}
                <span className="text-[10px] font-bold tracking-widest uppercase text-smoke-dim">
                  {CATEGORY_NAMES[post.category] || post.category}
                </span>
                <span className="text-smoke-dim text-xs">·</span>
                <span className="text-[10px] text-smoke-dim lowercase">{timeAgo(post.createdAt)}</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={`bg-paper-soft border border-ink/12 p-5 mb-4 border-l-4 ${
                  isQuestion
                    ? post.resolved ? 'border-l-brass/50' : 'border-l-oxblood/30'
                    : 'border-l-ink/20'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <UserAvatar
                    name={post.authorName}
                    accountType={post.authorType}
                    anonymous={post.isAnonymous}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <AuthorLine item={post} onOpenProfile={openProfile} />
                    <p className="text-[11px] text-smoke-dim lowercase mt-0.5">
                      {post.isAnonymous
                        ? 'posted anonymously'
                        : (post.authorType === 'specialist' ? 'security specialist' : 'journalist')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isAuthor && (
                      <>
                        <button
                          onClick={() => {
                            if (editMode) setEditMode(false);
                            else { setEditMode(true); setEditForm({ title: post.title, content: post.content }); }
                          }}
                          className="flex items-center gap-1 text-[11px] text-smoke-dim hover:text-ink transition-colors lowercase"
                        >
                          {editMode ? <X className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                          {editMode ? 'cancel' : 'edit'}
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ type: 'post', id: post.id })}
                          className="flex items-center gap-1 text-[11px] text-smoke-dim hover:text-oxblood transition-colors lowercase"
                        >
                          <Trash2 className="w-3 h-3" />
                          delete
                        </button>
                      </>
                    )}
                    {!isAuthor && user && (
                      <button
                        onClick={() => setReportDialog({ type: 'post', postId: post.id })}
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
                      onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                      className="w-full px-0 py-2 bg-transparent border-b border-ink/10 text-ink text-xl font-display font-bold placeholder-smoke focus:outline-none focus:border-ink/40 transition-colors mb-3"
                    />
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm((p) => ({ ...p, content: e.target.value }))}
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
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-4 py-1.5 text-smoke hover:text-ink text-xs font-semibold uppercase tracking-wide transition-colors"
                      >
                        cancel
                      </button>
                    </div>
                    {error && <p className="text-xs text-oxblood mt-2 lowercase">{error}</p>}
                  </>
                ) : (
                  <>
                    <h1 className="text-xl font-display font-bold mb-3 leading-snug text-ink">
                      {post.title}
                      {post.edited && (
                        <span className="ml-2 text-[10px] font-normal text-smoke-dim lowercase align-middle">(edited)</span>
                      )}
                    </h1>
                    <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-wrap mb-4">
                      {post.content}
                    </p>
                  </>
                )}

                <div className="flex items-center gap-4 pt-3 border-t border-ink/8">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 text-xs transition-colors lowercase ${
                      liked ? 'text-oxblood' : 'text-smoke hover:text-oxblood'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                    {post.likes || 0}
                  </button>
                  <span className="flex items-center gap-1.5 text-xs text-smoke lowercase">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {commentCount} {commentCount === 1 ? 'reply' : 'replies'}
                  </span>
                  <button
                    onClick={(e) => toggleFollowPost(e, post.id)}
                    className={`flex items-center gap-1.5 text-xs transition-colors lowercase ${
                      followedPosts.has(post.id) ? 'text-brass' : 'text-smoke hover:text-brass'
                    }`}
                  >
                    {followedPosts.has(post.id)
                      ? <BookmarkCheck className="w-3.5 h-3.5" />
                      : <Bookmark className="w-3.5 h-3.5" />
                    }
                    {followedPosts.has(post.id) ? 'following' : 'follow'}
                  </button>
                  {isQuestion && isAuthor && (
                    <button
                      onClick={handleResolve}
                      className={`flex items-center gap-1.5 text-xs transition-colors lowercase ml-auto ${
                        post.resolved ? 'text-olive-400' : 'text-smoke hover:text-olive-400'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {post.resolved ? 'resolved' : 'mark resolved'}
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
                    const isAccepted = post.acceptedCommentId && comment.id === post.acceptedCommentId;
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
                                    onClick={() => setDeleteTarget({ type: 'comment', id: post.id, commentId: comment.id })}
                                    className="flex items-center gap-1 text-[11px] text-smoke-dim hover:text-oxblood transition-colors lowercase"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    delete
                                  </button>
                                )}
                                {canReport && (
                                  <button
                                    onClick={() => setReportDialog({ type: 'comment', postId: post.id, commentId: comment.id })}
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
                    navigate('/community');
                  }}
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-smoke-dim pointer-events-none" />
                    <NewsInput
                      type="text"
                      value={sidebarSearch}
                      onChange={(e) => setSidebarSearch(e.target.value)}
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

      <DeleteConfirmModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async (t) => {
          if (t.type === 'post') await handleDeletePost(t.id);
          else await handleDeleteComment(t.id, t.commentId);
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
    </>
  );
};

export default CommunityPostDetail;
