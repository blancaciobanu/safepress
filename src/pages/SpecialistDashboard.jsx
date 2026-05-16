import { motion } from 'framer-motion';
import {
  Shield, AlertTriangle, CheckCircle, Clock, User,
  Star, Inbox, ChevronRight, Mail, Phone, MessageSquare,
  Lock, Users, BookOpen, ArrowRight, Award, TrendingUp,
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
import { NewsPage } from '../components/editorial/NewsPage';

const CRISIS_LABELS = {
  hacked:   'hacked account',
  source:   'source exposed',
  doxxed:   'doxxing incident',
  phishing: 'phishing attempt',
  other:    'security concern',
};

const CRISIS_ICONS = { hacked: Lock, source: Users, doxxed: AlertTriangle, phishing: Shield, other: Shield };

const CONTACT_ICONS = { email: Mail, phone: Phone, signal: MessageSquare };

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

const RequestCard = ({ req, userId, onClaim, onResolve }) => {
  const [expanded, setExpanded] = useState(false);
  const urgency = URGENCY_CONFIG[req.urgency] || URGENCY_CONFIG.normal;
  const CrisisIcon = CRISIS_ICONS[req.crisisType] || Shield;
  const ContactIcon = CONTACT_ICONS[req.contactMethod] || Mail;
  const isMine = req.claimedBy === userId;
  const privacyLocked = req.queueOnly && req.status === 'open';

  return (
    <motion.div
      layout
      className="border border-ink/10  bg-paper-soft/40 overflow-hidden"
    >
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-paper-soft/40 transition-all"
      >
        <div className={`flex-shrink-0 w-10 h-10  flex items-center justify-center border ${urgency.bg} ${urgency.border}`}>
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
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-midnight-400/15 text-oxblood border border-ink/30">
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
          <p className="text-[10px] text-gray-700 lowercase mt-1">
            {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {req.claimedByName && req.claimedBy !== userId && ` · claimed by ${req.claimedByName}`}
          </p>
        </div>

        <ChevronRight className={`flex-shrink-0 w-4 h-4 text-gray-700 transition-transform mt-0.5 ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded details */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="border-t border-ink/8 px-5 pb-5 pt-4 space-y-4"
        >
          {privacyLocked ? (
            <div className=" border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-brass mb-2">
                privacy-protected queue
              </p>
              <p className="text-sm text-ink-soft lowercase leading-relaxed">
                this case stays redacted until you claim it. once claimed, the requester&apos;s
                contact details and confidential description will appear in your active tab.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-ink-soft lowercase leading-relaxed">{req.description}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-paper-soft/60 border border-ink/8  p-3">
                  <p className="text-[10px] text-smoke-dim uppercase tracking-wider mb-1">name</p>
                  <p className="text-sm text-ink lowercase">{req.requesterName}</p>
                </div>
                <div className="bg-paper-soft/60 border border-ink/8  p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ContactIcon className="w-3 h-3 text-smoke-dim" />
                    <p className="text-[10px] text-smoke-dim uppercase tracking-wider">
                      {req.contactMethod || 'email'}
                    </p>
                  </div>
                  <p className="text-sm text-ink lowercase break-all">{req.requesterEmail}</p>
                </div>
                {req.requesterPhone && (
                  <div className="bg-paper-soft/60 border border-ink/8  p-3">
                    <p className="text-[10px] text-smoke-dim uppercase tracking-wider mb-1">phone</p>
                    <p className="text-sm text-ink lowercase">{req.requesterPhone}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {req.status === 'open' && (
              <button
                onClick={() => onClaim(req.id)}
                className="flex items-center gap-1.5 px-4 py-2 bg-midnight-400/20 border border-ink/30  text-sm text-oxblood hover:bg-midnight-400/30 transition-all lowercase font-medium"
              >
                <User className="w-3.5 h-3.5" />
                claim this request
              </button>
            )}
            {req.status === 'claimed' && isMine && (
              <button
                onClick={() => onResolve(req.id)}
                className="flex items-center gap-1.5 px-4 py-2 bg-olive-500/20 border border-olive-500/30  text-sm text-olive-500 hover:bg-olive-500/30 transition-all lowercase font-medium"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                mark as resolved
              </button>
            )}
          </div>
        </motion.div>
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
  const [activeTab,    setActiveTab]    = useState('open');
  const [claimedRequests, setClaimedRequests] = useState([]);

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
    try {
      const claimData = await claimSupportRequest({
        requestId: id,
        specialistId: user.uid,
        specialistName: user.username,
      });
      setRequests(prev => prev.filter((request) => request.id !== id));
      const refreshedClaimed = await getClaimedSupportRequestsBySpecialist(user.uid);
      setClaimedRequests(refreshedClaimed.map((request) =>
        request.id === id ? { ...request, ...claimData } : request
      ));
    } catch (e) {
      logError('Error claiming:', e);
    }
  };

  const handleResolve = async (id) => {
    try {
      const resolutionData = await resolveSupportRequest(id);
      const req = claimedRequests.find(r => r.id === id);
      setClaimedRequests(prev => prev.filter(r => r.id !== id));
      if (req) setResolved(prev => [{ ...req, ...resolutionData }, ...prev]);
    } catch (e) {
      logError('Error resolving:', e);
    }
  };

  if (loading || !isSpecialist) {
    return (
      <NewsPage max="reading">
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
      <NewsPage max="reading">
        <div>
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
            className="border border-ink/10  p-6 bg-paper-soft/40 space-y-5"
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
              <Link to="/resources" className="text-oxblood hover:text-midnight-300 transition-colors">resources →</Link>
              <span>·</span>
              <Link to="/community" className="text-oxblood hover:text-midnight-300 transition-colors">community →</Link>
            </div>
          </motion.div>
        </div>
      </NewsPage>
    );
  }

  // Derived data
  const sp           = profile?.specialistProfile || {};
  const vd           = profile?.verificationData  || {};
  const status = user.emailVerified ? user.verificationStatus : 'pending-email-verification';
  const openReqs     = requests.filter(r => r.status === 'open');
  const myActiveReqs = claimedRequests.filter(r => r.status === 'claimed' && r.claimedBy === user.uid);
  const ratedReqs    = resolved.filter(r => r.feedback);
  const avgRating    = ratedReqs.length
    ? ratedReqs.reduce((s, r) => s + r.feedback.rating, 0) / ratedReqs.length
    : null;

  const tabReqs = activeTab === 'open'     ? openReqs
               : activeTab === 'active'   ? myActiveReqs
               : resolved;

  const tabConfig = [
    { id: 'open',     label: 'open',     count: openReqs.length },
    { id: 'active',   label: 'active',   count: myActiveReqs.length },
    { id: 'resolved', label: 'resolved', count: resolved.length },
  ];

  return (
    <NewsPage>
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Avatar */}
            <div className="w-16 h-16  bg-ink/8 border border-ink/20 flex items-center justify-center flex-shrink-0">
              <span className="text-3xl">{user.avatarIcon || '🔒'}</span>
            </div>

            {/* Name + meta */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h1 className="text-4xl md:text-5xl font-display font-bold lowercase leading-none">
                  {user.username}
                </h1>
                <VerifiedBadge size="md" />
              </div>

              <p className="text-smoke lowercase text-sm mb-3">
                security specialist
                {vd.organization && (
                  <> · <span className="text-smoke">{vd.organization}</span></>
                )}
              </p>

              {/* Expertise chips */}
              {(sp.expertiseAreas?.length > 0 || vd.expertise) && (
                <div className="flex flex-wrap gap-2">
                  {(sp.expertiseAreas?.length > 0 ? sp.expertiseAreas : [vd.expertise]).map(area => (
                    <span
                      key={area}
                      className="px-2.5 py-1 bg-ink/8 border border-ink/20 text-oxblood  text-[11px] font-semibold lowercase"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-7">
            {[
              {
                icon: CheckCircle,
                value: resolved.length,
                label: 'cases resolved',
                color: 'text-olive-500',
                iconBg: 'bg-olive-500/10 border-olive-500/20',
              },
              {
                icon: Star,
                value: avgRating ? avgRating.toFixed(1) : '—',
                label: `avg rating${ratedReqs.length ? ` (${ratedReqs.length})` : ''}`,
                color: 'text-brass',
                iconBg: 'bg-amber-400/10 border-amber-400/20',
              },
              {
                icon: TrendingUp,
                value: myActiveReqs.length,
                label: 'active now',
                color: 'text-oxblood',
                iconBg: 'bg-ink/8 border-ink/20',
              },
            ].map(stat => {
              const StatIcon = stat.icon;
              return (
                <div key={stat.label} className="border border-ink/10  p-4 bg-paper-soft/40">
                  <div className={`w-8 h-8  border flex items-center justify-center mb-3 ${stat.iconBg}`}>
                    <StatIcon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <p className={`text-3xl font-display font-bold ${stat.color} mb-0.5`}>{stat.value}</p>
                  <p className="text-[11px] text-smoke-dim lowercase">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── 2-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">

          {/* ── Left: request queue ── */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Tabs */}
            <div className="flex items-center gap-1 mb-5 bg-paper-soft/60 border border-ink/8  p-1 w-fit">
              {tabConfig.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-4 py-2  text-xs font-semibold lowercase transition-all ${
                    activeTab === tab.id
                      ? 'bg-white/[0.08] text-ink'
                      : 'text-smoke-dim hover:text-smoke'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                      activeTab === tab.id
                        ? tab.id === 'open' && openReqs.some(r => r.urgency === 'emergency')
                          ? 'bg-crimson-500/30 text-oxblood'
                          : 'bg-midnight-400/20 text-oxblood'
                        : 'bg-paper-soft/80 text-smoke-dim'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Request list */}
            {tabReqs.length === 0 ? (
              loading ? (
                <div className="border border-ink/10  p-10 bg-paper-soft/40 flex flex-col items-center text-center gap-3">
                  <div className="w-10 h-10  bg-ink/8 border border-ink/20 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-sm text-smoke lowercase">loading your request queue...</p>
                </div>
              ) : (
                <div className="border border-ink/10  p-10 bg-paper-soft/40 flex flex-col items-center text-center gap-3">
                  <div className="w-10 h-10  bg-olive-500/10 border border-olive-500/20 flex items-center justify-center">
                    <Inbox className="w-5 h-5 text-olive-500" />
                  </div>
                  <p className="text-sm text-smoke lowercase">
                    {activeTab === 'open'     && 'no open requests right now'}
                    {activeTab === 'active'   && 'no active cases — claim one from open'}
                    {activeTab === 'resolved' && 'no resolved cases yet'}
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-3">
                {tabReqs.map(req => (
                  <RequestCard
                    key={req.id}
                    req={req}
                    userId={user.uid}
                    onClaim={handleClaim}
                    onResolve={handleResolve}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* ── Right: profile + feedback ── */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4 lg:sticky lg:top-28"
          >
            {/* Profile card */}
            <div className="border border-ink/10  p-5 bg-paper-soft/40">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] tracking-widest uppercase font-bold text-smoke-dim">profile</p>
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
                <p className="text-sm text-gray-700 lowercase italic mb-4">no bio yet — add one in settings</p>
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
              <div className="border border-ink/10  p-5 bg-paper-soft/40">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] tracking-widest uppercase font-bold text-smoke-dim">feedback</p>
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= Math.round(avgRating) ? 'text-brass fill-amber-400' : 'text-gray-700'}`} />
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
                          <Star key={s} className={`w-3 h-3 ${s <= req.feedback.rating ? 'text-brass fill-amber-400' : 'text-gray-700'}`} />
                        ))}
                      </div>
                      {req.feedback.comment ? (
                        <p className="text-xs text-smoke lowercase leading-relaxed">{req.feedback.comment}</p>
                      ) : (
                        <p className="text-xs text-gray-700 lowercase italic">no comment</p>
                      )}
                      <p className="text-[10px] text-gray-700 lowercase mt-1">
                        {CRISIS_LABELS[req.crisisType] || req.crisisType} · {new Date(req.feedback.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick links */}
            <div className="border border-ink/10  p-5 bg-paper-soft/40">
              <p className="text-[10px] tracking-widest uppercase font-bold text-smoke-dim mb-3">resources</p>
              <div className="space-y-1">
                {[
                  { to: '/resources',  icon: BookOpen, label: 'security resources' },
                  { to: '/community',  icon: Users,    label: 'community' },
                ].map(item => {
                  const ItemIcon = item.icon;
                  return (
                    <a
                      key={item.to}
                      href={item.to}
                      className="flex items-center gap-3 py-2 text-smoke hover:text-ink-soft transition-colors group"
                    >
                      <ItemIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm lowercase flex-1">{item.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  );
                })}
              </div>
            </div>

          </motion.div>
        </div>

      </div>
    </NewsPage>
  );
};

export default SpecialistDashboard;
