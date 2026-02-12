import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle2, XCircle, AlertTriangle,
  Lock, Smartphone, MessageSquare, Database, MapPin,
  ArrowRight, RotateCcw, Briefcase, Users, Globe2
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const SecurityScore = () => {
  const { user } = useAuth();
  const [view, setView] = useState('welcome'); // welcome, quiz, results
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);

  const questions = [
    // Risk/Work Context (6 questions)
    {
      id: 'risk1',
      category: 'risk',
      categoryName: 'work context',
      icon: Briefcase,
      question: 'how would you describe the sensitivity of your current journalistic work?',
      options: [
        { value: 'low', label: 'general news, entertainment, or lifestyle reporting', points: 10 },
        { value: 'medium', label: 'political, business, or social issues reporting', points: 7 },
        { value: 'high', label: 'investigative journalism or sensitive topics (corruption, whistleblowers)', points: 3 },
        { value: 'critical', label: 'conflict zones, hostile environments, or authoritarian regimes', points: 0 }
      ]
    },
    {
      id: 'risk2',
      category: 'risk',
      categoryName: 'work context',
      icon: Briefcase,
      question: 'do you work with confidential sources who could face risks if their identity is revealed?',
      options: [
        { value: 'no', label: 'no, my sources are public or low-risk', points: 10 },
        { value: 'rarely', label: 'rarely, only for specific stories', points: 7 },
        { value: 'sometimes', label: 'sometimes, for investigative work', points: 3 },
        { value: 'frequently', label: 'frequently, protecting sources is critical to my work', points: 0 }
      ]
    },
    {
      id: 'risk3',
      category: 'risk',
      categoryName: 'work context',
      icon: Briefcase,
      question: 'what is your geographic work environment?',
      options: [
        { value: 'safe', label: 'stable democracy with strong press freedom protections', points: 10 },
        { value: 'moderate', label: 'democracy with some press restrictions or surveillance concerns', points: 5 },
        { value: 'restricted', label: 'authoritarian regime or conflict zone with limited press freedom', points: 0 }
      ]
    },
    {
      id: 'risk4',
      category: 'risk',
      categoryName: 'work context',
      icon: Briefcase,
      question: 'how public is your professional profile?',
      options: [
        { value: 'high', label: 'very public (TV/broadcast, frequent bylines, active social media)', points: 10 },
        { value: 'medium', label: 'moderately visible (some bylines, limited social media presence)', points: 7 },
        { value: 'low', label: 'low visibility (prefer anonymity or work behind the scenes)', points: 5 }
      ]
    },
    {
      id: 'risk5',
      category: 'risk',
      categoryName: 'work context',
      icon: Briefcase,
      question: 'have you personally experienced any of the following threats or incidents?',
      options: [
        { value: 'none', label: 'none of the above', points: 10 },
        { value: 'online', label: 'online harassment, trolling, or coordinated attacks', points: 6 },
        { value: 'surveillance', label: 'surveillance concerns or digital monitoring', points: 3 },
        { value: 'legal', label: 'legal threats, lawsuits, or arrest risks', points: 2 },
        { value: 'physical', label: 'physical threats, violence, or data breach attempts', points: 0 }
      ]
    },
    {
      id: 'risk6',
      category: 'risk',
      categoryName: 'work context',
      icon: Briefcase,
      question: 'what types of stories do you typically cover?',
      options: [
        { value: 'general', label: 'general news, sports, culture, or lifestyle', points: 10 },
        { value: 'politics', label: 'politics, government accountability, or business investigations', points: 5 },
        { value: 'sensitive', label: 'corruption, organized crime, human rights abuses, or national security', points: 0 }
      ]
    },

    // Password Security (5 questions)
    {
      id: 'pass1',
      category: 'password',
      categoryName: 'password security',
      icon: Lock,
      question: 'do you use unique passwords for each of your accounts?',
      options: [
        { value: 'yes', label: 'yes, all accounts have unique passwords', points: 10 },
        { value: 'some', label: 'some accounts share passwords', points: 5 },
        { value: 'no', label: 'no, i reuse passwords across accounts', points: 0 }
      ]
    },
    {
      id: 'pass2',
      category: 'password',
      categoryName: 'password security',
      icon: Lock,
      question: 'do you use a password manager?',
      options: [
        { value: 'yes', label: 'yes, i use a password manager for all accounts', points: 10 },
        { value: 'some', label: 'i use it for some accounts', points: 5 },
        { value: 'no', label: 'no, i remember my passwords', points: 0 }
      ]
    },
    {
      id: 'pass3',
      category: 'password',
      categoryName: 'password security',
      icon: Lock,
      question: 'are your passwords long (12+ characters) with a mix of letters, numbers, and symbols?',
      options: [
        { value: 'yes', label: 'yes, all passwords are long and complex', points: 10 },
        { value: 'some', label: 'some passwords are strong', points: 5 },
        { value: 'unsure', label: 'i\'m not sure / i don\'t know', points: 2 },
        { value: 'no', label: 'no, i use short or simple passwords', points: 0 }
      ]
    },
    {
      id: 'pass4',
      category: 'password',
      categoryName: 'password security',
      icon: Lock,
      question: 'have you enabled two-factor authentication (2FA) on your important accounts?',
      options: [
        { value: 'yes', label: 'yes, on all critical accounts (email, banking, social media)', points: 10 },
        { value: 'some', label: 'yes, on some accounts', points: 5 },
        { value: 'no', label: 'no, i don\'t use 2FA', points: 0 }
      ]
    },
    {
      id: 'pass5',
      category: 'password',
      categoryName: 'password security',
      icon: Lock,
      question: 'how often do you change passwords for your sensitive accounts?',
      options: [
        { value: 'regular', label: 'every 3-6 months or when compromised', points: 10 },
        { value: 'rare', label: 'rarely, only when forced to', points: 5 },
        { value: 'never', label: 'never, unless i forget them', points: 0 }
      ]
    },

    // Device Security (5 questions)
    {
      id: 'device1',
      category: 'device',
      categoryName: 'device security',
      icon: Smartphone,
      question: 'do you keep your operating system and apps updated?',
      options: [
        { value: 'yes', label: 'yes, i install updates immediately', points: 10 },
        { value: 'sometimes', label: 'sometimes, when i remember', points: 5 },
        { value: 'no', label: 'no, i delay or ignore updates', points: 0 }
      ]
    },
    {
      id: 'device2',
      category: 'device',
      categoryName: 'device security',
      icon: Smartphone,
      question: 'do your devices require a password to access files if someone steals them?',
      options: [
        { value: 'yes', label: 'yes, my files are protected even if device is stolen', points: 10 },
        { value: 'some', label: 'some devices have this protection', points: 5 },
        { value: 'unsure', label: 'i\'m not sure / i don\'t know', points: 0 },
        { value: 'no', label: 'no, files can be accessed if device is stolen', points: 0 }
      ]
    },
    {
      id: 'device3',
      category: 'device',
      categoryName: 'device security',
      icon: Smartphone,
      question: 'do you use antivirus or anti-malware software on your devices?',
      options: [
        { value: 'yes', label: 'yes, with real-time protection enabled', points: 10 },
        { value: 'basic', label: 'only basic/built-in protection', points: 5 },
        { value: 'no', label: 'no, i don\'t use any protection', points: 0 }
      ]
    },
    {
      id: 'device4',
      category: 'device',
      categoryName: 'device security',
      icon: Smartphone,
      question: 'do you use biometric locks (fingerprint/face ID) or strong PINs on your devices?',
      options: [
        { value: 'yes', label: 'yes, all devices have strong locks', points: 10 },
        { value: 'some', label: 'some devices have locks', points: 5 },
        { value: 'no', label: 'no, minimal or no device locks', points: 0 }
      ]
    },
    {
      id: 'device5',
      category: 'device',
      categoryName: 'device security',
      icon: Smartphone,
      question: 'do you have remote wipe capabilities enabled on your mobile devices?',
      options: [
        { value: 'yes', label: 'yes, find my device and remote wipe enabled', points: 10 },
        { value: 'unsure', label: 'i\'m not sure if it\'s enabled', points: 5 },
        { value: 'no', label: 'no, it\'s not enabled', points: 0 }
      ]
    },

    // Communication Practices (5 questions)
    {
      id: 'comm1',
      category: 'communication',
      categoryName: 'communication practices',
      icon: MessageSquare,
      question: 'do you use secure messaging apps (Signal, WhatsApp) for sensitive communications?',
      options: [
        { value: 'yes', label: 'yes, always use Signal, WhatsApp or similar', points: 10 },
        { value: 'sometimes', label: 'sometimes, depends on the contact', points: 5 },
        { value: 'unsure', label: 'i\'m not sure which apps are secure', points: 2 },
        { value: 'no', label: 'no, i use regular SMS or other apps', points: 0 }
      ]
    },
    {
      id: 'comm2',
      category: 'communication',
      categoryName: 'communication practices',
      icon: MessageSquare,
      question: 'do you verify the identity of sources before sharing sensitive information?',
      options: [
        { value: 'yes', label: 'yes, always through multiple channels', points: 10 },
        { value: 'sometimes', label: 'sometimes, if it seems suspicious', points: 5 },
        { value: 'no', label: 'no, i trust the contact information i have', points: 0 }
      ]
    },
    {
      id: 'comm3',
      category: 'communication',
      categoryName: 'communication practices',
      icon: MessageSquare,
      question: 'do you use secure email services (ProtonMail, Tutanota) for sensitive correspondence?',
      options: [
        { value: 'yes', label: 'yes, for all sensitive communications', points: 10 },
        { value: 'sometimes', label: 'i have one but don\'t use it consistently', points: 5 },
        { value: 'no', label: 'no, i use regular email (Gmail, Yahoo, etc.)', points: 0 }
      ]
    },
    {
      id: 'comm4',
      category: 'communication',
      categoryName: 'communication practices',
      icon: MessageSquare,
      question: 'do you regularly delete or archive sensitive communications?',
      options: [
        { value: 'yes', label: 'yes, i have a routine deletion schedule', points: 10 },
        { value: 'sometimes', label: 'occasionally, when i remember', points: 5 },
        { value: 'no', label: 'no, i keep everything', points: 0 }
      ]
    },
    {
      id: 'comm5',
      category: 'communication',
      categoryName: 'communication practices',
      icon: MessageSquare,
      question: 'do you use a VPN when connecting to public wifi networks?',
      options: [
        { value: 'yes', label: 'yes, always on public networks', points: 10 },
        { value: 'sometimes', label: 'sometimes, if i remember', points: 5 },
        { value: 'no', label: 'no, i connect directly', points: 0 }
      ]
    },

    // Data Protection (5 questions)
    {
      id: 'data1',
      category: 'data',
      categoryName: 'data protection',
      icon: Database,
      question: 'do you regularly backup your important files and data?',
      options: [
        { value: 'yes', label: 'yes, automatic backups to protected storage', points: 10 },
        { value: 'sometimes', label: 'occasionally, i back up manually', points: 5 },
        { value: 'unsure', label: 'i\'m not sure if backups are happening', points: 2 },
        { value: 'no', label: 'no, i don\'t backup regularly', points: 0 }
      ]
    },
    {
      id: 'data2',
      category: 'data',
      categoryName: 'data protection',
      icon: Database,
      question: 'are your backups protected so others can\'t access them?',
      options: [
        { value: 'yes', label: 'yes, protected with passwords and in safe locations', points: 10 },
        { value: 'partial', label: 'backed up but not password-protected', points: 5 },
        { value: 'unsure', label: 'i\'m not sure / i don\'t know', points: 2 },
        { value: 'no', label: 'no protection or stored in accessible places', points: 0 }
      ]
    },
    {
      id: 'data3',
      category: 'data',
      categoryName: 'data protection',
      icon: Database,
      question: 'do you use password-protected USB drives or external storage for sensitive files?',
      options: [
        { value: 'yes', label: 'yes, all external storage requires passwords', points: 10 },
        { value: 'sometimes', label: 'some drives are password-protected', points: 5 },
        { value: 'unsure', label: 'i\'m not sure / i don\'t use external storage', points: 5 },
        { value: 'no', label: 'no, anyone can access my drives', points: 0 }
      ]
    },
    {
      id: 'data4',
      category: 'data',
      categoryName: 'data protection',
      icon: Database,
      question: 'when you delete sensitive files, do you permanently erase them so they can\'t be recovered?',
      options: [
        { value: 'yes', label: 'yes, i use permanent deletion tools', points: 10 },
        { value: 'sometimes', label: 'sometimes, for very sensitive files', points: 5 },
        { value: 'unsure', label: 'i\'m not sure how to do this', points: 2 },
        { value: 'no', label: 'no, i just use the trash/recycle bin', points: 0 }
      ]
    },
    {
      id: 'data5',
      category: 'data',
      categoryName: 'data protection',
      icon: Database,
      question: 'do you avoid storing sensitive information in cloud services (Google Drive, Dropbox, iCloud)?',
      options: [
        { value: 'yes', label: 'yes, sensitive data stays on my devices only', points: 10 },
        { value: 'protected', label: 'i protect files with passwords before uploading', points: 7 },
        { value: 'unsure', label: 'i\'m not sure what\'s stored in the cloud', points: 2 },
        { value: 'no', label: 'no, i upload everything to cloud services', points: 0 }
      ]
    },

    // Physical Security (5 questions)
    {
      id: 'physical1',
      category: 'physical',
      categoryName: 'physical security',
      icon: MapPin,
      question: 'do you keep your devices physically secure and out of sight when not in use?',
      options: [
        { value: 'yes', label: 'yes, always locked away or secured', points: 10 },
        { value: 'sometimes', label: 'usually, but sometimes leave them unattended', points: 5 },
        { value: 'no', label: 'no, i often leave devices in public spaces', points: 0 }
      ]
    },
    {
      id: 'physical2',
      category: 'physical',
      categoryName: 'physical security',
      icon: MapPin,
      question: 'do you disable location services when not needed?',
      options: [
        { value: 'yes', label: 'yes, location is off unless actively needed', points: 10 },
        { value: 'sometimes', label: 'sometimes, for sensitive work', points: 5 },
        { value: 'no', label: 'no, location services always on', points: 0 }
      ]
    },
    {
      id: 'physical3',
      category: 'physical',
      categoryName: 'physical security',
      icon: MapPin,
      question: 'do you use privacy screens or screen protectors to prevent shoulder surfing?',
      options: [
        { value: 'yes', label: 'yes, on all devices used in public', points: 10 },
        { value: 'sometimes', label: 'on some devices', points: 5 },
        { value: 'no', label: 'no, i don\'t use privacy screens', points: 0 }
      ]
    },
    {
      id: 'physical4',
      category: 'physical',
      categoryName: 'physical security',
      icon: MapPin,
      question: 'do you cover webcams when not in use?',
      options: [
        { value: 'yes', label: 'yes, always covered or has physical shutter', points: 10 },
        { value: 'sometimes', label: 'sometimes, when i remember', points: 5 },
        { value: 'no', label: 'no, never covered', points: 0 }
      ]
    },
    {
      id: 'physical5',
      category: 'physical',
      categoryName: 'physical security',
      icon: MapPin,
      question: 'do you vary your routes and routines when working on sensitive stories?',
      options: [
        { value: 'yes', label: 'yes, i vary patterns and stay aware of surroundings', points: 10 },
        { value: 'sometimes', label: 'sometimes, for high-risk situations', points: 5 },
        { value: 'no', label: 'no, i maintain regular patterns', points: 0 }
      ]
    }
  ];

  const totalQuestions = questions.length;

  const handleAnswer = (questionId, value, points) => {
    setAnswers({
      ...answers,
      [questionId]: { value, points }
    });
  };

  const saveQuizResults = async () => {
    if (!user) {
      console.log('User not logged in - results will not be saved');
      return; // Don't save if user is not logged in
    }

    setSaving(true);
    try {
      const score = calculateScore();
      const categoryScores = calculateCategoryScores();
      const riskLevel = calculateRiskLevel();

      const quizResult = {
        score,
        categoryScores,
        riskLevel, // NEW: Save risk level for Resources page filtering
        completedAt: new Date().toISOString(),
        totalQuestions: questions.length,
        answeredQuestions: Object.keys(answers).length
      };

      // Save to user's document in Firestore
      const userRef = doc(db, 'users', user.uid);

      // Check if document exists
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        // Document exists - manually append to array
        const existingScores = userDoc.data().securityScores || [];
        await updateDoc(userRef, {
          securityScores: [...existingScores, quizResult],
          lastQuizDate: quizResult.completedAt,
          riskLevel: riskLevel
        });
      } else {
        // Document doesn't exist - create it with initial data
        await setDoc(userRef, {
          email: user.email,
          securityScores: [quizResult],
          lastQuizDate: quizResult.completedAt,
          riskLevel: riskLevel,
          createdAt: new Date().toISOString()
        });
      }

      console.log('✅ Quiz results saved successfully - Risk Level:', riskLevel);
      console.log('✅ Updated user profile with risk level:', user.uid);
    } catch (error) {
      console.error('❌ Error saving quiz results:', error);
      alert('Failed to save quiz results. Please try again or contact support.');
    } finally {
      setSaving(false);
    }
  };

  const nextQuestion = async () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Save results before showing results view
      await saveQuizResults();
      setView('results');
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const restartQuiz = () => {
    setView('welcome');
    setCurrentQuestion(0);
    setAnswers({});
  };

  const calculateScore = () => {
    const totalPossiblePoints = questions.reduce((sum, q) => {
      const maxPoints = Math.max(...q.options.map(opt => opt.points));
      return sum + maxPoints;
    }, 0);

    const earnedPoints = Object.values(answers).reduce((sum, answer) => sum + answer.points, 0);
    const percentage = Math.round((earnedPoints / totalPossiblePoints) * 100);

    return percentage;
  };

  const calculateCategoryScores = () => {
    const categories = {};

    questions.forEach(q => {
      if (!categories[q.category]) {
        categories[q.category] = {
          name: q.categoryName,
          earnedPoints: 0,
          totalPoints: 0
        };
      }

      const maxPoints = Math.max(...q.options.map(opt => opt.points));
      categories[q.category].totalPoints += maxPoints;

      if (answers[q.id]) {
        categories[q.category].earnedPoints += answers[q.id].points;
      }
    });

    // Convert to percentage scores
    Object.keys(categories).forEach(cat => {
      const { earnedPoints, totalPoints } = categories[cat];
      categories[cat].score = Math.round((earnedPoints / totalPoints) * 100);
    });

    return categories;
  };

  // Calculate risk level based on work context AND overall security
  const calculateRiskLevel = () => {
    const overallScore = calculateScore();
    const categoryScores = calculateCategoryScores();

    // Get work context score (risk category)
    const workContextScore = categoryScores.risk ? categoryScores.risk.score : 50;

    // Risk matrix: work context (vertical) x overall security (horizontal)
    // High threat work + poor security = CRITICAL
    // High threat work + good security = HIGH
    // Low threat work + poor security = MEDIUM
    // Low threat work + good security = LOW

    if (workContextScore < 40) {
      // High-threat work environment
      if (overallScore < 50) return 'critical';
      if (overallScore < 70) return 'high';
      return 'medium';
    } else if (workContextScore < 70) {
      // Medium-threat work environment
      if (overallScore < 50) return 'high';
      if (overallScore < 70) return 'medium';
      return 'low';
    } else {
      // Low-threat work environment
      if (overallScore < 50) return 'medium';
      return 'low';
    }
  };

  const getRiskLevelInfo = (riskLevel) => {
    const riskInfo = {
      low: {
        color: 'text-olive-400',
        bgColor: 'bg-olive-500/10',
        borderColor: 'border-olive-500/20',
        icon: CheckCircle2,
        title: 'low risk',
        description: 'your security practices are solid for your work context. maintain these habits and stay updated on emerging threats.'
      },
      medium: {
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        icon: AlertTriangle,
        title: 'medium risk',
        description: 'you have some good practices, but there are important gaps to address. focus on the weak areas identified below.'
      },
      high: {
        color: 'text-crimson-400',
        bgColor: 'bg-crimson-500/10',
        borderColor: 'border-crimson-500/20',
        icon: XCircle,
        title: 'high risk',
        description: 'significant security gaps exist that could compromise your work or sources. prioritize addressing critical issues immediately.'
      },
      critical: {
        color: 'text-crimson-500',
        bgColor: 'bg-crimson-500/20',
        borderColor: 'border-crimson-500/30',
        icon: Shield,
        title: 'critical risk',
        description: 'your current security posture is inadequate for your threat level. immediate action is required to protect yourself and sources.'
      }
    };

    return riskInfo[riskLevel] || riskInfo.medium;
  };

  const getRiskLevelColor = (riskLevel) => {
    const colors = {
      low: 'text-olive-500',
      medium: 'text-amber-500',
      high: 'text-orange-500',
      critical: 'text-crimson-500'
    };
    return colors[riskLevel] || 'text-gray-500';
  };

  const getRiskLevelLabel = (riskLevel) => {
    const labels = {
      low: 'low-risk environment',
      medium: 'medium-risk environment',
      high: 'high-risk environment',
      critical: 'critical-risk environment'
    };
    return labels[riskLevel] || 'unknown';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-olive-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-crimson-500';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'strong security';
    if (score >= 60) return 'moderate security';
    if (score >= 40) return 'needs improvement';
    return 'critical - immediate action needed';
  };

  const getRecommendations = () => {
    const categoryScores = calculateCategoryScores();
    const recommendations = [];

    Object.entries(categoryScores).forEach(([key, data]) => {
      if (data.score < 60) {
        recommendations.push({
          category: data.name,
          icon: questions.find(q => q.category === key)?.icon || Shield,
          score: data.score,
          priority: data.score < 40 ? 'critical' : 'important'
        });
      }
    });

    return recommendations.sort((a, b) => a.score - b.score);
  };

  // Welcome Screen
  if (view === 'welcome') {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-midnight-400/10 border border-midnight-400/20 mb-6">
              <Shield className="w-8 h-8 text-midnight-400" />
            </div>

            <h1 className="text-4xl md:text-6xl font-display font-bold mb-4 lowercase">
              security assessment
            </h1>

            <p className="text-lg md:text-xl font-sans text-gray-400 max-w-2xl mx-auto lowercase leading-relaxed">
              evaluate your digital safety practices with our comprehensive 31-question assessment
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card p-8 mb-8"
          >
            <h2 className="text-2xl font-display font-semibold mb-6 lowercase">
              what you'll discover
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start gap-3 md:col-span-2">
                <Briefcase className="w-5 h-5 text-midnight-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white lowercase mb-1">work context & risk profile</h3>
                  <p className="text-sm text-gray-400 font-sans lowercase">
                    your work environment, source protection needs, and threat landscape
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-midnight-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white lowercase mb-1">password security</h3>
                  <p className="text-sm text-gray-400 font-sans lowercase">
                    authentication strength, password management, and 2FA practices
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-midnight-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white lowercase mb-1">device security</h3>
                  <p className="text-sm text-gray-400 font-sans lowercase">
                    encryption, updates, antivirus, and device protection
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-midnight-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white lowercase mb-1">communication practices</h3>
                  <p className="text-sm text-gray-400 font-sans lowercase">
                    encrypted messaging, secure email, and source verification
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-midnight-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white lowercase mb-1">data protection</h3>
                  <p className="text-sm text-gray-400 font-sans lowercase">
                    backups, encryption, cloud security, and file deletion
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-midnight-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white lowercase mb-1">physical security</h3>
                  <p className="text-sm text-gray-400 font-sans lowercase">
                    device protection, location privacy, and operational security
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-midnight-400/10 rounded-lg border border-midnight-400/20 mb-8">
              <p className="text-sm font-sans text-gray-300 lowercase leading-relaxed">
                <span className="text-white font-semibold">note:</span> this assessment takes approximately 5 minutes.
                answer honestly to get an accurate picture of your security posture. all responses are private and stored locally.
              </p>
            </div>

            <button
              onClick={() => setView('quiz')}
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-midnight-400 hover:bg-midnight-500 text-white rounded-lg font-semibold transition-all hover:scale-[1.02] lowercase"
            >
              start assessment
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Quiz Screen
  if (view === 'quiz') {
    const currentQ = questions[currentQuestion];
    const currentAnswer = answers[currentQ.id];
    const Icon = currentQ.icon;
    const progress = ((currentQuestion + 1) / totalQuestions) * 100;

    return (
      <div className="min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-sans text-gray-400 lowercase">
                question {currentQuestion + 1} of {totalQuestions}
              </span>
              <span className="text-sm font-sans text-gray-400 lowercase">
                {Math.round(progress)}% complete
              </span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-midnight-400"
              />
            </div>
          </motion.div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card p-8 mb-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-midnight-400" />
                </div>
                <span className="text-sm font-sans text-gray-400 lowercase">
                  {currentQ.categoryName}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-display font-semibold mb-8 lowercase leading-tight">
                {currentQ.question}
              </h2>

              <div className="space-y-3">
                {currentQ.options.map((option, index) => (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    onClick={() => handleAnswer(currentQ.id, option.value, option.points)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      currentAnswer?.value === option.value
                        ? 'border-midnight-400 bg-midnight-400/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        currentAnswer?.value === option.value
                          ? 'border-midnight-400 bg-midnight-400'
                          : 'border-gray-600'
                      }`}>
                        {currentAnswer?.value === option.value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 rounded-full bg-white"
                          />
                        )}
                      </div>
                      <span className="text-sm md:text-base font-sans text-white lowercase">
                        {option.label}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            <button
              onClick={previousQuestion}
              disabled={currentQuestion === 0}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed lowercase"
            >
              previous
            </button>

            <button
              onClick={nextQuestion}
              disabled={!currentAnswer}
              className="flex-1 px-6 py-3 bg-midnight-400 hover:bg-midnight-500 text-white rounded-lg font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed lowercase inline-flex items-center justify-center gap-2"
            >
              {currentQuestion === totalQuestions - 1 ? 'see results' : 'next question'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (view === 'results') {
    const overallScore = calculateScore();
    const categoryScores = calculateCategoryScores();
    const recommendations = getRecommendations();
    const riskLevel = calculateRiskLevel();

    return (
      <div className="min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Overall Score */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-5xl font-display font-bold mb-4 lowercase">
              your security score
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card p-8 md:p-12 text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/5 border-4 border-white/10 mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5, type: 'spring', bounce: 0.4 }}
                className={`text-5xl md:text-7xl font-bold ${getScoreColor(overallScore)}`}
              >
                {overallScore}%
              </motion.div>
            </div>

            <h2 className={`text-2xl md:text-3xl font-display font-semibold mb-2 lowercase ${getScoreColor(overallScore)}`}>
              {getScoreLabel(overallScore)}
            </h2>

            <p className="text-gray-400 font-sans text-sm md:text-base lowercase">
              based on your responses across 6 security categories
            </p>
          </motion.div>

          {/* Risk Level Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card p-6 mb-12 border-l-4 border-midnight-400"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-midnight-400/20 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-6 h-6 text-midnight-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-display font-semibold mb-2 lowercase">
                  your risk profile: <span className={getRiskLevelColor(riskLevel)}>{getRiskLevelLabel(riskLevel)}</span>
                </h3>
                <p className="text-sm text-gray-400 lowercase leading-relaxed mb-3">
                  {riskLevel === 'low' && 'based on your work context, you operate in a relatively safe environment. our resources page will prioritize essential security tools that every journalist should use.'}
                  {riskLevel === 'medium' && 'based on your work context, you face moderate security risks. our resources page will show you both essential tools and specialized tools for sensitive reporting.'}
                  {riskLevel === 'high' && 'based on your work context, you operate in a high-risk environment. our resources page will prioritize advanced security tools for investigative journalism and source protection.'}
                  {riskLevel === 'critical' && 'based on your work context, you face critical security threats. our resources page will show you all available tools, including emergency communication and anti-surveillance measures.'}
                </p>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 lowercase leading-relaxed">
                    <strong className="text-white">💡 personalized recommendations:</strong> when you visit the resources page, we'll automatically highlight tools most relevant to your {getRiskLevelLabel(riskLevel)} and security score. you can always toggle to see all tools.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Category Breakdown */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-6 lowercase">
              category breakdown
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(categoryScores).map(([key, data], index) => {
                const CategoryIcon = data.icon;
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className="glass-card p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                          <CategoryIcon className="w-5 h-5 text-midnight-400" />
                        </div>
                        <h3 className="font-display font-semibold lowercase">
                          {data.name}
                        </h3>
                      </div>
                      <span className={`text-2xl font-bold ${getScoreColor(data.percentage)}`}>
                        {data.percentage}%
                      </span>
                    </div>

                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${data.percentage}%` }}
                        transition={{ duration: 1, delay: 0.7 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className={`h-full ${
                          data.percentage >= 80 ? 'bg-olive-500' :
                          data.percentage >= 60 ? 'bg-amber-500' :
                          'bg-crimson-500'
                        }`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* Priority Recommendations */}
          {recommendations.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mb-12"
            >
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-6 lowercase">
                priority improvements
              </h2>

              <div className="space-y-4">
                {recommendations.map((rec, index) => {
                  const RecIcon = rec.icon;
                  return (
                    <motion.div
                      key={rec.category}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                      className="glass-card p-6 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          rec.priority === 'critical' ? 'bg-crimson-500/20' : 'bg-amber-500/20'
                        }`}>
                          {rec.priority === 'critical' ? (
                            <XCircle className="w-5 h-5 text-crimson-500" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-display font-semibold lowercase text-white mb-1">
                            {rec.category}
                          </h3>
                          <p className="text-sm text-gray-400 font-sans lowercase">
                            {rec.priority === 'critical' ? 'immediate attention needed' : 'needs improvement'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xl font-bold ${getScoreColor(rec.score)}`}>
                          {rec.score}%
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* Call to Action */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card p-8 text-center"
          >
            <h2 className="text-xl md:text-2xl font-display font-semibold mb-4 lowercase">
              ready to improve your security?
            </h2>
            <p className="text-gray-400 font-sans text-sm md:text-base lowercase mb-6 leading-relaxed">
              check out our secure setup guide for step-by-step instructions, or connect with a security specialist for personalized help
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/secure-setup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-midnight-400 hover:bg-midnight-500 text-white rounded-lg font-semibold transition-all hover:scale-105 lowercase"
              >
                <Shield className="w-5 h-5" />
                secure setup guide
              </Link>

              <Link
                to="/request-support"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg font-semibold transition-all hover:scale-105 lowercase"
              >
                get specialist help
              </Link>

              <button
                onClick={restartQuiz}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg font-semibold transition-all hover:scale-105 lowercase"
              >
                <RotateCcw className="w-4 h-4" />
                retake assessment
              </button>
            </div>
          </motion.section>
        </div>
      </div>
    );
  }
};

export default SecurityScore;
