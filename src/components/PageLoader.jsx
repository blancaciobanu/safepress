import { Shield } from 'lucide-react';

const PageLoader = ({ text = 'Loading…' }) => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Shield className="w-8 h-8 text-oxblood animate-pulse" />
      <p className="eyebrow sm text-smoke">{text}</p>
    </div>
  </div>
);

export default PageLoader;
