import { motion } from 'framer-motion';
import {
  Shield, AlertTriangle, TrendingUp, Book, Users, Zap,
  Lock, Smartphone, MessageSquare, Database, MapPin,
  ArrowRight, Calendar, Award, Clock
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

  // Map category keys to their icons
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

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-olive-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-crimson-500';
  };

  const getScoreGradient = (score) => {
    if (score >= 80) return 'from-olive-500 to-olive-600';
    if (score >= 60) return 'from-amber-500 to-amber-600';
    return 'from-crimson-500 to-crimson-600';
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'excellent! keep up the great work';
    if (score >= 60) return 'good progress, but room for improvement';
    return 'attention needed - let\'s improve your security';
  };

  const getRecommendations = () => {
    if (!latestScore) return [];

    const recommendations = [];
    const categoryScores = latestScore.categoryScores;

    // Check each category and provide recommendations
    if (categoryScores.password?.score < 70) {
      recommendations.push({
        icon: Lock,
        category: 'password security',
        issue: 'your password security needs improvement',
        action: 'start using a password manager',
        link: '/secure-setup',
        priority: 'high'
      });
    }

    if (categoryScores.device?.score < 70) {
      recommendations.push({
        icon: Smartphone,
        category: 'device security',
        issue: 'your devices need better protection',
        action: 'enable full disk encryption',
        link: '/secure-setup',
        priority: 'high'
      });
    }

    if (categoryScores.communication?.score < 70) {
      recommendations.push({
        icon: MessageSquare,
        category: 'communication security',
        issue: 'your communications could be more secure',
        action: 'switch to encrypted messaging',
        link: '/resources',
        priority: 'medium'
      });
    }

    if (categoryScores.data?.score < 70) {
      recommendations.push({
        icon: Database,
        category: 'data protection',
        issue: 'your data storage needs improvement',
        action: 'implement regular encrypted backups',
        link: '/secure-setup',
        priority: 'high'
      });
    }

    if (categoryScores.physical?.score < 70) {
      recommendations.push({
        icon: MapPin,
        category: 'physical security',
        issue: 'your physical security practices need work',
        action: 'review our physical security guide',
        link: '/resources',
        priority: 'medium'
      });
    }

    return recommendations.slice(0, 3); // Return top 3 priorities
  };

  const quickActions = [
    {
      title: 'crisis mode',
      description: 'get immediate help in emergency situations',
      icon: AlertTriangle,
      link: '/crisis',
      gradient: 'from-crimson-500 to-crimson-600',
    },
    {
      title: 'retake security quiz',
      description: 'update your security score',
      icon: Shield,
      link: '/security-score',
      gradient: 'from-midnight-400 to-midnight-500',
    },
    {
      title: 'secure your setup',
      description: 'step-by-step hardening guide',
      icon: Zap,
      link: '/secure-setup',
      gradient: 'from-teal-500 to-teal-600',
    },
    {
      title: 'browse resources',
      description: 'learn about digital security',
      icon: Book,
      link: '/resources',
      gradient: 'from-purple-500 to-purple-600',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-midnight-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400 lowercase">loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{user.avatarIcon || '🔒'}</span>
              <h1 className="text-4xl md:text-5xl font-display font-bold lowercase">
                welcome back, <span className="text-midnight-400">{user.username}</span>
              </h1>
              {user.accountType === 'specialist' && user.verificationStatus === 'approved' && (
                <VerifiedBadge size="md" />
              )}
            </div>

            {/* Verification Status Notice for Specialists */}
            {user.accountType === 'specialist' && user.verificationStatus === 'pending' && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-400 font-semibold lowercase mb-1">
                      specialist verification pending
                    </p>
                    <p className="text-xs text-gray-400 lowercase leading-relaxed">
                      your credentials are being reviewed. you'll receive full specialist access once approved.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <p className="text-lg text-gray-400 lowercase leading-relaxed">
            your digital safety command center
          </p>
        </motion.div>

        {/* Security Score Card */}
        {hasQuizData ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card p-8 mb-8"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getScoreGradient(latestScore.score)} flex items-center justify-center`}>
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold lowercase">your security score</h2>
                    <p className="text-sm text-gray-400 lowercase">
                      {getScoreMessage(latestScore.score)}
                    </p>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className={`text-6xl font-display font-bold ${getScoreColor(latestScore.score)}`}>
                    {latestScore.score}
                  </span>
                  <span className="text-2xl text-gray-500">/100</span>
                </div>

                <p className="text-sm text-gray-500 lowercase">
                  last updated: {new Date(latestScore.completedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>

              {/* Category Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full md:w-auto">
                {Object.entries(latestScore.categoryScores).map(([key, category]) => {
                  const Icon = categoryIcons[key] || Shield;
                  return (
                    <div key={key} className="text-center">
                      <Icon className={`w-5 h-5 mx-auto mb-2 ${getScoreColor(category.score)}`} />
                      <p className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                        {category.score}%
                      </p>
                      <p className="text-xs text-gray-500 lowercase">{category.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card p-8 mb-8 text-center"
          >
            <Shield className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold mb-4 lowercase">
              take your first security assessment
            </h2>
            <p className="text-gray-400 mb-6 lowercase">
              find out how secure you really are with our comprehensive quiz
            </p>
            <Link
              to="/security-score"
              className="inline-flex items-center gap-2 px-8 py-4 bg-midnight-400 hover:bg-midnight-500 text-white rounded-lg font-semibold transition-all hover:scale-105 lowercase"
            >
              start security quiz
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        )}

        {/* Personalized Recommendations */}
        {hasQuizData && getRecommendations().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-display font-bold mb-6 lowercase">
              recommended actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {getRecommendations().map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      rec.priority === 'high' ? 'bg-crimson-500/20' : 'bg-amber-500/20'
                    }`}>
                      <rec.icon className={`w-5 h-5 ${
                        rec.priority === 'high' ? 'text-crimson-500' : 'text-amber-500'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <span className={`text-xs uppercase tracking-wider font-semibold ${
                        rec.priority === 'high' ? 'text-crimson-500' : 'text-amber-500'
                      }`}>
                        {rec.priority} priority
                      </span>
                      <h3 className="text-lg font-display font-semibold mt-1 lowercase">
                        {rec.category}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-4 lowercase">{rec.issue}</p>
                  <Link
                    to={rec.link}
                    className="inline-flex items-center gap-2 text-sm text-midnight-400 hover:text-midnight-300 transition-colors lowercase font-semibold"
                  >
                    {rec.action}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Score History */}
        {hasQuizData && userData.securityScores.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-display font-bold mb-6 lowercase">
              your progress
            </h2>
            <div className="glass-card p-6">
              <div className="space-y-4">
                {userData.securityScores.slice(-5).reverse().map((score, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-400">
                        {new Date(score.completedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(score.score)}`}>
                      {score.score}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-2xl font-display font-bold mb-6 lowercase">quick actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              >
                <Link
                  to={action.link}
                  className="block glass-card p-6 hover:scale-[1.02] transition-all duration-300 group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 lowercase">{action.title}</h3>
                  <p className="text-sm text-gray-400 lowercase">{action.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
