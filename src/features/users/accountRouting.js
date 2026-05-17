import { SPECIALIST_VERIFICATION_STATUSES, specialistNeedsVerificationDossier } from './verification';

export const NEW_USER_SESSION_KEY = 'safepress:new-user';

export const getPostAuthPath = (user, { isNew = false } = {}) => {
  if (!user) return '/';
  if (isNew) return '/welcome';

  if (user.accountType === 'specialist') {
    const status = !user.emailVerified
      ? SPECIALIST_VERIFICATION_STATUSES.PENDING_EMAIL
      : (user.verificationStatus || SPECIALIST_VERIFICATION_STATUSES.PENDING_REVIEW);

    if (specialistNeedsVerificationDossier(status)) {
      return '/specialist-verification';
    }

    return '/specialist-dashboard';
  }

  return '/';
};
