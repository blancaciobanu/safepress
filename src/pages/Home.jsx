import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCrisis } from '../contexts/CrisisContext';
import {
  getApprovedSpecialistHomeStats,
  getExternalFieldSignal,
  getInternalFieldSignal,
  getJournalistHomeSupportSnapshot,
  getLatestSecurityScore,
  getSetupProgress,
  getSpecialistVerificationState,
  getSupportStatusLabel,
} from '../features/home/services/homeService';
import { logError } from '../utils/logger';

const VISITOR_INSTRUMENTS = [
  {
    kicker: '01 — Assessment',
    title: 'Security score.',
    body: 'Thirty-one questions across six risk areas. Open access; no account.',
    to: '/security-score',
    cta: 'Take the score',
  },
  {
    kicker: '02 — Playbook',
    title: 'Source protection.',
    body: 'First contact, safer meetings, compartmentalisation, and publication discipline.',
    to: '/source-protection',
    cta: 'Read playbook',
  },
  {
    kicker: '03 — Reference',
    title: 'OS guides & tools.',
    body: 'Platform-specific hardening guides for the kit you already use in the field.',
    to: '/resources',
    cta: 'Open library',
  },
  {
    kicker: '04 — Discussion',
    title: 'Community.',
    body: 'Public field notes and open questions from journalists under similar pressure.',
    to: '/community',
    cta: 'Read threads',
  },
];

const JOURNALIST_INSTRUMENTS = [
  {
    kicker: '01 — Baseline',
    title: 'Security score.',
    body: 'Latest assessment, weakest categories, and the way back into hardening work.',
    to: '/security-score',
    cta: 'Open score',
  },
  {
    kicker: '02 — Checklist',
    title: 'Secure setup.',
    body: 'Practical hardening across passwords, devices, comms, and data.',
    to: '/secure-setup',
    cta: 'Continue setup',
  },
  {
    kicker: '03 — Playbook',
    title: 'Source protection.',
    body: 'First contact, safer meetings, and publication discipline for higher-risk work.',
    to: '/source-protection',
    cta: 'Read playbook',
  },
  {
    kicker: '04 — Reference',
    title: 'OS guides & tools.',
    body: 'Platform-specific hardening guides and curated, field-ready picks.',
    to: '/resources',
    cta: 'Open library',
  },
  {
    kicker: '05 — Discussion',
    title: 'Community.',
    body: 'Public field notes and open questions from peers facing similar pressure.',
    to: '/community',
    cta: 'Read threads',
  },
  {
    kicker: '06 — Direct help',
    title: 'Specialist support.',
    body: 'File a request when the situation needs hands-on intervention.',
    to: '/request-support',
    cta: 'File a request',
  },
];

const SPECIALIST_INSTRUMENTS = [
  {
    kicker: '01 — The desk',
    title: 'Specialist dashboard.',
    body: 'Queue review, claim flow, and case resolution — where the casework lives.',
    to: '/specialist-dashboard',
    cta: 'Open desk',
  },
  {
    kicker: '02 — Discussion',
    title: 'Community.',
    body: 'Stay close to the questions reporters are surfacing publicly.',
    to: '/community',
    cta: 'Read threads',
  },
  {
    kicker: '03 — Playbook',
    title: 'Source protection.',
    body: 'Operational guidance journalists are pointed to across higher-risk reporting.',
    to: '/source-protection',
    cta: 'Review playbook',
  },
  {
    kicker: '04 — Reference',
    title: 'OS guides & tools.',
    body: 'Keep recommendations current with platform-specific hardening references.',
    to: '/resources',
    cta: 'Open library',
  },
  {
    kicker: '05 — Account',
    title: 'Settings.',
    body: 'Profile, verification state, and account details.',
    to: '/settings',
    cta: 'Open settings',
  },
];

const ease = [0.22, 1, 0.36, 1];
const fadeUp = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.9, ease },
};

const EMERGENCY_DISMISS_KEY = 'safepress:home:emergency-dismissed';

const SCORE_TONES = {
  strong: 'var(--color-ink)',
  moderate: 'var(--color-brass)',
  fragile: 'var(--color-oxblood)',
};

