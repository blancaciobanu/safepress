import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, ArrowUpRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCrisis } from '../contexts/CrisisContext';
import {
  getLatestSecurityScore,
  getSetupProgress,
  getSpecialistVerificationState,
} from '../features/home/services/homeService';
import { buildPageModel, emphasis } from '../features/home/services/homePageModel';
import { useHomeData } from '../features/home/hooks/useHomeData';

const ease = [0.22, 1, 0.36, 1];
const fadeUp = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.9, ease },
};

const EMERGENCY_DISMISS_KEY = 'safepress:home:emergency-dismissed';

const formatMastheadDate = (value) => {
  try {
    return new Date(value).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
  } catch {
    return null;
  }
};

const formatShortDate = (value) => {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return null;
  }
};

// ── Presentational components ────────────────────────────────────────────────

const Marginalia = ({ folio, filed, inscription }) => (
  <div className="marginalia">
    {folio && <span className="folio">{folio}</span>}
    <span className="filed">{filed}</span>
    {inscription && <p className="inscription">{inscription}</p>}
  </div>
);

const RailInstrument = ({ instrument, index }) => (
  <motion.li
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.6, delay: index * 0.04, ease }}
    className="py-5 first:pt-0 last:pb-0"
  >
    <Link to={instrument.to} className="group block">
      <p className="caption uppercase tracking-[0.2em] text-[0.62rem] text-[color:var(--color-ink)]/65 group-hover:text-[color:var(--color-oxblood)] transition-colors">
        {instrument.kicker}
      </p>
      <h3 className="display-soft text-xl text-[color:var(--color-ink)] mt-2 group-hover:text-[color:var(--color-oxblood)] transition-colors leading-tight">
        {instrument.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
        {instrument.body}
      </p>
      <span className="mt-3 inline-flex items-center gap-1 caption uppercase tracking-[0.18em] text-[0.65rem] text-[color:var(--color-ink)]/85 group-hover:text-[color:var(--color-oxblood)] transition-colors whitespace-nowrap">
        {instrument.cta}
        <ArrowRight className="w-3 h-3" />
      </span>
    </Link>
  </motion.li>
);

const SidebarStat = ({ label, value, detail, tone }) => (
  <li className="py-5 first:pt-0 last:pb-0">
    <p className="eyebrow text-[color:var(--color-smoke)] text-[0.62rem]">{label}</p>
    <p className="display-soft num mt-2 text-3xl md:text-[2rem]" style={{ color: tone || 'var(--color-ink)' }}>
      {value}
    </p>
    <p className="mt-2 text-sm leading-snug text-[color:var(--color-smoke)]">
      {detail}
    </p>
  </li>
);

