const CODENAME_POOL_A = [
  'Slate', 'Iron', 'Coal', 'Ash', 'Obsidian', 'Copper', 'Flint', 'Chalk', 'Ember', 'Cedar',
  'Indigo', 'Silver', 'Steel', 'Shadow', 'Granite', 'Onyx', 'Bronze', 'Birch', 'Quartz', 'Hazel',
  'Dusk', 'Thorn', 'Heath', 'Frost', 'Storm', 'Peat', 'Cinder', 'Sable', 'Umber', 'Shale',
  'Briar', 'Amber', 'Alder', 'Brine', 'Holt', 'Gorse', 'Marsh', 'Flax', 'Larch', 'Weld',
  'Rivet', 'Calyx', 'Vane', 'Spine', 'Cairn', 'Scree', 'Riven', 'Tarn', 'Sedge', 'Croft',
];

const CODENAME_POOL_B = [
  'Wire', 'Ledger', 'Dispatch', 'Bureau', 'Fox', 'Hawk', 'Wren', 'Cipher', 'Meridian',
  'Chronicle', 'Signal', 'Courier', 'Raven', 'Swift', 'Crane', 'Heron', 'Quill', 'Index',
  'Column', 'Broadside', 'Register', 'Tribune', 'Herald', 'Gazette', 'Kestrel', 'Linnet',
  'Reed', 'Tor', 'Beck', 'Moor', 'Vale', 'Ridge', 'Osprey', 'Press', 'Record',
  'Monitor', 'Finch', 'Stag', 'Skein', 'Teal', 'Stint', 'Piper', 'Bunting',
  'Snipe', 'Plover', 'Godwit', 'Curlew', 'Lapwing', 'Brant', 'Field',
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const generateUsername = () => `${pick(CODENAME_POOL_A)} ${pick(CODENAME_POOL_B)}`;

export const getInitials = (name = '') =>
  name.trim().split(/[\s_]+/).filter(w => w && !/^\d+$/.test(w)).slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '').join('') || '?';

export const generateUserIdentity = () => ({ username: generateUsername() });

export const getDisplayName = (user) => {
  if (!user) return '';
  if (user.isAdmin) return user.displayName || user.username || 'Admin';
  if (user.accountType === 'specialist') return user.realName || user.username || 'Specialist';
  return user.username || 'Private account';
};

export const getRoleColor = (accountType, isVerified = false) => {
  if (accountType === 'admin') return 'text-oxblood';
  if (accountType === 'specialist') return isVerified ? 'text-brass' : 'text-smoke';
  return 'text-ink';
};
