import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Smartphone, Database, MessageSquare, MapPin,
  Check, ExternalLink, AlertTriangle, ArrowRight,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../config/firebaseCollections';
import {
  NewsButton,
  NewsNotice,
  NewsPage,
  NewsRule,
} from '../components/editorial/NewsPage';

/* Workbench — Secure Setup.
   A numbered checklist of practical tasks, grouped by category.
   Editorial restraint: no metal-clip skeuomorphism, no rainbow brand
   colors. Category identity is a single subtle accent + the icon. */

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

/* Single subtle accent per category — used for the gauge ring and the
   category chip border. Stays inside the editorial palette. */
const CATEGORY_TONE = {
  password:      'var(--color-ink)',
  device:        'var(--color-ink-soft)',
  data:          'var(--color-brass)',
  communication: 'var(--color-oxblood-soft)',
  physical:      'var(--color-smoke)',
};

const PRIORITY_BORDER = {
  critical: 'border-l-oxblood',
  high:     'border-l-brass',
  medium:   'border-l-ink/30',
  low:      'border-l-ink/15',
};

const DIFFICULTY_TONE = {
  easy:     'text-smoke border-smoke/40 bg-transparent',
  medium:   'text-brass border-brass/40 bg-brass/[0.06]',
  advanced: 'text-oxblood border-oxblood/40 bg-oxblood/[0.06]',
};

const getLevelInfo = (pct) => {
  if (pct >= 100) return { label: 'Security hardened',  tone: 'text-oxblood' };
  if (pct >= 75)  return { label: 'Security conscious', tone: 'text-ink' };
  if (pct >= 50)  return { label: 'Security aware',     tone: 'text-brass' };
  if (pct >= 25)  return { label: 'Building habits',    tone: 'text-ink-soft' };
  return                 { label: 'Getting started',    tone: 'text-smoke' };
};