const getScoreBand = (score) => {
  if (score >= 80) return { label: 'strong', tone: SCORE_TONES.strong };
  if (score >= 60) return { label: 'moderate', tone: SCORE_TONES.moderate };
  return { label: 'fragile', tone: SCORE_TONES.fragile };
};

const getCrisisLabel = (type) => {
  if (type === 'hacked') return 'hacked account';
  if (type === 'source') return 'source exposure';
  if (type === 'doxxed') return 'doxxing incident';
  if (type === 'phishing') return 'phishing attempt';
  return 'security concern';
};

const formatShortDate = (value) => {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return null;
  }
};

const formatMastheadDate = (value) => {
  try {
    return new Date(value).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return null;
  }
};

const getFirstName = (user) => {
  if (!user) return '';
  if (user.displayName) {
    const trimmed = user.displayName.trim();
    if (trimmed) return trimmed.split(/\s+/)[0];
  }
  if (user.email) {
    const local = user.email.split('@')[0];
    if (local) return local;
  }
  return 'colleague';
};

const emphasis = (text) => (
  <em className="italic" style={{ color: 'var(--color-oxblood)' }}>{text}</em>
);

const buildJournalistBrief = ({ user, latestScore, setupProgress, latestRequest, loading }) => {
  const scoreBand = latestScore ? getScoreBand(latestScore.score) : null;
  const supportValue = loading
    ? 'updating'
    : latestRequest
      ? getSupportStatusLabel(latestRequest.status)
      : 'none active';

  let nextAction = {
    label: 'Turn to your desk',
    to: '/dashboard',
    note: 'See the fuller breakdown without leaving the front page blind.',
  };

  if (!user.emailVerified) {
    nextAction = {
      label: 'Verify your email',
      to: '/settings',
      note: 'Verification keeps account recovery and support workflows cleaner.',
    };
  } else if (!latestScore) {
    nextAction = {
      label: 'Take the assessment',
      to: '/security-score',
      note: 'Start with the score before you decide where to spend effort.',
    };
  } else if (setupProgress.percent < 100) {
    nextAction = {
      label: 'Continue secure setup',
      to: '/secure-setup',
      note: 'The checklist is still the fastest route to a safer working baseline.',
    };
  } else if (latestRequest && latestRequest.status !== 'resolved') {
    nextAction = {
      label: 'Review support status',
      to: '/dashboard',
      note: 'Keep the case close until it is resolved.',
    };
  } else if (latestRequest?.status === 'resolved' && !latestRequest.feedback) {
    nextAction = {
      label: 'Leave specialist feedback',
      to: '/dashboard',
      note: 'Close the loop while the support case is still fresh.',
    };
  } else if (latestScore.score < 70) {
    nextAction = {
      label: 'Review your weakest areas',
      to: '/dashboard',
      note: 'Use the dashboard recommendations to raise the riskiest categories first.',
    };
  } else {
    nextAction = {
      label: 'Refresh the playbook',
      to: '/source-protection',
      note: 'Good posture still needs routine maintenance and better source habits.',
    };
  }

  let activity = {
    label: 'Current signal',
    title: 'Nothing urgent is active right now.',
    detail: 'Use the quieter moment to move the checklist forward before the next rough assignment.',
  };

  if (!user.emailVerified) {
    activity = {
      label: 'Current signal',
      title: 'Your email still needs verification.',
      detail: 'That keeps some account and support flows at arm\u2019s length until you confirm it.',
    };
  } else if (latestRequest) {
    const filedDate = formatShortDate(latestRequest.createdAt);
    activity = {
      label: 'Support status',
      title: `${getSupportStatusLabel(latestRequest.status)} for ${getCrisisLabel(latestRequest.crisisType)}.`,
      detail: filedDate
        ? `Filed ${filedDate}. Only your own request status appears here; the fuller case detail stays inside the support workflow.`
        : 'Only your own request status appears here; the fuller case detail stays inside the support workflow.',
    };
  } else if (!latestScore) {
    activity = {
      label: 'Current signal',
      title: 'You do not have a baseline score yet.',
      detail: 'Without that first pass, the rest of the toolset stays more general than it needs to be.',
    };
  } else if (setupProgress.percent < 100) {
    activity = {
      label: 'Current signal',
      title: `${setupProgress.completed} of ${setupProgress.total} setup tasks are done.`,
      detail: 'That still leaves practical hardening work between your current score and a steadier routine.',
    };
  }

  const firstName = getFirstName(user);

  return {
    heading: `Today's brief, ${firstName}.`,
    headingNode: (
      <>
        Today&apos;s brief, {emphasis(firstName)}.
      </>
    ),
    lede: 'Home reads your current score, setup progress, and support state so the next move is obvious without turning this page into a second dashboard. The toolkit you actually reach for is running down the left rail; the figures describing your posture are on the right; the activity callout below this paragraph names the next sensible step.',
    ledeBody: 'No account theatre, no extra clicks. The front page reflects where you stand, points at the next action, and steps aside while you do the work. Crisis access stays visible up top in case the assignment turns sharp. The dashboard remains where the full breakdown lives — this page only briefs you on it.',
    metrics: [
      {
        label: 'Latest score',
        value: latestScore ? `${latestScore.score}/100` : 'not started',
        detail: latestScore ? `${scoreBand.label} posture` : '31 questions across six risk areas',
        tone: latestScore ? scoreBand.tone : 'var(--color-ink)',
      },
      {
        label: 'Setup progress',
        value: `${setupProgress.percent}%`,
        detail: `${setupProgress.completed} of ${setupProgress.total} tasks complete`,
        tone: 'var(--color-ink)',
      },
      {
        label: 'Support status',
        value: supportValue,
        detail: latestRequest ? getCrisisLabel(latestRequest.crisisType) : 'private case state only appears for your own requests',
        tone: latestRequest?.status === 'open'
          ? 'var(--color-brass)'
          : latestRequest?.status === 'claimed'
            ? 'var(--color-ink)'
            : latestRequest?.status === 'resolved'
              ? 'var(--color-oxblood)'
              : 'var(--color-ink)',
      },
    ],
    nextAction,
    activity,
    instruments: JOURNALIST_INSTRUMENTS,
    closing: {
      heading: 'Keep the routine close.',
      lead: 'A better front page is only useful if it sends you back to work faster.',
      to: '/dashboard',
      label: 'Turn to your desk',
    },
  };
};

