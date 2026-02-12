import { Award } from 'lucide-react';

const VerifiedBadge = ({ size = 'sm', showText = false }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  if (showText) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-olive-500/20 border border-olive-500/30 rounded-full text-xs font-semibold text-olive-400 lowercase">
        <Award className={sizeClasses[size]} />
        verified specialist
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center justify-center bg-olive-500/20 border border-olive-500/30 rounded-full p-1"
      title="Verified Security Specialist"
    >
      <Award className={`${sizeClasses[size]} text-olive-400`} />
    </span>
  );
};

export default VerifiedBadge;
