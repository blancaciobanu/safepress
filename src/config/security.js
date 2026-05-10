export const MIN_PASSWORD_LENGTH = 12;

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).+$/;

export const isStrongPassword = (password = '') =>
  password.length >= MIN_PASSWORD_LENGTH && PASSWORD_PATTERN.test(password);

export const getPasswordRequirementMessage = () =>
  `password must be at least ${MIN_PASSWORD_LENGTH} characters and include uppercase, lowercase, a number, and a symbol`;

export const isAdminFromClaims = (claims = {}) =>
  claims?.admin === true && claims?.email_verified === true;

export const SUPPORT_REQUEST_TYPES = ['hacked', 'source', 'doxxed', 'phishing', 'other'];
export const SUPPORT_REQUEST_URGENCIES = ['emergency', 'urgent', 'normal'];
export const SUPPORT_CONTACT_METHODS = ['email', 'phone', 'signal'];
export const COMMUNITY_POST_TYPES = ['discussion', 'question'];
export const COMMUNITY_CATEGORIES = [
  'device-security',
  'source-protection',
  'communication',
  'data-protection',
  'physical-safety',
  'legal-rights',
  'general',
];
