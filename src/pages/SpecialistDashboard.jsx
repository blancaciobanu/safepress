import { motion } from 'framer-motion';
import {
  Shield, AlertTriangle, CheckCircle, Clock, User,
  Star,
  Users, Award,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VerifiedBadge from '../components/VerifiedBadge';
import { reapplySpecialistVerification } from '../features/users/services/userService';
import {
  claimSupportRequest,
  getClaimedSupportRequestsBySpecialist,
  getOpenSupportQueueRequests,
  getResolvedSupportRequestsBySpecialist,
  resolveSupportRequest,
} from '../features/support/services/supportService';
import { logError } from '../utils/logger';
import { NewsPage, NewsRule } from '../components/editorial/NewsPage';

const CRISIS_LABELS = {
  hacked:   'hacked account',
  source:   'source exposed',
  doxxed:   'doxxing incident',
  phishing: 'phishing attempt',
  other:    'security concern',
};

const CRISIS_ICONS = { hacked: Shield, source: Users, doxxed: AlertTriangle, phishing: Shield, other: Shield };

const getMonogram = (value) =>
  (value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'SP';

const URGENCY_CONFIG = {
  emergency: { label: 'emergency', bg: 'bg-oxblood/12', text: 'text-oxblood', border: 'border-oxblood/30' },
  urgent:    { label: 'urgent',    bg: 'bg-brass/12',   text: 'text-brass',   border: 'border-brass/30' },
  normal:    { label: 'normal',    bg: 'bg-paper-soft/80',   text: 'text-smoke',    border: 'border-ink/10' },
};

const loadSpecialistRequests = async (specialistId) => {
  const [openRequests, claimedRequests, resolvedRequests] = await Promise.all([
    getOpenSupportQueueRequests(),
    getClaimedSupportRequestsBySpecialist(specialistId),
    getResolvedSupportRequestsBySpecialist(specialistId),
  ]);

  return {
    openRequests,
    claimedRequests,
    resolvedRequests,
  };
};

/* ─── Request Card ─────────────────────────────────────────────────────────── */

const RequestCard = ({
  req,
  userId,
  lane,
  busy = false,
  isDragging = false,
  onClaim,
  onResolve,
  onDragStart,
  onDragEnd,
}) => {
  const urgency = URGENCY_CONFIG[req.urgency] || URGENCY_CONFIG.normal;
  const CrisisIcon = CRISIS_ICONS[req.crisisType] || Shield;
  const isMine = req.claimedBy === userId;
  const privacyLocked = req.queueOnly && req.status === 'open';
  const canRoute = lane === 'open' || lane === 'active';
  const routeLabel = lane === 'open' ? 'drag to active' : 'drag to filed';
  const canResolveFromDesk = Boolean(
    req.caseReport?.summary?.trim() &&
    req.caseReport?.actionsTaken?.trim() &&
    req.caseReport?.nextSteps?.trim()
  );

  return (
    <motion.div
      layout="position"
      className={`specialist-request-card specialist-request-card--${lane}${busy ? ' is-routing' : ''}${isDragging ? ' is-dragging' : ''}`}
    >
      <div className="specialist-request-card__meta">
        <span className="eyebrow sm text-oxblood">
          {lane === 'open' ? 'Redacted intake' : lane === 'active' ? 'Active case file' : 'Filed note'}
        </span>
        {canRoute && (
          <div
            className="specialist-request-card__handle"
            draggable={!busy}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          >
            {busy ? 'routing...' : routeLabel}
          </div>
        )}
      </div>

      <div className="specialist-request-card__toggle">
        <div className={`specialist-request-card__icon ${urgency.bg} ${urgency.border}`}>
          <CrisisIcon className={`w-5 h-5 ${urgency.text}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-base font-medium text-ink lowercase">
              {CRISIS_LABELS[req.crisisType] || req.crisisType}
            </p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${urgency.bg} ${urgency.text} ${urgency.border}`}>
              {urgency.label}
            </span>
            {req.status === 'claimed' && isMine && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-ink/[0.06] text-oxblood border border-ink/30">
                active
              </span>
            )}
            {req.status === 'claimed' && !isMine && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-paper-soft/80 text-smoke border border-ink/10">
                claimed
              </span>
            )}
          </div>
          <p className="text-sm text-smoke lowercase line-clamp-1">
            {req.description}
          </p>
          <p className="text-[10px] text-smoke lowercase mt-1">
            {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {req.claimedByName && req.claimedBy !== userId && ` · claimed by ${req.claimedByName}`}
          </p>
        </div>
      </div>

      <div className="specialist-request-card__footer">
        <Link to={`/specialist-cases/${req.id}`} className="specialist-request-card__filelink">
          open case file →
        </Link>

        <div className="flex gap-2">
          {req.status === 'open' && (
            <button
              onClick={() => onClaim(req.id)}
              disabled={busy}
              className="flex items-center gap-1.5 px-4 py-2 bg-ink/[0.08] border border-ink/30  text-sm text-oxblood hover:bg-ink/[0.10] transition-all lowercase font-medium"
            >
              <User className="w-3.5 h-3.5" />
              {busy ? 'routing...' : 'claim this request'}
            </button>
          )}
          {req.status === 'claimed' && isMine && (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={() => onResolve(req.id)}
                disabled={busy || !canResolveFromDesk}
                title={canResolveFromDesk ? undefined : 'Save the resolution report in the case file before filing'}
                className="flex items-center gap-1.5 px-4 py-2 bg-olive-500/20 border border-olive-500/30  text-sm text-olive-500 hover:bg-olive-500/30 transition-all lowercase font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {busy ? 'filing...' : 'mark as resolved'}
              </button>
              {!canResolveFromDesk && (
                <p className="text-[10px] text-smoke lowercase">open case file to write the report first</p>
              )}
            </div>
          )}
        </div>
      </div>

      {!privacyLocked && lane !== 'resolved' && (
        <div className="specialist-request-card__details">
          <div className="specialist-request-card__meta-block">
            <p className="text-[10px] text-smoke-dim uppercase tracking-wider mb-1">name</p>
            <p className="text-sm text-ink lowercase">{req.requesterName}</p>
          </div>
          <div className="specialist-request-card__meta-block">
            <p className="text-[10px] text-smoke-dim uppercase tracking-wider mb-1">
              {req.contactMethod || 'email'}
            </p>
            <p className="text-sm text-ink lowercase break-all">{req.requesterEmail}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

/* ─── Main page ────────────────────────────────────────────────────────────── */

const SpecialistDashboard = () => {
  const { user, refreshUser } = useAuth();
  const navigate  = useNavigate();

  const [profile,      setProfile]      = useState(user);
  const [loading,      setLoading]      = useState(false);
  const [requests,     setRequests]     = useState([]);
  const [resolved,     setResolved]     = useState([]);
  const [claimedRequests, setClaimedRequests] = useState([]);
  const [routeBusyId, setRouteBusyId] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [activeDropLane, setActiveDropLane] = useState(null);

  const isSpecialist = user?.accountType === 'specialist';
  const isVerifiedSpecialist = isSpecialist && user?.verificationStatus === 'approved';
  const [reapplying, setReapplying] = useState(false);

  // Only redirect non-specialists; pending/rejected specialists stay here and see status
  useEffect(() => {
    if (!user) return;
    if (user.accountType !== 'specialist') navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  // Use the already-hydrated auth profile immediately.
  useEffect(() => {
    setProfile(user || null);
  }, [user]);

  const handleReapply = async () => {
    if (!user) return;
    setReapplying(true);
    try {
      await reapplySpecialistVerification(user.uid);
      const refreshedUser = await refreshUser();
      if (refreshedUser) setProfile(refreshedUser);
    } catch (e) {
      logError('Error reapplying:', e);
    } finally {
      setReapplying(false);
    }
  };

  // Fetch all request lists together for verified specialists.
  useEffect(() => {
    if (!isVerifiedSpecialist || !user) {
      setLoading(false);
      setRequests([]);
      setClaimedRequests([]);
      setResolved([]);
      return;
    }

    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      try {
        const {
          openRequests,
          claimedRequests: claimed,
          resolvedRequests,
        } = await loadSpecialistRequests(user.uid);

        if (cancelled) return;
        setRequests(openRequests);
        setClaimedRequests(claimed);
        setResolved(resolvedRequests);
      } catch (e) {
        if (!cancelled) {
          logError('Error fetching specialist dashboard data:', e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();

    return () => {
      cancelled = true;
    };
  }, [isVerifiedSpecialist, user]);

  const handleClaim = async (id) => {
    setRouteBusyId(id);
    try {
      const claimData = await claimSupportRequest({
        requestId: id,
        specialistId: user.uid,
        specialistName: user.realName || user.username,
      });
      setRequests(prev => prev.filter((request) => request.id !== id));
      const refreshedClaimed = await getClaimedSupportRequestsBySpecialist(user.uid);
      setClaimedRequests(refreshedClaimed.map((request) =>
        request.id === id ? { ...request, ...claimData } : request
      ));
    } catch (e) {
      logError('Error claiming:', e);
    } finally {
      setRouteBusyId((current) => (current === id ? null : current));
    }
  };

  const handleResolve = async (id) => {
    setRouteBusyId(id);
    try {
      const resolutionData = await resolveSupportRequest(id);
      const req = claimedRequests.find(r => r.id === id);
      setClaimedRequests(prev => prev.filter(r => r.id !== id));
      if (req) setResolved(prev => [{ ...req, ...resolutionData }, ...prev]);
    } catch (e) {
      logError('Error resolving:', e);
    } finally {
      setRouteBusyId((current) => (current === id ? null : current));
    }
  };

  if (loading || !isSpecialist) {
    return (
      <NewsPage >
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="eyebrow sm">Loading…</p>
          </div>
        </div>
      </NewsPage>
    );
  }

  // Pending / rejected specialists see a status view instead of the dashboard
  if (!isVerifiedSpecialist) {
    const status = user.emailVerified ? user.verificationStatus : 'pending-email-verification';
    const vd = profile?.verificationData || {};
    const submittedAt = vd.submittedAt ? new Date(vd.submittedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null;
    const rejectionReason = profile?.verificationRejectionReason;

    return (
      <NewsPage className="specialist-desk">
        <div className="specialist-desk__status">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-8"
          >
            <div className={`inline-flex items-center justify-center w-14 h-14  mb-5 border ${
              status === 'rejected'
                ? 'bg-oxblood/8 border-oxblood/20'
                : 'bg-amber-500/10 border-amber-500/20'
            }`}>
              {status === 'rejected' ? (
                <AlertTriangle className="w-7 h-7 text-oxblood" />
              ) : (
                <Clock className="w-7 h-7 text-amber-500" />
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 lowercase">
              {status === 'rejected'
                ? 'application not approved'
                : status === 'pending-email-verification'
                  ? 'verify your email first'
                  : 'verification in review'}
            </h1>

            <p className="text-base text-smoke lowercase max-w-md mx-auto leading-relaxed" style={{ letterSpacing: '0.03em' }}>
              {status === 'rejected'
                ? 'your specialist application was not approved. you can update your credentials and reapply.'
                : status === 'pending-email-verification'
                  ? 'your specialist application is saved, but it will not enter review until you verify your email address.'
                  : "we're reviewing your specialist credentials. you'll get access to the request queue once approved."}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="specialist-status-sheet space-y-5"
          >
            {status === 'rejected' && rejectionReason && (
              <div className="bg-crimson-500/5 border border-oxblood/20  p-4">
                <p className="text-[10px] text-oxblood uppercase tracking-widest font-bold mb-2">reason for rejection</p>
                <p className="text-sm text-ink-soft lowercase leading-relaxed">{rejectionReason}</p>
              </div>
            )}

            {status === 'pending' && (
              <div className="bg-amber-500/5 border border-amber-500/20  p-4">
                <p className="text-[10px] text-brass uppercase tracking-widest font-bold mb-2">expected timeline</p>
                <p className="text-sm text-ink-soft lowercase leading-relaxed">
                  applications are typically reviewed within 2–3 business days. you'll be notified by email once a decision is made.
                </p>
              </div>
            )}

            {status === 'pending-email-verification' && (
              <div className="bg-amber-500/5 border border-amber-500/20  p-4">
                <p className="text-[10px] text-brass uppercase tracking-widest font-bold mb-2">next step</p>
                <p className="text-sm text-ink-soft lowercase leading-relaxed">
                  open the verification email we sent you, confirm your address, then sign back in. your application will automatically move into the review queue.
                </p>
              </div>
            )}

            <div>
              <p className="text-[10px] text-smoke-dim uppercase tracking-widest font-bold mb-3">your submission</p>
              <div className="space-y-3 text-sm lowercase">
                {vd.expertise && (
                  <div>
                    <span className="text-smoke-dim">expertise: </span>
                    <span className="text-ink-soft">{vd.expertise}</span>
                  </div>
                )}
                {vd.organization && (
                  <div>
                    <span className="text-smoke-dim">organization: </span>
                    <span className="text-ink-soft">{vd.organization}</span>
                  </div>
                )}
                {vd.credentials && (
                  <div>
                    <span className="text-smoke-dim">credentials: </span>
                    <p className="text-ink-soft mt-1 leading-relaxed">{vd.credentials}</p>
                  </div>
                )}
                {submittedAt && (
                  <div>
                    <span className="text-smoke-dim">submitted: </span>
                    <span className="text-ink-soft">{submittedAt}</span>
                  </div>
                )}
              </div>
            </div>

            {status === 'rejected' && (
              <div className="pt-3 border-t border-ink/8">
                <button
                  onClick={handleReapply}
                  disabled={reapplying}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-ink hover:bg-ink-soft disabled:opacity-50 text-ink  font-semibold transition-all lowercase"
                >
                  <Shield className="w-4 h-4" />
                  {reapplying ? 'resubmitting...' : 'resubmit for review'}
                </button>
                <p className="text-xs text-smoke-dim text-center mt-3 lowercase">
                  update your credentials in settings, then click resubmit
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-smoke-dim lowercase pt-3 border-t border-ink/8">
              <span>while you wait, explore the app:</span>
              <Link to="/resources" className="text-oxblood hover:text-ink transition-colors">resources →</Link>
              <span>·</span>
              <Link to="/community" className="text-oxblood hover:text-ink transition-colors">community →</Link>
            </div>
          </motion.div>
        </div>
      </NewsPage>
    );
  }

  // Derived data
  const sp           = profile?.specialistProfile || {};
  const vd           = profile?.verificationData  || {};
  const openReqs     = requests.filter(r => r.status === 'open');
  const myActiveReqs = claimedRequests.filter(r => r.status === 'claimed' && r.claimedBy === user.uid);
  const ratedReqs    = resolved.filter(r => r.feedback);
  const avgRating    = ratedReqs.length
    ? ratedReqs.reduce((s, r) => s + r.feedback.rating, 0) / ratedReqs.length
    : null;
  const specialistMonogram = getMonogram(user.realName || user.username);
  const laneConfig = [
    {
      id: 'open',
      kicker: 'Intake tray',
      title: 'New requests',
      note: 'Requests stay redacted here until you pull them into the active folio.',
      requests: openReqs,
      empty: 'No new requests waiting in intake.',
    },
    {
      id: 'active',
      kicker: 'Active folio',
      title: 'Cases in progress',
      note: 'Claimed requests reveal the brief so you can work directly with the reporter.',
      requests: myActiveReqs,
      empty: 'No active cases yet. Pull one from intake when you are ready.',
    },
    {
      id: 'resolved',
      kicker: 'Filed notes',
      title: 'Closed resolutions',
      note: 'Keep recent closures and feedback on the desk for pattern memory.',
      requests: resolved,
      empty: 'Nothing filed yet. Resolved cases will collect here.',
    },
  ];

  const beginDeskDrag = (requestId, fromLane) => (event) => {
    event.dataTransfer.effectAllowed = 'move';
    setDragState({ id: requestId, from: fromLane });
  };

  const endDeskDrag = () => {
    setDragState(null);
    setActiveDropLane(null);
  };

  const canDropIntoLane = (laneId) => {
    if (!dragState) return false;
    return (dragState.from === 'open' && laneId === 'active')
      || (dragState.from === 'active' && laneId === 'resolved');
  };

  const allowLaneDrop = (laneId) => (event) => {
    if (!canDropIntoLane(laneId)) return;
    event.preventDefault();
    setActiveDropLane(laneId);
  };

  const leaveLaneDrop = (laneId) => () => {
    setActiveDropLane((current) => (current === laneId ? null : current));
  };

  const dropInLane = (laneId) => async (event) => {
    event.preventDefault();
    if (!dragState || !canDropIntoLane(laneId)) {
      endDeskDrag();
      return;
    }

    const { id, from } = dragState;
    setActiveDropLane(laneId);

    try {
      if (from === 'open' && laneId === 'active') {
        await handleClaim(id);
      } else if (from === 'active' && laneId === 'resolved') {
        await handleResolve(id);
      }
    } finally {
      endDeskDrag();
    }
  };

  return (
    <NewsPage className="specialist-desk">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="specialist-desk__header"
        >
          <div className="flex items-baseline justify-between pb-3">
            <span className="eyebrow sm text-oxblood">Specialist Desk · Casework queue</span>
            <span className="eyebrow sm">{openReqs.length + myActiveReqs.length + resolved.length} tracked cases</span>
          </div>
          <NewsRule />

          <div className="specialist-desk__hero">
              <div className="specialist-desk__identity">
                <div className="specialist-desk__avatar">
                  <span className="specialist-desk__avatar-mark">{specialistMonogram}</span>
                </div>
                <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h1 className="display text-4xl md:text-6xl leading-none">
                    {user.realName || user.username}<span className="italic-ox">.</span>
                  </h1>
                  <VerifiedBadge size="md" />
                </div>
                <p className="text-smoke lowercase text-sm mb-3">
                  security specialist
                  {vd.organization && (
                    <> · <span className="text-smoke">{vd.organization}</span></>
                  )}
                </p>

                {(sp.expertiseAreas?.length > 0 || vd.expertise) && (
                  <div className="flex flex-wrap gap-2">
                    {(sp.expertiseAreas?.length > 0 ? sp.expertiseAreas : [vd.expertise]).map(area => (
                      <span
                        key={area}
                        className="specialist-desk__chip"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="specialist-desk__note">
              <p className="eyebrow sm text-brass">How this desk works</p>
              <p className="news-card-copy mt-3">
                Claim a case from the open queue, work it through your active desk, and file it once the journalist confirms the immediate risk is contained.
              </p>
            </div>
          </div>

            <div className="specialist-desk__stats">
              {[
                {
                  value: resolved.length,
                  label: 'cases resolved',
                  tone: 'olive',
                },
                {
                  value: avgRating ? avgRating.toFixed(1) : '—',
                  label: `avg rating${ratedReqs.length ? ` (${ratedReqs.length})` : ''}`,
                  tone: 'brass',
                },
                {
                  value: myActiveReqs.length,
                  label: 'active now',
                  tone: 'oxblood',
                },
              ].map(stat => {
                return (
                  <div key={stat.label} className={`specialist-stat specialist-stat--${stat.tone}`}>
                    <p className="specialist-stat__kicker">{stat.label}</p>
                    <p className="specialist-stat__value">{stat.value}</p>
                  </div>
                );
              })}
            </div>
        </motion.div>

	        {/* ── 2-column layout ── */}
	        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">

	          {/* ── Left: investigations board ── */}
	          <motion.div
	            initial={{ opacity: 0, y: 6 }}
	            animate={{ opacity: 1, y: 0 }}
	            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
	            className="specialist-queue-panel"
	          >
	            <div className="specialist-queue-head">
	              <div>
	                <p className="eyebrow sm text-ink-soft">Investigations board</p>
	                <h2 className="news-card-title mt-2">Route each case across intake, active, and filed lanes.</h2>
	              </div>
	              <div className="specialist-routing-note">
	                <p className="eyebrow sm text-brass">Desk note</p>
	                <p className="news-card-copy mt-3">
	                  Drag a request into the active folio to claim it. Once the immediate risk is contained, drag it again into filed notes.
	                </p>
	              </div>
	            </div>

	            <div className="specialist-board">
	              {laneConfig.map((lane) => (
	                <section
	                  key={lane.id}
	                  className={`specialist-lane specialist-lane--${lane.id}${activeDropLane === lane.id ? ' is-target' : ''}${canDropIntoLane(lane.id) ? ' is-droppable' : ''}`}
	                  onDragOver={allowLaneDrop(lane.id)}
	                  onDragLeave={leaveLaneDrop(lane.id)}
	                  onDrop={dropInLane(lane.id)}
	                >
	                  <div className="specialist-lane__head">
	                    <span className="eyebrow sm text-oxblood">{lane.kicker}</span>
	                    <span className="eyebrow sm">{lane.requests.length} on desk</span>
	                  </div>
	                  <div className="specialist-lane__titleline">
	                    <h3 className="specialist-lane__title">{lane.title}</h3>
	                  </div>
	                  <p className="specialist-lane__note">{lane.note}</p>

	                  <div className="specialist-lane__stack">
	                    {loading ? (
	                      <div className="specialist-empty-state">
	                        <div className="specialist-empty-state__icon bg-ink/8 border border-ink/20">
	                          <div className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
	                        </div>
	                        <p className="text-sm text-smoke lowercase">loading the desk...</p>
	                      </div>
	                    ) : lane.requests.length > 0 ? (
	                      <div className="specialist-request-list">
	                        {lane.requests.map((req) => (
	                          <RequestCard
	                            key={req.id}
	                            req={req}
	                            lane={lane.id}
	                            userId={user.uid}
	                            busy={routeBusyId === req.id}
	                            isDragging={dragState?.id === req.id}
	                            onClaim={handleClaim}
	                            onResolve={handleResolve}
	                            onDragStart={lane.id === 'resolved' ? undefined : beginDeskDrag(req.id, lane.id)}
	                            onDragEnd={lane.id === 'resolved' ? undefined : endDeskDrag}
	                          />
	                        ))}
	                      </div>
	                    ) : (
	                      <div className="specialist-empty-state">
	                        <p className="eyebrow sm text-smoke-dim">tray clear</p>
	                        <p className="text-sm text-smoke lowercase">{lane.empty}</p>
	                      </div>
	                    )}
	                  </div>
	                </section>
	              ))}
	            </div>
	          </motion.div>

	          {/* ── Right: profile + feedback ── */}
	          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
	            transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
	            className="specialist-side-rail lg:sticky lg:top-28"
	          >
	            <div className="specialist-side-note">
	              <span className="specialist-side-note__pin" aria-hidden="true" />
	              <p className="eyebrow sm text-oxblood">Pinned note</p>
	              <p className="mt-3 text-sm text-ink-soft lowercase leading-relaxed">
	                Keep only live risks in the active folio. Once a reporter is stabilized, file the case and let the desk breathe again.
	              </p>
	            </div>

	            <div className="specialist-sidecard">
	              <div className="flex items-center justify-between mb-4">
	                <p className="text-[10px] tracking-widest uppercase font-bold text-smoke-dim">field credentials</p>
	                <Link
	                  to="/settings"
	                  className="text-[10px] text-smoke-dim hover:text-smoke transition-colors lowercase"
                >
                  edit →
                </Link>
              </div>

              {sp.bio ? (
                <p className="text-sm text-smoke lowercase leading-relaxed mb-4">{sp.bio}</p>
              ) : (
                <p className="text-sm text-smoke lowercase italic mb-4">no bio yet — add one in settings</p>
              )}

              {/* Certifications */}
              {sp.certifications?.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] text-smoke-dim uppercase tracking-wider mb-2">certifications</p>
                  <div className="space-y-1.5">
                    {sp.certifications.map((cert, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-olive-500 flex-shrink-0" />
                        <span className="text-xs text-smoke lowercase">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification data — credentials */}
              {vd.credentials && (
                <div>
                  <p className="text-[10px] text-smoke-dim uppercase tracking-wider mb-1.5">credentials</p>
                  <p className="text-xs text-smoke lowercase leading-relaxed">{vd.credentials}</p>
                </div>
              )}
            </div>

            {/* Feedback card */}
            {ratedReqs.length > 0 && (
              <div className="specialist-sidecard">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] tracking-widest uppercase font-bold text-smoke-dim">feedback</p>
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= Math.round(avgRating) ? 'text-brass fill-amber-400' : 'text-smoke'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-smoke">{avgRating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {ratedReqs.slice(0, 4).map(req => (
                    <div key={req.id} className="border-b border-white/[0.04] last:border-0 pb-3 last:pb-0">
                      <div className="flex gap-0.5 mb-1.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= req.feedback.rating ? 'text-brass fill-amber-400' : 'text-smoke'}`} />
                        ))}
                      </div>
                      {req.feedback.comment ? (
                        <p className="text-xs text-smoke lowercase leading-relaxed">{req.feedback.comment}</p>
                      ) : (
                        <p className="text-xs text-smoke lowercase italic">no comment</p>
                      )}
                      <p className="text-[10px] text-smoke lowercase mt-1">
                        {CRISIS_LABELS[req.crisisType] || req.crisisType} · {new Date(req.feedback.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

	            {/* Quick links */}
	            <div className="specialist-sidecard">
	              <p className="text-[10px] tracking-widest uppercase font-bold text-smoke-dim mb-3">reference shelf</p>
	              <div className="space-y-1">
                {[
                  { to: '/resources',  label: 'field manual' },
                  { to: '/community',  label: 'community desk' },
                ].map(item => {
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="specialist-sidecard__link"
                    >
                      <span className="text-sm lowercase flex-1">{item.label}</span>
                      <span className="specialist-sidecard__link-arrow">→</span>
                    </Link>
                  );
                })}
              </div>
            </div>

          </motion.div>
        </div>

    </NewsPage>
  );
};

export default SpecialistDashboard;
