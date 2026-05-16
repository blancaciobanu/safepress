import { EyeOff, Pen, Shield } from 'lucide-react';

/* Deterministic colored avatar.
   Colors picked by name hash so the same user always gets the same color.
   Icon picked by role/anonymous flag. */

const AVATAR_COLORS = [
  '#4361EE', '#A78BFA', '#2DD4BF', '#F59E0B', '#EF4444',
  '#10B981', '#EC4899', '#3B82F6', '#F97316', '#8B5CF6',
];

const AVATAR_SIZES = {
  xs: { dim: 20, icon: 10 },
  sm: { dim: 28, icon: 13 },
  md: { dim: 36, icon: 16 },
  lg: { dim: 44, icon: 20 },
};

const colorFor = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h);
  }
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

export const UserAvatar = ({
  name = '',
  accountType = 'journalist',
  anonymous = false,
  size = 'md',
}) => {
  const { dim, icon } = AVATAR_SIZES[size] ?? AVATAR_SIZES.md;
  const Icon = anonymous ? EyeOff : accountType === 'specialist' ? Shield : Pen;
  const bg = anonymous ? '#374151' : colorFor(name);

  return (
    <div
      style={{ width: dim, height: dim, backgroundColor: bg, flexShrink: 0 }}
      className="rounded-full flex items-center justify-center text-white"
    >
      <Icon style={{ width: icon, height: icon }} strokeWidth={2.5} />
    </div>
  );
};
