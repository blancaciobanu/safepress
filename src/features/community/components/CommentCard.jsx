import { CheckCircle2, CornerDownRight, Flag, Pencil, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { timeAgo } from '../../../utils/time';
import { UserAvatar } from './UserAvatar';
import { AuthorLine } from './AuthorLine';
import { CommunityRichText } from './CommunityRichText';
import { CommunityRichTextEditor } from './CommunityRichTextEditor';
import { AUTHOR_META_CLASS, getRoleLabel } from '../utils/authorHelpers';

const MAX_COMMUNITY_COMMENT_LENGTH = 5000;

const CommentCard = ({
  comment,
  depth = 0,
  repliesByParent,
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
  onAcceptAnswer,
  onAddReply,
  onEditComment,
  setDeleteTarget,
  setReportDialog,
  setError,
}) => {
  const { user } = useAuth();

  const isAccepted = post.acceptedCommentId && comment.id === post.acceptedCommentId;
  const canAccept = post.type === 'question' && isAuthor && !comment.deleted;
  const canDelete = user && comment.authorId === user.uid && !comment.deleted;
  const canEdit = user && comment.authorId === user.uid && !comment.deleted;
  const canReport = user && comment.authorId && comment.authorId !== user.uid && !comment.deleted;
  const canReply = user && !isClosed && !comment.deleted;
  const isNested = depth > 0;
  const isActiveReply = replyTarget?.id === comment.id;
  const isActiveEdit = editingCommentId === comment.id;
  const editDraftTrimmed = editCommentDraft.trim();
  const editDraftOverLimit = editDraftTrimmed.length > MAX_COMMUNITY_COMMENT_LENGTH;
  const childReplies = repliesByParent.get(comment.id) || [];
  const trimmedReplyDraft = replyDraft.trim();
  const replyDraftLength = trimmedReplyDraft.length;
  const replyDraftOverLimit = replyDraftLength > MAX_COMMUNITY_COMMENT_LENGTH;
  const commentParagraphs = comment.content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const renderedParagraphs = commentParagraphs.length ? commentParagraphs : [comment.content];
  const commentRoleLabel = comment.deleted ? null : getRoleLabel(comment);

  const sharedProps = {
    post, isAuthor, isClosed,
    getAuthorAvatarUrl, openProfile, submitting,
    replyTarget, setReplyTarget, replyDraft, setReplyDraft, replyError, setReplyError,
    editingCommentId, setEditingCommentId, editCommentDraft, setEditCommentDraft,
    editCommentError, setEditCommentError,
    onAcceptAnswer, onAddReply, onEditComment,
    setDeleteTarget, setReportDialog, setError,
    repliesByParent,
  };

  return (
    <div className={isNested ? 'mt-4 ml-4 border-l border-ink/10 pl-4 md:ml-6 md:pl-5' : ''}>
      <div
        className={`bg-paper-soft border border-ink/12 ${
          isNested ? 'p-4 border-l-2' : 'p-5 border-l-4'
        } ${isAccepted ? 'border-l-olive-500' : 'border-l-ink/10'}`}
      >
        {isAccepted && (
          <div className="flex items-center gap-1.5 mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-olive-500" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-olive-400">accepted answer</span>
          </div>
        )}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <UserAvatar
              name={comment.authorName}
              avatarUrl={comment.deleted ? null : getAuthorAvatarUrl(comment.authorId)}
              accountType={comment.authorType}
              anonymous={comment.deleted}
              size={isNested ? 'md' : 'reply'}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {comment.deleted ? (
                    <span className="text-[14px] font-semibold leading-none text-smoke-dim italic">deleted</span>
                  ) : (
                    <AuthorLine item={comment} onOpenProfile={openProfile} variant="comment" />
                  )}
                </div>
                {commentRoleLabel && (
                  <p className={AUTHOR_META_CLASS}>
                    {commentRoleLabel}
                  </p>
                )}
              </div>
              <span className="text-[11px] text-smoke-dim leading-none whitespace-nowrap pt-0.5 flex items-center gap-1">
                {timeAgo(comment.createdAt)}
                {comment.edited && <span className="text-[10px]">(edited)</span>}
              </span>
            </div>

            {comment.replyToAuthorName && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-smoke-dim">
                <CornerDownRight className="w-3 h-3" />
                <span>replying to {comment.replyToAuthorName}</span>
              </div>
            )}

            {isActiveEdit ? (
              <>
                <CommunityRichTextEditor
                  value={editCommentDraft}
                  onChange={(nextValue) => {
                    setEditCommentDraft(nextValue);
                    if (editCommentError) setEditCommentError('');
                  }}
                  placeholder="Edit your comment..."
                  rows="2"
                  className="mt-2 community-inline-reply-editor"
                  ariaInvalid={editDraftOverLimit}
                />
                <div className="community-reply-composer__footer">
                  <span className={`eyebrow sm ${editDraftOverLimit ? 'text-oxblood' : 'text-smoke-dim'}`}>
                    {editDraftTrimmed.length}/{MAX_COMMUNITY_COMMENT_LENGTH}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditCommentDraft('');
                        setEditCommentError('');
                      }}
                      className="text-[11px] text-smoke-dim hover:text-ink transition-colors"
                    >
                      cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditComment(comment)}
                      disabled={!editDraftTrimmed || editDraftOverLimit || submitting}
                      className="btn mono disabled:opacity-40"
                    >
                      {submitting ? '...' : 'save'}
                    </button>
                  </div>
                </div>
                {editCommentError && <p className="text-xs text-oxblood mt-2">{editCommentError}</p>}
              </>
            ) : (
              <>
                <CommunityRichText
                  content={renderedParagraphs.join('\n\n')}
                  className={`mt-2 break-words ${
                    comment.deleted
                      ? 'text-sm text-smoke-dim italic leading-relaxed'
                      : 'text-[15px] md:text-base text-ink-soft leading-[1.62]'
                  }`}
                  paragraphClassName="leading-[1.62]"
                  listClassName={comment.deleted
                    ? 'text-sm text-smoke-dim italic leading-relaxed'
                    : 'text-[15px] md:text-base text-ink-soft leading-[1.62]'}
                />

                {(canReply || canAccept || canEdit || canDelete || canReport) && (
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {canEdit && (
                      <button
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setEditCommentDraft(comment.content);
                          setEditCommentError('');
                        }}
                        className="flex items-center gap-1 text-[11px] text-smoke-dim hover:text-ink transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        edit
                      </button>
                    )}
                    {canReply && (
                      <button
                        onClick={() => {
                          setReplyTarget(comment);
                          setReplyDraft('');
                          setReplyError('');
                          setError('');
                        }}
                        className="flex items-center gap-1 text-[11px] text-smoke-dim hover:text-ink transition-colors"
                      >
                        <CornerDownRight className="w-3 h-3" />
                        reply
                      </button>
                    )}
                    {canAccept && (
                      <button
                        onClick={() => onAcceptAnswer(comment.id)}
                        className={`flex items-center gap-1 text-[11px] transition-colors ${
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
                        className="flex items-center gap-1 text-[11px] text-smoke-dim hover:text-oxblood transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        delete
                      </button>
                    )}
                    {canReport && (
                      <button
                        onClick={() => setReportDialog({ type: 'comment', postId: post.id, commentId: comment.id })}
                        className="flex items-center gap-1 text-[11px] text-smoke-dim hover:text-brass transition-colors"
                      >
                        <Flag className="w-3 h-3" />
                        report
                      </button>
                    )}
                  </div>
                )}

                {isActiveReply && (
                  <div className="mt-3 border-t border-ink/8 pt-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-[11px] text-smoke">
                        replying to <span className="font-semibold text-ink">{comment.authorName}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTarget(null);
                          setReplyDraft('');
                          setReplyError('');
                        }}
                        className="text-[11px] text-smoke-dim hover:text-ink transition-colors"
                      >
                        cancel
                      </button>
                    </div>
                    <CommunityRichTextEditor
                      value={replyDraft}
                      onChange={(nextValue) => {
                        setReplyDraft(nextValue);
                        if (replyError) setReplyError('');
                      }}
                      placeholder={`Reply to ${comment.authorName}...`}
                      rows="2"
                      className="community-inline-reply-editor"
                      ariaInvalid={replyDraftOverLimit}
                    />
                    <div className="community-reply-composer__footer">
                      <span className={`eyebrow sm ${replyDraftOverLimit ? 'text-oxblood' : 'text-smoke-dim'}`}>
                        {replyDraftLength}/{MAX_COMMUNITY_COMMENT_LENGTH}
                      </span>
                      <button
                        type="button"
                        onClick={() => onAddReply(comment)}
                        disabled={!trimmedReplyDraft || replyDraftOverLimit || submitting}
                        className="btn mono disabled:opacity-40"
                      >
                        <Send className="w-3 h-3" />
                        {submitting ? '...' : 'reply'}
                      </button>
                    </div>
                    {replyError && <p className="text-xs text-oxblood mt-2">{replyError}</p>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {childReplies.length > 0 && (
        <div>
          {childReplies.map((reply) => (
            <CommentCard
              key={reply.id ?? reply.createdAt ?? reply.content}
              comment={reply}
              depth={depth + 1}
              {...sharedProps}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentCard;
