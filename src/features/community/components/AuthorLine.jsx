import VerifiedBadge from '../../../components/VerifiedBadge';
import { getRoleColor } from '../../../utils/userUtils';

const AUTHOR_LINE_VARIANTS = {
  default: {
    container: 'gap-1.5',
    name: 'text-[13px] md:text-sm font-semibold leading-none',
    badge: 'xs',
    pending: 'text-[9px] font-bold tracking-widest uppercase text-smoke bg-paper-soft/80 border border-ink/10 px-1.5 py-0.5',
    anonymous: 'text-[9px] font-bold tracking-widest uppercase text-smoke-dim',
  },
  comment: {
    container: 'gap-1.5',
    name: 'text-[15px] md:text-base font-semibold tracking-[0.005em] leading-none',
    badge: 'sm',
    pending: 'text-[10px] font-bold tracking-[0.14em] uppercase text-smoke bg-paper-soft/80 border border-ink/10 px-1.5 py-0.5',
    anonymous: 'text-[10px] font-bold tracking-[0.14em] uppercase text-smoke-dim',
  },
};

const resolveAuthor = (item) => {
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

export const AuthorLine = ({ item, onOpenProfile, className = '', variant = 'default' }) => {
  const a = resolveAuthor(item);
  const clickable = a.clickable && onOpenProfile && !a.anonymous;
  const nameColor = a.anonymous ? 'text-smoke-dim' : getRoleColor(a.type, a.verified);
  const styles = AUTHOR_LINE_VARIANTS[variant] ?? AUTHOR_LINE_VARIANTS.default;

  const inner = (
    <>
      <span className={`${styles.name} ${nameColor}`}>{a.name}</span>

      {a.type === 'specialist' && a.verified && <VerifiedBadge size={styles.badge} />}

      {a.type === 'specialist' && !a.verified && (
        <span className={styles.pending}>
          unverified
        </span>
      )}

      {a.anonymous && (
        <span className={styles.anonymous}>
          anonymous
        </span>
      )}
    </>
  );

  return (
    <div className={`flex items-center ${styles.container} ${className}`}>
      {clickable ? (
        <button
          onClick={(e) => { e.stopPropagation(); onOpenProfile(item.authorId, a.type); }}
          className={`flex items-center ${styles.container} hover:opacity-75 transition-opacity`}
        >
          {inner}
        </button>
      ) : (
        inner
      )}
    </div>
  );
};
