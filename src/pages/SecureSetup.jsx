import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Smartphone, Database, MessageSquare, MapPin,
  Check, ExternalLink, Shield, AlertTriangle,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// ── constants ─────────────────────────────────────────────────────────────────

const CATEGORY_COLORS = {
  password:      '#4361EE',
  device:        '#2DD4BF',
  data:          '#84CC16',
  communication: '#A78BFA',
  physical:      '#FBBF24',
};

const PRIORITY_BORDERS = {
  critical: 'border-l-crimson-500',
  high:     'border-l-amber-400',
  medium:   'border-l-teal-400',
  low:      'border-l-white/10',
};

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

// ── helpers ───────────────────────────────────────────────────────────────────

const getLevelInfo = (pct) => {
  if (pct >= 100) return { label: 'security hardened',  color: 'text-olive-400'    };
  if (pct >= 75)  return { label: 'security conscious', color: 'text-midnight-400' };
  if (pct >= 50)  return { label: 'security aware',     color: 'text-teal-400'     };
  if (pct >= 25)  return { label: 'building habits',    color: 'text-amber-400'    };
  return                 { label: 'getting started',    color: 'text-gray-400'     };
};

const getDifficultyBadge = (d) => ({
  easy:     'bg-olive-500/20 text-olive-400 border-olive-500/30',
  medium:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
  advanced: 'bg-crimson-500/20 text-crimson-400 border-crimson-500/30',
}[d] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30');

// ── sub-components ────────────────────────────────────────────────────────────

const ProgressRing = ({ progress, color, size = 52, strokeWidth = 3.5 }) => {
  const r = (size - strokeWidth) / 2;
  const c = r * 2 * Math.PI;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        style={{ strokeDasharray: c }}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (progress / 100) * c }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
};

// ── data (module-level — never recreated on render) ──────────────────────────

