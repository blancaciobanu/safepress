import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Smartphone, Database, MessageSquare, MapPin,
  Check, ExternalLink, AlertTriangle, ArrowRight, GripVertical,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../config/firebaseCollections';
import {
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
      <Motion.circle
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

const TASKS_BY_ID = Object.fromEntries(allTasks.map((task) => [task.id, task]));

const DEFAULT_TASK_ORDER = [...allTasks]
  .sort((a, b) => {
    const priorityDelta = (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3);
    if (priorityDelta !== 0) return priorityDelta;
    return a.title.localeCompare(b.title);
  })
  .map((task) => task.id);

const mergeOrderedSubset = (currentOrder, nextVisibleIds, visibleIds) => {
  let cursor = 0;
  return currentOrder.map((id) => (visibleIds.has(id) ? nextVisibleIds[cursor++] : id));
};

const zoneSequence = ['source', 'pinned'];

const getTaskTilt = (taskId, zone) => {
  const seed = [...taskId].reduce((total, char) => total + char.charCodeAt(0), 0);
  const base = ((seed % 7) - 3) * 0.6;
  if (zone === 'pinned') return `${base * 0.55}deg`;
  if (zone === 'filed') return `${base * 1.2}deg`;
  return '0deg';
};

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

const CategoryTrayCard = ({ categoryKey, category, progress, done, active, flagged, onSelect }) => {
  const Icon = category.icon;
  const accent = CATEGORY_TONE[categoryKey];

  return (
    <button
      type="button"
      onClick={() => onSelect(active ? null : categoryKey)}
      className={`workbench-category ${active ? 'is-active' : ''}`}
      style={{ '--category-accent': accent }}
    >
      {flagged && <span className="workbench-category__flag" aria-hidden="true" />}
      <div className="workbench-category__ring">
        <ProgressRing progress={progress} color={accent} />
        <div className="workbench-category__icon">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="workbench-category__copy">
        <span className="workbench-category__label">{category.name}</span>
        <span className="workbench-category__meta">{done}/{category.tasks.length} complete</span>
      </div>
    </button>
  );
};

const TaskCard = ({
  task,
  done,
  zone = 'source',
  selectedCategory,
  canToggle,
  onToggle,
  onDragStart,
  onDragEnd,
}) => {
  const category = setupTasks[task.categoryKey];
  const priorityBorder = done
    ? 'rgba(21, 17, 12, 0.12)'
    : ({
      critical: 'var(--color-oxblood)',
      high: 'var(--color-brass)',
      medium: 'rgba(21, 17, 12, 0.32)',
      low: 'rgba(21, 17, 12, 0.18)',
    }[task.priority] ?? 'rgba(21, 17, 12, 0.18)');

  return (
    <article
      draggable={!done}
      onDragStart={done ? undefined : onDragStart}
      onDragEnd={done ? undefined : onDragEnd}
      className={`workbench-task-card workbench-task-card--${zone} ${done ? 'is-done' : ''}`}
      style={{ '--task-accent': priorityBorder, '--card-tilt': getTaskTilt(task.id, zone) }}
    >
      <div className="workbench-task-card__topline">
        <span className="eyebrow sm">
          {category.name} · {task.priority}
        </span>
        <GripVertical className="workbench-task-card__handle" aria-hidden="true" />
      </div>

      <div className="workbench-task-card__header">
        <Motion.button
          type="button"
          onClick={() => onToggle(task.id)}
          disabled={!canToggle}
          whileTap={{ scale: 0.92 }}
          className={`workbench-task-card__check ${!canToggle ? 'is-disabled' : ''} ${done ? 'is-checked' : ''}`}
          aria-label={done ? 'Mark task incomplete' : 'Mark task complete'}
        >
          <AnimatePresence>
            {done && (
              <Motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.18 }}
              >
                <Check className="w-3 h-3" />
              </Motion.span>
            )}
          </AnimatePresence>
        </Motion.button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className={`workbench-task-card__title ${done ? 'is-done' : ''}`}>
              {task.title}
            </h3>
            <span
              className={`workbench-task-card__difficulty ${DIFFICULTY_TONE[task.difficulty] ?? 'text-smoke border-smoke/40'}`}
            >
              {task.difficulty}
            </span>
          </div>

          <div className={`workbench-task-card__body ${done ? 'is-muted' : ''}`}>
            <p>
              <span>Why</span>
              {task.why}
            </p>
            <p>
              <span>How</span>
              {task.how}
            </p>
          </div>

          <div className="workbench-task-card__meta">
            {!selectedCategory && (
              <span
                className="workbench-task-card__tag"
                style={{
                  color: CATEGORY_TONE[task.categoryKey],
                  borderColor: `color-mix(in srgb, ${CATEGORY_TONE[task.categoryKey]} 35%, transparent)`,
                }}
              >
                {category.name}
              </span>
            )}
            {task.link && (
              <Link to={task.link} className="workbench-link workbench-link--oxblood">
                View tools <ExternalLink className="w-3 h-3" />
              </Link>
            )}
            {task.categoryKey === 'communication' && (
              <Link to="/source-protection" className="workbench-link workbench-link--brass">
                Source playbook <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

/* ─── Main ────────────────────────────────────────────────────────────── */

const SecureSetup = () => {
  const { user, loading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [taskOrder,        setTaskOrder]        = useState(DEFAULT_TASK_ORDER);
  const [completedDrafts,  setCompletedDrafts]  = useState({});
  const [taskZones,        setTaskZones]        = useState({});
  const [draggedTaskId,    setDraggedTaskId]    = useState(null);
  const [activeDropZone,   setActiveDropZone]   = useState(null);

  const currentUserKey = user?.uid ?? 'guest';
  const persistedCompletedIds = useMemo(
    () => user?.setupProgress?.completedTasks || [],
    [user?.setupProgress?.completedTasks],
  );
  const weakCategories = useMemo(
    () => deriveWeakCategories(user?.securityScores),
    [user?.securityScores],
  );

  const completedTasks = useMemo(
    () => new Set(completedDrafts[currentUserKey] ?? persistedCompletedIds),
    [completedDrafts, currentUserKey, persistedCompletedIds],
  );

  const toggleTask = async (taskId) => {
    if (!user) return;
    const next = new Set(completedTasks);
    next.has(taskId) ? next.delete(taskId) : next.add(taskId);
    setCompletedDrafts((prev) => ({ ...prev, [user.uid]: Array.from(next) }));
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

  const orderedTasks = useMemo(
    () => taskOrder.map((id) => TASKS_BY_ID[id]).filter(Boolean),
    [taskOrder],
  );

  const visibleTasks = useMemo(
    () => (
      selectedCategory
        ? orderedTasks.filter((task) => task.categoryKey === selectedCategory)
        : orderedTasks
    ),
    [orderedTasks, selectedCategory],
  );

  const activeTasks = useMemo(
    () => visibleTasks.filter((task) => !completedTasks.has(task.id)),
    [visibleTasks, completedTasks],
  );

  const completedVisibleTasks = useMemo(
    () => visibleTasks.filter((task) => completedTasks.has(task.id)),
    [visibleTasks, completedTasks],
  );

  const weakFocus = weakCategories[0] ? setupTasks[weakCategories[0]] : null;
  const selectedCategoryData = selectedCategory ? setupTasks[selectedCategory] : null;

  const zoneBuckets = useMemo(() => {
    const buckets = { source: [], pinned: [] };
    activeTasks.forEach((task, index) => {
      const zone = taskZones[task.id] ?? zoneSequence[Math.min(index, zoneSequence.length - 1)] ?? 'source';
      buckets[zone]?.push(task);
    });
    return buckets;
  }, [activeTasks, taskZones]);

  const moveTaskToZone = (taskId, zone) => {
    if (zone === 'filed') {
      if (!completedTasks.has(taskId)) {
        void toggleTask(taskId);
      }
      return;
    }

    setTaskZones((prev) => ({ ...prev, [taskId]: zone }));
    const visibleIds = new Set(activeTasks.map((task) => task.id));
    const nextVisibleIds = activeTasks
      .map((task) => task.id)
      .filter((id) => id !== taskId);
    const insertionIndex = zone === 'pinned' ? Math.min(1, nextVisibleIds.length) : 0;
    nextVisibleIds.splice(insertionIndex, 0, taskId);
    setTaskOrder((currentOrder) => mergeOrderedSubset(currentOrder, nextVisibleIds, visibleIds));
  };

  const beginDrag = (taskId) => (event) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const endDrag = () => {
    setDraggedTaskId(null);
    setActiveDropZone(null);
  };

  const allowDrop = (zone) => (event) => {
    event.preventDefault();
    if (draggedTaskId) setActiveDropZone(zone);
  };

  const dropInZone = (zone) => (event) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) moveTaskToZone(taskId, zone);
    setDraggedTaskId(null);
    setActiveDropZone(null);
  };

  if (loading) {
    return (
      <NewsPage max="reading">
        <p className="eyebrow sm text-smoke">Loading your setup progress…</p>
      </NewsPage>
    );
  }

  return (
    <NewsPage className="setup-workbench">
      <Motion.header
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-baseline justify-between pb-3">
          <span className="eyebrow sm text-oxblood">Workbench · Secure Setup</span>
          <span className="eyebrow sm">{completedCount} of {totalTasks} done</span>
        </div>
        <NewsRule />

        <div className="workbench-hero">
          <div className="max-w-prose">
            <h1 className="display text-4xl md:text-6xl leading-none">
              Secure your setup<span className="italic-ox">.</span>
            </h1>
            <p className="workbench-lede">
              Work through practical security tasks as if they were laid out on a real desk:
              choose a tray, drag the active cards into the order that makes sense, and keep
              completed work filed below.
            </p>
          </div>

          <div className="workbench-headcards">
            <div className="workbench-headcard">
              <p className="eyebrow sm text-oxblood">Progress</p>
              <p className={`display num text-4xl mt-3 leading-none ${level.tone}`}>
                {overallPct}
                <span className="text-xl text-smoke">%</span>
              </p>
              <p className={`workbench-headcard__meta ${level.tone}`}>{level.label}</p>
            </div>
            <div className="workbench-headcard">
              <p className="eyebrow sm">Open cards</p>
              <p className="display-soft text-3xl mt-3 leading-none num text-ink">
                {activeTasks.length}
              </p>
              <p className="workbench-headcard__meta">Ready to arrange on the bench</p>
            </div>
            <div className="workbench-headcard">
              <p className="eyebrow sm">Weakest signal</p>
              <p className="display-soft text-2xl mt-3 leading-tight text-ink">
                {weakFocus ? weakFocus.name : 'Balanced'}
              </p>
              <p className="workbench-headcard__meta">
                {weakFocus ? 'Start here first' : 'No low-scoring area flagged'}
              </p>
            </div>
          </div>
        </div>

        <div className="workbench-meter">
          <div className="workbench-meter__bar">
              <Motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="workbench-meter__fill"
            />
            {Array.from({ length: 11 }, (_, i) => (
              <span
                key={i}
                className="workbench-meter__tick"
                style={{ left: `${i * 10}%` }}
              />
            ))}
            {[25, 50, 75].map((m) => (
              <span
                key={m}
                className={`workbench-meter__marker ${overallPct >= m ? 'is-passed' : ''}`}
                style={{
                  left: `${m}%`,
                  transform: 'translate(-50%, -50%) rotate(45deg)',
                }}
              />
            ))}
          </div>
          <div className="workbench-meter__labels">
            <span>Getting started</span>
            <span>Building habits</span>
            <span>Security aware</span>
            <span>Conscious</span>
            <span>Hardened</span>
          </div>
        </div>
      </Motion.header>

      {user && weakCategories.length > 0 && (
        <Motion.div
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
        </Motion.div>
      )}

      <Motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="workbench-tray"
      >
        <div className="workbench-tray__header">
          <div>
            <p className="eyebrow sm text-oxblood">Task trays</p>
            <h2 className="workbench-section-title">Pull cards onto the desk.</h2>
          </div>
          {selectedCategory && (
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="workbench-link workbench-link--oxblood"
            >
              Clear filter
            </button>
          )}
        </div>

        <div className="workbench-category-grid">
          {Object.entries(setupTasks).map(([key, cat]) => (
            <CategoryTrayCard
              key={key}
              categoryKey={key}
              category={cat}
              progress={catPct(key)}
              done={cat.tasks.filter((task) => completedTasks.has(task.id)).length}
              active={selectedCategory === key}
              flagged={weakCategories.includes(key)}
              onSelect={setSelectedCategory}
            />
          ))}
        </div>
      </Motion.div>

      <AnimatePresence mode="wait">
        <Motion.section
          key={selectedCategory ?? 'all'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="workbench-board"
        >
          <div className="workbench-board__inner">
            <div className="workbench-board__heading">
              <div>
                <p className="eyebrow sm">
                  {selectedCategoryData
                    ? `${selectedCategoryData.name} · ${visibleTasks.length} tasks`
                    : `Desk layout · ${visibleTasks.length} tasks`}
                </p>
                <h2 className="workbench-section-title">
                  {selectedCategoryData
                    ? `Move the ${selectedCategoryData.name.toLowerCase()} cards across the desk.`
                    : 'Move the cards across the desk.'}
                </h2>
              </div>
              <p className="workbench-drag-note">Drag cards between source, pinned, and filed scraps.</p>
            </div>

            {activeTasks.length > 0 ? (
              <div className="workbench-desk-spread">
                <div className="workbench-desk">
                <section
                  className={`workbench-lane workbench-lane--source ${activeDropZone === 'source' ? 'is-target' : ''}`}
                  onDragOver={allowDrop('source')}
                  onDragLeave={() => setActiveDropZone((current) => (current === 'source' ? null : current))}
                  onDrop={dropInZone('source')}
                >
                  <div className="workbench-stack-head">
                    <span className="eyebrow sm text-oxblood">Source stack</span>
                    <span className="eyebrow sm">{zoneBuckets.source.length} waiting</span>
                  </div>
                  <div className="workbench-task-list workbench-task-list--stack">
                    {zoneBuckets.source.length > 0 ? zoneBuckets.source.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        zone="source"
                        done={false}
                        selectedCategory={selectedCategory}
                        canToggle={Boolean(user)}
                        onToggle={toggleTask}
                        onDragStart={beginDrag(task.id)}
                        onDragEnd={endDrag}
                      />
                    )) : (
                      <p className="workbench-empty">No cards waiting in this stack.</p>
                    )}
                  </div>
                </section>

                <section
                  className={`workbench-lane workbench-lane--pinned ${activeDropZone === 'pinned' ? 'is-target' : ''}`}
                  onDragOver={allowDrop('pinned')}
                  onDragLeave={() => setActiveDropZone((current) => (current === 'pinned' ? null : current))}
                  onDrop={dropInZone('pinned')}
                >
                  <div className="workbench-stack-head">
                    <span className="eyebrow sm text-oxblood">Pinned slip</span>
                    <span className="eyebrow sm">{zoneBuckets.pinned.length} marked</span>
                  </div>
                  <div className="workbench-task-list workbench-task-list--pinned">
                    {zoneBuckets.pinned.length > 0 ? zoneBuckets.pinned.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        zone="pinned"
                        done={false}
                        selectedCategory={selectedCategory}
                        canToggle={Boolean(user)}
                        onToggle={toggleTask}
                        onDragStart={beginDrag(task.id)}
                        onDragEnd={endDrag}
                      />
                    )) : (
                      <p className="workbench-empty">Pin the items you want to keep in view.</p>
                    )}
                  </div>
                </section>

                <section
                  className={`workbench-lane workbench-lane--filed ${activeDropZone === 'filed' ? 'is-target' : ''}`}
                  onDragOver={allowDrop('filed')}
                  onDragLeave={() => setActiveDropZone((current) => (current === 'filed' ? null : current))}
                  onDrop={dropInZone('filed')}
                >
                  <div className="workbench-stack-head">
                    <span className="eyebrow sm text-oxblood">Filed scraps</span>
                    <span className="eyebrow sm">{completedVisibleTasks.length} checked off</span>
                  </div>
                  <div className="workbench-complete__grid workbench-complete__grid--desk">
                    {completedVisibleTasks.length > 0 ? completedVisibleTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        zone="filed"
                        done
                        selectedCategory={selectedCategory}
                        canToggle={Boolean(user)}
                        onToggle={toggleTask}
                      />
                    )) : (
                      <p className="workbench-empty">Drop completed cards here or check them off into the pile.</p>
                    )}
                  </div>
                </section>
                </div>
              </div>
            ) : (
              <NewsNotice tone="info" icon={Check}>
                <p className="eyebrow sm text-ink">Bench cleared</p>
                <p className="mt-2 text-sm text-ink-soft">
                  Everything in this tray is already checked off. Pick another category
                  or reopen a task if you want it back on the desk.
                </p>
              </NewsNotice>
            )}
          </div>
        </Motion.section>
      </AnimatePresence>

      {!user && (
        <Motion.div
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
                className="btn mono mt-4"
              >
                Create free account <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </NewsNotice>
        </Motion.div>
      )}

      <div className="mt-12 pt-4 border-t border-ink/22 flex items-baseline justify-between">
        <span className="eyebrow sm">
          Workbench · {completedCount === totalTasks ? 'Complete' : 'In progress'}
        </span>
        {completedCount < totalTasks && (
          <Link to="/security-score" className="workbench-link workbench-link--ink">
            Re-take the score <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </NewsPage>
  );
};

export default SecureSetup;