const CompactFieldSignal = ({ label, title, excerpt, href, meta, external = false, actionLabel = 'Read more' }) => {
  const Wrapper = external ? 'a' : Link;
  const props = external
    ? { href, target: '_blank', rel: 'noreferrer' }
    : { to: href };

  return (
    <Wrapper {...props} className="group block py-5 first:pt-0 last:pb-0">
      <p className="caption uppercase tracking-[0.2em] text-[0.62rem] text-[color:var(--color-ink)]/65 group-hover:text-[color:var(--color-oxblood)] transition-colors">
        {label}
      </p>
      <h4 className="display-soft mt-2 text-lg text-[color:var(--color-ink)] group-hover:text-[color:var(--color-oxblood)] transition-colors leading-tight">
        {title}
      </h4>
      <p className="mt-2 text-sm leading-snug text-[color:var(--color-ink-soft)]">
        {excerpt}
      </p>
      {meta && (
        <p className="mt-2 caption uppercase tracking-[0.18em] text-[0.6rem] text-[color:var(--color-smoke)]">
          {meta}
        </p>
      )}
      <span className="mt-3 inline-flex items-center gap-1 caption uppercase tracking-[0.18em] text-[0.65rem] text-[color:var(--color-ink)]/85 group-hover:text-[color:var(--color-oxblood)] transition-colors whitespace-nowrap">
        {actionLabel}
        <ArrowUpRight className="w-3 h-3" />
      </span>
    </Wrapper>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────

const Home = () => {
  const { user } = useAuth();
  const { openOverlay } = useCrisis();
  const [emergencyDismissed, setEmergencyDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem(EMERGENCY_DISMISS_KEY) === '1';
  });

  const { fieldSignals, journalistSnapshot, specialistStats } = useHomeData(user);

  const latestScore = getLatestSecurityScore(user);
  const setupProgress = getSetupProgress(user);
  const verificationState = getSpecialistVerificationState(user);

  const dismissEmergency = () => {
    setEmergencyDismissed(true);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(EMERGENCY_DISMISS_KEY, '1');
    }
  };

  const pageModel = useMemo(() => buildPageModel({
    user,
    verificationState,
    latestScore,
    setupProgress,
    journalistSnapshot,
    specialistStats,
  }), [user, verificationState, latestScore, setupProgress, journalistSnapshot, specialistStats]);

  const externalSignal = fieldSignals.externalAdvisory || {
    label: 'from public advisories',
    title: 'Public advisories will rotate in here.',
    excerpt: 'If the live feed is quiet or unavailable, go straight to the field manual and crisis mode rather than waiting on this block.',
    href: '/resources',
    source: 'SafePress fallback',
    publishedAt: null,
  };

  const internalSignal = fieldSignals.internalSignal || {
    label: 'recent community signal',
    title: 'The public discussion feed is quiet right now.',
    excerpt: 'When a new public question or discussion appears in the community, it will surface here instead of leaving this page as pure brochure work.',
    href: '/community',
    meta: 'Public discussion',
  };

  const heroHeadingNode = pageModel.hero?.headingNode || pageModel.headingNode;
  const heroLede        = pageModel.hero?.lede        || pageModel.lede;
  const heroLedeBody    = pageModel.hero?.ledeBody    || pageModel.ledeBody;
  const mastheadDateline = formatMastheadDate(new Date());

  return (
    <div className="surface-paper -mt-20 pt-20 min-h-screen text-[color:var(--color-ink-soft)]">

      {/* ─── §01  Front page (broadsheet) ─────────────────────────────── */}
      <section className="pt-6 md:pt-10 pb-16 md:pb-20">
        <div className="max-w-[1400px] mx-auto">

          {/* Broadsheet masthead */}
          <motion.header
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease }}
            className="broadsheet-masthead"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-y-2 pt-3 pb-3">
              <span className="caption uppercase tracking-[0.22em] text-[color:var(--color-smoke)] text-[0.65rem] md:text-[0.7rem]">
                {mastheadDateline || 'Monday, May 11, 2026'}
              </span>
              <span className="caption uppercase tracking-[0.22em] text-[color:var(--color-smoke)] text-[0.65rem] md:text-[0.7rem]">
                Vol. I &nbsp;·&nbsp; № 01
              </span>
            </div>
          </motion.header>

          {/* Emergency rail — dismissible */}
          <AnimatePresence initial={false}>
            {!emergencyDismissed && (
              <motion.div
                key="emergency-rail"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, height: 0, marginTop: 0 }}
                transition={{ duration: 0.4, ease }}
                className="mt-8 md:mt-10 bg-[color:var(--color-ink)] text-[color:var(--color-paper)] rounded-[1rem] px-5 py-4 md:px-7 md:py-5 grid md:grid-cols-12 gap-4 md:gap-8 items-center"
              >
                <div className="md:col-span-2 flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-[color:var(--color-brass-soft)]" />
                  <span className="eyebrow text-[color:var(--color-paper-dim)]">Emergency rail</span>
                </div>
                <div className="md:col-span-7">
                  <p className="display-soft text-[color:var(--color-paper)] text-xl md:text-[1.75rem] leading-tight max-w-[34ch]">
                    Source exposed? Account compromised? Go straight to crisis mode.
                  </p>
                  <p className="mt-2 md:mt-3 text-sm leading-relaxed text-[color:var(--color-paper-dim)] max-w-[42rem]">
                    Four scenario protocols, written for the first ten minutes and kept available without an account.
                  </p>
                </div>
                <div className="md:col-span-3 flex md:flex-col md:items-end md:justify-between gap-3 md:gap-2">
                  <button
                    onClick={openOverlay}
                    className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-[color:var(--color-paper)]/20 text-[color:var(--color-paper)] hover:bg-[color:var(--color-paper)]/8 transition-colors whitespace-nowrap"
                  >
                    <span className="display-soft text-base">Open crisis mode</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                  <button
                    onClick={dismissEmergency}
                    className="caption uppercase tracking-[0.18em] text-[color:var(--color-paper-dim)]/65 hover:text-[color:var(--color-paper)] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                    aria-label="Dismiss emergency rail"
                  >
                    <X className="w-3 h-3" /> Not in crisis
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lead headline — full width */}
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.15, ease }}
            className="display text-[color:var(--color-ink)] mt-12 md:mt-16 text-[2.5rem] sm:text-5xl md:text-7xl lg:text-[6.25rem] xl:text-[7.25rem] max-w-[22ch] leading-[0.96] tracking-[-0.015em]"
          >
            {heroHeadingNode}
            {!user && <span className="ink-caret" aria-hidden="true" />}
          </motion.h1>

          {/* Broadsheet body: rail | center lead | sidebar */}
          <div className="mt-10 md:mt-14 grid md:grid-cols-12 gap-y-12 gap-x-0 md:border-t md:border-[color:var(--color-ink)]/25">

            {/* LEFT — instruments rail */}
            <motion.aside
              {...fadeUp}
              className="md:col-span-3 md:order-1 order-2 md:border-r md:border-[color:var(--color-ink)]/15 md:pr-6 lg:pr-8 md:pt-7"
            >
              <p className="caption uppercase tracking-[0.22em] text-[color:var(--color-smoke)] text-[0.65rem] pb-3 border-b border-[color:var(--color-ink)]/25">
                The instruments
              </p>
              <ol className="mt-2 divide-y divide-[color:var(--color-ink)]/15">
                {pageModel.instruments.map((instrument, index) => (
                  <RailInstrument key={instrument.title} instrument={instrument} index={index} />
                ))}
              </ol>
            </motion.aside>

            {/* CENTER — lead column */}
            <div className="md:col-span-6 md:order-2 order-1 md:px-6 lg:px-8 md:pt-7">
              <motion.figure
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.9, ease }}
              >
                <div className="halftone-placeholder" />
                <figcaption className="mt-3 leading-snug text-sm text-[color:var(--color-smoke)] italic">
                  <span className="not-italic caption uppercase tracking-[0.22em] text-[color:var(--color-ink)]/75 text-[0.65rem] mr-2">
                    Photo
                  </span>
                  A reporter&apos;s desk in the quiet before filing.
                </figcaption>
              </motion.figure>

              <motion.div
                {...fadeUp}
                className="broadsheet-columns mt-8 md:mt-10 text-base leading-relaxed text-[color:var(--color-ink-soft)]"
              >
                <p>{heroLede}</p>
                {heroLedeBody ? <p>{heroLedeBody}</p> : null}
              </motion.div>

              {user ? (
                <motion.div
                  {...fadeUp}
                  className="mt-8 md:mt-10 pt-7 border-t border-[color:var(--color-ink)]/25"
                >
                  <p className="eyebrow text-[color:var(--color-smoke)]">{pageModel.activity.label}</p>
                  <p className="display-soft mt-2 text-xl md:text-2xl text-[color:var(--color-ink)] leading-snug max-w-[34ch]">
                    {pageModel.activity.title}
                  </p>
                  <p className="mt-3 text-sm md:text-base leading-relaxed text-[color:var(--color-smoke)] max-w-[42rem]">
                    {pageModel.activity.detail}
                  </p>
                  {pageModel.nextAction && (
                    <Link to={pageModel.nextAction.to} className="mt-5 link-newsprint">
                      {pageModel.nextAction.label}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  {...fadeUp}
                  className="mt-8 md:mt-10 pt-7 border-t border-[color:var(--color-ink)]/25 flex flex-wrap items-baseline gap-x-8 gap-y-3"
                >
                  {pageModel.hero.actions.map((action) => (
                    <Link
                      key={action.label}
                      to={action.to}
                      className="link-newsprint"
                    >
                      {action.label}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ))}
                </motion.div>
              )}
            </div>

            {/* RIGHT — sidebar */}
            <motion.aside
              {...fadeUp}
              className="md:col-span-3 md:order-3 order-3 md:border-l md:border-[color:var(--color-ink)]/15 md:pl-6 lg:pl-8 md:pt-7"
            >
              <div>
                <p className="caption uppercase tracking-[0.22em] text-[color:var(--color-smoke)] text-[0.65rem] pb-3 border-b border-[color:var(--color-ink)]/25">
                  By the numbers
                </p>
                <ul className="mt-2 divide-y divide-[color:var(--color-ink)]/15">
                  {pageModel.metrics.map((metric) => (
                    <SidebarStat
                      key={metric.label}
                      label={metric.label}
                      value={metric.value}
                      detail={metric.detail}
                      tone={metric.tone}
                    />
                  ))}
                </ul>
              </div>

              <div className="mt-10 pt-7 border-t border-[color:var(--color-ink)]/25">
                <p className="caption uppercase tracking-[0.22em] text-[color:var(--color-smoke)] text-[0.65rem] pb-3 border-b border-[color:var(--color-ink)]/25">
                  From the field
                </p>
                <div className="mt-2 divide-y divide-[color:var(--color-ink)]/15">
                  <CompactFieldSignal
                    label={externalSignal.label}
                    title={externalSignal.title}
                    excerpt={externalSignal.excerpt}
                    href={externalSignal.href}
                    meta={[
                      externalSignal.source,
                      externalSignal.publishedAt ? formatShortDate(externalSignal.publishedAt) : null,
                      fieldSignals.loading ? 'updating' : null,
                    ].filter(Boolean).join(' · ')}
                    external={externalSignal.href?.startsWith('http')}
                    actionLabel="Read advisory"
                  />
                  <CompactFieldSignal
                    label={internalSignal.label}
                    title={internalSignal.title}
                    excerpt={internalSignal.excerpt}
                    href={internalSignal.href}
                    meta={[
                      internalSignal.meta,
                      fieldSignals.loading ? 'updating' : null,
                    ].filter(Boolean).join(' · ')}
                    actionLabel="Open community"
                  />
                </div>
              </div>
            </motion.aside>

          </div>
        </div>
      </section>

      {/* ─── Continue ──────────────────────────────────────────────────── */}
      <section className="-mx-6 md:-mx-10 lg:-mx-14 px-6 md:px-10 lg:px-14 pt-16 md:pt-24 pb-16 md:pb-20 bg-[color:var(--color-ink)] text-[color:var(--color-paper)]">
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-12 gap-8 md:gap-10">

          <motion.div {...fadeUp} className="md:col-span-3">
            <div style={{ '--color-oxblood': '#A6873E', '--color-smoke': 'rgba(244, 239, 230, 0.55)', '--color-ink-soft': 'rgba(244, 239, 230, 0.85)' }}>
              <Marginalia
                filed="Continue"
                inscription="The front page should orient you, then send you back into the work without more theatre."
              />
            </div>
          </motion.div>

          <motion.div {...fadeUp} className="md:col-span-9">
            <p className="display text-[color:var(--color-paper)] text-4xl md:text-5xl lg:text-6xl max-w-[16ch] leading-[0.98]">
              {pageModel.closing.heading}
            </p>
            <p className="mt-6 text-base md:text-lg leading-relaxed text-[color:var(--color-paper-dim)] max-w-[42rem]">
              {pageModel.closing.lead}
            </p>
            <Link
              to={pageModel.closing.to}
              className="link-newsprint-dark mt-10"
            >
              {pageModel.closing.label}
              <ArrowRight className="w-4 h-4 self-center" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
