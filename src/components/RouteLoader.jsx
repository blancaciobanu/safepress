import { Shield } from 'lucide-react';

const RouteLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center px-4">
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-midnight-400/10 border border-ink/[0.12] mb-4">
        <Shield className="w-7 h-7 text-oxblood animate-pulse" />
      </div>
      <p className="text-sm text-gray-500 lowercase">loading page...</p>
    </div>
  </div>
);

export default RouteLoader;
