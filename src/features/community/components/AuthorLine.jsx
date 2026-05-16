import VerifiedBadge from '../../../components/VerifiedBadge';

/* Resolve the author display values from a post or comment.
   Anonymous posts get fully anonymized regardless of what's on the doc. */
export const resolveAuthor = (item) => {
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

  const verified =
    item?.authorVerificationStatus === 'approved' || item?.isVerified === true;
  const isSpecialist = item?.authorType === 'specialist';

  return {
    name: item?.authorName || 'user',
    type: item?.authorType || 'journalist',
    anonymous: false,
    verified,
    status: isSpecialist
      ? (item?.authorVerificationStatus || (verified ? 'approved' : 'pending'))
      : null,
    clickable: !!item?.authorId,
  };
};

/* Author byline with verification badge + role tag.
   Pass `onOpenProfile(uid, type)` to make the name clickable. */
export const AuthorLine = ({ item, onOpenProfile, className = '' }) => {
  const a = resolveAuthor(item);
  const clickable = a.clickable && onOpenProfile && !a.anonymous;

  const inner = (
    <>
      <span className="text-xs font-semibold text-ink-soft lowercase">{a.name}</span>
      {a.type === 'specialist' && a.verified && <VerifiedBadge size="xs" />}
      {a.type === 'specialist' && !a.verified && (
        <span className="text-[9px] font-bold tracking-widest uppercase text-smoke bg-paper-soft/80 border border-ink/10 px-1.5 py-0.5 rounded">
          specialist · unverified
        </span>
      )}
      {a.type === 'journalist' && !a.anonymous && (
        <span className="text-[9px] font-bold tracking-widest uppercase text-smoke-dim">
          journalist
        </span>
      )}
      {a.anonymous && (
        <span className="text-[9px] font-bold tracking-widest uppercase text-smoke-dim">
          anonymous
        </span>
      )}
    </>
  );

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {clickable ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenProfile(item.authorId, a.type);
          }}
          className="flex items-center gap-1.5 hover:opacity-75 transition-opacity"
        >
          {inner}
        </button>
      ) : (
        inner
      )}
    </div>
  );
};