const buildApprovedSpecialistBrief = ({ stats, loading }) => {
  const openCount = loading ? '...' : `${stats.openCount}`;
  const claimedCount = loading ? '...' : `${stats.claimedCount}`;
  const resolvedCount = loading ? '...' : `${stats.resolvedCount}`;

  let nextAction = {
    label: 'Turn to the specialist desk',
    to: '/specialist-dashboard',
    note: 'The detailed queue and case workflow still belongs in the specialist desk.',
  };

  if (!loading && stats.claimedCount > 0) {
    nextAction = {
      label: 'Return to active cases',
      to: '/specialist-dashboard',
      note: 'Your active work is waiting there, with full case detail.',
    };
  } else if (!loading && stats.openCount > 0) {
    nextAction = {
      label: 'Review open queue',
      to: '/specialist-dashboard',
      note: 'Claiming a request is what unlocks the private details for that case.',
    };
  }

  let activity = {
    label: 'Queue signal',
    title: 'Updating the queue snapshot.',
    detail: 'Home keeps this to counts only. The fuller casework stays in the specialist dashboard.',
  };

  if (!loading && stats.openCount > 0) {
    activity = {
      label: 'Queue signal',
      title: `${stats.openCount} request${stats.openCount === 1 ? '' : 's'} waiting in the redacted queue.`,
      detail: 'Confidential case details remain hidden until a specialist claims the request.',
    };
  } else if (!loading && stats.claimedCount > 0) {
    activity = {
      label: 'Queue signal',
      title: `${stats.claimedCount} active case${stats.claimedCount === 1 ? '' : 's'} currently assigned to you.`,
      detail: 'Use the specialist dashboard for the ongoing casework and contact detail.',
    };
  } else if (!loading) {
    activity = {
      label: 'Queue signal',
      title: 'The queue is quiet right now.',
      detail: 'Community, resources, and source-protection material stay useful while you wait for new work.',
    };
  }

  return {
    heading: 'Today on the desk.',
    headingNode: (
      <>
        Today on {emphasis('the desk.')}
      </>
    ),
    lede: 'Home keeps the summary light: open queue, active cases, resolved work, and one next move back into the specialist workflow. The casework itself still happens inside the specialist dashboard. This page is only the front-page brief — the counts and the way back in.',
    ledeBody: 'The instruments running down the left are the supporting tools you reach for when the queue is quiet: community, source-protection guidance, OS guides, account. The figures on the right name the state of your queue right now. The activity callout below this paragraph names the next sensible move into the work.',
    metrics: [
      {
        label: 'Open queue',
        value: openCount,
        detail: 'redacted until claimed',
        tone: 'var(--color-ink)',
      },
      {
        label: 'Active cases',
        value: claimedCount,
        detail: 'currently assigned',
        tone: 'var(--color-ink)',
      },
      {
        label: 'Resolved',
        value: resolvedCount,
        detail: 'completed with you attached',
        tone: 'var(--color-ink)',
      },
    ],
    nextAction,
    activity,
    instruments: SPECIALIST_INSTRUMENTS,
    closing: {
      heading: 'Stay current, then go back to work.',
      lead: 'The dashboard is still the real workspace. Home is only the front page summary.',
      to: '/specialist-dashboard',
      label: 'Turn to the specialist desk',
    },
  };
};

