import { motion as Motion } from 'framer-motion';
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
  deleteCommunityPostWithComments,
  getCommunityPost,
  getPostCommentCount,
  softDeleteCommunityComment,
  updateCommunityComment,
  updateCommunityPost,
  updateCommunityPostLike,
} from '../features/community/services/communityService';
import { useFollowedPosts } from '../features/community/hooks/useFollowedPosts';
import { useAuthorProfile } from '../features/community/hooks/useAuthorProfile';
import { usePostComments } from '../features/community/hooks/usePostComments';
import { useReportDialog } from '../features/community/hooks/useReportDialog';
import { logError } from '../utils/logger';
import { timeAgo } from '../utils/time';
import { NewsSidebar } from '../features/news/NewsSidebar';
import { UserAvatar } from '../features/community/components/UserAvatar';
import { AuthorLine } from '../features/community/components/AuthorLine';
import { CommunityRichText } from '../features/community/components/CommunityRichText';
import { CommunityRichTextEditor } from '../features/community/components/CommunityRichTextEditor';
import { DeleteConfirmModal } from '../features/community/components/DeleteConfirmModal';
import { ReportModal } from '../features/community/components/ReportModal';
import { AuthorProfileModal } from '../features/community/components/AuthorProfileModal';
import { getPublicProfile } from '../features/users/services/userService';
import { getDisplayName } from '../utils/userUtils';
import {
  NewsInput,
  NewsPage,
  NewsPanel,
} from '../components/editorial/NewsPage';
import CommentCard from '../features/community/components/CommentCard';
import { AUTHOR_META_CLASS, getRoleLabel } from '../features/community/utils/authorHelpers';

const CATEGORY_NAMES = {
  'device-security': 'devices',
  'source-protection': 'sources',
  'communication': 'comms',
  'data-protection': 'data',
  'physical-safety': 'physical',
  'legal-rights': 'legal',
  'general': 'general',
};

// Keep this in sync with the Firestore rule for community comment content.
const MAX_COMMUNITY_COMMENT_LENGTH = 5000;

const getCommentParentId = (comment = {}) => comment.parentCommentId || null;

const CommunityPostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const { followedPosts, toggleFollow: toggleFollowPost } = useFollowedPosts(user);
  const { authorProfile, setAuthorProfile, openProfile } = useAuthorProfile();
  const { comments, setComments, commentsLoading } = usePostComments(post);
  const { reportDialog, setReportDialog, submitReport } = useReportDialog(user);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [authorAvatars, setAuthorAvatars] = useState({});
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [replyError, setReplyError] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentDraft, setEditCommentDraft] = useState('');
  const [editCommentError, setEditCommentError] = useState('');

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

  useEffect(() => {
    const authorIds = [...new Set([
      post?.isAnonymous ? null : post?.authorId,
      ...comments.map((comment) => (comment.deleted ? null : comment.authorId)),
    ].filter(Boolean))];

    const missingIds = authorIds.filter((authorId) => !Object.prototype.hasOwnProperty.call(authorAvatars, authorId));
    if (!missingIds.length) return;

    let cancelled = false;

    const fetchAuthorAvatars = async () => {
      try {
        const profiles = await Promise.all(
          missingIds.map(async (authorId) => [authorId, await getPublicProfile(authorId)])
        );

        if (cancelled) return;

        setAuthorAvatars((prev) => {
          const next = { ...prev };
          profiles.forEach(([authorId, profile]) => {
            next[authorId] = profile?.avatarUrl || null;
          });
          return next;
        });
      } catch (err) {
        logError('Error loading author avatars:', err);
      }
    };

    fetchAuthorAvatars();

    return () => {
      cancelled = true;
    };
  }, [post, comments, authorAvatars]);

  const getAuthorAvatarUrl = (authorId) => {
    if (!authorId) return null;
    if (authorId === user?.uid && user?.avatarUrl) return user.avatarUrl;
    return authorAvatars[authorId] || null;
  };

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

  const submitComment = async ({
    content,
    parentComment = null,
    onSuccess,
    onError = setError,
  }) => {
    const trimmedComment = content.trim();
    if (!user || !trimmedComment || !post) return;
    if (!user.emailVerified) {
      onError('verify your email before replying in the community.');
      return;
    }
    if (trimmedComment.length > MAX_COMMUNITY_COMMENT_LENGTH) {
      onError(`reply is too long — ${trimmedComment.length}/${MAX_COMMUNITY_COMMENT_LENGTH} characters.`);
      return;
    }
    setSubmitting(true);
    onError('');
    try {
      const comment = {
        id: `${user.uid}-${Date.now()}`,
        authorId: user.uid,
        authorName: getDisplayName(user) || 'anonymous',
        authorType: user.accountType || 'journalist',
        isVerified: user.verificationStatus === 'approved',
        authorVerificationStatus: user.accountType === 'specialist' ? (user.verificationStatus || 'pending') : null,
        content: trimmedComment,
        createdAt: new Date().toISOString(),
        deleted: false,
      };

      if (parentComment) {
        comment.parentCommentId = parentComment.id;
        comment.replyToAuthorId = parentComment.authorId || null;
        comment.replyToAuthorName = parentComment.authorName || 'deleted';
      }

      await addCommunityComment({
        postId: post.id,
        comment,
        fallbackCount: getPostCommentCount(post),
      });
      const nextCount = Math.max(getPostCommentCount(post), comments.length) + 1;
      setComments((prev) => [...prev, comment]);
      setPost((prev) => ({ ...prev, commentCount: nextCount, lastCommentAt: comment.createdAt }));
      onSuccess?.();
    } catch (err) {
      logError('Error adding comment:', err);
      onError('failed to add comment.');
    }
    setSubmitting(false);
  };

  const handleAddComment = async () => {
    await submitComment({
      content: newComment,
      onSuccess: () => setNewComment(''),
      onError: setError,
    });
  };

  const handleAddCommentReply = async (targetComment) => {
    if (!targetComment || targetComment.deleted) return;
    await submitComment({
      content: replyDraft,
      parentComment: targetComment,
      onSuccess: () => {
        setReplyDraft('');
        setReplyTarget(null);
        setReplyError('');
      },
      onError: setReplyError,
    });
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
      if (replyTarget?.id === commentId) {
        setReplyTarget(null);
        setReplyDraft('');
        setReplyError('');
      }
    } catch (err) {
      logError('Error deleting comment:', err);
    }
  };

  const handleEditComment = async (comment) => {
    const trimmed = editCommentDraft.trim();
    if (!trimmed || trimmed.length > MAX_COMMUNITY_COMMENT_LENGTH) return;
    setSubmitting(true);
    setEditCommentError('');
    try {
      const patch = {
        content: trimmed,
        edited: true,
        editedAt: new Date().toISOString(),
      };
      await updateCommunityComment({ postId: post.id, commentId: comment.id, patch });
      setComments((prev) => prev.map((c) => c.id === comment.id ? { ...c, ...patch } : c));
      setEditingCommentId(null);
      setEditCommentDraft('');
    } catch (err) {
      logError('Error editing comment:', err);
      setEditCommentError('failed to save edit — check your connection.');
    }
    setSubmitting(false);
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
          <p className="text-smoke text-sm mb-3">post not found</p>
          <button
            onClick={() => navigate('/community')}
            className="text-xs text-smoke-dim hover:text-ink transition-colors"
          >
            ← back to community
          </button>
        </div>
      </NewsPage>
    );
  }

  const isQuestion = post.type === 'question';
  const isAMA      = post.type === 'ama';
  const isClosed   = isQuestion && post.resolved;
  const liked = post.likedBy?.includes(user?.uid);
  const commentCount = Math.max(getPostCommentCount(post), comments.length);
  const isAuthor = post.authorId === user?.uid;
  const replyLabel = isAMA ? 'Your question' : isQuestion ? 'Your answer' : 'Your reply';
  const replyAction = isAMA ? 'ask' : isQuestion ? 'answer' : 'reply';
  const emptyReplyCue = isAMA ? 'first question' : isQuestion ? 'first answer' : 'first reply';
  const trimmedComment = newComment.trim();
  const commentLength = trimmedComment.length;
  const commentOverLimit = commentLength > MAX_COMMUNITY_COMMENT_LENGTH;
  const postRoleLabel = getRoleLabel(post || {}, { anonymousLabel: 'Posted Anonymously' });

  const commentsById = new Map(comments.map((comment) => [comment.id, comment]));
  const repliesByParent = new Map();
  const topLevelComments = [];

  comments.forEach((comment) => {
    const parentId = getCommentParentId(comment);
    if (parentId && commentsById.has(parentId)) {
      const replies = repliesByParent.get(parentId) || [];
      replies.push(comment);
      repliesByParent.set(parentId, replies);
      return;
    }
    topLevelComments.push(comment);
  });

  const acceptedComment = post.acceptedCommentId ? commentsById.get(post.acceptedCommentId) : null;
  const acceptedTopLevelId = acceptedComment
    ? (getCommentParentId(acceptedComment) || acceptedComment.id)
    : null;
  const orderedTopLevelComments = (() => {
    if (!acceptedTopLevelId) return topLevelComments;
    const acceptedThread = topLevelComments.find((comment) => comment.id === acceptedTopLevelId);
    if (!acceptedThread) return topLevelComments;
    return [
      acceptedThread,
      ...topLevelComments.filter((comment) => comment.id !== acceptedTopLevelId),
    ];
  })();

  const commentCardProps = {
    post,
    isAuthor,
    isClosed,
    getAuthorAvatarUrl,
    openProfile,
    submitting,
    replyTarget,
    setReplyTarget,
    replyDraft,
    setReplyDraft,
    replyError,
    setReplyError,
    editingCommentId,
    setEditingCommentId,
    editCommentDraft,
    setEditCommentDraft,
    editCommentError,
    setEditCommentError,
    onAcceptAnswer: handleAcceptAnswer,
    onAddReply: handleAddCommentReply,
    onEditComment: handleEditComment,
    setDeleteTarget,
    setReportDialog,
    setError,
    repliesByParent,
  };

  return (
    <>
      <NewsPage>
        <div>
          <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
            <div className="min-w-0">

              <Motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 mb-5 flex-wrap"
              >
                <button
                  onClick={() => navigate('/community')}
                  className="flex items-center gap-1.5 text-smoke hover:text-ink transition-colors text-xs flex-shrink-0"
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
                <span className="text-[10px] text-smoke-dim">{timeAgo(post.createdAt)}</span>
              </Motion.div>

              <Motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={`bg-paper-soft border border-ink/12 p-5 mb-4 ${
                  isAMA
                    ? 'border-t-2 border-t-oxblood/60'
                    : `border-l-4 ${isQuestion
                        ? post.resolved ? 'border-l-brass/50' : 'border-l-oxblood/30'
                        : 'border-l-ink/20'}`
                }`}
              >
                {isAMA && (
                  <div className="community-ama-strip">
                    <span className="eyebrow sm text-oxblood">Ask Me Anything</span>
                    <span className="eyebrow sm text-smoke-dim">specialist thread</span>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <UserAvatar
                    name={post.authorName}
                    avatarUrl={post.isAnonymous ? null : getAuthorAvatarUrl(post.authorId)}
                    accountType={post.authorType}
                    anonymous={post.isAnonymous}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <AuthorLine item={post} onOpenProfile={openProfile} />
                    <p className={AUTHOR_META_CLASS}>
                      {postRoleLabel}
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
                          className="flex items-center gap-1 text-[11px] text-smoke-dim hover:text-ink transition-colors"
                        >
                          {editMode ? <X className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                          {editMode ? 'cancel' : 'edit'}
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ type: 'post', id: post.id })}
                          className="flex items-center gap-1 text-[11px] text-smoke-dim hover:text-oxblood transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          delete
                        </button>
                      </>
                    )}
                    {!isAuthor && user && (
                      <button
                        onClick={() => setReportDialog({ type: 'post', postId: post.id })}
                        className="flex items-center gap-1 text-[11px] text-smoke-dim hover:text-brass transition-colors"
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
                      className="w-full px-0 py-2 bg-transparent border-b border-ink/10 text-ink text-2xl md:text-[1.7rem] font-display font-bold placeholder-smoke focus:outline-none focus:border-ink/40 transition-colors mb-3"
                    />
                    <CommunityRichTextEditor
                      value={editForm.content}
                      onChange={(nextValue) => setEditForm((prev) => ({ ...prev, content: nextValue }))}
                      placeholder="Update the thread context..."
                      rows="4"
                      className="mb-3"
                    />
                    <div className="flex items-start gap-2 px-3 py-2.5 mb-4 bg-amber-500/[0.08] border border-amber-500/20">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-brass/80 leading-relaxed">
                        once saved, an "edited" label will be visible to all community members.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditPost}
                        disabled={submitting || !editForm.title.trim() || !editForm.content.trim()}
                        className="px-4 py-1.5 btn disabled:opacity-40 text-xs font-semibold uppercase tracking-wide transition-all"
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
                    {error && <p className="text-xs text-oxblood mt-2">{error}</p>}
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl md:text-[1.7rem] font-display font-bold mb-3 leading-snug text-ink">
                      {post.title}
                    </h1>
                    <CommunityRichText
                      content={post.content}
                      className="mb-2 text-[15px] md:text-base text-ink-soft leading-[1.62]"
                      paragraphClassName="leading-[1.62]"
                      listClassName="text-[15px] md:text-base text-ink-soft leading-[1.62]"
                    />
                    {post.edited && (
                      <p className="text-[10px] font-mono text-smoke-dim mb-3">edited</p>
                    )}
                  </>
                )}

                <div className="flex items-center gap-4 pt-3 border-t border-ink/8">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${
                      liked ? 'text-oxblood' : 'text-smoke hover:text-oxblood'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                    {post.likes || 0}
                  </button>
                  <span className="flex items-center gap-1.5 text-xs text-smoke">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {commentCount} {commentCount === 1 ? 'reply' : 'replies'}
                  </span>
                  <button
                    onClick={(e) => toggleFollowPost(e, post.id)}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${
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
                      className={`flex items-center gap-1.5 text-xs transition-colors ml-auto ${
                        post.resolved ? 'text-olive-400' : 'text-smoke hover:text-olive-400'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {post.resolved ? 'resolved' : 'mark resolved'}
                    </button>
                  )}
                </div>
              </Motion.div>

              <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                {isClosed ? (
                  <div className="border border-ink/10 bg-paper-soft/40 px-5 py-4 mb-4 flex items-center gap-3">
                    <span className="eyebrow sm text-brass">✓ resolved</span>
                    <span className="text-smoke-dim text-[10px]">·</span>
                    <span className="eyebrow sm text-smoke-dim">thread closed — this question has been answered</span>
                  </div>
                ) : user ? (
                  <NewsPanel
                    as="form"
                    className="community-reply-composer mb-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddComment();
                    }}
                  >
                    <div className="community-reply-composer__header">
                      <UserAvatar
                        name={user.username || ''}
                        avatarUrl={user.avatarUrl || null}
                        accountType={user.accountType}
                        size="sm"
                      />
                      <p className="eyebrow sm text-smoke">{replyLabel}</p>
                    </div>
                    <CommunityRichTextEditor
                      value={newComment}
                      onChange={(nextValue) => {
                        setNewComment(nextValue);
                        if (error) setError('');
                      }}
                      placeholder={isAMA ? 'Ask your question...' : isQuestion ? 'Write your answer...' : 'Add a reply...'}
                      rows="3"
                      ariaInvalid={commentOverLimit}
                    />
                    <div className="community-reply-composer__footer">
                      <div className="flex items-center gap-2">
                        <span className="eyebrow sm text-smoke-dim">{commentCount === 0 ? emptyReplyCue : 'join thread'}</span>
                        <span className={`eyebrow sm ${commentOverLimit ? 'text-oxblood' : 'text-smoke-dim'}`}>
                          {commentLength}/{MAX_COMMUNITY_COMMENT_LENGTH}
                        </span>
                      </div>
                      <button
                        type="submit"
                        disabled={!trimmedComment || commentOverLimit || submitting}
                        className="btn mono disabled:opacity-40"
                      >
                        <Send className="w-3 h-3" />
                        {submitting ? '...' : replyAction}
                      </button>
                    </div>
                    {error && <p className="text-xs text-oxblood mt-2">{error}</p>}
                  </NewsPanel>
                ) : (
                  <NewsPanel muted className="flex items-center justify-between gap-4 px-5 py-3.5 mb-4">
                    <p className="text-xs text-smoke">
                      {isAMA ? 'log in to ask a question' : 'log in to join the conversation'}
                    </p>
                    <button
                      onClick={() => navigate('/login')}
                      className="px-4 py-1.5 bg-ink hover:bg-ink-soft text-paper text-xs font-semibold tracking-wide uppercase transition-all flex-shrink-0"
                    >
                      log in
                    </button>
                  </NewsPanel>
                )}

                {commentCount > 0 && (
                  <p className="text-[10px] font-bold tracking-widest uppercase text-smoke-dim mb-3 px-1">
                    {commentCount} {isAMA
                      ? (commentCount === 1 ? 'question' : 'questions')
                      : (commentCount === 1 ? 'reply' : 'replies')}
                  </p>
                )}

                <div className="space-y-4">
                  {commentsLoading && (
                    <div className="flex justify-center py-2">
                      <div className="w-4 h-4 border-2 border-midnight-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {orderedTopLevelComments.map((comment) => (
                    <CommentCard
                      key={comment.id ?? comment.createdAt ?? comment.content}
                      comment={comment}
                      depth={0}
                      {...commentCardProps}
                    />
                  ))}

                  {commentCount === 0 && (
                    <p className="text-center text-smoke-dim text-xs py-6">
                      no {isQuestion ? 'answers' : 'replies'} yet — be the first
                    </p>
                  )}
                </div>
              </Motion.div>

            </div>

            <div className="hidden lg:block">
              <div className="lg:sticky lg:top-32 space-y-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    navigate('/community');
                  }}
                >
                  <div className="relative community-post-detail__sidebar-search">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-smoke-dim pointer-events-none" />
                    <NewsInput
                      type="text"
                      value={sidebarSearch}
                      onChange={(e) => setSidebarSearch(e.target.value)}
                      placeholder="Search discussions..."
                      className="pr-4 py-2.5"
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