const setupTasks = {
    password: {
      name: 'password security',
      icon: Lock,
      tasks: [
        {
          id: 'pass-manager',
          title: 'install a password manager',
          why: 'prevents password reuse and makes it easy to use strong, unique passwords for every account',
          how: 'download Bitwarden (free, open-source) or 1Password (premium)',
          link: '/resources',
          difficulty: 'easy',
          os: ['all'],
          priority: 'critical',
        },
        {
          id: 'pass-audit',
          title: 'audit existing passwords',
          why: 'identifies weak, reused, or compromised passwords that need to be changed',
          how: "use your password manager's security audit feature to find weak passwords",
          difficulty: 'easy',
          os: ['all'],
          priority: 'high',
        },
        {
          id: 'pass-2fa-email',
          title: 'enable 2FA on email accounts',
          why: 'email is the key to all your accounts — if compromised, attackers can reset everything',
          how: 'go to your email security settings and enable two-factor authentication using an authenticator app',
          difficulty: 'easy',
          os: ['all'],
          priority: 'critical',
        },
        {
          id: 'pass-2fa-social',
          title: 'enable 2FA on social media',
          why: 'prevents account takeover and protects your professional identity',
          how: 'enable 2FA in security settings for Twitter, Facebook, LinkedIn, Instagram',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high',
        },
        {
          id: 'pass-2fa-banking',
          title: 'enable 2FA on financial accounts',
          why: 'protects your money and prevents unauthorized transactions',
          how: 'log into your bank/payment apps and enable 2FA in security settings',
          difficulty: 'easy',
          os: ['all'],
          priority: 'critical',
        },
        {
          id: 'pass-change-weak',
          title: 'change all weak passwords',
          why: 'weak passwords can be cracked in seconds by automated tools',
          how: 'use your password manager to generate strong passwords for flagged accounts',
          difficulty: 'medium',
          os: ['all'],
          priority: 'high',
        },
      ],
    },
    device: {
      name: 'device security',
      icon: Smartphone,
      tasks: [
        {
          id: 'device-encryption-windows',
          title: 'enable BitLocker (Windows)',
          why: 'protects your files if your device is stolen — cannot be accessed without your password',
          how: 'Settings → Privacy & Security → Device Encryption → Turn on BitLocker',
          link: '/resources',
          difficulty: 'easy',
          os: ['Windows'],
          priority: 'critical',
        },
        {
          id: 'device-encryption-mac',
          title: 'enable FileVault (macOS)',
          why: 'encrypts your entire disk so files are protected if device is stolen',
          how: 'System Settings → Privacy & Security → FileVault → Turn On',
          link: '/resources',
          difficulty: 'easy',
          os: ['macOS'],
          priority: 'critical',
        },
        {
          id: 'device-encryption-mobile',
          title: 'enable device encryption (mobile)',
          why: 'protects sensitive data on your phone if lost or stolen',
          how: 'iOS: enabled by default with passcode. Android: Settings → Security → Encrypt phone',
          difficulty: 'easy',
          os: ['iOS', 'Android'],
          priority: 'critical',
        },
        {
          id: 'device-auto-updates',
          title: 'enable automatic updates',
          why: 'security patches fix vulnerabilities that hackers actively exploit',
          how: 'Windows: Settings → Windows Update → Advanced → Automatic updates. Mac: System Settings → Software Update → Automatic',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high',
        },
        {
          id: 'device-antivirus',
          title: 'install antivirus software',
          why: 'detects and blocks malware before it can compromise your system',
          how: 'Windows: Windows Defender is built-in. Mac: Install Malwarebytes or Bitdefender',
          difficulty: 'easy',
          os: ['Windows', 'macOS'],
          priority: 'high',
        },
        {
          id: 'device-screen-lock',
          title: 'set up strong screen lock',
          why: 'prevents unauthorized physical access to your device',
          how: 'use 6+ digit PIN, fingerprint, or face ID. Set auto-lock to 1–5 minutes',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high',
        },
        {
          id: 'device-remote-wipe',
          title: 'enable remote wipe',
          why: "allows you to erase your device remotely if it's stolen",
          how: "iOS: Find My iPhone. Android: Find My Device. Windows/Mac: Microsoft/Apple account settings",
          difficulty: 'easy',
          os: ['all'],
          priority: 'medium',
        },
      ],
    },
    data: {
      name: 'data protection',
      icon: Database,
      tasks: [
        {
          id: 'data-backup-setup',
          title: 'set up automatic backups',
          why: 'protects against ransomware, hardware failure, and accidental deletion',
          how: 'use external drive + cloud: Time Machine (Mac), File History (Windows), or Backblaze',
          difficulty: 'medium',
          os: ['all'],
          priority: 'critical',
        },
        {
          id: 'data-backup-encrypt',
          title: 'encrypt your backups',
          why: 'backups contain sensitive data — must be protected if storage is compromised',
          how: 'enable encryption in backup software settings or use Cryptomator for cloud backups',
          link: '/resources',
          difficulty: 'medium',
          os: ['all'],
          priority: 'high',
        },
        {
          id: 'data-cloud-audit',
          title: 'audit cloud storage',
          why: 'sensitive files may be synced to cloud without encryption',
          how: 'review Google Drive, Dropbox, iCloud — remove sensitive files or encrypt them first',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high',
        },
        {
          id: 'data-usb-encrypt',
          title: 'encrypt USB drives',
          why: 'USB drives are easily lost — encryption protects the data on them',
          how: 'use VeraCrypt or BitLocker To Go to create encrypted USB drives',
          link: '/resources',
          difficulty: 'medium',
          os: ['Windows', 'macOS', 'Linux'],
          priority: 'medium',
        },
        {
          id: 'data-secure-delete',
          title: 'use secure file deletion',
          why: 'deleted files can be recovered — secure deletion makes recovery impossible',
          how: 'Windows: Eraser. Mac: built-in secure empty trash. Linux: shred command',
          difficulty: 'easy',
          os: ['all'],
          priority: 'medium',
        },
        {
          id: 'data-backup-test',
          title: 'test your backups',
          why: "backups are useless if they don't work when you need them",
          how: 'try restoring a test file from your backup to verify it works',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high',
        },
      ],
    },
    communication: {
      name: 'communication security',
      icon: MessageSquare,
      tasks: [
        {
          id: 'comm-signal',
          title: 'install Signal messenger',
          why: 'end-to-end encrypted messaging protects sensitive source communications',
          how: 'download Signal from signal.org for iOS, Android, Windows, Mac, Linux',
          link: '/resources',
          difficulty: 'easy',
          os: ['all'],
          priority: 'critical',
        },
        {
          id: 'comm-protonmail',
          title: 'create ProtonMail account',
          why: 'encrypted email prevents interception of sensitive correspondence',
          how: 'sign up at proton.me for a free encrypted email account',
          link: '/resources',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high',
        },
        {
          id: 'comm-vpn',
          title: 'install a VPN',
          why: 'encrypts internet traffic and hides your location, especially on public wifi',
          how: 'use ProtonVPN (free), Mullvad, or IVPN for privacy-focused VPN service',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high',
        },
        {
          id: 'comm-tor',
          title: 'install Tor Browser',
          why: 'provides anonymity for research and accessing information without tracking',
          how: 'download from torproject.org — essential for investigative research',
          link: '/resources',
          difficulty: 'easy',
          os: ['Windows', 'macOS', 'Linux', 'Android'],
          priority: 'high',
        },
        {
          id: 'comm-messaging-audit',
          title: 'switch from SMS to Signal',
          why: 'SMS is not encrypted — easily intercepted by governments and hackers',
          how: 'convince key contacts to install Signal, gradually move conversations over',
          difficulty: 'medium',
          os: ['all'],
          priority: 'high',
        },
        {
          id: 'comm-metadata',
          title: 'enable disappearing messages',
          why: 'reduces metadata trail and prevents message history from being recovered',
          how: 'in Signal: Settings → Privacy → Disappearing Messages → Default timer',
          difficulty: 'easy',
          os: ['all'],
          priority: 'medium',
        },
      ],
    },
    physical: {
      name: 'physical security',
      icon: MapPin,
      tasks: [
        {
          id: 'phys-webcam-cover',
          title: 'cover your webcam',
          why: 'malware can activate webcams without your knowledge',
          how: 'use webcam cover sticker or tape when not in use',
          difficulty: 'easy',
          os: ['all'],
          priority: 'medium',
        },
        {
          id: 'phys-privacy-screen',
          title: 'use privacy screen protectors',
          why: 'prevents shoulder surfing in public spaces',
          how: 'buy privacy screen filters for laptop and phone from Amazon or electronics stores',
          difficulty: 'easy',
          os: ['all'],
          priority: 'low',
        },
        {
          id: 'phys-location-services',
          title: 'review location permissions',
          why: 'apps track your movement unnecessarily — creates security risk',
          how: 'Phone: Settings → Privacy → Location Services → review and disable unnecessary apps',
          difficulty: 'easy',
          os: ['iOS', 'Android'],
          priority: 'medium',
        },
        {
          id: 'phys-secure-storage',
          title: 'secure device storage',
          why: 'devices left unattended can be tampered with or stolen',
          how: 'use laptop locks, keep devices in locked drawers when not in use',
          difficulty: 'easy',
          os: ['all'],
          priority: 'medium',
        },
        {
          id: 'phys-public-wifi',
          title: 'avoid sensitive work on public wifi',
          why: 'public networks are easily monitored — credentials can be intercepted',
          how: 'use VPN if you must use public wifi, or use phone hotspot instead',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high',
        },
        {
          id: 'phys-usb-security',
          title: 'disable USB auto-run',
          why: 'malware can auto-execute from infected USB drives',
          how: 'Windows: Group Policy Editor → disable autoplay. Mac: disabled by default',
          difficulty: 'medium',
          os: ['Windows'],
          priority: 'medium',
        },
      ],
    },
};

