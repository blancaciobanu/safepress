import { motion } from 'framer-motion';
import {
  Shield, AlertTriangle, CheckCircle, Clock, User,
  Star, Inbox, ChevronRight, Mail, Phone, MessageSquare,
  Lock, Users, BookOpen, ArrowRight, Award, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import VerifiedBadge from '../components/VerifiedBadge';

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
  emergency: { label: 'emergency', bg: 'bg-crimson-500/15', text: 'text-crimson-400', border: 'border-crimson-500/30' },
  urgent:    { label: 'urgent',    bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30' },
  normal:    { label: 'normal',    bg: 'bg-white/[0.05]',   text: 'text-gray-500',    border: 'border-white/[0.08]' },
};

/* ─── Request Card ─────────────────────────────────────────────────────────── */

const RequestCard = ({ req, userId, onClaim, onResolve }) => {
  const [expanded, setExpanded] = useState(false);
  const urgency = URGENCY_CONFIG[req.urgency] || URGENCY_CONFIG.normal;
  const CrisisIcon = CRISIS_ICONS[req.crisisType] || Shield;
  const ContactIcon = CONTACT_ICONS[req.contactMethod] || Mail;
  const isMine = req.claimedBy === userId;

  return (
    <motion.div
      layout
      className="border border-white/[0.08] rounded-2xl bg-white/[0.02] overflow-hidden"
    >
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-white/[0.02] transition-all"
      >
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${urgency.bg} ${urgency.border}`}>
          <CrisisIcon className={`w-5 h-5 ${urgency.text}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-base font-medium text-white lowercase">
              {CRISIS_LABELS[req.crisisType] || req.crisisType}
            </p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${urgency.bg} ${urgency.text} ${urgency.border}`}>
              {urgency.label}
            </span>
            {req.status === 'claimed' && isMine && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-midnight-400/15 text-midnight-400 border border-midnight-400/30">
                active
              </span>
            )}
            {req.status === 'claimed' && !isMine && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/[0.05] text-gray-500 border border-white/[0.08]">
                claimed
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 lowercase line-clamp-1">
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
          className="border-t border-white/[0.06] px-5 pb-5 pt-4 space-y-4"
        >
          {/* Description */}
          <p className="text-sm text-gray-300 lowercase leading-relaxed">{req.description}</p>

          {/* Contact grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">name</p>
              <p className="text-sm text-white lowercase">{req.requesterName}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <ContactIcon className="w-3 h-3 text-gray-600" />
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">
                  {req.contactMethod || 'email'}
                </p>
              </div>
              <p className="text-sm text-white lowercase break-all">{req.requesterEmail}</p>
            </div>
            {req.requesterPhone && (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">phone</p>
                <p className="text-sm text-white lowercase">{req.requesterPhone}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {req.status === 'open' && (
              <button
                onClick={() => onClaim(req.id)}
                className="flex items-center gap-1.5 px-4 py-2 bg-midnight-400/20 border border-midnight-400/30 rounded-xl text-sm text-midnight-400 hover:bg-midnight-400/30 transition-all lowercase font-medium"
              >
                <User className="w-3.5 h-3.5" />
                claim this request
              </button>
            )}
            {req.status === 'claimed' && isMine && (
              <button
                onClick={() => onResolve(req.id)}
                className="flex items-center gap-1.5 px-4 py-2 bg-olive-500/20 border border-olive-500/30 rounded-xl text-sm text-olive-500 hover:bg-olive-500/30 transition-all lowercase font-medium"
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
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [requests,     setRequests]     = useState([]);
  const [resolved,     setResolved]     = useState([]);
  const [activeTab,    setActiveTab]    = useState('open');

  const isVerifiedSpecialist = user?.accountType === 'specialist' && user?.verificationStatus === 'approved';

  // Redirect non-specialists
  useEffect(() => {
    if (!user) return;
    if (user.accountType !== 'specialist') { navigate('/dashboard', { replace: true }); return; }
    if (user.verificationStatus === 'pending') { navigate('/dashboard', { replace: true }); return; }
    if (user.verificationStatus === 'rejected') { navigate('/dashboard', { replace: true }); return; }
  }, [user, navigate]);

  // Fetch full user profile from Firestore (includes specialistProfile)
  useEffect(() => {
    if (!isVerifiedSpecialist) return;
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) setProfile(snap.data());
      } catch (e) {
        console.error('Error fetching profile:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [isVerifiedSpecialist, user]);

  // Fetch open + claimed requests
  useEffect(() => {
    if (!isVerifiedSpecialist) return;
    const fetch = async () => {
      try {
        const q = query(
          collection(db, 'support-requests'),
          where('status', 'in', ['open', 'claimed']),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('Error fetching requests:', e);
      }
    };
    fetch();
  }, [isVerifiedSpecialist]);

  // Fetch resolved requests by this specialist
  useEffect(() => {
    if (!isVerifiedSpecialist || !user) return;
    const fetch = async () => {
      try {
        const q = query(
          collection(db, 'support-requests'),
          where('claimedBy', '==', user.uid),
          where('status', '==', 'resolved')
        );
        const snap = await getDocs(q);
        setResolved(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('Error fetching resolved:', e);
      }
    };
    fetch();
  }, [isVerifiedSpecialist, user]);

  const handleClaim = async (id) => {
    try {
      await updateDoc(doc(db, 'support-requests', id), {
        status: 'claimed',
        claimedBy: user.uid,
        claimedByName: user.username,
        claimedAt: new Date().toISOString(),
      });
      setRequests(prev => prev.map(r =>
        r.id === id ? { ...r, status: 'claimed', claimedBy: user.uid, claimedByName: user.username } : r
      ));
    } catch (e) {
      console.error('Error claiming:', e);
    }
  };

  const handleResolve = async (id) => {
    try {
      await updateDoc(doc(db, 'support-requests', id), {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
      });
      const req = requests.find(r => r.id === id);
      setRequests(prev => prev.filter(r => r.id !== id));
      if (req) setResolved(prev => [{ ...req, status: 'resolved', resolvedAt: new Date().toISOString() }, ...prev]);
    } catch (e) {
      console.error('Error resolving:', e);
    }
  };

  if (loading || !isVerifiedSpecialist) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-midnight-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-[10px] tracking-widest uppercase">loading</p>
        </div>
      </div>
    );
  }

  // Derived data
  const sp           = profile?.specialistProfile || {};
  const vd           = profile?.verificationData  || {};
  const openReqs     = requests.filter(r => r.status === 'open');
  const myActiveReqs = requests.filter(r => r.status === 'claimed' && r.claimedBy === user.uid);
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
    <div className="min-h-screen pt-32 pb-20 px-4">
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
            <div className="w-16 h-16 rounded-2xl bg-midnight-400/10 border border-midnight-400/20 flex items-center justify-center flex-shrink-0">
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

              <p className="text-gray-500 lowercase text-sm mb-3">
                security specialist
                {vd.organization && (
                  <> · <span className="text-gray-400">{vd.organization}</span></>
                )}
              </p>

              {/* Expertise chips */}
              {(sp.expertiseAreas?.length > 0 || vd.expertise) && (
                <div className="flex flex-wrap gap-2">
                  {(sp.expertiseAreas?.length > 0 ? sp.expertiseAreas : [vd.expertise]).map(area => (
                    <span
                      key={area}
                      className="px-2.5 py-1 bg-midnight-400/10 border border-midnight-400/20 text-midnight-400 rounded-lg text-[11px] font-semibold lowercase"
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
                color: 'text-amber-400',
                iconBg: 'bg-amber-400/10 border-amber-400/20',
              },
              {
                icon: TrendingUp,
                value: myActiveReqs.length,
                label: 'active now',
                color: 'text-midnight-400',
                iconBg: 'bg-midnight-400/10 border-midnight-400/20',
              },
            ].map(stat => {
              const StatIcon = stat.icon;
              return (
                <div key={stat.label} className="border border-white/[0.08] rounded-2xl p-4 bg-white/[0.02]">
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center mb-3 ${stat.iconBg}`}>
                    <StatIcon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <p className={`text-3xl font-display font-bold ${stat.color} mb-0.5`}>{stat.value}</p>
                  <p className="text-[11px] text-gray-600 lowercase">{stat.label}</p>
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
            <div className="flex items-center gap-1 mb-5 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 w-fit">
              {tabConfig.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold lowercase transition-all ${
                    activeTab === tab.id
                      ? 'bg-white/[0.08] text-white'
                      : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                      activeTab === tab.id
                        ? tab.id === 'open' && openReqs.some(r => r.urgency === 'emergency')
                          ? 'bg-crimson-500/30 text-crimson-400'
                          : 'bg-midnight-400/20 text-midnight-400'
                        : 'bg-white/[0.05] text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Request list */}
            {tabReqs.length === 0 ? (
              <div className="border border-white/[0.08] rounded-2xl p-10 bg-white/[0.02] flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-olive-500/10 border border-olive-500/20 flex items-center justify-center">
                  <Inbox className="w-5 h-5 text-olive-500" />
                </div>
                <p className="text-sm text-gray-500 lowercase">
                  {activeTab === 'open'     && 'no open requests right now'}
                  {activeTab === 'active'   && 'no active cases — pick one from open'}
                  {activeTab === 'resolved' && 'no resolved cases yet'}
                </p>
              </div>
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
            <div className="border border-white/[0.08] rounded-2xl p-5 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] tracking-widest uppercase font-bold text-gray-600">profile</p>
                <a
                  href="/settings"
                  className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors lowercase"
                >
                  edit →
                </a>
              </div>

              {sp.bio ? (
                <p className="text-sm text-gray-400 lowercase leading-relaxed mb-4">{sp.bio}</p>
              ) : (
                <p className="text-sm text-gray-700 lowercase italic mb-4">no bio yet — add one in settings</p>
              )}

              {/* Certifications */}
              {sp.certifications?.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">certifications</p>
                  <div className="space-y-1.5">
                    {sp.certifications.map((cert, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-olive-500 flex-shrink-0" />
                        <span className="text-xs text-gray-400 lowercase">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification data — credentials */}
              {vd.credentials && (
                <div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5">credentials</p>
                  <p className="text-xs text-gray-500 lowercase leading-relaxed">{vd.credentials}</p>
                </div>
              )}
            </div>

            {/* Feedback card */}
            {ratedReqs.length > 0 && (
              <div className="border border-white/[0.08] rounded-2xl p-5 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] tracking-widest uppercase font-bold text-gray-600">feedback</p>
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-700'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{avgRating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {ratedReqs.slice(0, 4).map(req => (
                    <div key={req.id} className="border-b border-white/[0.04] last:border-0 pb-3 last:pb-0">
                      <div className="flex gap-0.5 mb-1.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= req.feedback.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-700'}`} />
                        ))}
                      </div>
                      {req.feedback.comment ? (
                        <p className="text-xs text-gray-400 lowercase leading-relaxed">{req.feedback.comment}</p>
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
            <div className="border border-white/[0.08] rounded-2xl p-5 bg-white/[0.02]">
              <p className="text-[10px] tracking-widest uppercase font-bold text-gray-600 mb-3">resources</p>
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
                      className="flex items-center gap-3 py-2 text-gray-500 hover:text-gray-300 transition-colors group"
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
    </div>
  );
};

export default SpecialistDashboard;