const buildPendingSpecialistBrief = ({ verificationState, emailVerified }) => {
  const stateMap = {
    'pending-email-verification': {
      heading: 'Your verification cannot move until your email is confirmed.',
      lede: 'Until the address is confirmed, the specialist workflow stays paused and queue access remains locked.',
      status: 'email verification pending',
      detail: 'Confirm the address on your account before the review process can continue.',
      nextAction: {
        label: 'Verify your email',
        to: '/settings',
        note: 'That is the only blocker worth acting on first.',
      },
      activity: {
        label: 'Current signal',
        title: 'Your specialist application is paused at email verification.',
        detail: 'Until that changes, the support queue remains unavailable from Home and from the specialist workflow.',
      },
    },
    pending: {
      heading: 'Your application is in review. The queue stays locked until approval is granted.',
      lede: 'Your application is in review. The queue stays locked until approval is granted.',
      status: 'under review',
      detail: 'Queue access stays locked until approval is granted.',
      nextAction: {
        label: 'Check specialist status',
        to: '/specialist-dashboard',
        note: 'The specialist dashboard already holds the fuller status and reapply path if needed.',
      },
      activity: {
        label: 'Current signal',
        title: 'Your application is waiting on review.',
        detail: 'There is nothing operational to do with the support queue yet, so use the supporting tools while you wait.',
      },
    },
    rejected: {
      heading: 'Your verification needs revision. Review the decision and reapply from the specialist workflow.',
      lede: 'Review the decision, revise the application, and reapply from the specialist workflow.',
      status: 'revision needed',
      detail: 'Review the rejection notes and reapply from the specialist workflow.',
      nextAction: {
        label: 'Review and reapply',
        to: '/specialist-dashboard',
        note: 'That is where the verification notes and reapply action already live.',
      },
      activity: {
        label: 'Current signal',
        title: 'Your previous verification attempt was not approved.',
        detail: 'The specialist dashboard is still the right place to review the decision and submit a cleaner application.',
      },
    },
  };

  const current = stateMap[verificationState] || stateMap.pending;

  return {
    heading: 'Your verification is reading.',
    headingNode: (
      <>
        Your verification is {emphasis('reading.')}
      </>
    ),
    lede: `${current.lede} Home keeps the state legible on the front page — verification status, email confirmation, and queue access — and points back into the specialist workflow when there is something to act on.`,
    ledeBody: `${current.heading} The instruments running down the left rail stay available while you wait — community discussion, source-protection guidance, and the OS guides. None of them depend on queue access, and they keep the time before approval useful rather than idle.`,
    metrics: [
      {
        label: 'Verification',
        value: current.status,
        detail: current.detail,
        tone: verificationState === 'rejected' ? 'var(--color-oxblood)' : 'var(--color-ink)',
      },
      {
        label: 'Email',
        value: emailVerified ? 'verified' : 'unverified',
        detail: emailVerified ? 'account confirmation complete' : 'required before queue access',
        tone: emailVerified ? 'var(--color-ink)' : 'var(--color-brass)',
      },
      {
        label: 'Queue access',
        value: 'locked',
        detail: 'specialist access only unlocks after approval',
        tone: 'var(--color-ink)',
      },
    ],
    nextAction: current.nextAction,
    activity: current.activity,
    instruments: SPECIALIST_INSTRUMENTS,
    closing: {
      heading: 'Keep the rest of the toolkit close while you wait.',
      lead: 'Resources, community, and source-protection guidance still matter before specialist approval is final.',
      to: current.nextAction.to,
      label: current.nextAction.label,
    },
  };
};

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

