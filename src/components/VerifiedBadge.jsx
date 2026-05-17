const EditorialCheck = ({ className = '' }) => (
  <svg
    viewBox="0 0 12 10"
    fill="none"
    strokeWidth="1.8"
    stroke="currentColor"
    className={className}
    aria-hidden="true"
  >
    <polyline points="1,5.2 4.4,9 11,1" />
  </svg>
);

const SIZES = {
  xs: { box: 'w-3.5 h-3.5', mark: 'w-2 h-2' },
  sm: { box: 'w-4 h-4',   mark: 'w-2.5 h-2.5' },
  md: { box: 'w-5 h-5',   mark: 'w-3 h-3' },
  lg: { box: 'w-6 h-6',   mark: 'w-3.5 h-3.5' },
};

const VerifiedBadge = ({ size = 'sm', showText = false }) => {
  const { box, mark } = SIZES[size] ?? SIZES.sm;

  if (showText) {
    return (
      <span className="inline-flex items-center gap-1.5 text-brass" title="Verified Security Specialist">
        <EditorialCheck className={mark} />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">verified</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center border border-brass/50 text-brass flex-shrink-0 ${box}`}
      title="Verified Security Specialist"
    >
      <EditorialCheck className={mark} />
    </span>
  );
};

export default VerifiedBadge;
