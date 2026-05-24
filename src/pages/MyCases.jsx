import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  listenToSupportRequestsByRequester,
  SUPPORT_CASE_MARKERS,
} from '../features/support/services/supportService';
import { logError } from '../utils/logger';
import { NewsNotice, NewsPage, NewsRule } from '../components/editorial/NewsPage';
import PageLoader from '../components/PageLoader';

const CRISIS_LABELS = {
  hacked: 'hacked account',
  source: 'source exposed',
  doxxed: 'doxxing incident',
  phishing: 'phishing attempt',
  other: 'security concern',
};

const STATUS_CONFIG = {
  open: { label: 'waiting in intake', color: 'text-brass', border: 'border-brass/30', bg: 'bg-brass/8' },
  claimed: { label: 'with a specialist', color: 'text-oxblood', border: 'border-oxblood/30', bg: 'bg-oxblood/8' },
  resolved: { label: 'resolution filed', color: 'text-smoke', border: 'border-ink/20', bg: 'bg-paper-soft/80' },
};

const URGENCY_LABELS = {
  emergency: 'emergency',
  urgent: 'urgent',
  normal: 'normal',
};

const CASE_MARKER_LABELS = {
  [SUPPORT_CASE_MARKERS.AWAITING_SPECIALIST]: 'awaiting specialist',
  [SUPPORT_CASE_MARKERS.AWAITING_REPORTER]: 'awaiting you',
  [SUPPORT_CASE_MARKERS.MONITORING]: 'monitoring',
  [SUPPORT_CASE_MARKERS.READY_TO_FILE]: 'ready to file',
};

const MyCases = () => {
  const { user } = useAuth();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const unsubscribe = listenToSupportRequestsByRequester({
      requesterId: user.uid,
      onData: (result) => {
        if (cancelled) return;
        setCases(result);
        setLoading(false);
      },
      onError: (err) => {
        logError('Error loading my cases:', err);
        if (!cancelled) {
          setError('Could not load your cases right now.');
          setLoading(false);
        }
      },
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user]);

  if (user?.accountType === 'specialist') return <Navigate to="/specialist-dashboard" replace />;

  if (loading) {
    return (
      <NewsPage className="specialist-casefile" max="reading">
        <PageLoader text="Loading your cases…" />
      </NewsPage>
    );
  }

  return (
    <NewsPage className="specialist-casefile" max="reading">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="news-page-topline">
          <span className="eyebrow sm text-oxblood">Support · My cases</span>
          <span className="eyebrow sm">{cases.length} on file</span>
        </div>
        <NewsRule />

        <div className="mt-10 max-w-prose">
          <h1 className="display text-4xl md:text-6xl leading-none">
            Your support cases<span className="italic-ox">.</span>
          </h1>
          <p className="mt-5 text-base text-smoke leading-relaxed">
            Open a desk to follow the thread, answer specialist questions, and read the final report.
          </p>
        </div>

        {error && (
          <NewsNotice tone="danger" icon={AlertTriangle} className="mt-8">
            <p className="text-sm text-ink-soft">{error}</p>
          </NewsNotice>
        )}

        {!error && cases.length === 0 && (
          <div className="mt-16 text-center">
            <p className="eyebrow sm text-smoke-dim mb-4">no cases on file</p>
            <p className="text-sm text-smoke mb-8">
              You haven't filed a support request yet. If you're facing a security incident, open one now.
            </p>
            <Link to="/request-support" className="link-handdrawn">
              File a support request →
            </Link>
          </div>
        )}

        {cases.length > 0 && (
          <div className="mt-10 space-y-4">
            {cases.map((caseItem, index) => {
              const status = STATUS_CONFIG[caseItem.status] || STATUS_CONFIG.open;
              const urgency = URGENCY_LABELS[caseItem.urgency] || caseItem.urgency;
              const crisisLabel = CRISIS_LABELS[caseItem.crisisType] || caseItem.crisisType;
              const markerLabel = CASE_MARKER_LABELS[caseItem.caseMarker];
              const date = new Date(caseItem.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <motion.div
                  key={caseItem.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className="border border-ink/12 bg-paper-soft p-6 group"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${status.bg} ${status.color} ${status.border}`}>
                          {status.label}
                        </span>
                        <span className="text-[10px] text-smoke-dim uppercase tracking-widest">
                          {urgency}
                        </span>
                        {markerLabel && (
                          <span className="text-[10px] text-ink-soft uppercase tracking-widest">
                            {markerLabel}
                          </span>
                        )}
                        {caseItem.feedback && (
                          <span className="text-[10px] text-[#375E5A] uppercase tracking-widest">
                            feedback filed
                          </span>
                        )}
                      </div>

                      <h2 className="text-xl font-display font-bold text-ink leading-snug mb-2">
                        {crisisLabel}<span className="italic-ox">.</span>
                      </h2>

                      {caseItem.description && (
                        <p className="text-sm text-smoke leading-relaxed line-clamp-2 mb-3">
                          {caseItem.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-smoke-dim uppercase tracking-widest">
                        <span>filed {date}</span>
                        {caseItem.claimedByName && (
                          <span>specialist · {caseItem.claimedByName}</span>
                        )}
                        {caseItem.resolvedAt && (
                          <span>
                            resolved {new Date(caseItem.resolvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      to={`/support-cases/${caseItem.id}`}
                      className="flex-shrink-0 eyebrow sm text-oxblood hover:text-ink transition-colors whitespace-nowrap"
                    >
                      open desk →
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-16 pt-6 border-t border-ink/8 flex items-center justify-between">
          <Link to="/request-support" className="link-handdrawn text-sm">
            File a new request →
          </Link>
        </div>
      </motion.div>
    </NewsPage>
  );
};

export default MyCases;
