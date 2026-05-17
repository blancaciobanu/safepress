import { getInitials } from '../../../utils/userUtils';

const AVATAR_SIZES = {
  xs: { dim: 20, fontSize: 8 },
  sm: { dim: 28, fontSize: 11 },
  md: { dim: 36, fontSize: 13 },
  lg: { dim: 44, fontSize: 16 },
};

export const UserAvatar = ({
  name = '',
  avatarUrl = null,
  size = 'md',
}) => {
  const { dim, fontSize } = AVATAR_SIZES[size] ?? AVATAR_SIZES.md;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: dim, height: dim, flexShrink: 0 }}
        className="rounded-full object-cover border border-ink/15"
      />
    );
  }

  return (
    <div
      style={{ width: dim, height: dim, fontSize, flexShrink: 0 }}
      className="bg-paper-soft border border-ink/20 flex items-center justify-center font-display font-bold text-ink flex-shrink-0"
    >
      {getInitials(name)}
    </div>
  );
};
