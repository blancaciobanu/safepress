export const AUTHOR_META_CLASS =
  'mt-2 font-mono text-[9px] font-semibold uppercase leading-none tracking-[0.24em] text-smoke-dim';

export const getRoleLabel = (item, { anonymousLabel = 'Posted Anonymously' } = {}) => {
  if (item?.isAnonymous) return anonymousLabel;
  if (item?.authorType === 'specialist') {
    return item?.authorVerificationStatus === 'approved' || item?.isVerified
      ? 'Verified Security Specialist'
      : 'Security Specialist';
  }
  return 'Journalist';
};
