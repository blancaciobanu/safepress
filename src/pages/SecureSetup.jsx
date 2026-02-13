import { motion } from 'framer-motion';
import {
  Lock, Smartphone, Database, MessageSquare, MapPin,
  Check, Circle, ChevronDown, ChevronUp, ExternalLink,
  Shield, AlertTriangle, TrendingUp, Monitor
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const SecureSetup = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Comprehensive checklist organized by category
  const setupTasks = {
    password: {
      name: 'password security',
      icon: Lock,
      color: 'from-purple-500 to-purple-600',
      tasks: [
        {
          id: 'pass-manager',
          title: 'install a password manager',
          why: 'prevents password reuse and makes it easy to use strong, unique passwords for every account',
          how: 'download Bitwarden (free, open-source) or 1Password (premium)',
          link: '/resources',
          difficulty: 'easy',
          os: ['all'],
          priority: 'critical'
        },
        {
          id: 'pass-audit',
          title: 'audit existing passwords',
          why: 'identifies weak, reused, or compromised passwords that need to be changed',
          how: 'use your password manager\'s security audit feature to find weak passwords',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high'
        },
        {
          id: 'pass-2fa-email',
          title: 'enable 2FA on email accounts',
          why: 'email is the key to all your accounts - if compromised, attackers can reset everything',
          how: 'go to your email security settings and enable two-factor authentication using an authenticator app',
          difficulty: 'easy',
          os: ['all'],
          priority: 'critical'
        },
        {
          id: 'pass-2fa-social',
          title: 'enable 2FA on social media',
          why: 'prevents account takeover and protects your professional identity',
          how: 'enable 2FA in security settings for Twitter, Facebook, LinkedIn, Instagram',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high'
        },
        {
          id: 'pass-2fa-banking',
          title: 'enable 2FA on financial accounts',
          why: 'protects your money and prevents unauthorized transactions',
          how: 'log into your bank/payment apps and enable 2FA in security settings',
          difficulty: 'easy',
          os: ['all'],
          priority: 'critical'
        },
        {
          id: 'pass-change-weak',
          title: 'change all weak passwords',
          why: 'weak passwords can be cracked in seconds by automated tools',
          how: 'use your password manager to generate strong passwords for flagged accounts',
          difficulty: 'medium',
          os: ['all'],
          priority: 'high'
        }
      ]
    },
    device: {
      name: 'device security',
      icon: Smartphone,
      color: 'from-blue-500 to-blue-600',
      tasks: [
        {
          id: 'device-encryption-windows',
          title: 'enable BitLocker (Windows)',
          why: 'protects your files if your device is stolen - cannot be accessed without your password',
          how: 'Settings → Privacy & Security → Device Encryption → Turn on BitLocker',
          link: '/resources',
          difficulty: 'easy',
          os: ['Windows'],
          priority: 'critical'
        },
        {
          id: 'device-encryption-mac',
          title: 'enable FileVault (macOS)',
          why: 'encrypts your entire disk so files are protected if device is stolen',
          how: 'System Settings → Privacy & Security → FileVault → Turn On',
          link: '/resources',
          difficulty: 'easy',
          os: ['macOS'],
          priority: 'critical'
        },
        {
          id: 'device-encryption-mobile',
          title: 'enable device encryption (mobile)',
          why: 'protects sensitive data on your phone if lost or stolen',
          how: 'iOS: enabled by default with passcode. Android: Settings → Security → Encrypt phone',
          difficulty: 'easy',
          os: ['iOS', 'Android'],
          priority: 'critical'
        },
        {
          id: 'device-auto-updates',
          title: 'enable automatic updates',
          why: 'security patches fix vulnerabilities that hackers actively exploit',
          how: 'Windows: Settings → Windows Update → Advanced → Automatic updates. Mac: System Settings → Software Update → Automatic',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high'
        },
        {
          id: 'device-antivirus',
          title: 'install antivirus software',
          why: 'detects and blocks malware before it can compromise your system',
          how: 'Windows: Windows Defender is built-in. Mac: Install Malwarebytes or Bitdefender',
          difficulty: 'easy',
          os: ['Windows', 'macOS'],
          priority: 'high'
        },
        {
          id: 'device-screen-lock',
          title: 'set up strong screen lock',
          why: 'prevents unauthorized physical access to your device',
          how: 'use 6+ digit PIN, fingerprint, or face ID. Set auto-lock to 1-5 minutes',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high'
        },
        {
          id: 'device-remote-wipe',
          title: 'enable remote wipe',
          why: 'allows you to erase your device remotely if it\'s stolen',
          how: 'iOS: Find My iPhone. Android: Find My Device. Windows/Mac: Microsoft/Apple account settings',
          difficulty: 'easy',
          os: ['all'],
          priority: 'medium'
        }
      ]
    },
    data: {
      name: 'data protection',
      icon: Database,
      color: 'from-teal-500 to-teal-600',
      tasks: [
        {
          id: 'data-backup-setup',
          title: 'set up automatic backups',
          why: 'protects against ransomware, hardware failure, and accidental deletion',
          how: 'use external drive + cloud: Time Machine (Mac), File History (Windows), or Backblaze',
          difficulty: 'medium',
          os: ['all'],
          priority: 'critical'
        },
        {
          id: 'data-backup-encrypt',
          title: 'encrypt your backups',
          why: 'backups contain sensitive data - must be protected if storage is compromised',
          how: 'enable encryption in backup software settings or use Cryptomator for cloud backups',
          link: '/resources',
          difficulty: 'medium',
          os: ['all'],
          priority: 'high'
        },
        {
          id: 'data-cloud-audit',
          title: 'audit cloud storage',
          why: 'sensitive files may be synced to cloud without encryption',
          how: 'review Google Drive, Dropbox, iCloud - remove sensitive files or encrypt them first',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high'
        },
        {
          id: 'data-usb-encrypt',
          title: 'encrypt USB drives',
          why: 'USB drives are easily lost - encryption protects the data on them',
          how: 'use VeraCrypt or BitLocker To Go to create encrypted USB drives',
          link: '/resources',
          difficulty: 'medium',
          os: ['Windows', 'macOS', 'Linux'],
          priority: 'medium'
        },
        {
          id: 'data-secure-delete',
          title: 'use secure file deletion',
          why: 'deleted files can be recovered - secure deletion makes recovery impossible',
          how: 'Windows: Eraser. Mac: built-in secure empty trash. Linux: shred command',
          difficulty: 'easy',
          os: ['all'],
          priority: 'medium'
        },
        {
          id: 'data-backup-test',
          title: 'test your backups',
          why: 'backups are useless if they don\'t work when you need them',
          how: 'try restoring a test file from your backup to verify it works',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high'
        }
      ]
    },
    communication: {
      name: 'communication security',
      icon: MessageSquare,
      color: 'from-green-500 to-green-600',
      tasks: [
        {
          id: 'comm-signal',
          title: 'install Signal messenger',
          why: 'end-to-end encrypted messaging protects sensitive source communications',
          how: 'download Signal from signal.org for iOS, Android, Windows, Mac, Linux',
          link: '/resources',
          difficulty: 'easy',
          os: ['all'],
          priority: 'critical'
        },
        {
          id: 'comm-protonmail',
          title: 'create ProtonMail account',
          why: 'encrypted email prevents interception of sensitive correspondence',
          how: 'sign up at proton.me for a free encrypted email account',
          link: '/resources',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high'
        },
        {
          id: 'comm-vpn',
          title: 'install a VPN',
          why: 'encrypts internet traffic and hides your location, especially on public wifi',
          how: 'use ProtonVPN (free), Mullvad, or IVPN for privacy-focused VPN service',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high'
        },
        {
          id: 'comm-tor',
          title: 'install Tor Browser',
          why: 'provides anonymity for research and accessing information without tracking',
          how: 'download from torproject.org - essential for investigative research',
          link: '/resources',
          difficulty: 'easy',
          os: ['Windows', 'macOS', 'Linux', 'Android'],
          priority: 'high'
        },
        {
          id: 'comm-messaging-audit',
          title: 'switch from SMS to Signal',
          why: 'SMS is not encrypted - easily intercepted by governments and hackers',
          how: 'convince key contacts to install Signal, gradually move conversations over',
          difficulty: 'medium',
          os: ['all'],
          priority: 'high'
        },
        {
          id: 'comm-metadata',
          title: 'enable disappearing messages',
          why: 'reduces metadata trail and prevents message history from being recovered',
          how: 'in Signal: Settings → Privacy → Disappearing Messages → Default timer',
          difficulty: 'easy',
          os: ['all'],
          priority: 'medium'
        }
      ]
    },
    physical: {
      name: 'physical security',
      icon: MapPin,
      color: 'from-orange-500 to-orange-600',
      tasks: [
        {
          id: 'phys-webcam-cover',
          title: 'cover your webcam',
          why: 'malware can activate webcams without your knowledge',
          how: 'use webcam cover sticker or tape when not in use',
          difficulty: 'easy',
          os: ['all'],
          priority: 'medium'
        },
        {
          id: 'phys-privacy-screen',
          title: 'use privacy screen protectors',
          why: 'prevents shoulder surfing in public spaces',
          how: 'buy privacy screen filters for laptop and phone from Amazon or electronics stores',
          difficulty: 'easy',
          os: ['all'],
          priority: 'low'
        },
        {
          id: 'phys-location-services',
          title: 'review location permissions',
          why: 'apps track your movement unnecessarily - creates security risk',
          how: 'Phone: Settings → Privacy → Location Services → review and disable unnecessary apps',
          difficulty: 'easy',
          os: ['iOS', 'Android'],
          priority: 'medium'
        },
        {
          id: 'phys-secure-storage',
          title: 'secure device storage',
          why: 'devices left unattended can be tampered with or stolen',
          how: 'use laptop locks, keep devices in locked drawers when not in use',
          difficulty: 'easy',
          os: ['all'],
          priority: 'medium'
        },
        {
          id: 'phys-public-wifi',
          title: 'avoid sensitive work on public wifi',
          why: 'public networks are easily monitored - credentials can be intercepted',
          how: 'use VPN if you must use public wifi, or use phone hotspot instead',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high'
        },
        {
          id: 'phys-usb-security',
          title: 'disable USB auto-run',
          why: 'malware can auto-execute from infected USB drives',
          how: 'Windows: Group Policy Editor → disable autoplay. Mac: disabled by default',
          difficulty: 'medium',
          os: ['Windows'],
          priority: 'medium'
        }
      ]
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          if (data.setupProgress?.completedTasks) {
            setCompletedTasks(new Set(data.setupProgress.completedTasks));
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const toggleTask = async (taskId) => {
    if (!user) return;

    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }
    setCompletedTasks(newCompleted);

    // Save to Firestore
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'setupProgress.completedTasks': Array.from(newCompleted),
        'setupProgress.lastUpdated': new Date().toISOString()
      });
    } catch (error) {
      // If document doesn't exist, create it
      if (error.code === 'not-found') {
        await setDoc(userRef, {
          setupProgress: {
            completedTasks: Array.from(newCompleted),
            lastUpdated: new Date().toISOString()
          }
        }, { merge: true });
      } else {
        console.error('Error saving progress:', error);
      }
    }
  };

  const calculateCategoryProgress = (categoryKey) => {
    const tasks = setupTasks[categoryKey].tasks;
    const completed = tasks.filter(task => completedTasks.has(task.id)).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const calculateOverallProgress = () => {
    let totalTasks = 0;
    let completedCount = 0;

    Object.keys(setupTasks).forEach(categoryKey => {
      const tasks = setupTasks[categoryKey].tasks;
      totalTasks += tasks.length;
      completedCount += tasks.filter(task => completedTasks.has(task.id)).length;
    });

    return Math.round((completedCount / totalTasks) * 100);
  };

  const getWeakCategories = () => {
    if (!userData?.securityScores || userData.securityScores.length === 0) {
      return [];
    }

    const latestScore = userData.securityScores[userData.securityScores.length - 1];
    const categoryScores = latestScore.categoryScores;

    return Object.entries(categoryScores)
      .filter(([key]) => key !== 'risk') // Exclude work context
      .filter(([_, data]) => data.score < 70)
      .sort((a, b) => a[1].score - b[1].score)
      .map(([key]) => key);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-crimson-500';
      case 'high': return 'text-amber-500';
      case 'medium': return 'text-olive-500';
      case 'low': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-olive-500/20 text-olive-400 border-olive-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'advanced': return 'bg-crimson-500/20 text-crimson-400 border-crimson-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const overallProgress = calculateOverallProgress();
  const weakCategories = getWeakCategories();

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-midnight-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400 lowercase">loading your setup progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 mb-5">
            <Shield className="w-7 h-7 text-teal-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 lowercase">
            secure your setup
          </h1>
          <p className="text-base text-gray-500 lowercase max-w-md mx-auto leading-relaxed"
            style={{ letterSpacing: '0.03em' }}
          >
            step-by-step guide to harden your digital security
          </p>
        </motion.div>

        {/* Overall Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-display font-bold lowercase">overall progress</h2>
              <p className="text-sm text-gray-400 lowercase">
                {user ? `${Array.from(completedTasks).length} tasks completed` : 'sign in to track progress'}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${
                overallProgress >= 80 ? 'text-olive-500' :
                overallProgress >= 50 ? 'text-amber-500' :
                'text-crimson-500'
              }`}>
                {overallProgress}%
              </div>
            </div>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full ${
                overallProgress >= 80 ? 'bg-olive-500' :
                overallProgress >= 50 ? 'bg-amber-500' :
                'bg-crimson-500'
              }`}
            />
          </div>
        </motion.div>

        {/* Priority Section */}
        {user && weakCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card p-6 mb-8 border-l-4 border-crimson-500"
          >
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-crimson-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-display font-bold mb-2 lowercase">
                  priority areas based on your security assessment
                </h3>
                <p className="text-sm text-gray-400 lowercase leading-relaxed mb-3">
                  focus on these categories first - they had the lowest scores in your quiz:
                </p>
                <div className="flex flex-wrap gap-2">
                  {weakCategories.map(categoryKey => {
                    const category = setupTasks[categoryKey];
                    if (!category) return null;
                    const CategoryIcon = category.icon;
                    return (
                      <button
                        key={categoryKey}
                        onClick={() => setExpandedCategory(categoryKey)}
                        className="flex items-center gap-2 px-3 py-2 bg-crimson-500/10 hover:bg-crimson-500/20 border border-crimson-500/30 rounded-lg transition-all lowercase text-sm font-semibold"
                      >
                        <CategoryIcon className="w-4 h-4 text-crimson-400" />
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Categories */}
        {Object.entries(setupTasks).map(([categoryKey, category], categoryIndex) => {
          const progress = calculateCategoryProgress(categoryKey);
          const isExpanded = expandedCategory === categoryKey;
          const CategoryIcon = category.icon;

          return (
            <motion.div
              key={categoryKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + categoryIndex * 0.1 }}
              className="glass-card p-6 mb-6"
            >
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : categoryKey)}
                className="w-full flex items-center justify-between mb-4 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                    <CategoryIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-display font-bold lowercase">{category.name}</h3>
                    <p className="text-sm text-gray-400 lowercase">
                      {category.tasks.filter(t => completedTasks.has(t.id)).length} / {category.tasks.length} completed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      progress >= 80 ? 'text-olive-500' :
                      progress >= 50 ? 'text-amber-500' :
                      'text-crimson-500'
                    }`}>
                      {progress}%
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-6 h-6 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className={`h-full ${
                    progress >= 80 ? 'bg-olive-500' :
                    progress >= 50 ? 'bg-amber-500' :
                    'bg-crimson-500'
                  }`}
                />
              </div>

              {/* Tasks */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3 pt-2"
                >
                  {category.tasks.map((task, taskIndex) => {
                    const isCompleted = completedTasks.has(task.id);
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: taskIndex * 0.05 }}
                        className={`p-4 rounded-lg border transition-all ${
                          isCompleted
                            ? 'bg-olive-500/5 border-olive-500/30'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleTask(task.id)}
                            disabled={!user}
                            className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-olive-500 text-white'
                                : 'bg-white/5 border-2 border-white/20 hover:border-white/40'
                            } ${!user && 'opacity-50 cursor-not-allowed'}`}
                          >
                            {isCompleted && <Check className="w-4 h-4" />}
                          </button>

                          {/* Task Content */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <h4 className={`font-semibold lowercase ${isCompleted && 'line-through opacity-70'}`}>
                                {task.title}
                              </h4>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-xs px-2 py-1 rounded-full border uppercase tracking-wider font-semibold ${getDifficultyBadge(task.difficulty)}`}>
                                  {task.difficulty}
                                </span>
                                {task.priority && (
                                  <span className={`text-xs uppercase tracking-wider font-semibold ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-sm text-gray-400 lowercase mb-2 leading-relaxed">
                              <span className="text-white font-semibold">why:</span> {task.why}
                            </p>

                            <p className="text-sm text-gray-300 lowercase mb-2 leading-relaxed">
                              <span className="text-white font-semibold">how:</span> {task.how}
                            </p>

                            <div className="flex items-center gap-4 mt-3">
                              {task.os && (
                                <div className="flex flex-wrap gap-1">
                                  {task.os.map(os => (
                                    <span key={os} className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 rounded lowercase text-gray-400">
                                      {os}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {task.link && (
                                <Link
                                  to={task.link}
                                  className="flex items-center gap-1 text-xs text-midnight-400 hover:text-midnight-300 transition-colors font-semibold lowercase"
                                >
                                  view tools
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {/* Footer CTA */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="glass-card p-6 text-center"
          >
            <Shield className="w-12 h-12 text-midnight-400 mx-auto mb-4" />
            <h3 className="text-xl font-display font-semibold mb-2 lowercase">
              sign in to track your progress
            </h3>
            <p className="text-gray-400 lowercase mb-4">
              create an account to save your checklist progress and get personalized recommendations
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-midnight-400 hover:bg-midnight-500 text-white rounded-lg font-semibold transition-all hover:scale-105 lowercase"
            >
              create free account
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SecureSetup;
