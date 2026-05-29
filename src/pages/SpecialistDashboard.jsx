import { motion as Motion } from 'framer-motion';
import {
  Shield, AlertTriangle, CheckCircle, Clock, User,
  Star, Users, Inbox, FileText, Archive,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VerifiedBadge from '../components/VerifiedBadge';
import {
  claimSupportRequest,
  getClaimedSupportRequestsBySpecialist,
  getOpenSupportQueueRequests,
  getResolvedSupportRequestsBySpecialist,
  resolveSupportRequest,
  SUPPORT_CASE_MARKERS,
} from '../features/support/services/supportService';
import {
  SPECIALIST_VERIFICATION_STATUSES,
  specialistNeedsVerificationDossier,
} from '../features/users/verification';
import { logError } from '../utils/logger';
import {
  NewsButton,
  NewsPage,
  NewsRule,
} from '../components/editorial/NewsPage';
import { caseFileRef } from '../utils/caseRef';
import { getRoleColor } from '../utils/userUtils';
import { URGENCY_LABELS } from '../features/support/supportCase.constants';

const CRISIS_LABELS = {
  hacked:   'Hacked account',
  source:   'Source exposed',
  doxxed:   'Doxxing incident',
  phishing: 'Phishing attempt',
  other:    'Security concern',
};

const CRISIS_ICONS = { hacked: Shield, source: Users, doxxed: AlertTriangle, phishing: Shield, other: Shield };

const URGENCY_TONE = {
  emergency: 'text-oxblood',
  urgent:    'text-brass',
  normal:    'text-smoke',
};

const CASE_MARKER_LABELS = {
  [SUPPORT_CASE_MARKERS.AWAITING_SPECIALIST]: 'awaiting specialist',
  [SUPPORT_CASE_MARKERS.AWAITING_REPORTER]: 'awaiting reporter',
  [SUPPORT_CASE_MARKERS.MONITORING]: 'monitoring',
  [SUPPORT_CASE_MARKERS.READY_TO_FILE]: 'ready to file',
};

const ACCENT = {
  open:     '#7B2E2E',
  active:   '#8A6D2C',
  resolved: '#375E5A',
};

const getMonogram = (value) =>
  (value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'SP';

const splitCredentialText = (value = '') =>
  String(value)
    .replace(/\.\s+(?=[A-Z(])/g, '.\n')
    .split(/\r?\n|;\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const expandCredentialEntries = (values = []) =>
  values.flatMap((value) => splitCredentialText(value));

const timeInQueue = (createdAt) => {
  const hours = Math.floor((Date.now() - new Date(createdAt).getTime()) / 3_600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h in queue`;
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day in queue' : `${days} days in queue`;
};

const formatShortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const loadSpecialistRequests = async (specialistId) => {
  const [openRequests, claimedRequests, resolvedRequests] = await Promise.all([
    getOpenSupportQueueRequests(),
    getClaimedSupportRequestsBySpecialist(specialistId),
    getResolvedSupportRequestsBySpecialist(specialistId),
  ]);
  return { openRequests, claimedRequests, resolvedRequests };
};

/* ─── Case folder card — visualises an actual paper folder ───────────────── */

const CaseFolder = ({ req, lane, userId, busy, onClaim, onResolve }) => {
  const CrisisIcon = CRISIS_ICONS[req.crisisType] || Shield;
  const isMine = req.claimedBy === userId;
  const accent = ACCENT[lane];
  const crisisLabel = CRISIS_LABELS[req.crisisType] || req.crisisType;
  const urgency = URGENCY_LABELS[req.urgency] || req.urgency;
  const markerLabel = CASE_MARKER_LABELS[req.caseMarker];
  const caseRef = caseFileRef(req);

  const canResolveFromDesk = Boolean(
    req.caseReport?.summary?.trim()
    && req.caseReport?.actionsTaken?.trim()
    && req.caseReport?.nextSteps?.trim()
  );

  const toplineKicker =
    lane === 'open' ? 'Redacted intake'
    : lane === 'active' ? 'Active case file'
    : 'Filed note';

  const stampMeta =
    lane === 'open' ? timeInQueue(req.createdAt)
    : lane === 'active' && req.claimedAt ? `Claimed ${formatShortDate(req.claimedAt)}`
    : lane === 'resolved' && req.resolvedAt ? `Filed ${formatShortDate(req.resolvedAt)}`
    : formatShortDate(req.createdAt);

  return (
    <article className={`case-folder case-folder--${lane}`} style={{ '--folder-accent': accent }}>
      <div className="case-folder__tab" aria-hidden="true">
        <span className="case-folder__tab-mark">{caseRef}</span>
      </div>

      <div className="case-folder__body">
        <div className="case-folder__topline">
          <div className="case-folder__topline-left">
            <span className="case-folder__icon">
              <CrisisIcon className="w-4 h-4" />
            </span>
            <div>
              <p className="case-folder__kicker">{toplineKicker}</p>
              <p className="case-folder__stamp">{stampMeta}</p>
            </div>
          </div>
          {lane === 'resolved' && (
            <span className="case-folder__resolved-stamp" aria-hidden="true">FILED</span>
          )}
        </div>

        <h3 className="case-folder__title">
          {crisisLabel}<span className="italic-ox">.</span>
        </h3>

        <div className="case-folder__meta">
          <span className={URGENCY_TONE[req.urgency] || 'text-smoke'}>{urgency}</span>
          {markerLabel && <span>{markerLabel}</span>}
          {req.status === 'claimed' && isMine && <span className="text-oxblood">on your desk</span>}
          {req.status === 'claimed' && !isMine && <span>claimed elsewhere</span>}
        </div>

        {req.previewNote && lane === 'open' && (
          <p className="case-folder__excerpt">
            &ldquo;{req.previewNote}&rdquo;
          </p>
        )}

        {lane !== 'open' && req.requesterName && (
          <div className="case-folder__contact">
            <div>
              <span className="case-folder__contact-key">Reporter</span>
              <p>{req.requesterName}</p>
            </div>
            <div>
              <span className="case-folder__contact-key">{req.contactMethod || 'email'}</span>
              <p>{req.requesterEmail}</p>
            </div>
          </div>
        )}

        {lane === 'resolved' && req.feedback && (
          <div className="case-folder__feedback">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 ${s <= req.feedback.rating ? 'text-brass fill-amber-400' : 'text-smoke/40'}`}
                />
              ))}
            </div>
            {req.feedback.comment && (
              <p className="case-folder__feedback-text">&ldquo;{req.feedback.comment}&rdquo;</p>
            )}
          </div>
        )}

        <div className="case-folder__footer">
          <Link to={`/specialist-cases/${req.id}`} className="case-folder__link">
            open case file →
          </Link>

          {lane === 'open' && (
            <NewsButton onClick={() => onClaim(req.id)} disabled={busy}>
              <User className="w-4 h-4" />
              {busy ? 'Claiming…' : 'Claim case'}
            </NewsButton>
          )}

          {lane === 'active' && isMine && (
            <div className="flex flex-col items-end gap-1.5">
              <NewsButton
                onClick={() => onResolve(req.id)}
                disabled={busy || !canResolveFromDesk}
                title={canResolveFromDesk ? undefined : 'Save the resolution report inside the case file before filing.'}
              >
                <CheckCircle className="w-4 h-4" />
                {busy ? 'Filing…' : 'Mark resolved'}
              </NewsButton>
              {!canResolveFromDesk && (
                <p className="text-[10px] text-smoke-dim">Write the report inside the case file first.</p>
              )}
            </div>
          )}

          {lane === 'active' && !isMine && (
            <span className="eyebrow sm text-smoke-dim">claimed by {req.claimedByName || 'another specialist'}</span>
          )}
        </div>
      </div>
    </article>
  );
};

