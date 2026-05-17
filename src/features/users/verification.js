export const SPECIALIST_VERIFICATION_STATUSES = {
  PENDING_EMAIL: 'pending-email-verification',
  PENDING_DETAILS: 'pending-details',
  PENDING_REVIEW: 'pending',
  NEEDS_MORE_INFO: 'needs-more-info',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const SPECIALIST_SECURE_CONTACT_METHODS = [
  { value: 'signal', label: 'Signal' },
  { value: 'email', label: 'Encrypted email' },
  { value: 'wire', label: 'Wire / secure call' },
  { value: 'simplex', label: 'SimpleX' },
];

export const SPECIALIST_AVAILABILITY_OPTIONS = [
  { value: 'limited', label: 'Limited / evenings only' },
  { value: 'business-hours', label: 'Business hours' },
  { value: 'extended', label: 'Extended coverage' },
  { value: 'urgent-only', label: 'Urgent escalation only' },
];

export const SPECIALIST_SUPPORT_AREAS = [
  'Source protection',
  'Incident response',
  'Account recovery',
  'Harassment and doxxing',
  'Malware and suspicious files',
  'Travel and device seizure',
  'Secure communications',
  'Operational security',
];

export const dossierRequiredStatuses = new Set([
  SPECIALIST_VERIFICATION_STATUSES.PENDING_DETAILS,
  SPECIALIST_VERIFICATION_STATUSES.NEEDS_MORE_INFO,
  SPECIALIST_VERIFICATION_STATUSES.REJECTED,
]);

export const specialistNeedsVerificationDossier = (status) => dossierRequiredStatuses.has(status);
