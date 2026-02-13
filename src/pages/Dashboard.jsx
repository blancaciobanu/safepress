import { motion } from 'framer-motion';
import {
  Shield, AlertTriangle, Book, Users, Zap,
  Lock, Smartphone, MessageSquare, Database, MapPin,
  ArrowRight, Clock, ChevronRight, BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import VerifiedBadge from '../components/VerifiedBadge';

const Dashboard = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{user.avatarIcon || '🔒'}</span>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl md:text-4xl font-display font-bold lowercase">
                {user.username}
              </h1>
              {user.accountType === 'specialist' && user.verificationStatus === 'approved' && (
                <VerifiedBadge size="md" />
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 lowercase" style={{ letterSpacing: '0.03em' }}>
            your security at a glance
          </p>

          {/* Specialist pending notice */}
          {user.accountType === 'specialist' && user.verificationStatus === 'pending' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 flex items-center gap-2 text-xs text-amber-400 lowercase"
            >
              <Clock className="w-3.5 h-3.5" />
              specialist verification pending
            </motion.div>
          )}
        </motion.div>

        {/* ── Top Row: Score + Setup ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
        >
          {/* Security Score Card */}
          <Link to="/security-score" className="group">
            <div className="border border-white/[0.08] rounded-2xl p-6 bg-white/[0.02] hover:bg-white/[0.03] transition-all h-full">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[10px] tracking-widest uppercase font-bold text-gray-600">
                  security score
                </p>
                <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
              </div>

              {hasQuizData ? (
                <>
                  <div className="flex items-end gap-3 mb-4">
                    <span className={`text-5xl font-display font-bold ${getScoreColor(latestScore.score)}`}>
                      {latestScore.score}
                    </span>
                    <span className="text-sm text-gray-600 mb-1.5 lowercase">/100</span>
                    <span className={`text-xs font-semibold lowercase mb-2 ml-auto ${getScoreColor(latestScore.score)}`}>
                      {getScoreLabel(latestScore.score)}
                    </span>
                  </div>

                  {/* Mini bars */}
                  <div className="space-y-2">
                    {Object.entries(latestScore.categoryScores)
                      .filter(([key]) => key !== 'risk')
                      .map(([key, data]) => {
                        const CatIcon = categoryIcons[key] || Shield;
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <CatIcon className="w-3 h-3 text-gray-600 flex-shrink-0" />
                            <div className="flex-1 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${getBarColor(data.score)}`} style={{ width: `${data.score}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <p className="text-[10px] text-gray-600 lowercase mt-4">
                    {daysSinceQuiz === 0 ? 'taken today' : daysSinceQuiz === 1 ? 'taken yesterday' : `${daysSinceQuiz}d ago`}
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center text-center py-4">
                  <Shield className="w-8 h-8 text-gray-700 mb-3" />
                  <p className="text-sm text-gray-400 lowercase mb-1">not taken yet</p>
                  <p className="text-xs text-gray-600 lowercase">find out where you stand</p>
                </div>
              )}
            </div>
          </Link>

          {/* Secure Setup Card */}
          <Link to="/secure-setup" className="group">
            <div className="border border-white/[0.08] rounded-2xl p-6 bg-white/[0.02] hover:bg-white/[0.03] transition-all h-full">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[10px] tracking-widest uppercase font-bold text-gray-600">
                  secure setup
                </p>
                <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
              </div>

              <div className="flex items-end gap-3 mb-4">
                <span className={`text-5xl font-display font-bold ${
                  setupPercent >= 80 ? 'text-olive-500' :
                  setupPercent >= 40 ? 'text-amber-500' :
                  setupPercent > 0 ? 'text-crimson-500' : 'text-gray-600'
                }`}>
                  {setupPercent}%
                </span>
                <span className="text-sm text-gray-600 mb-1.5 lowercase">complete</span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    setupPercent >= 80 ? 'bg-olive-500' :
                    setupPercent >= 40 ? 'bg-amber-500' :
                    setupPercent > 0 ? 'bg-crimson-500' : 'bg-gray-700'
                  }`}
                  style={{ width: `${setupPercent}%` }}
                />
              </div>

              <p className="text-[10px] text-gray-600 lowercase">
                {setupCompleted} of {setupTotal} tasks done
              </p>

              {setupCompleted === 0 && (
                <p className="text-xs text-gray-500 lowercase mt-4">
                  step-by-step hardening guide
                </p>
              )}
            </div>
          </Link>
        </motion.div>

        {/* ── Up Next ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <p className="text-[10px] tracking-widest uppercase font-bold text-gray-600 mb-4">
            up next
          </p>

          <div className="space-y-2">
            {/* Recommendations from quiz */}
            {hasQuizData && getRecommendations().map((rec, i) => {
              const RecIcon = rec.icon;
              return (
                <Link
                  key={rec.label}
                  to={rec.link}
                  className="group flex items-center gap-4 py-3 px-4 -mx-4 rounded-xl hover:bg-white/[0.03] transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                    <RecIcon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white lowercase">{rec.action}</p>
                    <p className="text-[10px] text-gray-600 lowercase">{rec.label} · score {rec.score}%</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors flex-shrink-0" />
                </Link>
              );
            })}

            {/* Prompt to take quiz if no data */}
            {!hasQuizData && (
              <Link
                to="/security-score"
                className="group flex items-center gap-4 py-3 px-4 -mx-4 rounded-xl hover:bg-white/[0.03] transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-midnight-400/10 border border-midnight-400/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-midnight-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white lowercase">take your security assessment</p>
                  <p className="text-[10px] text-gray-600 lowercase">find out how secure you really are</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors flex-shrink-0" />
              </Link>
            )}

            {/* Setup prompt if not started */}
            {setupCompleted === 0 && (
              <Link
                to="/secure-setup"
                className="group flex items-center gap-4 py-3 px-4 -mx-4 rounded-xl hover:bg-white/[0.03] transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-teal-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white lowercase">start securing your setup</p>
                  <p className="text-[10px] text-gray-600 lowercase">{setupTotal} tasks to harden your devices</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors flex-shrink-0" />
              </Link>
            )}

            {/* Lessons placeholder */}
            <div className="flex items-center gap-4 py-3 px-4 -mx-4 rounded-xl opacity-50">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white lowercase">lessons</p>
                <p className="text-[10px] text-gray-600 lowercase">interactive security training — coming soon</p>
              </div>
              <span className="text-[10px] bg-white/[0.05] border border-white/[0.08] text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold flex-shrink-0">
                soon
              </span>
            </div>

            {/* No recommendations — all good */}
            {hasQuizData && getRecommendations().length === 0 && setupPercent >= 80 && (
              <div className="flex items-center gap-4 py-3 px-4 -mx-4">
                <div className="w-8 h-8 rounded-lg bg-olive-500/10 border border-olive-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-olive-500" />
                </div>
                <p className="text-sm text-olive-400 lowercase">you're in great shape — keep it up</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Quick Links ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="pt-6 border-t border-white/[0.05]"
        >
          <div className="flex flex-wrap gap-2">
            {[
              { to: '/crisis', icon: AlertTriangle, label: 'crisis mode', color: 'text-crimson-500' },
              { to: '/resources', icon: Book, label: 'resources', color: 'text-gray-400' },
              { to: '/community', icon: Users, label: 'community', color: 'text-gray-400' },
              { to: '/settings', icon: Lock, label: 'settings', color: 'text-gray-400' },
            ].map((item) => {
              const ItemIcon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs font-medium lowercase hover:bg-white/[0.06] transition-all"
                >
                  <ItemIcon className={`w-3.5 h-3.5 ${item.color}`} />
                  {item.label}
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
