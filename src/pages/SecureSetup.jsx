import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  Check, AlertTriangle, ArrowRight, GripVertical,
} from 'lucide-react';
import { setupTasks, allTasks, TASKS_BY_ID, DEFAULT_TASK_ORDER } from '../features/setup/data/setupTasks';
import { useMemo, useState, useEffect, useRef } from 'react';
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

const WORKBENCH_LEVELS = [
  { threshold: 0, label: 'Getting started', tone: 'text-smoke', accent: 'rgba(123, 114, 101, 0.9)' },
  { threshold: 25, label: 'Building habits', tone: 'text-ink-soft', accent: 'var(--color-ink-soft)' },
  { threshold: 50, label: 'Security aware', tone: 'text-brass', accent: 'var(--color-brass)' },
  { threshold: 75, label: 'Conscious', tone: 'text-oxblood', accent: 'var(--color-oxblood-soft)' },
  { threshold: 100, label: 'Hardened', tone: 'text-oxblood', accent: 'var(--color-oxblood)' },
];

const getLevelInfo = (pct) => {
  return WORKBENCH_LEVELS.reduce(
    (current, step) => (pct >= step.threshold ? step : current),
    WORKBENCH_LEVELS[0],
  );
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


const DESK_PREVIEW_LIMIT = 4;
const INITIAL_STACK_CURSOR = { source: 0, pinned: 0, filed: 0 };
const getZoneStorageKey = (userKey) => `safepress:setup:task-zones:${userKey}`;

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

const getDeskWindow = (tasks, cursor) => {
  if (tasks.length <= DESK_PREVIEW_LIMIT) {
    return {
      start: 0,
      end: tasks.length,
      total: tasks.length,
      hiddenBefore: 0,
      hiddenAfter: 0,
      tasks,
    };
  }

  const start = Math.min(cursor, tasks.length);
  const end   = Math.min(start + DESK_PREVIEW_LIMIT, tasks.length);

  return {
    start,
    end,
    total: tasks.length,
    hiddenBefore: start,
    hiddenAfter: tasks.length - end,
    tasks: tasks.slice(start, end),
  };
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
                {task.linkLabel ?? 'See in Manual'} <ArrowRight className="w-3 h-3" />
              </Link>
            )}
            {task.categoryKey === 'communication' && (
              <Link to="/resources?tab=source-protection" className="workbench-link workbench-link--brass">
                Source guide in Manual <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

const StackSummary = ({
  stackWindow,
  onNext,
  onReset,
  label = 'in stack',
}) => {
  if (stackWindow.total <= DESK_PREVIEW_LIMIT) return null;

  return (
    <div className="workbench-pile-controls">
      {stackWindow.hiddenAfter > 0 ? (
        <button
          type="button"
          onClick={onNext}
          className="workbench-pile"
          aria-label={`Show ${stackWindow.hiddenAfter} more cards ${label}`}
        >
          <span className="workbench-pile__papers" aria-hidden="true" />
          <span className="workbench-pile__label">+{stackWindow.hiddenAfter} more {label}</span>
        </button>
      ) : (
        <span className="workbench-pile__end">End of stack</span>
      )}
      {stackWindow.hiddenBefore > 0 && (
        <button
          type="button"
          onClick={onReset}
          className="workbench-link workbench-link--ink workbench-pile__reset"
        >
          Back to first cards
        </button>
      )}
    </div>
  );
};

/* ─── Main ────────────────────────────────────────────────────────────── */

const SecureSetup = () => {
  const { user, loading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const taskOrder = DEFAULT_TASK_ORDER;
  const [completedDrafts,  setCompletedDrafts]  = useState({});
  const [taskZoneDrafts,   setTaskZoneDrafts]   = useState({});
  const [draggedTaskId,    setDraggedTaskId]    = useState(null);
  const [activeDropZone,   setActiveDropZone]   = useState(null);
  const [stackCursor,      setStackCursor]      = useState(INITIAL_STACK_CURSOR);

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
  const persistedTaskZones = useMemo(
    () => user?.setupProgress?.taskZones || {},
    [user?.setupProgress?.taskZones],
  );
  const taskZones = useMemo(
    () => {
      const draftZones = taskZoneDrafts[currentUserKey];
      if (draftZones) return draftZones;
      if (typeof window !== 'undefined') {
        try {
          const stored = window.localStorage.getItem(getZoneStorageKey(currentUserKey));
          if (stored) return JSON.parse(stored);
        } catch {
          // Ignore malformed local storage payloads.
        }
      }
      return persistedTaskZones;
    },
    [taskZoneDrafts, currentUserKey, persistedTaskZones],
  );

  const updateSelectedCategory = (nextCategory) => {
    setSelectedCategory(nextCategory);
    setStackCursor({ ...INITIAL_STACK_CURSOR });
  };

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

  const persistTaskZones = async (nextZones) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        'setupProgress.taskZones': nextZones,
        'setupProgress.lastUpdated': new Date().toISOString(),
      });
    } catch {
      // Zone positions saved in localStorage; Firestore sync is best-effort.
    }
  };

  const totalTasks     = allTasks.length;
  const completedCount = allTasks.filter(t => completedTasks.has(t.id)).length;
  const overallPct     = Math.round((completedCount / totalTasks) * 100);
  const level          = getLevelInfo(overallPct);
  const nextLevel      = WORKBENCH_LEVELS.find((step) => step.threshold > overallPct) ?? WORKBENCH_LEVELS[WORKBENCH_LEVELS.length - 1];
  const meterCursorPct = Math.min(99.4, Math.max(0.6, overallPct));

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

  const autoInitDone = useRef(false);

  useEffect(() => {
    if (loading || autoInitDone.current) return;
    autoInitDone.current = true;

    if (Object.keys(taskZones).length > 0 || !weakCategories.length) return;

    const topCategories = weakCategories.slice(0, 2);
    const toPin = allTasks.filter(
      (t) => topCategories.includes(t.categoryKey) && t.priority === 'critical',
    );
    if (!toPin.length) return;

    const initialZones = Object.fromEntries(toPin.map((t) => [t.id, 'pinned']));
    setTaskZoneDrafts((prev) => ({ ...prev, [currentUserKey]: initialZones }));
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(getZoneStorageKey(currentUserKey), JSON.stringify(initialZones));
    }
    if (user) {
      updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        'setupProgress.taskZones': initialZones,
        'setupProgress.lastUpdated': new Date().toISOString(),
      }).catch(() => {});
    }
  }, [loading, weakCategories, taskZones, currentUserKey, user]);

  const weakFocus = weakCategories[0] ? setupTasks[weakCategories[0]] : null;
  const selectedCategoryData = selectedCategory ? setupTasks[selectedCategory] : null;

  const zoneBuckets = useMemo(() => {
    const buckets = { source: [], pinned: [] };
    activeTasks.forEach((task) => {
      const zone = taskZones[task.id] ?? 'source';
      buckets[zone]?.push(task);
    });
    return buckets;
  }, [activeTasks, taskZones]);

  const sourceWindow = useMemo(
    () => getDeskWindow(zoneBuckets.source, stackCursor.source),
    [zoneBuckets.source, stackCursor.source],
  );
  const pinnedWindow = useMemo(
    () => getDeskWindow(zoneBuckets.pinned, stackCursor.pinned),
    [zoneBuckets.pinned, stackCursor.pinned],
  );
  const filedWindow = useMemo(
    () => getDeskWindow(completedVisibleTasks, stackCursor.filed),
    [completedVisibleTasks, stackCursor.filed],
  );

  const shiftStack = (zone, total, direction = 1) => {
    if (total <= DESK_PREVIEW_LIMIT) return;
    setStackCursor((current) => {
      const nextStart = current[zone] + (direction * DESK_PREVIEW_LIMIT);
      return {
        ...current,
        [zone]: Math.max(0, Math.min(nextStart, total)),
      };
    });
  };

  const moveTaskToZone = (taskId, zone) => {
    if (zone === 'filed') {
      if (!completedTasks.has(taskId)) {
        void toggleTask(taskId);
      }
      return;
    }

    const nextZones = { ...taskZones, [taskId]: zone };
    setTaskZoneDrafts((prev) => ({ ...prev, [currentUserKey]: nextZones }));
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(getZoneStorageKey(currentUserKey), JSON.stringify(nextZones));
    }
    void persistTaskZones(nextZones);
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
      <NewsPage >
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
            <h1 className="display workbench-main-title leading-none">
              Secure your setup<span className="italic-ox">.</span>
            </h1>
            <p className="workbench-lede">
              Work through practical security tasks as if they were laid out on a real desk:
              choose a tray, pull the cards into focus, pin what matters, and file the finished work
              into the scraps pile.
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
          <div className="workbench-meter__summary">
            <div>
              <p className="workbench-meter__value">{overallPct}% complete</p>
              <p className="workbench-meter__goal">
                {overallPct >= 100 ? (
                  'All milestones reached'
                ) : (
                  <>
                    Next marker <span className="workbench-meter__goal-target" style={{ color: nextLevel.accent }}>{nextLevel.label}</span> at {nextLevel.threshold}%
                  </>
                )}
              </p>
            </div>
            <p className="workbench-meter__fraction">{completedCount} / {totalTasks} tasks checked</p>
          </div>
          <div className="workbench-meter__bar" style={{ '--meter-accent': level.accent }}>
            {WORKBENCH_LEVELS.slice(1).map((step, index) => (
              <span
                key={step.threshold}
                className="workbench-meter__zone"
                style={{
                  left: `${index * 25}%`,
                  width: '25%',
                  '--zone-accent': step.accent,
                }}
              />
            ))}
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
                className={[
                  'workbench-meter__marker',
                  overallPct > m ? 'is-passed' : '',
                  level.threshold === m ? 'is-current' : '',
                  nextLevel.threshold === m ? 'is-next' : '',
                ].filter(Boolean).join(' ')}
                style={{
                  left: `${m}%`,
                  '--marker-accent': WORKBENCH_LEVELS.find((step) => step.threshold === m)?.accent,
                }}
              />
            ))}
            <Motion.span
              initial={{ left: 0 }}
              animate={{ left: `${meterCursorPct}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="workbench-meter__cursor"
            />
          </div>
          <div className="workbench-meter__labels">
            {WORKBENCH_LEVELS.map((step) => (
              <span
                key={step.threshold}
                className={[
                  'workbench-meter__label',
                  overallPct >= step.threshold ? 'is-passed' : '',
                  level.threshold === step.threshold ? 'is-current' : '',
                ].filter(Boolean).join(' ')}
                style={{ '--label-accent': step.accent }}
              >
                <strong>{step.threshold === 0 ? 'Start' : `${step.threshold}%`}</strong>
                {step.label}
              </span>
            ))}
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
                    onClick={() => updateSelectedCategory(active ? null : key)}
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
          <div className="workbench-tray__copy">
            <p className="eyebrow sm text-oxblood">Choose a stack</p>
            <h2 className="workbench-section-title">Pick the security area you want to work through.</h2>
            <p className="workbench-tray__note">
              Each tray filters the desk below to one set of cards, so you can focus on a single area at a time.
            </p>
          </div>
          {selectedCategory && (
            <button
              type="button"
              onClick={() => updateSelectedCategory(null)}
              className="workbench-link workbench-link--oxblood"
            >
              Clear filter
            </button>
          )}
          {!selectedCategory && (
            <p className="workbench-tray__hint">Leave all trays open to work across the full setup.</p>
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
              onSelect={updateSelectedCategory}
            />
          ))}
        </div>
      </Motion.div>

      <AnimatePresence mode="wait">
        <Motion.div
          key={selectedCategory ?? 'all'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="workbench-board__heading">
            <div>
              {selectedCategoryData && (
                <p className="eyebrow sm">
                  {selectedCategoryData.name} · {visibleTasks.length} tasks
                </p>
              )}
              <h2 className="workbench-section-title">
                {selectedCategoryData
                  ? `Move the ${selectedCategoryData.name.toLowerCase()} cards across the desk.`
                  : 'Move the cards across the desk.'}
              </h2>
            </div>
            <p className="workbench-drag-note">Drag cards between source, pinned, and filed scraps.</p>
          </div>
          <section className="workbench-board">
          <div className="workbench-board__inner">
            {activeTasks.length > 0 ? (
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
                    {sourceWindow.tasks.length > 0 ? sourceWindow.tasks.map((task) => (
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
                  <StackSummary
                    stackWindow={sourceWindow}
                    onNext={() => shiftStack('source', zoneBuckets.source.length, 1)}
                    onReset={() => setStackCursor((current) => ({ ...current, source: 0 }))}
                  />
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
                    {pinnedWindow.tasks.length > 0 ? pinnedWindow.tasks.map((task) => (
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
                  <StackSummary
                    stackWindow={pinnedWindow}
                    onNext={() => shiftStack('pinned', zoneBuckets.pinned.length, 1)}
                    onReset={() => setStackCursor((current) => ({ ...current, pinned: 0 }))}
                  />
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
                    {filedWindow.tasks.length > 0 ? filedWindow.tasks.map((task) => (
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
                  <StackSummary
                    stackWindow={filedWindow}
                    onNext={() => shiftStack('filed', completedVisibleTasks.length, 1)}
                    onReset={() => setStackCursor((current) => ({ ...current, filed: 0 }))}
                    label="in pile"
                  />
                </section>
              </div>
            ) : (
              <NewsNotice tone="info" icon={Check}>
                <div>
                  <p className="eyebrow sm text-ink">Bench cleared</p>
                  <p className="mt-2 text-sm text-ink-soft">
                    Everything in this tray is already checked off. Pick another category
                    or reopen a task if you want it back on the desk.
                  </p>
                </div>
              </NewsNotice>
            )}
          </div>
          </section>
        </Motion.div>
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
