import { motion } from 'framer-motion';
import {
  Shield, AlertTriangle, Book, Users, Zap,
  Lock, Smartphone, MessageSquare, Database, MapPin,
  ArrowRight, Clock, ChevronRight, BookOpen, Headphones,
  Inbox, CheckCircle, User, Star, Send
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, orderBy, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import VerifiedBadge from '../components/VerifiedBadge';

// ── ProgressRing ──────────────────────────────────────────────────
const ProgressRing = ({ pct, size = 80, stroke = 6, color = '#6366F1' }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
};

const getLevelInfo = (pct) => {
  if (pct >= 100) return { label: 'security hardened',  color: '#84CC16' };
  if (pct >= 75)  return { label: 'security conscious', color: '#6366F1' };
  if (pct >= 50)  return { label: 'security aware',     color: '#2DD4BF' };
  if (pct >= 25)  return { label: 'building habits',    color: '#FBBF24' };
  return                 { label: 'getting started',    color: '#6B7280' };
};

const SCORE_HEX = (score) =>
  score >= 80 ? '#84CC16' : score >= 60 ? '#F59E0B' : '#EF4444';

const SETUP_HEX = (pct) =>
  pct >= 80 ? '#84CC16' : pct >= 40 ? '#F59E0B' : pct > 0 ? '#EF4444' : '#374151';

const Dashboard = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supportRequests, setSupportRequests] = useState([]);
  const [resolvedByMe, setResolvedByMe] = useState([]);
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [expandedMyRequest, setExpandedMyRequest] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const isVerifiedSpecialist = user?.accountType === 'specialist' && user?.verificationStatus === 'approved';

  const categoryIcons = {
    risk: Users,
    password: Lock,
    device: Smartphone,
    communication: MessageSquare,
    data: Database,
    physical: MapPin
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  // Fetch support requests for verified specialists
  useEffect(() => {
    const fetchRequests = async () => {
      if (!isVerifiedSpecialist) return;
      try {
        const q = query(
          collection(db, 'support-requests'),
          where('status', 'in', ['open', 'claimed']),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        setSupportRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error('Error fetching support requests:', error);
      }
    };
    fetchRequests();
  }, [isVerifiedSpecialist]);

  // Fetch resolved requests for specialist (to show feedback)
  useEffect(() => {
    const fetchResolved = async () => {
      if (!isVerifiedSpecialist || !user) return;
      try {
        const q = query(
          collection(db, 'support-requests'),
          where('claimedBy', '==', user.uid),
          where('status', '==', 'resolved')
        );
        const snapshot = await getDocs(q);
        setResolvedByMe(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error('Error fetching resolved requests:', error);
      }
    };
    fetchResolved();
  }, [isVerifiedSpecialist, user]);

  const handleClaimRequest = async (requestId) => {
    try {
      await updateDoc(doc(db, 'support-requests', requestId), {
        status: 'claimed',
        claimedBy: user.uid,
        claimedByName: user.username,
        claimedAt: new Date().toISOString()
      });
      setSupportRequests(prev => prev.map(r =>
        r.id === requestId
          ? { ...r, status: 'claimed', claimedBy: user.uid, claimedByName: user.username, claimedAt: new Date().toISOString() }
          : r
      ));
    } catch (error) {
      console.error('Error claiming request:', error);
    }
  };

  const handleResolveRequest = async (requestId) => {
    try {
      await updateDoc(doc(db, 'support-requests', requestId), {
        status: 'resolved',
        resolvedAt: new Date().toISOString()
      });
      setSupportRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      console.error('Error resolving request:', error);
    }
  };

  // Fetch journalist's own submitted requests
  useEffect(() => {
    const fetchMyRequests = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'support-requests'),
          where('requesterId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const requests = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        if (requests.length > 0) setMyRequests(requests);
      } catch (error) {
        console.error('Error fetching my requests:', error);
      }
    };
    fetchMyRequests();
  }, [user]);

  const handleSubmitFeedback = async (requestId) => {
    if (feedbackRating === 0) return;
    setSubmittingFeedback(true);
    try {
      await updateDoc(doc(db, 'support-requests', requestId), {
        feedback: {
          rating: feedbackRating,
          comment: feedbackComment,
          submittedAt: new Date().toISOString()
        }
      });
      setMyRequests(prev => prev.map(r =>
        r.id === requestId
          ? { ...r, feedback: { rating: feedbackRating, comment: feedbackComment, submittedAt: new Date().toISOString() } }
          : r
      ));
      setFeedbackRating(0);
      setFeedbackComment('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getCrisisLabel = (type) => {
    const labels = { hacked: 'hacked account', source: 'source exposed', doxxed: 'doxxing incident', phishing: 'phishing attempt' };
    return labels[type] || 'security concern';
  };

  const latestScore = userData?.securityScores?.[userData.securityScores.length - 1];
  const hasQuizData = userData?.securityScores && userData.securityScores.length > 0;

  // Setup progress
  const setupCompleted = userData?.setupProgress?.completedTasks?.length || 0;
  const setupTotal = 31;
  const setupPercent = Math.round((setupCompleted / setupTotal) * 100);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-olive-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-crimson-500';
  };

  const getBarColor = (score) => {
    if (score >= 80) return 'bg-olive-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-crimson-500';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'strong';
    if (score >= 60) return 'moderate';
    return 'needs work';
  };

  const getRecommendations = () => {
    if (!latestScore) return [];
    const recs = [];
    const cs = latestScore.categoryScores;

    if (cs.password?.score < 70) recs.push({
      icon: Lock, label: 'passwords', action: 'set up a password manager', link: '/secure-setup', score: cs.password.score
    });
    if (cs.device?.score < 70) recs.push({
      icon: Smartphone, label: 'devices', action: 'enable disk encryption', link: '/secure-setup', score: cs.device.score
    });
    if (cs.communication?.score < 70) recs.push({
      icon: MessageSquare, label: 'comms', action: 'switch to encrypted messaging', link: '/resources', score: cs.communication.score
    });
    if (cs.data?.score < 70) recs.push({
      icon: Database, label: 'data', action: 'set up encrypted backups', link: '/secure-setup', score: cs.data.score
    });
    if (cs.physical?.score < 70) recs.push({
      icon: MapPin, label: 'physical', action: 'review physical security guide', link: '/resources', score: cs.physical.score
    });

    return recs.sort((a, b) => a.score - b.score).slice(0, 3);
  };

  const daysSinceQuiz = hasQuizData
    ? Math.floor((new Date() - new Date(latestScore.completedAt)) / (1000 * 60 * 60 * 24))
    : null;

  // Verified specialists have their own dedicated dashboard
  if (isVerifiedSpecialist) {
    return <Navigate to="/specialist-dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-midnight-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-[10px] tracking-widest uppercase">loading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">

        {/* ── Greeting ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-5 mb-8"
        >
          <div className="w-14 h-14 rounded-2xl bg-midnight-400/10 border border-midnight-400/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">{user.avatarIcon || '🔒'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h1 className="text-3xl font-display font-bold lowercase">
                hello, {user.username}
              </h1>
              {user.accountType === 'specialist' && user.verificationStatus === 'approved' && (
                <VerifiedBadge size="sm" />
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {hasQuizData ? (
                <span className="text-xs font-medium lowercase" style={{ color: getLevelInfo(latestScore.score).color }}>
                  {getLevelInfo(latestScore.score).label}
                </span>
              ) : (
                <span className="text-xs text-gray-600 lowercase">no assessment yet — take the quiz to get your rank</span>
              )}
              {user.accountType === 'specialist' && user.verificationStatus === 'pending' && (
                <span className="flex items-center gap-1 text-xs text-amber-400 lowercase ml-1">
                  <Clock className="w-3 h-3" />
                  verification pending
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── 3 stat cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5"
        >
          {/* Security Score */}
          <Link to="/security-score" className="group border border-white/[0.08] rounded-2xl p-5 bg-white/[0.02] hover:bg-white/[0.03] transition-all">
            <p className="text-[10px] tracking-widest uppercase font-bold text-gray-600 mb-4">security score</p>
            {hasQuizData ? (
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0" style={{ width: 72, height: 72 }}>
                  <ProgressRing pct={latestScore.score} size={72} stroke={5} color={SCORE_HEX(latestScore.score)} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold font-display" style={{ color: SCORE_HEX(latestScore.score) }}>
                      {latestScore.score}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white lowercase">{getScoreLabel(latestScore.score)}</p>
                  <p className="text-xs text-gray-600 lowercase">
                    {daysSinceQuiz === 0 ? 'taken today' : daysSinceQuiz === 1 ? 'yesterday' : `${daysSinceQuiz}d ago`}
                  </p>
                  <p className="text-[10px] text-gray-700 lowercase mt-2 group-hover:text-gray-400 transition-colors">retake →</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-[72px] h-[72px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-7 h-7 text-gray-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 lowercase">not assessed</p>
                  <p className="text-xs text-gray-600 lowercase">5 min · 31 questions</p>
                  <p className="text-[10px] text-midnight-400 lowercase mt-2 group-hover:text-midnight-300 transition-colors">start →</p>
                </div>
              </div>
            )}
          </Link>

          {/* Secure Setup */}
          <Link to="/secure-setup" className="group border border-white/[0.08] rounded-2xl p-5 bg-white/[0.02] hover:bg-white/[0.03] transition-all">
            <p className="text-[10px] tracking-widest uppercase font-bold text-gray-600 mb-4">secure setup</p>
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0" style={{ width: 72, height: 72 }}>
                <ProgressRing pct={setupPercent} size={72} stroke={5} color={SETUP_HEX(setupPercent)} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold font-display" style={{ color: SETUP_HEX(setupPercent) }}>
                    {setupPercent}<span className="text-xs">%</span>
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-white lowercase">{getLevelInfo(setupPercent).label}</p>
                <p className="text-xs text-gray-600 lowercase">{setupCompleted} / {setupTotal} tasks</p>
                <p className="text-[10px] text-gray-700 lowercase mt-2 group-hover:text-gray-400 transition-colors">continue →</p>
              </div>
            </div>
          </Link>

          {/* Priority action */}
          <div className="border border-white/[0.08] rounded-2xl p-5 bg-white/[0.02]">
            <p className="text-[10px] tracking-widest uppercase font-bold text-gray-600 mb-4">priority</p>
            {hasQuizData && getRecommendations().length > 0 ? (() => {
              const top = getRecommendations()[0];
              const TopIcon = top.icon;
              return (
                <Link to={top.link} className="group flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-crimson-500/10 border border-crimson-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TopIcon className="w-5 h-5 text-crimson-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white lowercase leading-snug">{top.action}</p>
                    <p className="text-xs text-gray-600 lowercase mt-1">{top.label} · {top.score}% score</p>
                    <p className="text-[10px] text-crimson-500/60 lowercase mt-2 group-hover:text-crimson-400 transition-colors">fix now →</p>
                  </div>
                </Link>
              );
            })() : !hasQuizData ? (
              <Link to="/security-score" className="group flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-midnight-400/10 border border-midnight-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-5 h-5 text-midnight-400" />
                </div>
                <div>
                  <p className="text-sm text-white lowercase leading-snug">take your security assessment</p>
                  <p className="text-xs text-gray-600 lowercase mt-1">find out where you stand</p>
                  <p className="text-[10px] text-midnight-400/60 lowercase mt-2 group-hover:text-midnight-400 transition-colors">start →</p>
                </div>
              </Link>
            ) : (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-olive-500/10 border border-olive-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-olive-500" />
                </div>
                <p className="text-sm text-olive-400 lowercase leading-snug pt-2.5">you're in great shape — keep it up</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── 2-col: Up Next + Explore ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4 mb-6">

          {/* Up Next */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="border border-white/[0.08] rounded-2xl p-5 bg-white/[0.02]"
          >
            <p className="text-[10px] tracking-widest uppercase font-bold text-gray-600 mb-3">up next</p>
            <div className="space-y-0.5">
              {hasQuizData && getRecommendations().map((rec) => {
                const RecIcon = rec.icon;
                return (
                  <Link
                    key={rec.label}
                    to={rec.link}
                    className="group flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/[0.04] transition-all border-l-2 border-l-transparent hover:border-l-crimson-500/40"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                      <RecIcon className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white lowercase">{rec.action}</p>
                      <p className="text-xs text-gray-600 lowercase">{rec.label} · {rec.score}%</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-400 transition-colors flex-shrink-0" />
                  </Link>
                );
              })}
              {!hasQuizData && (
                <Link
                  to="/security-score"
                  className="group flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/[0.04] transition-all border-l-2 border-l-transparent hover:border-l-midnight-400/40"
                >
                  <div className="w-7 h-7 rounded-lg bg-midnight-400/10 border border-midnight-400/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-3.5 h-3.5 text-midnight-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white lowercase">take your security assessment</p>
                    <p className="text-xs text-gray-600 lowercase">find out how secure you really are</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-400 transition-colors flex-shrink-0" />
                </Link>
              )}
              {setupCompleted === 0 && (
                <Link
                  to="/secure-setup"
                  className="group flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/[0.04] transition-all border-l-2 border-l-transparent hover:border-l-teal-500/40"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-3.5 h-3.5 text-teal-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white lowercase">start securing your setup</p>
                    <p className="text-xs text-gray-600 lowercase">{setupTotal} tasks to harden your devices</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-400 transition-colors flex-shrink-0" />
                </Link>
              )}
              <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl opacity-40">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white lowercase">lessons</p>
                  <p className="text-xs text-gray-600 lowercase">interactive training — coming soon</p>
                </div>
                <span className="text-[10px] bg-white/[0.05] border border-white/[0.08] text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold flex-shrink-0">
                  soon
                </span>
              </div>
              {hasQuizData && getRecommendations().length === 0 && setupPercent >= 80 && (
                <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl">
                  <div className="w-7 h-7 rounded-lg bg-olive-500/10 border border-olive-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-3.5 h-3.5 text-olive-500" />
                  </div>
                  <p className="text-sm text-olive-400 lowercase">you're in great shape — keep it up</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Explore */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="border border-white/[0.08] rounded-2xl p-5 bg-white/[0.02]"
          >
            <p className="text-[10px] tracking-widest uppercase font-bold text-gray-600 mb-3">explore</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: '/resources',       icon: Book,          label: 'resources', color: '#6366F1', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.18)'  },
                { to: '/community',       icon: Users,         label: 'community', color: '#2DD4BF', bg: 'rgba(45,212,191,0.08)',  border: 'rgba(45,212,191,0.18)'  },
                { to: '/request-support', icon: Headphones,    label: 'get help',  color: '#84CC16', bg: 'rgba(132,204,22,0.08)', border: 'rgba(132,204,22,0.18)'  },
                { to: '/crisis',          icon: AlertTriangle, label: 'crisis',    color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.18)'   },
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="group flex flex-col items-center text-center gap-2.5 p-3.5 rounded-xl border transition-all hover:scale-[1.04]"
                    style={{ backgroundColor: item.bg, borderColor: item.border }}
                  >
                    <ItemIcon className="w-5 h-5" style={{ color: item.color }} />
                    <p className="text-xs font-medium text-gray-400 lowercase group-hover:text-white transition-colors">{item.label}</p>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ── My Requests (journalist view) ── */}
        {myRequests.length > 0 && !isVerifiedSpecialist && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="border border-white/[0.08] rounded-2xl p-5 bg-white/[0.02] mb-5"
          >
            <p className="text-[10px] tracking-widest uppercase font-bold text-gray-600 mb-4">
              my support requests
            </p>

            <div className="space-y-2">
              {myRequests.map((req) => (
                <div key={req.id}>
                  <button
                    onClick={() => setExpandedMyRequest(expandedMyRequest === req.id ? null : req.id)}
                    className="w-full group flex items-center gap-4 py-3 px-3 rounded-xl hover:bg-white/[0.04] transition-all text-left"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      req.status === 'resolved' ? 'bg-olive-500/10 border border-olive-500/20' :
                      req.status === 'claimed' ? 'bg-midnight-400/10 border border-midnight-400/20' :
                      'bg-amber-500/10 border border-amber-500/20'
                    }`}>
                      {req.status === 'resolved' ? (
                        <CheckCircle className="w-4 h-4 text-olive-500" />
                      ) : req.status === 'claimed' ? (
                        <User className="w-4 h-4 text-midnight-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-white lowercase truncate">
                        {getCrisisLabel(req.crisisType)}
                      </p>
                      <p className="text-xs text-gray-600 lowercase">
                        {req.status === 'open' && 'waiting for a specialist'}
                        {req.status === 'claimed' && `${req.claimedByName || 'a specialist'} is on it`}
                        {req.status === 'resolved' && (req.feedback ? 'resolved — feedback sent' : 'resolved — rate your experience')}
                        {' · '}{new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-gray-700 transition-transform flex-shrink-0 ${expandedMyRequest === req.id ? 'rotate-90' : ''}`} />
                  </button>

                  {/* Expanded: feedback form for resolved requests */}
                  {expandedMyRequest === req.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="ml-12 mr-0 mb-2"
                    >
                      <div className="border border-white/[0.08] rounded-xl p-4 bg-white/[0.02] space-y-3">
                        {/* Status info */}
                        <div className="text-xs lowercase space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex px-2 py-0.5 rounded-full font-bold uppercase tracking-widest text-[10px] ${
                              req.status === 'resolved' ? 'bg-olive-500/20 text-olive-400' :
                              req.status === 'claimed' ? 'bg-midnight-400/20 text-midnight-400' :
                              'bg-amber-500/20 text-amber-400'
                            }`}>
                              {req.status}
                            </span>
                            {req.claimedByName && (
                              <span className="text-gray-500">by {req.claimedByName}</span>
                            )}
                          </div>
                          {req.urgency && (
                            <p className="text-gray-600">urgency: {req.urgency}</p>
                          )}
                        </div>

                        {/* Feedback form for resolved requests without feedback */}
                        {req.status === 'resolved' && !req.feedback && (
                          <div className="pt-2 border-t border-white/[0.06] space-y-3">
                            <p className="text-sm text-white lowercase">how was your experience?</p>

                            {/* Star rating */}
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setFeedbackRating(star)}
                                  className="p-1 transition-all hover:scale-110"
                                >
                                  <Star className={`w-6 h-6 ${
                                    star <= feedbackRating
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-gray-700'
                                  }`} />
                                </button>
                              ))}
                            </div>

                            {/* Comment */}
                            <textarea
                              value={feedbackComment}
                              onChange={(e) => setFeedbackComment(e.target.value)}
                              placeholder="optional: share your thoughts..."
                              rows="2"
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-midnight-400 transition-colors resize-none lowercase"
                            />

                            <button
                              onClick={() => handleSubmitFeedback(req.id)}
                              disabled={feedbackRating === 0 || submittingFeedback}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-midnight-400/20 border border-midnight-400/30 rounded-lg text-xs text-midnight-400 hover:bg-midnight-400/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all lowercase"
                            >
                              <Send className="w-3.5 h-3.5" />
                              {submittingFeedback ? 'sending...' : 'send feedback'}
                            </button>
                          </div>
                        )}

                        {/* Already submitted feedback */}
                        {req.feedback && (
                          <div className="pt-2 border-t border-white/[0.06]">
                            <div className="flex items-center gap-1 mb-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className={`w-4 h-4 ${
                                  star <= req.feedback.rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-700'
                                }`} />
                              ))}
                            </div>
                            {req.feedback.comment && (
                              <p className="text-xs text-gray-400 lowercase">{req.feedback.comment}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Specialist: Support Requests ── */}
        {isVerifiedSpecialist && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <p className="text-[10px] tracking-widest uppercase font-bold text-gray-600">
                support requests
              </p>
              {supportRequests.filter(r => r.status === 'open').length > 0 && (
                <span className="text-[10px] bg-crimson-500/20 text-crimson-400 px-2 py-0.5 rounded-full font-bold">
                  {supportRequests.filter(r => r.status === 'open').length} open
                </span>
              )}
            </div>

            {supportRequests.length === 0 ? (
              <div className="flex items-center gap-4 py-3 px-4 -mx-4">
                <div className="w-8 h-8 rounded-lg bg-olive-500/10 border border-olive-500/20 flex items-center justify-center flex-shrink-0">
                  <Inbox className="w-4 h-4 text-olive-500" />
                </div>
                <p className="text-base text-gray-500 lowercase">no open requests — all clear</p>
              </div>
            ) : (
              <div className="space-y-2">
                {supportRequests.map((req) => (
                  <div key={req.id}>
                    <button
                      onClick={() => setExpandedRequest(expandedRequest === req.id ? null : req.id)}
                      className="w-full group flex items-center gap-4 py-3 px-4 -mx-4 rounded-xl hover:bg-white/[0.03] transition-all text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        req.urgency === 'emergency' ? 'bg-crimson-500/10 border border-crimson-500/20' :
                        req.urgency === 'urgent' ? 'bg-amber-500/10 border border-amber-500/20' :
                        'bg-white/[0.04] border border-white/[0.08]'
                      }`}>
                        <AlertTriangle className={`w-4 h-4 ${
                          req.urgency === 'emergency' ? 'text-crimson-500' :
                          req.urgency === 'urgent' ? 'text-amber-500' :
                          'text-gray-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base text-white lowercase truncate">
                          {getCrisisLabel(req.crisisType)}
                        </p>
                        <p className="text-xs text-gray-600 lowercase">
                          {req.urgency} · {new Date(req.createdAt).toLocaleDateString()}
                          {req.status === 'claimed' && req.claimedBy === user.uid && ' · claimed by you'}
                          {req.status === 'claimed' && req.claimedBy !== user.uid && ` · claimed by ${req.claimedByName}`}
                        </p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-700 transition-transform flex-shrink-0 ${expandedRequest === req.id ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Expanded details */}
                    {expandedRequest === req.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="ml-12 mr-0 mb-2"
                      >
                        <div className="border border-white/[0.08] rounded-xl p-4 bg-white/[0.02] space-y-3">
                          <p className="text-sm text-gray-300 lowercase leading-relaxed">{req.description}</p>

                          <div className="grid grid-cols-2 gap-2 text-xs lowercase">
                            <div>
                              <span className="text-gray-600">contact</span>
                              <p className="text-white">{req.requesterEmail}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">preferred method</span>
                              <p className="text-white">{req.contactMethod}</p>
                            </div>
                            {req.requesterPhone && (
                              <div>
                                <span className="text-gray-600">phone</span>
                                <p className="text-white">{req.requesterPhone}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-600">name</span>
                              <p className="text-white">{req.requesterName}</p>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1">
                            {req.status === 'open' && (
                              <button
                                onClick={() => handleClaimRequest(req.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-midnight-400/20 border border-midnight-400/30 rounded-lg text-xs text-midnight-400 hover:bg-midnight-400/30 transition-all lowercase"
                              >
                                <User className="w-3.5 h-3.5" />
                                claim this request
                              </button>
                            )}
                            {req.status === 'claimed' && req.claimedBy === user.uid && (
                              <button
                                onClick={() => handleResolveRequest(req.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-olive-500/20 border border-olive-500/30 rounded-lg text-xs text-olive-500 hover:bg-olive-500/30 transition-all lowercase"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                mark as resolved
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Specialist: Your Feedback ── */}
        {isVerifiedSpecialist && resolvedByMe.some(r => r.feedback) && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <p className="text-[10px] tracking-widest uppercase font-bold text-gray-600">
                your feedback
              </p>
              {(() => {
                const rated = resolvedByMe.filter(r => r.feedback);
                const avg = rated.reduce((sum, r) => sum + r.feedback.rating, 0) / rated.length;
                return (
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= Math.round(avg) ? 'text-amber-400 fill-amber-400' : 'text-gray-700'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{avg.toFixed(1)} ({rated.length})</span>
                  </div>
                );
              })()}
            </div>

            <div className="space-y-2">
              {resolvedByMe.filter(r => r.feedback).slice(0, 3).map((req) => (
                <div key={req.id} className="flex items-start gap-3 py-2 px-4 -mx-4">
                  <div className="flex gap-0.5 mt-0.5 flex-shrink-0">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3 h-3 ${s <= req.feedback.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-700'}`} />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    {req.feedback.comment ? (
                      <p className="text-sm text-gray-400 lowercase">{req.feedback.comment}</p>
                    ) : (
                      <p className="text-sm text-gray-600 lowercase italic">no comment</p>
                    )}
                    <p className="text-[10px] text-gray-700 lowercase mt-0.5">
                      {getCrisisLabel(req.crisisType)} · {new Date(req.feedback.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Quick Links ── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="pt-6 border-t border-white/[0.05]"
        >
          <p className="text-[10px] tracking-widest uppercase font-bold text-gray-600 mb-4">
            explore
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { to: '/resources', icon: Book, label: 'resources', desc: 'guides & tools', color: 'text-midnight-400', bg: 'bg-midnight-400/10', border: 'border-midnight-400/20' },
              { to: '/community', icon: Users, label: 'community', desc: 'discuss & share', color: 'text-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
              { to: '/request-support', icon: Headphones, label: 'get help', desc: 'contact a specialist', color: 'text-olive-500', bg: 'bg-olive-500/10', border: 'border-olive-500/20' },
              { to: '/crisis', icon: AlertTriangle, label: 'crisis mode', desc: 'emergency steps', color: 'text-crimson-500', bg: 'bg-crimson-500/10', border: 'border-crimson-500/20' },
            ].map((item) => {
              const ItemIcon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group flex flex-col items-center text-center gap-3 p-5 bg-white/[0.02] border border-white/[0.08] rounded-2xl hover:bg-white/[0.05] transition-all"
                >
                  <div className={`w-10 h-10 rounded-xl ${item.bg} border ${item.border} flex items-center justify-center`}>
                    <ItemIcon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white lowercase">{item.label}</p>
                    <p className="text-xs text-gray-600 lowercase mt-0.5">{item.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
