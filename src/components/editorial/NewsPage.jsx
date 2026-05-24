import { createElement } from 'react';

const cx = (...classes) => classes.filter(Boolean).join(' ');

export const NewsPage = ({ children, max = 'wide', className = '' }) => {
  const maxClass = max === 'reading'
    ? 'max-w-[980px]'
    : max === 'form'
      ? 'max-w-[720px]'
      : 'max-w-[1400px]';

  return (
    <div className={cx('surface-newsroom -mt-20 min-h-screen pt-20 pb-16 md:pb-20', className)}>
      <div className={cx(maxClass, 'mx-auto pt-6 md:pt-10')}>
        {children}
      </div>
    </div>
  );
};

export const NewsPageTopline = ({ children, className = '' }) => (
  <div className={cx('news-page-topline', className)}>
    {children}
  </div>
);

export const NewsHeader = ({ kicker, title, lede, meta, icon: Icon, className = '' }) => (
  <header className={cx('news-header', className)}>
    <NewsRule className="news-header__pair" />
    <div className="news-header__rule">
      <div>
        {kicker && <p className="news-kicker">{kicker}</p>}
        <h1 className="news-title">{title}</h1>
      </div>
      {Icon && (
        <div className="news-header__mark" aria-hidden="true">
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
    {(lede || meta) && (
      <div className="news-header__body">
        {lede && <p className="news-lede">{lede}</p>}
        {meta && <p className="news-meta">{meta}</p>}
      </div>
    )}
  </header>
);

export const NewsTabs = ({ tabs, activeId, onChange, className = '' }) => (
  <div className={cx('news-tabs', className)}>
    {tabs.map((tab) => {
      const Icon = tab.icon;
      const active = activeId === tab.id;

      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cx('news-tab', active && 'is-active')}
          style={{ '--tab-accent': tab.accent || 'var(--color-oxblood)' }}
        >
          {Icon && <Icon className="news-tab__icon" />}
          <span className="news-tab__copy">
            <span className="news-tab__label">{tab.label}</span>
            {tab.desc && <span className="news-tab__desc">{tab.desc}</span>}
          </span>
        </button>
      );
    })}
  </div>
);

export const NewsSectionHeader = ({ kicker, title, lede, icon: Icon, accent, className = '' }) => (
  <div className={cx('news-section-header', className)} style={{ '--section-accent': accent || 'var(--color-ink)' }}>
    <div className="min-w-0">
      {kicker && <p className="news-kicker">{kicker}</p>}
      <h2 className="news-section-title">{title}</h2>
      {lede && <p className="news-section-lede">{lede}</p>}
    </div>
    {Icon && (
      <div className="news-section-mark" aria-hidden="true">
        <Icon className="w-4 h-4" />
      </div>
    )}
  </div>
);

/* tone: 'default' (brass) | 'danger' (oxblood) | 'brass' | 'info' (smoke) */
export const NewsNotice = ({ children, tone = 'default', icon: Icon, className = '' }) => (
  <div className={cx('news-notice', tone !== 'default' && `news-notice--${tone}`, className)}>
    {Icon && <Icon className="news-notice__icon" />}
    <div>{children}</div>
  </div>
);

export const NewsBadge = ({ children, color, className = '' }) => (
  <span className={cx('news-badge', className)} style={{ '--badge-color': color || 'var(--color-oxblood)' }}>
    {children}
  </span>
);

export const NewsCard = ({ children, className = '', accent }) => (
  <article className={cx('news-card', className)} style={{ '--card-accent': accent || 'rgba(21, 17, 12, 0.18)' }}>
    {children}
  </article>
);

export const NewsPanel = ({ as = 'div', children, muted = false, className = '', ...rest }) => (
  createElement(as, { className: cx('news-panel', muted && 'news-panel--muted', className), ...rest }, children)
);

export const NewsModalCard = ({ as = 'div', children, className = '', borderColor, style, ...rest }) => (
  createElement(
    as,
    {
      className: cx('news-modal-card', className),
      style: borderColor ? { ...style, '--modal-border': borderColor } : style,
      ...rest,
    },
    children,
  )
);

export const NewsInput = ({ className = '', ...rest }) => (
  <input className={cx('news-input', className)} {...rest} />
);

export const NewsTextarea = ({ className = '', ...rest }) => (
  <textarea className={cx('news-textarea', className)} {...rest} />
);

export const NewsSelect = ({ className = '', children, ...rest }) => (
  <select className={cx('news-select', className)} {...rest}>
    {children}
  </select>
);

/* ─── Editorial primitives shared across newsroom-object pages ────────
   These wrap the canonical classes in src/index.css. Use them so per-page
   files stay short and the editorial vocabulary stays consistent. */

/* Broadsheet rule pair — 3px ink + 1px ink hairline below.
   The standard masthead/section bookend on paper pages. */
export const NewsRule = ({ tone = 'ink', className = '' }) => {
  const color = tone === 'oxblood' ? 'var(--color-oxblood)' : 'var(--color-ink)';
  return (
    <div className={cx('news-rule-pair', className)} style={{ '--rule-color': color }} aria-hidden="true">
      <hr />
      <hr />
    </div>
  );
};

/* Numbered form field — eyebrow label above, ink underline input below.
   Use with a child <input>, <textarea>, or <select> already styled by .f-row. */
export const NewsField = ({ no, label, children, className = '' }) => (
  <label className={cx('f-row', className)}>
    <span className="f-lbl">
      {no && <span className="no">№ {no}</span>}
      <span>{label}</span>
    </span>
    {children}
  </label>
);

/* Editorial button — just composes the .btn classes from index.css.
   Variants: 'filled' (default ink), 'ghost', 'mono'. */
export const NewsButton = ({
  children,
  variant = 'filled',
  className = '',
  ...rest
}) => {
  const variantClass = variant === 'ghost' ? 'btn ghost'
                     : variant === 'mono'  ? 'btn mono'
                     : 'btn';
  return (
    <button className={cx(variantClass, className)} {...rest}>
      {children}
    </button>
  );
};

/* Filed-at strip — the dateline format used on form headers, ledgers,
   and case desks. Pass a date string. */
export const NewsFiled = ({ label = 'Filed', date, time, className = '' }) => (
  <span className={cx('eyebrow sm', className)}>
    {label} · {date}{time && ` · ${time}`}
  </span>
);