/* ─── Main page ────────────────────────────────────────────────────────────── */

const SpecialistDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [resolved, setResolved] = useState([]);
  const [claimedRequests, setClaimedRequests] = useState([]);
  const [routeBusyId, setRouteBusyId] = useState(null);
  const [activeLane, setActiveLane] = useState('open');

  const isSpecialist = user?.accountType === 'specialist';
  const isVerifiedSpecialist = isSpecialist && user?.verificationStatus === SPECIALIST_VERIFICATION_STATUSES.APPROVED;

  useEffect(() => {
    if (!user) return;
    if (user.accountType !== 'specialist') navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    setProfile(user || null);
  }, [user]);

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
        if (!cancelled) logError('Error fetching specialist dashboard data:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [isVerifiedSpecialist, user]);

  const handleClaim = async (id) => {
    setRouteBusyId(id);
    try {
      const claimData = await claimSupportRequest({
        requestId: id,
        specialistId: user.uid,
        specialistName: user.realName || user.username,
      });
      setRequests((prev) => prev.filter((request) => request.id !== id));
      const refreshedClaimed = await getClaimedSupportRequestsBySpecialist(user.uid);
      setClaimedRequests(refreshedClaimed.map((request) =>
        request.id === id ? { ...request, ...claimData } : request
      ));
      setActiveLane('active');
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
      const req = claimedRequests.find((r) => r.id === id);
      setClaimedRequests((prev) => prev.filter((r) => r.id !== id));
      if (req) setResolved((prev) => [{ ...req, ...resolutionData }, ...prev]);
      setActiveLane('resolved');
    } catch (e) {
      logError('Error resolving:', e);
    } finally {
      setRouteBusyId((current) => (current === id ? null : current));
    }
  };

  /* ─── Derived ────────────────────────────────────────────────────────────── */

  const openReqs     = useMemo(() => requests.filter((r) => r.status === 'open'), [requests]);
  const myActiveReqs = useMemo(
    () => claimedRequests.filter((r) => r.status === 'claimed' && r.claimedBy === user?.uid),
    [claimedRequests, user?.uid],
  );
  const ratedReqs = useMemo(() => resolved.filter((r) => r.feedback), [resolved]);
  const avgRating = ratedReqs.length
    ? ratedReqs.reduce((s, r) => s + r.feedback.rating, 0) / ratedReqs.length
    : null;

  if (loading || !isSpecialist) {
    return (
      <NewsPage>
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="eyebrow sm">Loading…</p>
          </div>
        </div>
      </NewsPage>
    );
  }

  /* ─── Pending / unverified state ─────────────────────────────────────────── */

  if (!isVerifiedSpecialist) {
    const status = user.emailVerified ? user.verificationStatus : SPECIALIST_VERIFICATION_STATUSES.PENDING_EMAIL;
    const vd = profile?.verificationData || {};
    const submittedAtSource = vd.dossierSubmittedAt || vd.submittedAt;
    const submittedAt = submittedAtSource
      ? new Date(submittedAtSource).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : null;
    const rejectionReason = profile?.verificationRejectionReason;
    const reviewNote = profile?.verificationReviewNote;
    const needsDossier = specialistNeedsVerificationDossier(status);

    const statusKicker =
      status === 'rejected' ? 'application not approved'
      : status === SPECIALIST_VERIFICATION_STATUSES.PENDING_EMAIL ? 'email verification required'
      : status === SPECIALIST_VERIFICATION_STATUSES.PENDING_DETAILS ? 'dossier incomplete'
      : status === SPECIALIST_VERIFICATION_STATUSES.NEEDS_MORE_INFO ? 'additional detail requested'
      : 'under review';

    const statusHeadline =
      status === 'rejected' ? 'Application not approved'
      : status === SPECIALIST_VERIFICATION_STATUSES.PENDING_EMAIL ? 'Verify your email first'
      : status === SPECIALIST_VERIFICATION_STATUSES.PENDING_DETAILS ? 'Complete your verification file'
      : status === SPECIALIST_VERIFICATION_STATUSES.NEEDS_MORE_INFO ? 'The desk needs more detail'
      : 'Verification in review';

    const statusDesc =
      status === 'rejected'
        ? 'Your previous verification was not approved. Revise the file if you want the desk to review it again.'
        : status === SPECIALIST_VERIFICATION_STATUSES.PENDING_EMAIL
          ? 'Your specialist application is saved, but it will not enter review until you verify your email address.'
          : status === SPECIALIST_VERIFICATION_STATUSES.PENDING_DETAILS
            ? 'Your basic application is on file, but the review desk still needs your working dossier before it can assess case readiness.'
            : status === SPECIALIST_VERIFICATION_STATUSES.NEEDS_MORE_INFO
              ? 'The review desk sent the file back with notes. Strengthen it, then send it back for another pass.'
              : "We're reviewing your specialist credentials. You'll get access to the request queue once approved.";

    return (
      <NewsPage className="specialist-desk">
        <div className="specialist-desk__status">
          <Motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="news-page-topline">
              <span className="eyebrow sm text-oxblood">Specialist Desk · Verification</span>
              <span className="eyebrow sm">{statusKicker}</span>
            </div>
            <NewsRule />

            <div className="mt-10 flex items-start gap-5 max-w-prose">
              <div className={`flex-shrink-0 inline-flex items-center justify-center w-11 h-11 border mt-1 ${
                status === 'rejected'
                  ? 'bg-oxblood/8 border-oxblood/20'
                  : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                {status === 'rejected' ? (
                  <AlertTriangle className="w-5 h-5 text-oxblood" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div>
                <h1 className="display text-4xl md:text-5xl leading-none">
                  {statusHeadline}<span className="italic-ox">.</span>
                </h1>
                <p className="mt-5 text-base text-ink-soft leading-relaxed">
                  {statusDesc}
                </p>
              </div>
            </div>
          </Motion.div>

          <Motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="specialist-status-sheet space-y-5 mt-10"
          >
            {(status === SPECIALIST_VERIFICATION_STATUSES.REJECTED && rejectionReason) && (
              <div className="bg-crimson-500/5 border border-oxblood/20  p-4">
                <p className="text-[10px] text-oxblood uppercase tracking-widest font-bold mb-2">reason for rejection</p>
                <p className="text-sm text-ink-soft leading-relaxed">{rejectionReason}</p>
              </div>
            )}

            {status === SPECIALIST_VERIFICATION_STATUSES.NEEDS_MORE_INFO && reviewNote && (
              <div className="bg-crimson-500/5 border border-oxblood/20  p-4">
                <p className="text-[10px] text-oxblood uppercase tracking-widest font-bold mb-2">review note</p>
                <p className="text-sm text-ink-soft leading-relaxed">{reviewNote}</p>
              </div>
            )}

            {status === SPECIALIST_VERIFICATION_STATUSES.PENDING_REVIEW && (
              <div className="bg-amber-500/5 border border-amber-500/20  p-4">
                <p className="text-[10px] text-brass uppercase tracking-widest font-bold mb-2">expected timeline</p>
                <p className="text-sm text-ink-soft leading-relaxed">
                  applications are typically reviewed within 2–3 business days. you'll be notified by email once a decision is made.
                </p>
              </div>
            )}

            {status === SPECIALIST_VERIFICATION_STATUSES.PENDING_EMAIL && (
              <div className="bg-amber-500/5 border border-amber-500/20  p-4">
                <p className="text-[10px] text-brass uppercase tracking-widest font-bold mb-2">next step</p>
                <p className="text-sm text-ink-soft leading-relaxed">
                  open the verification email we sent you, confirm your address, then sign back in. your application will automatically move into the review queue.
                </p>
              </div>
            )}

            {status === SPECIALIST_VERIFICATION_STATUSES.PENDING_DETAILS && (
              <div className="bg-amber-500/5 border border-amber-500/20  p-4">
                <p className="text-[10px] text-brass uppercase tracking-widest font-bold mb-2">missing piece</p>
                <p className="text-sm text-ink-soft leading-relaxed">
                  the desk still needs your fuller verification file: proof of work, secure contact method, coverage areas, languages, and availability.
                </p>
              </div>
            )}

            <div>
              <p className="text-[10px] text-smoke-dim uppercase tracking-widest font-bold mb-3">your submission</p>
              <div className="space-y-3 text-sm">
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

            {needsDossier && (
              <div className="pt-3 border-t border-ink/8">
                <Link
                  to="/specialist-verification"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-ink hover:bg-ink-soft text-paper font-semibold transition-all"
                >
                  <Shield className="w-4 h-4" />
                  {status === SPECIALIST_VERIFICATION_STATUSES.PENDING_DETAILS
                    ? 'complete verification file'
                    : 'revise verification file'}
                </Link>
                <p className="text-xs text-smoke-dim text-center mt-3">
                  keep the file current there, then send it back to the review desk
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-smoke-dim pt-3 border-t border-ink/8">
              <span>while you wait, explore the app:</span>
              <Link to="/resources" className="text-oxblood hover:text-ink transition-colors">resources →</Link>
              <span>·</span>
              <Link to="/community" className="text-oxblood hover:text-ink transition-colors">community →</Link>
            </div>
          </Motion.div>
        </div>
      </NewsPage>
    );
  }

  /* ─── Verified specialist dashboard ──────────────────────────────────────── */

  const sp = profile?.specialistProfile || {};
  const vd = profile?.verificationData || {};
  const specialistMonogram = getMonogram(user.realName || user.username);
  const coverageAreas = sp.expertiseAreas?.length > 0
    ? sp.expertiseAreas
    : (vd.supportAreas || []);
  const hasCredentialStack = Boolean((sp.certifications?.length > 0) || vd.credentials);
  const certificationEntries = expandCredentialEntries(sp.certifications || []);
  const reviewDeskEntries = splitCredentialText(vd.credentials || '');
  const credentialFacts = [
    { label: 'Region', value: vd.region },
    { label: 'Languages', value: vd.languages },
    { label: 'Availability', value: vd.availability },
    {
      label: 'Secure route',
      value: vd.secureContactHandle
        ? `${vd.secureContactMethod || 'secure'} · ${vd.secureContactHandle}`
        : '',
    },
  ].filter((item) => item.value);

  const filingTabs = [
    { id: 'open',     label: 'Intake tray',  desc: `${openReqs.length} new`,            icon: Inbox,    count: openReqs.length },
    { id: 'active',   label: 'Active folio', desc: `${myActiveReqs.length} on desk`,    icon: FileText, count: myActiveReqs.length },
    { id: 'resolved', label: 'Filed notes',  desc: `${resolved.length} closed`,         icon: Archive,  count: resolved.length },
  ];

  const laneRequests =
    activeLane === 'open' ? openReqs
    : activeLane === 'active' ? myActiveReqs
    : resolved;

  const laneEmpty =
    activeLane === 'open' ? 'No new requests waiting. The intake tray is clear.'
    : activeLane === 'active' ? 'No active cases yet. Pull one in from intake when you are ready.'
    : 'Nothing filed yet. Resolved cases will collect here.';

  const laneSectionNote =
    activeLane === 'open'
      ? 'Each folder is a redacted intake. Claim a case to unlock the reporter brief and open the secure thread.'
      : activeLane === 'active'
        ? 'Folders pulled to your desk. Open one to message the reporter, set markers, and draft the resolution report.'
        : 'A closing record for every case you filed. Open the folder to revisit the report or reporter feedback.';

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  return (
    <NewsPage className="specialist-desk">
      <Motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="news-page-topline">
          <span className="eyebrow sm text-oxblood">Specialist Desk · Casework queue</span>
          <span className="eyebrow sm">{todayStr} · on duty</span>
        </div>
        <NewsRule />

        {/* ── Nameplate header ──────────────────────────────────────────── */}
        <section className="specialist-plate">
          <div className="specialist-plate__photo-frame">
            <div className="specialist-plate__photo">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.realName || user.username} className="specialist-plate__photo-img" />
              ) : (
                <span className="specialist-plate__photo-mark">{specialistMonogram}</span>
              )}
            </div>
            <span className="specialist-plate__duty-tag" aria-hidden="true">
              <span className="specialist-plate__duty-pip" />
              On duty
            </span>
          </div>

          <div className="specialist-plate__copy">
            <p className="eyebrow sm text-brass">Specialist · Verified by review desk</p>
            <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
              <h1 className={`display text-5xl md:text-6xl leading-none ${getRoleColor('specialist', true)}`}>
                {user.realName || user.username}<span className="italic-ox">.</span>
              </h1>
              <VerifiedBadge size="md" />
            </div>
            {vd.organization && (
              <p className="specialist-plate__role">
                <span>{vd.organization}</span>
              </p>
            )}
            {(sp.expertiseAreas?.length > 0 || vd.expertise) && (
              <div className="specialist-plate__chips">
                {(sp.expertiseAreas?.length > 0 ? sp.expertiseAreas : [vd.expertise]).map((area) => (
                  <span key={area} className="specialist-plate__chip">{area}</span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Duty ledger ───────────────────────────────────────────────── */}
        <section className="duty-ledger">
          <div className="duty-ledger__head">
            <span className="eyebrow sm text-oxblood">Duty ledger</span>
            <span className="eyebrow sm text-smoke-dim">As of {todayStr}</span>
          </div>
          <div className="duty-ledger__grid">
            <div className="duty-ledger__cell">
              <p className="duty-ledger__kicker">Cases resolved</p>
              <p className="duty-ledger__value">{resolved.length}</p>
              <p className="duty-ledger__note">All-time closures on your desk</p>
            </div>
            <div className="duty-ledger__cell">
              <p className="duty-ledger__kicker">
                Avg rating{ratedReqs.length ? ` · ${ratedReqs.length}` : ''}
              </p>
              <p className="duty-ledger__value duty-ledger__value--brass">
                {avgRating ? avgRating.toFixed(1) : '—'}
              </p>
              <p className="duty-ledger__note">
                {ratedReqs.length ? 'Reporter feedback, out of 5' : 'No feedback filed yet'}
              </p>
            </div>
            <div className="duty-ledger__cell">
              <p className="duty-ledger__kicker">Active now</p>
              <p className="duty-ledger__value duty-ledger__value--oxblood">{myActiveReqs.length}</p>
              <p className="duty-ledger__note">Live folders on the desk</p>
            </div>
          </div>
        </section>

      </Motion.div>

      <div className="specialist-casework-shell">
        <Motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0"
        >
          {/* ── Filing-drawer tabs ───────────────────────────────────────── */}
          <div className="filing-drawer" role="tablist" aria-label="Casework lanes">
            {filingTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeLane === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveLane(tab.id)}
                  className={`filing-drawer__tab ${active ? 'is-active' : ''}`}
                  style={{ '--tab-accent': ACCENT[tab.id] }}
                >
                  <Icon className="filing-drawer__icon" />
                  <span className="filing-drawer__copy">
                    <span className="filing-drawer__label">{tab.label}</span>
                    <span className="filing-drawer__desc">{tab.desc}</span>
                  </span>
                  <span className="filing-drawer__count">{String(tab.count).padStart(2, '0')}</span>
                </button>
              );
            })}
          </div>

          <div className="filing-drawer__note">
            <p className="eyebrow sm text-smoke">{laneSectionNote}</p>
          </div>

          {laneRequests.length === 0 ? (
            <div className="specialist-empty-state">
              <p className="eyebrow sm text-smoke-dim">drawer clear</p>
              <p className="text-sm text-smoke mt-2">{laneEmpty}</p>
            </div>
          ) : (
            <div className="case-folder-stack">
              {laneRequests.map((req) => (
                <CaseFolder
                  key={req.id}
                  req={req}
                  lane={activeLane}
                  userId={user.uid}
                  busy={routeBusyId === req.id}
                  onClaim={handleClaim}
                  onResolve={handleResolve}
                />
              ))}
            </div>
          )}
        </Motion.div>
      </div>

      <Motion.section
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className={`specialist-profile-file ${!hasCredentialStack ? 'specialist-profile-file--compact' : ''}`}
      >
        <div className="specialist-profile-file__mast">
          <div>
            <p className="eyebrow sm text-oxblood">Field profile</p>
            <h2 className="display-soft text-3xl leading-none mt-3">Review desk profile.</h2>
          </div>
          <Link to="/settings" className="specialist-profile-file__edit">
            edit file →
          </Link>
        </div>

        <div className="specialist-profile-file__grid">
          <div className="specialist-profile-file__brief">
            <p className="specialist-profile-file__label">Desk copy</p>
            {sp.bio ? (
              <p className="specialist-profile-file__bio">{sp.bio}</p>
            ) : (
              <p className="specialist-profile-file__bio specialist-profile-file__bio--empty">
                No field brief on file yet. Add one in settings so journalists understand what to route to you first.
              </p>
            )}
          </div>

          <div className="specialist-profile-file__details">
            {credentialFacts.length > 0 && (
              <div className="specialist-profile-file__facts">
                {credentialFacts.map((fact) => (
                  <div key={fact.label} className="specialist-profile-file__fact">
                    <span>{fact.label}</span>
                    <p>{fact.value}</p>
                  </div>
                ))}
              </div>
            )}

            {coverageAreas.length > 0 && (
              <div className="specialist-profile-file__lanes">
                <p className="specialist-profile-file__label">Coverage lanes</p>
                <div className="specialist-profile-file__chips">
                  {coverageAreas.map((area) => (
                    <span key={area} className="specialist-profile-file__chip">{area}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {hasCredentialStack && (
          <div
            className={`specialist-profile-file__evidence ${
              certificationEntries.length === 0 || reviewDeskEntries.length === 0
                ? 'specialist-profile-file__evidence--single'
                : ''
            }`}
          >
            {certificationEntries.length > 0 && (
              <div className="specialist-profile-file__evidence-group">
                <p className="specialist-profile-file__label">Certifications</p>
                <div className="specialist-profile-file__certs">
                  {certificationEntries.map((cert) => (
                    <span key={cert} className="specialist-profile-file__cert">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {reviewDeskEntries.length > 0 && (
              <div className="specialist-profile-file__evidence-group specialist-profile-file__evidence-group--note">
                <p className="specialist-profile-file__label">Verified note</p>
                <div className="specialist-profile-file__note">
                  {reviewDeskEntries.map((entry) => (
                    <p key={entry}>{entry}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Motion.section>
    </NewsPage>
  );
};

export default SpecialistDashboard;
