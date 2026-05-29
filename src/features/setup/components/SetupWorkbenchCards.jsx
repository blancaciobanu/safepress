import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Check, GripVertical, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { setupTasks } from '../data/setupTasks';
import { CATEGORY_TONE } from '../workbenchConstants';

const DIFFICULTY_TONE = {
  easy:     'text-smoke border-smoke/40 bg-transparent',
  medium:   'text-brass border-brass/40 bg-brass/[0.06]',
  advanced: 'text-oxblood border-oxblood/40 bg-oxblood/[0.06]',
};

export const ProgressRing = ({ progress, color, size = 44, strokeWidth = 2.5 }) => {
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

export const CategoryTrayCard = ({ categoryKey, category, progress, done, active, flagged, onSelect }) => {
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

export const TaskCard = ({
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

  const getTaskTilt = (taskId, taskZone) => {
    const seed = [...taskId].reduce((total, char) => total + char.charCodeAt(0), 0);
    const base = ((seed % 7) - 3) * 0.6;
    if (taskZone === 'pinned') return `${base * 0.55}deg`;
    if (taskZone === 'filed') return `${base * 1.2}deg`;
    return '0deg';
  };

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
