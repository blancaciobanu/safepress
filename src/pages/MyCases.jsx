import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  listenToSupportRequestsByRequester,
  SUPPORT_CASE_MARKERS,
} from '../features/support/services/supportService';
import { logError } from '../utils/logger';
import { NewsNotice, NewsPage, NewsRule } from '../components/editorial/NewsPage';
import PageLoader from '../components/PageLoader';
import { caseFileRef } from '../utils/caseRef';
import { CRISIS_LABELS, URGENCY_LABELS } from '../features/support/supportCase.constants';

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
      <NewsPage>
        <PageLoader text="Loading your cases…" />
      </NewsPage>
    );
  }

  const openCount = cases.filter((c) => c.status === 'open').length;
  const activeCount = cases.filter((c) => c.status === 'claimed').length;
  const resolvedCount = cases.filter((c) => c.status === 'resolved').length;

  return (
    <NewsPage>
      <Motion.div
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
            Your case desk<span className="italic-ox">.</span>
          </h1>
          <p className="mt-5 text-base text-ink-soft leading-relaxed">
            Open a desk to follow the thread, answer specialist questions, and keep the resolution on file.
          </p>
        </div>

        {cases.length > 0 && (
          <div className="specialist-desk__stats mt-10">
            {[
              { value: openCount,    label: 'in intake',          tone: 'brass'   },
              { value: activeCount,  label: 'with a specialist',  tone: 'oxblood' },
              { value: resolvedCount,label: 'resolved',            tone: 'olive'   },
            ].map((stat) => (
              <div key={stat.label} className={`specialist-stat specialist-stat--${stat.tone}`}>
                <p className="specialist-stat__kicker">{stat.label}</p>
                <p className="specialist-stat__value">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <NewsNotice tone="danger" icon={AlertTriangle} className="mt-8">
            <p className="text-sm text-ink-soft">{error}</p>
          </NewsNotice>
        )}

        {!error && cases.length === 0 && (
          <div className="mt-16">
            <p className="eyebrow sm text-smoke-dim mb-4">no cases on file</p>
            <p className="text-sm text-smoke mb-8 max-w-prose">
              You haven't filed a support request yet. If you're facing a security incident, open one now.
            </p>
            <Link to="/request-support" className="link-handdrawn">
              File a support request →
            </Link>
          </div>
        )}

        {cases.length > 0 && (
          <div className="mt-10 space-y-3">
            {cases.map((caseItem, index) => {
              const urgency = URGENCY_LABELS[caseItem.urgency] || caseItem.urgency;
              const crisisLabel = CRISIS_LABELS[caseItem.crisisType] || caseItem.crisisType;
              const markerLabel = CASE_MARKER_LABELS[caseItem.caseMarker];
              const date = new Date(caseItem.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              });

              const statusLabel =
                caseItem.status === 'open'
                  ? 'in intake'
                  : caseItem.status === 'claimed'
                    ? 'with a specialist'
                    : 'resolution filed';

              return (
                <Motion.div
                  key={caseItem.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className={`my-cases-card my-cases-card--${caseItem.status}`}
                >
                  <div className="my-cases-card__head">
                    <span className="eyebrow sm text-oxblood">
                      {statusLabel} · {caseFileRef(caseItem)}
                    </span>
                    <span className="eyebrow sm text-smoke-dim">{urgency}</span>
                  </div>

                  <h2 className="display-soft text-2xl md:text-3xl leading-tight mt-2">
                    {crisisLabel}<span className="italic-ox">.</span>
                  </h2>

                  {caseItem.description && (
                    <p className="my-cases-card__excerpt">
                      &ldquo;{caseItem.description.length > 140
                        ? caseItem.description.slice(0, 140) + '…'
                        : caseItem.description}&rdquo;
                    </p>
                  )}

                  <div className="my-cases-card__meta">
                    <span>filed {date}</span>
                    {caseItem.claimedByName && (
                      <span>specialist · {caseItem.claimedByName}</span>
                    )}
                    {markerLabel && <span>{markerLabel}</span>}
                    {caseItem.resolvedAt && (
                      <span>
                        resolved {new Date(caseItem.resolvedAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                    )}
                    {caseItem.feedback && <span>feedback filed</span>}
                  </div>

                  <div className="my-cases-card__footer">
                    <Link
                      to={`/support-cases/${caseItem.id}`}
                      className="my-cases-card__link"
                    >
                      open case desk →
                    </Link>
                  </div>
                </Motion.div>
              );
            })}
          </div>
        )}

        <div className="asterism mt-12 mb-6">⁂</div>

        <div className="flex items-center gap-6 pb-4">
          <Link to="/request-support" className="link-handdrawn text-sm">
            File a new request →
          </Link>
        </div>
      </Motion.div>
    </NewsPage>
  );
};

export default MyCases;