const Home = () => {
  const { user } = useAuth();
  const { openOverlay } = useCrisis();
  const [emergencyDismissed, setEmergencyDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem(EMERGENCY_DISMISS_KEY) === '1';
  });
  const [fieldSignals, setFieldSignals] = useState({
    externalAdvisory: null,
    internalSignal: null,
    loading: true,
  });
  const [journalistSnapshot, setJournalistSnapshot] = useState({
    loading: false,
    latestRequest: null,
  });
  const [specialistStats, setSpecialistStats] = useState({
    loading: false,
    openCount: 0,
    claimedCount: 0,
    resolvedCount: 0,
  });

  const latestScore = getLatestSecurityScore(user);
  const setupProgress = getSetupProgress(user);
  const verificationState = getSpecialistVerificationState(user);

  const dismissEmergency = () => {
    setEmergencyDismissed(true);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(EMERGENCY_DISMISS_KEY, '1');
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadFieldSignals = async () => {
      setFieldSignals((current) => ({ ...current, loading: true }));
      const [externalResult, internalResult] = await Promise.allSettled([
        getExternalFieldSignal(),
        getInternalFieldSignal(),
      ]);

      if (cancelled) return;

      if (externalResult.status === 'rejected') {
        logError('Failed to load external Home advisory:', externalResult.reason);
      }
      if (internalResult.status === 'rejected') {
        logError('Failed to load internal Home signal:', internalResult.reason);
      }

      setFieldSignals({
        externalAdvisory: externalResult.status === 'fulfilled' ? externalResult.value : null,
        internalSignal: internalResult.status === 'fulfilled' ? internalResult.value : null,
        loading: false,
      });
    };

    loadFieldSignals();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const resetJournalist = () => {
      setJournalistSnapshot({
        loading: false,
        latestRequest: null,
      });
    };

    const resetSpecialist = () => {
      setSpecialistStats({
        loading: false,
        openCount: 0,
        claimedCount: 0,
        resolvedCount: 0,
      });
    };

    if (!user) {
      resetJournalist();
      resetSpecialist();
      return undefined;
    }

    if (user.accountType === 'specialist') {
      resetJournalist();

      if (verificationState !== 'approved') {
        resetSpecialist();
        return undefined;
      }

      const loadSpecialistStats = async () => {
        setSpecialistStats((current) => ({ ...current, loading: true }));
        try {
          const stats = await getApprovedSpecialistHomeStats(user.uid);
          if (cancelled) return;
          setSpecialistStats({
            loading: false,
            ...stats,
          });
        } catch (error) {
          if (!cancelled) {
            logError('Failed to load specialist Home stats:', error);
            resetSpecialist();
          }
        }
      };

      loadSpecialistStats();
      return () => {
        cancelled = true;
      };
    }

    resetSpecialist();

    const loadJournalistSnapshot = async () => {
      setJournalistSnapshot((current) => ({ ...current, loading: true }));
      try {
        const snapshot = await getJournalistHomeSupportSnapshot(user.uid);
        if (cancelled) return;
        setJournalistSnapshot({
          loading: false,
          latestRequest: snapshot.latestRequest,
        });
      } catch (error) {
        if (!cancelled) {
          logError('Failed to load journalist Home support state:', error);
          resetJournalist();
        }
      }
    };

    loadJournalistSnapshot();

    return () => {
      cancelled = true;
    };
  }, [user, verificationState]);

  const pageModel = useMemo(() => {
    if (!user) {
      return {
        hero: {
          heading: 'Journalism is as safe as the journalist.',
          headingNode: (
            <>
              Journalism is as safe as {emphasis('the journalist.')}
            </>
          ),
          lede: 'An editorial brief for journalists working under pressure. Assessment first, crisis access always visible, the rest of the toolkit close. The front page is meant to be read at a glance — masthead at the top, instruments running down the left, the lead in the middle, figures and field signals on the right.',
          ledeBody: 'No account is needed to read the crisis protocols, take the score, or browse the resource library. Crisis protocols sit on every page — four scenarios written for the first ten minutes after something goes wrong. The slower posture work, and the community feed, wait one column away until you decide they are the right tool for the moment.',
          actions: [
            { label: 'Take the security score', to: '/security-score' },
            { label: 'Browse the resource library', to: '/resources' },
          ],
        },
        metrics: [
          {
            label: 'Score questions',
            value: '31',
            detail: 'six risk areas, about five minutes',
            tone: 'var(--color-ink)',
          },
          {
            label: 'Crisis protocols',
            value: '4',
            detail: 'hacked, source exposed, doxxed, phishing',
            tone: 'var(--color-ink)',
          },
          {
            label: 'Access',
            value: 'open',
            detail: 'protocols, score, and library need no account',
            tone: 'var(--color-ink)',
          },
        ],
        instruments: VISITOR_INSTRUMENTS,
        closing: {
          heading: 'Five minutes. No account.',
          lead: 'The assessment stays open, the crisis protocols stay visible, and the rest of the toolkit waits until you need it.',
          to: '/security-score',
          label: 'Turn to the assessment',
        },
      };
    }

    if (user.accountType === 'specialist') {
      if (verificationState === 'approved') {
        return buildApprovedSpecialistBrief({
          stats: specialistStats,
          loading: specialistStats.loading,
        });
      }

      return buildPendingSpecialistBrief({
        verificationState,
        emailVerified: user.emailVerified,
      });
    }

    return buildJournalistBrief({
      user,
      latestScore,
      setupProgress,
      latestRequest: journalistSnapshot.latestRequest,
      loading: journalistSnapshot.loading,
    });
  }, [
    journalistSnapshot.latestRequest,
    journalistSnapshot.loading,
    latestScore,
    setupProgress,
    specialistStats,
    user,
    verificationState,
  ]);

  const externalSignal = fieldSignals.externalAdvisory || {
    label: 'from public advisories',
    title: 'Public advisories will rotate in here.',
    excerpt: 'If the live feed is quiet or unavailable, go straight to the resource library and crisis mode rather than waiting on this block.',
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

  const heroHeading = pageModel.hero?.heading || pageModel.heading;
  const heroHeadingNode = pageModel.hero?.headingNode || pageModel.headingNode;
  const heroLede = pageModel.hero?.lede || pageModel.lede;
  const heroLedeBody = pageModel.hero?.ledeBody || pageModel.ledeBody;
  const mastheadDateline = formatMastheadDate(new Date());

  return (
    <div className="surface-paper -mt-20 pt-20 min-h-screen text-[color:var(--color-ink-soft)]">

      {/* ─── §01  Front page (broadsheet) ─────────────────────────────── */}
      <section className="px-6 md:px-10 lg:px-14 pt-6 md:pt-10 pb-16 md:pb-20">
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
            {heroHeadingNode || heroHeading}
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
      <section className="px-6 md:px-10 lg:px-14 pt-16 md:pt-24 pb-16 md:pb-20 bg-[color:var(--color-ink)] text-[color:var(--color-paper)]">
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