const ProgressRing = ({ progress, color, size = 44, strokeWidth = 2.5 }) => {
  const r = (size - strokeWidth) / 2;
  const c = r * 2 * Math.PI;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(21,17,12,0.10)" strokeWidth={strokeWidth}
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

/* ─── Static data (preserved verbatim from the legacy page) ──────────── */

const setupTasks = {
    password: {
      name: 'Password security',
      icon: Lock,
      tasks: [
        {
          id: 'pass-manager',
          title: 'Install a password manager',
          why: 'Prevents password reuse and makes it easy to use strong, unique passwords for every account',
          how: 'Download Bitwarden (free, open-source) or 1Password (premium)',
          link: '/resources',
          difficulty: 'easy',
          os: ['all'],
          priority: 'critical',
        },
        {
          id: 'pass-audit',
          title: 'Audit existing passwords',
          why: 'Identifies weak, reused, or compromised passwords that need to be changed',
          how: "Use your password manager's security audit feature to find weak passwords",
          difficulty: 'easy',
          os: ['all'],
          priority: 'high',
        },
        {
          id: 'pass-2fa-email',
          title: 'Enable 2FA on email accounts',
          why: 'Email is the key to all your accounts — if compromised, attackers can reset everything',
          how: 'Go to your email security settings and enable two-factor authentication using an authenticator app',
          difficulty: 'easy',
          os: ['all'],
          priority: 'critical',
        },
        {
          id: 'pass-2fa-social',
          title: 'Enable 2FA on social media',
          why: 'Prevents account takeover and protects your professional identity',
          how: 'Enable 2FA in security settings for Twitter, Facebook, LinkedIn, Instagram',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high',
        },
        {
          id: 'pass-2fa-banking',
          title: 'Enable 2FA on financial accounts',
          why: 'Protects your money and prevents unauthorized transactions',
          how: 'Log into your bank/payment apps and enable 2FA in security settings',
          difficulty: 'easy',
          os: ['all'],
          priority: 'critical',
        },
        {
          id: 'pass-change-weak',
          title: 'Change all weak passwords',
          why: 'Weak passwords can be cracked in seconds by automated tools',
          how: 'Use your password manager to generate strong passwords for flagged accounts',
          difficulty: 'medium',
          os: ['all'],
          priority: 'high',
        },
      ],
    },
    device: {
      name: 'Device security',
      icon: Smartphone,
      tasks: [
        {
          id: 'device-encryption-windows',
          title: 'Enable BitLocker (Windows)',
          why: 'Protects your files if your device is stolen — cannot be accessed without your password',
          how: 'Settings → Privacy & Security → Device Encryption → Turn on BitLocker',
          link: '/resources',
          difficulty: 'easy',
          os: ['Windows'],
          priority: 'critical',
        },
        {
          id: 'device-encryption-mac',
          title: 'Enable FileVault (macOS)',
          why: 'Encrypts your entire disk so files are protected if device is stolen',
          how: 'System Settings → Privacy & Security → FileVault → Turn On',
          link: '/resources',
          difficulty: 'easy',
          os: ['macOS'],
          priority: 'critical',
        },
        {
          id: 'device-encryption-mobile',
          title: 'Enable device encryption (mobile)',
          why: 'Protects sensitive data on your phone if lost or stolen',
          how: 'iOS: enabled by default with passcode. Android: Settings → Security → Encrypt phone',
          difficulty: 'easy',
          os: ['iOS', 'Android'],
          priority: 'critical',
        },
        {
          id: 'device-auto-updates',
          title: 'Enable automatic updates',
          why: 'Security patches fix vulnerabilities that hackers actively exploit',
          how: 'Windows: Settings → Windows Update → Advanced → Automatic updates. Mac: System Settings → Software Update → Automatic',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high',
        },
        {
          id: 'device-antivirus',
          title: 'Install antivirus software',
          why: 'Detects and blocks malware before it can compromise your system',
          how: 'Windows: Windows Defender is built-in. Mac: install Malwarebytes or Bitdefender',
          difficulty: 'easy',
          os: ['Windows', 'macOS'],
          priority: 'high',
        },
        {
          id: 'device-screen-lock',
          title: 'Set up strong screen lock',
          why: 'Prevents unauthorized physical access to your device',
          how: 'Use 6+ digit PIN, fingerprint, or face ID. Set auto-lock to 1–5 minutes',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high',
        },
        {
          id: 'device-remote-wipe',
          title: 'Enable remote wipe',
          why: "Allows you to erase your device remotely if it's stolen",
          how: 'iOS: Find My iPhone. Android: Find My Device. Windows/Mac: Microsoft/Apple account settings',
          difficulty: 'easy',
          os: ['all'],
          priority: 'medium',
        },
      ],
    },
    data: {
      name: 'Data protection',
      icon: Database,
      tasks: [
        {
          id: 'data-backup-setup',
          title: 'Set up automatic backups',
          why: 'Protects against ransomware, hardware failure, and accidental deletion',
          how: 'Use external drive + cloud: Time Machine (Mac), File History (Windows), or Backblaze',
          difficulty: 'medium',
          os: ['all'],
          priority: 'critical',
        },
        {
          id: 'data-backup-encrypt',
          title: 'Encrypt your backups',
          why: 'Backups contain sensitive data — must be protected if storage is compromised',
          how: 'Enable encryption in backup software settings or use Cryptomator for cloud backups',
          link: '/resources',
          difficulty: 'medium',
          os: ['all'],
          priority: 'high',
        },
        {
          id: 'data-cloud-audit',
          title: 'Audit cloud storage',
          why: 'Sensitive files may be synced to cloud without encryption',
          how: 'Review Google Drive, Dropbox, iCloud — remove sensitive files or encrypt them first',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high',
        },
        {
          id: 'data-usb-encrypt',
          title: 'Encrypt USB drives',
          why: 'USB drives are easily lost — encryption protects the data on them',
          how: 'Use VeraCrypt or BitLocker To Go to create encrypted USB drives',
          link: '/resources',
          difficulty: 'medium',
          os: ['Windows', 'macOS', 'Linux'],
          priority: 'medium',
        },
        {
          id: 'data-secure-delete',
          title: 'Use secure file deletion',
          why: 'Deleted files can be recovered — secure deletion makes recovery impossible',
          how: 'Windows: Eraser. Mac: built-in secure empty trash. Linux: shred command',
          difficulty: 'easy',
          os: ['all'],
          priority: 'medium',
        },
        {
          id: 'data-backup-test',
          title: 'Test your backups',
          why: "Backups are useless if they don't work when you need them",
          how: 'Try restoring a test file from your backup to verify it works',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high',
        },
      ],
    },
    communication: {
      name: 'Communication security',
      icon: MessageSquare,
      tasks: [
        {
          id: 'comm-signal',
          title: 'Install Signal messenger',
          why: 'End-to-end encrypted messaging protects sensitive source communications',
          how: 'Download Signal from signal.org for iOS, Android, Windows, Mac, Linux',
          link: '/resources',
          difficulty: 'easy',
          os: ['all'],
          priority: 'critical',
        },
        {
          id: 'comm-protonmail',
          title: 'Create ProtonMail account',
          why: 'Encrypted email prevents interception of sensitive correspondence',
          how: 'Sign up at proton.me for a free encrypted email account',
          link: '/resources',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high',
        },
        {
          id: 'comm-vpn',
          title: 'Install a VPN',
          why: 'Encrypts internet traffic and hides your location, especially on public wifi',
          how: 'Use ProtonVPN (free), Mullvad, or IVPN for privacy-focused VPN service',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high',
        },
        {
          id: 'comm-tor',
          title: 'Install Tor Browser',
          why: 'Provides anonymity for research and accessing information without tracking',
          how: 'Download from torproject.org — essential for investigative research',
          link: '/resources',
          difficulty: 'easy',
          os: ['Windows', 'macOS', 'Linux', 'Android'],
          priority: 'high',
        },
        {
          id: 'comm-messaging-audit',
          title: 'Switch from SMS to Signal',
          why: 'SMS is not encrypted — easily intercepted by governments and hackers',
          how: 'Convince key contacts to install Signal, gradually move conversations over',
          difficulty: 'medium',
          os: ['all'],
          priority: 'high',
        },
        {
          id: 'comm-metadata',
          title: 'Enable disappearing messages',
          why: 'Reduces metadata trail and prevents message history from being recovered',
          how: 'In Signal: Settings → Privacy → Disappearing Messages → Default timer',
          difficulty: 'easy',
          os: ['all'],
          priority: 'medium',
        },
      ],
    },
    physical: {
      name: 'Physical security',
      icon: MapPin,
      tasks: [
        {
          id: 'phys-webcam-cover',
          title: 'Cover your webcam',
          why: 'Malware can activate webcams without your knowledge',
          how: 'Use webcam cover sticker or tape when not in use',
          difficulty: 'easy',
          os: ['all'],
          priority: 'medium',
        },
        {
          id: 'phys-privacy-screen',
          title: 'Use privacy screen protectors',
          why: 'Prevents shoulder surfing in public spaces',
          how: 'Buy privacy screen filters for laptop and phone from Amazon or electronics stores',
          difficulty: 'easy',
          os: ['all'],
          priority: 'low',
        },
        {
          id: 'phys-location-services',
          title: 'Review location permissions',
          why: 'Apps track your movement unnecessarily — creates security risk',
          how: 'Phone: Settings → Privacy → Location Services → review and disable unnecessary apps',
          difficulty: 'easy',
          os: ['iOS', 'Android'],
          priority: 'medium',
        },
        {
          id: 'phys-secure-storage',
          title: 'Secure device storage',
          why: 'Devices left unattended can be tampered with or stolen',
          how: 'Use laptop locks, keep devices in locked drawers when not in use',
          difficulty: 'easy',
          os: ['all'],
          priority: 'medium',
        },
        {
          id: 'phys-public-wifi',
          title: 'Avoid sensitive work on public wifi',
          why: 'Public networks are easily monitored — credentials can be intercepted',
          how: 'Use VPN if you must use public wifi, or use phone hotspot instead',
          difficulty: 'easy',
          os: ['all'],
          priority: 'high',
        },
        {
          id: 'phys-usb-security',
          title: 'Disable USB auto-run',
          why: 'Malware can auto-execute from infected USB drives',
          how: 'Windows: Group Policy Editor → disable autoplay. Mac: disabled by default',
          difficulty: 'medium',
          os: ['Windows'],
          priority: 'medium',
        },
      ],
    },
};

const allTasks = Object.entries(setupTasks).flatMap(([key, cat]) =>
  cat.tasks.map(t => ({ ...t, categoryKey: key }))
);

const deriveWeakCategories = (scores = []) => {
  if (!scores?.length) return [];
  const latest = scores[scores.length - 1];
  const QUIZ_TO_SETUP = {
    password: 'password',
    device: 'device',
    communication: 'communication',
    data: 'data',
    physical: 'physical',
  };
  return Object.entries(latest.categoryScores ?? {})
    .filter(([key, value]) => QUIZ_TO_SETUP[key] && value.score < 70)
    .sort((left, right) => left[1].score - right[1].score)
    .map(([key]) => QUIZ_TO_SETUP[key]);
};

/* ─── Main ────────────────────────────────────────────────────────────── */

const SecureSetup = () => {
  const { user } = useAuth();
  const [completedTasks,   setCompletedTasks]   = useState(() => new Set(user?.setupProgress?.completedTasks || []));
  const [weakCategories,   setWeakCategories]   = useState(() => deriveWeakCategories(user?.securityScores));
  const [loading,          setLoading]          = useState(!user);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (!user) {
      setCompletedTasks(new Set());
      setWeakCategories([]);
      setLoading(false);
      return;
    }
    setCompletedTasks(new Set(user.setupProgress?.completedTasks || []));
    setWeakCategories(deriveWeakCategories(user.securityScores));
    setLoading(false);
  }, [user]);

  const toggleTask = async (taskId) => {
    if (!user) return;
    const next = new Set(completedTasks);
    next.has(taskId) ? next.delete(taskId) : next.add(taskId);
    setCompletedTasks(next);
    try {
      const ref = doc(db, COLLECTIONS.USERS, user.uid);
      await updateDoc(ref, {
        'setupProgress.completedTasks': Array.from(next),
        'setupProgress.lastUpdated':    new Date().toISOString(),
      });
    } catch (err) {
      if (err.code === 'not-found') {
        await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
          setupProgress: { completedTasks: Array.from(next), lastUpdated: new Date().toISOString() },
        }, { merge: true });
      }
    }
  };

  const totalTasks     = allTasks.length;
  const completedCount = allTasks.filter(t => completedTasks.has(t.id)).length;
  const overallPct     = Math.round((completedCount / totalTasks) * 100);
  const level          = getLevelInfo(overallPct);

  const catPct = (key) => {
    const tasks = setupTasks[key].tasks;
    return Math.round(tasks.filter(t => completedTasks.has(t.id)).length / tasks.length * 100);
  };

  const filteredTasks = useMemo(() => {
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

  if (loading) {
    return (
      <NewsPage max="reading">
        <p className="eyebrow sm text-smoke">Loading your setup progress…</p>
      </NewsPage>
    );
  }

  return (
    <NewsPage>
      {/* Form masthead — typographic, no metal clip. */}
      <motion.header
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-baseline justify-between pb-3">
          <span className="eyebrow sm text-oxblood">Workbench · Secure Setup</span>
          <span className="eyebrow sm">{completedCount} of {totalTasks} done</span>
        </div>
        <NewsRule />

        <div className="mt-10 grid grid-cols-1 md:grid-cols-[1.45fr_1fr] gap-x-10 gap-y-5 items-end pb-9 border-b border-ink/12">
          <div className="max-w-prose">
            <h1 className="display text-4xl md:text-6xl leading-none">
              Secure your setup<span className="italic-ox">.</span>
            </h1>
            <p className="mt-5 text-base md:text-lg leading-relaxed text-ink-soft">
              Work through each task to harden your digital security. Each item
              is something you do; checked items stay on the page as a record
              of the work.
            </p>
          </div>
          <div className="md:text-right">
            <p className="eyebrow sm">Progress</p>
            <p className={`display num text-5xl md:text-6xl mt-2 leading-none ${level.tone}`}>
              {overallPct}
              <span className="text-2xl text-smoke">%</span>
            </p>
            <p className={`mt-2 font-mono text-[11px] uppercase tracking-[0.18em] ${level.tone}`}>
              {level.label}
            </p>
          </div>
        </div>

        {/* Progress bar with milestone markers */}
        <div className="mt-7 relative">
          <div className="relative h-1 bg-ink/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 bg-ink"
            />
            {/* Tick marks every 10% */}
            {Array.from({ length: 11 }, (_, i) => (
              <span
                key={i}
                className="absolute -top-1 w-px h-3 bg-ink/30"
                style={{ left: `${i * 10}%` }}
              />
            ))}
            {/* Milestone diamonds at 25/50/75 */}
            {[25, 50, 75].map(m => (
              <span
                key={m}
                className={`absolute top-1/2 w-1.5 h-1.5 ${
                  overallPct >= m ? 'bg-oxblood' : 'bg-paper border border-ink/35'
                }`}
                style={{
                  left: `${m}%`,
                  transform: 'translate(-50%, -50%) rotate(45deg)',
                }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-3 font-mono text-[9px] uppercase tracking-[0.15em] text-smoke">
            <span>Getting started</span>
            <span>Building habits</span>
            <span>Security aware</span>
            <span>Conscious</span>
            <span>Hardened</span>
          </div>
        </div>
      </motion.header>

      {/* Weak categories — appears when quiz signals areas to focus on */}
      {user && weakCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-9"
        >
          <NewsNotice tone="brass" icon={AlertTriangle}>
            <p className="eyebrow sm text-brass">Based on your security quiz</p>
            <p className="mt-2 text-sm text-ink-soft">
              Your weakest areas — tackle these first:
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {weakCategories.map(key => {
                const cat = setupTasks[key];
                const Icon = cat.icon;
                const active = selectedCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(active ? null : key)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 border font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                      active
                        ? 'bg-ink text-paper border-ink'
                        : 'border-brass/45 text-brass hover:bg-brass/[0.08]'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </NewsNotice>
        </motion.div>
      )}

      {/* Category strip — circular gauges */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="mt-10 grid grid-cols-3 md:grid-cols-5 gap-3"
      >
        {Object.entries(setupTasks).map(([key, cat]) => {
          const pct      = catPct(key);
          const done     = cat.tasks.filter(t => completedTasks.has(t.id)).length;
          const isActive = selectedCategory === key;
          const isWeak   = weakCategories.includes(key);
          const Icon     = cat.icon;
          const tone     = CATEGORY_TONE[key];
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(isActive ? null : key)}
              className={`relative p-4 border flex flex-col items-center gap-2.5 transition-colors ${
                isActive
                  ? 'bg-paper-soft border-ink'
                  : 'bg-paper-soft/40 border-ink/15 hover:bg-paper-soft/80 hover:border-ink/30'
              }`}
            >
              {isWeak && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-oxblood" />
              )}
              <div className="relative flex items-center justify-center">
                <ProgressRing progress={pct} color={tone} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon className="w-4 h-4" style={{ color: tone }} />
                </div>
              </div>
              <p className="text-[11px] font-medium text-ink text-center leading-tight">
                {cat.name}
              </p>
              <p className="font-mono text-[10px] tabular-nums text-smoke">
                {done}/{cat.tasks.length}
              </p>
            </button>
          );
        })}
      </motion.div>

      {/* Filter + count strip */}
      <div className="mt-9 mb-4 pb-2 flex items-baseline justify-between border-b border-ink/15">
        <p className="eyebrow sm">
          {selectedCategory
            ? `${setupTasks[selectedCategory].name} — ${filteredTasks.length} tasks`
            : `All tasks — ${filteredTasks.length} total`}
        </p>
        {selectedCategory && (
          <button
            onClick={() => setSelectedCategory(null)}
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-oxblood hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Task grid */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={selectedCategory ?? 'all'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {filteredTasks.map((task) => {
            const done = completedTasks.has(task.id);
            const priorityBorder = done
              ? 'border-l-ink/10'
              : (PRIORITY_BORDER[task.priority] ?? 'border-l-ink/15');
            return (
              <article
                key={task.id}
                className={`p-4 bg-paper-soft border border-ink/10 border-l-2 ${priorityBorder} transition-colors`}
              >
                <div className="flex items-start gap-3">
                  {/* Square ink checkbox */}
                  <motion.button
                    onClick={() => toggleTask(task.id)}
                    disabled={!user}
                    whileTap={{ scale: 0.9 }}
                    className={`flex-shrink-0 w-5 h-5 mt-0.5 inline-flex items-center justify-center transition-colors ${
                      done
                        ? 'bg-ink text-paper border border-ink'
                        : 'border-[1.5px] border-ink/35 hover:border-ink'
                    } ${!user ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    aria-label={done ? 'Mark task incomplete' : 'Mark task complete'}
                  >
                    <AnimatePresence>
                      {done && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.18 }}
                        >
                          <Check className="w-3 h-3" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4
                        className={`text-sm font-medium leading-snug ${
                          done
                            ? 'line-through text-smoke decoration-oxblood decoration-[1.5px]'
                            : 'text-ink'
                        }`}
                      >
                        {task.title}
                      </h4>
                      <span
                        className={`font-mono text-[9px] uppercase tracking-[0.14em] px-1.5 py-0.5 border ${DIFFICULTY_TONE[task.difficulty] ?? 'text-smoke border-smoke/40'}`}
                      >
                        {task.difficulty}
                      </span>
                    </div>

                    <div className={done ? 'opacity-55' : ''}>
                      <p className="text-xs text-smoke leading-relaxed mt-1">
                        <span className="text-ink-soft font-medium">Why:</span>{' '}
                        {task.why}
                      </p>
                      <p className="text-xs text-smoke leading-relaxed mt-1">
                        <span className="text-ink-soft font-medium">How:</span>{' '}
                        {task.how}
                      </p>
                    </div>

                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 mt-3">
                      {!selectedCategory && (
                        <span
                          className="font-mono text-[9px] uppercase tracking-[0.16em] px-1.5 py-0.5 border"
                          style={{
                            color: CATEGORY_TONE[task.categoryKey],
                            borderColor: `color-mix(in srgb, ${CATEGORY_TONE[task.categoryKey]} 35%, transparent)`,
                          }}
                        >
                          {setupTasks[task.categoryKey].name}
                        </span>
                      )}
                      {task.link && (
                        <Link
                          to={task.link}
                          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-oxblood hover:underline"
                        >
                          View tools <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                      {task.categoryKey === 'communication' && (
                        <Link
                          to="/source-protection"
                          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-brass hover:underline"
                        >
                          Source playbook <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Signed-out CTA */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12"
        >
          <NewsNotice tone="brass">
            <div className="flex-1">
              <p className="eyebrow sm text-brass">Sign in to track progress</p>
              <p className="display-soft text-xl mt-2 leading-tight">
                Your completed tasks are saved to your account.
              </p>
              <p className="text-sm text-ink-soft mt-2 leading-relaxed">
                Without an account, progress stays only as long as this page is open.
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 mt-4 font-mono text-[11px] uppercase tracking-[0.18em] px-3.5 py-2 border border-ink text-ink hover:bg-ink hover:text-paper transition-colors"
              >
                Create free account <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </NewsNotice>
        </motion.div>
      )}

      {/* Footer rule */}
      <div className="mt-12 pt-4 border-t border-ink/22 flex items-baseline justify-between">
        <span className="eyebrow sm">
          Workbench · {completedCount === totalTasks ? 'Complete' : 'In progress'}
        </span>
        {completedCount < totalTasks && (
          <Link
            to="/security-score"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink hover:text-oxblood transition-colors"
          >
            Re-take the score →
          </Link>
        )}
      </div>
    </NewsPage>
  );
};

export default SecureSetup;