// allTasks is stable — derived once from the module-level setupTasks constant
const allTasks = Object.entries(setupTasks).flatMap(([key, cat]) =>
  cat.tasks.map(t => ({ ...t, categoryKey: key }))
);

// ── main component ────────────────────────────────────────────────────────────

const SecureSetup = () => {
  const { user } = useAuth();
  const [completedTasks,   setCompletedTasks]   = useState(new Set());
  const [weakCategories,   setWeakCategories]   = useState([]);
  const [loading,          setLoading]           = useState(true);
  const [selectedCategory, setSelectedCategory]  = useState(null);

  // ── Firebase ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) { setLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.setupProgress?.completedTasks) {
            setCompletedTasks(new Set(data.setupProgress.completedTasks));
          }
          // Derive weak categories from latest quiz score
          const scores = data.securityScores;
          if (scores?.length) {
            const latest = scores[scores.length - 1];
            const QUIZ_TO_SETUP = { password: 'password', device: 'device', communication: 'communication', data: 'data', physical: 'physical' };
            const weak = Object.entries(latest.categoryScores ?? {})
              .filter(([k, v]) => QUIZ_TO_SETUP[k] && v.score < 70)
              .sort((a, b) => a[1].score - b[1].score)
              .map(([k]) => QUIZ_TO_SETUP[k]);
            setWeakCategories(weak);
          }
        }
      } catch (e) {
        console.error('Error fetching setup progress:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [user]);

  const toggleTask = async (taskId) => {
    if (!user) return;
    const next = new Set(completedTasks);
    next.has(taskId) ? next.delete(taskId) : next.add(taskId);
    setCompletedTasks(next);
    try {
      const ref = doc(db, 'users', user.uid);
      await updateDoc(ref, {
        'setupProgress.completedTasks': Array.from(next),
        'setupProgress.lastUpdated':    new Date().toISOString(),
      });
    } catch (err) {
      if (err.code === 'not-found') {
        await setDoc(doc(db, 'users', user.uid), {
          setupProgress: { completedTasks: Array.from(next), lastUpdated: new Date().toISOString() },
        }, { merge: true });
      }
    }
  };

  // ── derived ──────────────────────────────────────────────────────────────────

  const totalTasks     = allTasks.length;
  const completedCount = allTasks.filter(t => completedTasks.has(t.id)).length;
  const overallPct     = Math.round((completedCount / totalTasks) * 100);
  const level          = getLevelInfo(overallPct);

  const catPct = (key) => {
    const tasks = setupTasks[key].tasks;
    return Math.round(tasks.filter(t => completedTasks.has(t.id)).length / tasks.length * 100);
  };

  const filteredTasks = useMemo(() => {
    // always sort a copy — never mutate the module-level allTasks array
    const base = selectedCategory
      ? allTasks.filter(t => t.categoryKey === selectedCategory)
      : [...allTasks];
    return base.sort((a, b) => {
    const ac = completedTasks.has(a.id) ? 1 : 0;
    const bc = completedTasks.has(b.id) ? 1 : 0;
    if (ac !== bc) return ac - bc;
      return (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3);
    });
  }, [selectedCategory, completedTasks]);

  // ── loading ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-midnight-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400 lowercase">loading your setup progress…</p>
        </div>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-midnight-400/10 border border-midnight-400/20 mb-5">
            <Shield className="w-7 h-7 text-midnight-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 lowercase">
            secure your setup
          </h1>
          <p className="text-base text-gray-500 lowercase max-w-md mx-auto leading-relaxed">
            work through each task to harden your digital security
          </p>
        </motion.div>

        {/* Level banner */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card p-7 mb-6"
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600 mb-1.5">
                security level
              </p>
              <h2 className={`text-2xl font-display font-bold lowercase ${level.color}`}>
                {level.label}
              </h2>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold tabular-nums leading-none ${level.color}`}>
                {overallPct}%
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {user ? `${completedCount} / ${totalTasks} tasks` : 'sign in to track'}
              </p>
            </div>
          </div>

          {/* Milestone progress bar */}
          <div className="relative">
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallPct}%` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-gradient-to-r from-midnight-400 to-teal-400 rounded-full"
              />
            </div>
            {/* Milestone diamond markers */}
            {[25, 50, 75].map(m => (
              <div
                key={m}
                className={`absolute top-1/2 w-2.5 h-2.5 rotate-45 border transition-colors ${
                  overallPct >= m
                    ? 'bg-midnight-400 border-midnight-400'
                    : 'bg-dark-900 border-white/20'
                }`}
                style={{ left: `${m}%`, transform: 'translate(-50%, -50%) rotate(45deg)' }}
              />
            ))}
          </div>

          <div className="flex justify-between mt-3 text-[10px] text-gray-600 lowercase">
            <span>getting started</span>
            <span>building habits</span>
            <span>security aware</span>
            <span>conscious</span>
            <span>hardened</span>
          </div>
        </motion.div>

        {/* Quiz-based focus areas */}
        {user && weakCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card p-5 mb-6 border-l-4 border-l-amber-400"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-amber-400">
                based on your security quiz
              </span>
            </div>
            <p className="text-sm text-gray-400 lowercase mb-3">
              your weakest areas — tackle these first:
            </p>
            <div className="flex flex-wrap gap-2">
              {weakCategories.map(key => {
                const cat = setupTasks[key];
                const Icon = cat.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs lowercase transition-all ${
                      selectedCategory === key
                        ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                        : 'bg-amber-400/10 border-amber-400/30 text-amber-400 hover:bg-amber-400/20'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Category strip */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-8"
        >
          {Object.entries(setupTasks).map(([key, cat]) => {
            const pct       = catPct(key);
            const done      = cat.tasks.filter(t => completedTasks.has(t.id)).length;
            const isActive  = selectedCategory === key;
            const Icon      = cat.icon;
            const color     = CATEGORY_COLORS[key];
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(isActive ? null : key)}
                className={`relative p-4 rounded-xl border flex flex-col items-center gap-2.5 transition-all ${
                  isActive
                    ? 'bg-midnight-400/10 border-midnight-400/30'
                    : weakCategories.includes(key)
                      ? 'bg-amber-400/[0.04] border-amber-400/20 hover:bg-amber-400/10'
                      : 'bg-white/[0.02] border-white/10 hover:bg-white/5 hover:border-white/20'
                }`}
              >
                {/* Weak category indicator dot */}
                {weakCategories.includes(key) && (
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-amber-400 rounded-full" />
                )}
                {/* Ring with icon */}
                <div className="relative flex items-center justify-center">
                  <ProgressRing progress={pct} color={color} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-white lowercase text-center leading-tight">
                  {cat.name}
                </p>
                <p className="text-[10px] text-gray-600">
                  {done}/{cat.tasks.length}
                </p>
              </button>
            );
          })}
        </motion.div>

        {/* Task count line */}
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-xs text-gray-600 lowercase">
            {selectedCategory
              ? `${setupTasks[selectedCategory].name} — ${filteredTasks.length} tasks`
              : `all tasks — ${filteredTasks.length} total`
            }
          </p>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs text-midnight-400 hover:text-midnight-300 lowercase transition-colors"
            >
              clear filter
            </button>
          )}
        </div>

        {/* Task grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTasks.map((task) => {
              const isCompleted = completedTasks.has(task.id);
              const borderClass = isCompleted
                ? 'border-l-olive-500 border-olive-500/20 bg-olive-500/[0.04]'
                : `${PRIORITY_BORDERS[task.priority] ?? 'border-l-white/10'} border-white/10 bg-white/[0.02] hover:bg-white/[0.04]`;

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border border-l-4 transition-all duration-300 ${borderClass}`}
                >
                  <div className="flex items-start gap-3">

                    {/* Checkbox */}
                    <motion.button
                      onClick={() => toggleTask(task.id)}
                      disabled={!user}
                      whileTap={{ scale: 0.85 }}
                      className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all mt-0.5 ${
                        isCompleted
                          ? 'bg-olive-500 text-white'
                          : 'border-2 border-white/20 hover:border-white/50'
                      } ${!user ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <AnimatePresence>
                        {isCompleted && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className={`text-sm font-semibold leading-snug lowercase ${
                          isCompleted ? 'line-through text-gray-500' : 'text-white'
                        }`}>
                          {task.title}
                        </h4>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-bold flex-shrink-0 ${getDifficultyBadge(task.difficulty)}`}>
                          {task.difficulty}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 lowercase leading-relaxed mb-1.5">
                        <span className="text-gray-400 font-semibold">why:</span> {task.why}
                      </p>
                      <p className="text-xs text-gray-500 lowercase leading-relaxed">
                        <span className="text-gray-400 font-semibold">how:</span> {task.how}
                      </p>

                      <div className="flex items-center gap-3 mt-2.5">
                        {/* Category chip (only in "all" view) */}
                        {!selectedCategory && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded border lowercase"
                            style={{
                              color:            CATEGORY_COLORS[task.categoryKey],
                              borderColor:      CATEGORY_COLORS[task.categoryKey] + '40',
                              backgroundColor:  CATEGORY_COLORS[task.categoryKey] + '10',
                            }}
                          >
                            {setupTasks[task.categoryKey].name}
                          </span>
                        )}
                        {task.link && (
                          <Link
                            to={task.link}
                            className="inline-flex items-center gap-1 text-xs text-midnight-400 hover:text-midnight-300 transition-colors font-semibold lowercase"
                          >
                            view tools <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer CTA */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass-card p-6 text-center mt-8"
          >
            <Shield className="w-10 h-10 text-midnight-400 mx-auto mb-3" />
            <h3 className="text-lg font-display font-semibold mb-2 lowercase">
              sign in to track your progress
            </h3>
            <p className="text-sm text-gray-500 lowercase mb-4">
              your completed tasks are saved to your account
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-midnight-400 hover:bg-midnight-500 text-white rounded-lg font-semibold text-sm transition-all hover:scale-105 lowercase"
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
