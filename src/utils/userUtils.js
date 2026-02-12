/**
 * User Utility Functions
 * Generates anonymous usernames and avatar icons for user privacy
 */

// Avatar icon options (animals and nature emojis for friendly, safe feel)
export const avatarIcons = [
  '🦊', // Fox
  '🐧', // Penguin
  '🦉', // Owl
  '🐺', // Wolf
  '🦅', // Eagle
  '🐱', // Cat
  '🐶', // Dog
  '🐻', // Bear
  '🦁', // Lion
  '🐯', // Tiger
  '🐼', // Panda
  '🐨', // Koala
  '🦔', // Hedgehog
  '🦎', // Lizard
  '🐢', // Turtle
  '🦋', // Butterfly
  '🐝', // Bee
  '🦜', // Parrot
  '🦚', // Peacock
  '🌸', // Cherry Blossom
  '🌺', // Hibiscus
  '🌻', // Sunflower
  '🌵', // Cactus
  '🍀', // Four Leaf Clover
  '🌙', // Crescent Moon
  '⭐', // Star
  '💫', // Dizzy
  '🔮', // Crystal Ball
  '🎭', // Theater Masks
  '🎨', // Artist Palette
];

// Username prefixes (professional, security-focused)
const usernamePrefixes = [
  'SecureReporter',
  'SafeJournalist',
  'ProtectedWriter',
  'AnonymousPress',
  'ShieldedScribe',
  'GuardedEditor',
  'PrivateInvestigator',
  'CloakedCorrespondent',
  'MaskedMedia',
  'HiddenTruth',
  'VeiledVoice',
  'CrypticChronicler',
  'StealthStory',
  'CovertCoverage',
  'DiscreetDispatch',
];

/**
 * Generate a random anonymous username
 * Format: Prefix_#### (e.g., SecureReporter_4829)
 */
export const generateUsername = () => {
  const prefix = usernamePrefixes[Math.floor(Math.random() * usernamePrefixes.length)];
  const randomNumber = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  return `${prefix}_${randomNumber}`;
};

/**
 * Get a random avatar icon
 */
export const getRandomAvatarIcon = () => {
  return avatarIcons[Math.floor(Math.random() * avatarIcons.length)];
};

/**
 * Get avatar icon by index (for consistent assignment)
 */
export const getAvatarIcon = (index) => {
  return avatarIcons[index % avatarIcons.length];
};

/**
 * Generate unique user identity (username + icon)
 * Returns: { username: string, avatarIcon: string }
 */
export const generateUserIdentity = () => {
  return {
    username: generateUsername(),
    avatarIcon: getRandomAvatarIcon()
  };
};
