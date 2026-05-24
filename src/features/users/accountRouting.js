import { SPECIALIST_VERIFICATION_STATUSES, specialistNeedsVerificationDossier } from './verification';

export const needsWelcomePathChoice = (user) => {
  if (!user || user.isAdmin) return false;
  return user.accountType === 'journalist' && !user.welcomeCompletedAt;
};

export const getPostAuthPath = (user) => {
  if (!user) return '/';
  if (needsWelcomePathChoice(user)) return '/welcome';

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
