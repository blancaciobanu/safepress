import VerifiedBadge from '../../../components/VerifiedBadge';
import { getRoleColor } from '../../../utils/userUtils';

export const resolveAuthor = (item) => {
  if (item?.isAnonymous) {
    return { name: 'anonymous', type: 'journalist', anonymous: true, verified: false, clickable: false };
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

export const AuthorLine = ({ item, onOpenProfile, className = '' }) => {
  const a = resolveAuthor(item);
  const clickable = a.clickable && onOpenProfile && !a.anonymous;
  const nameColor = a.anonymous ? 'text-smoke-dim' : getRoleColor(a.type, a.verified);

  const inner = (
    <>
      <span className={`text-xs font-semibold lowercase ${nameColor}`}>{a.name}</span>

      {a.type === 'specialist' && a.verified && <VerifiedBadge size="xs" />}

      {a.type === 'specialist' && !a.verified && (
        <span className="text-[9px] font-bold tracking-widest uppercase text-smoke bg-paper-soft/80 border border-ink/10 px-1.5 py-0.5">
          unverified
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
          onClick={(e) => { e.stopPropagation(); onOpenProfile(item.authorId, a.type); }}
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
