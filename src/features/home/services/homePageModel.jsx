import { getSupportStatusLabel } from './homeService';

// ── Instrument rail data ─────────────────────────────────────────────────────

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
    title: 'Source protection guide.',
    body: 'First contact, safer meetings, compartmentalisation, and publication discipline inside the field manual.',
    to: '/resources?tab=source-protection',
    cta: 'Open guide',
  },
  {
    kicker: '03 — Reference',
    title: 'OS guides & tools.',
    body: 'Platform hardening, source guidance, and vetted tools in one desk.',
    to: '/resources',
    cta: 'Open manual',
  },
  {
    kicker: '04 — Training',
    title: 'Simulations.',
    body: 'Practice phishing, source-contact, and border-search decisions before the real thing.',
    to: '/simulations',
    cta: 'Run drills',
  },
  {
    kicker: '05 — Discussion',
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
    title: 'Source protection guide.',
    body: 'First contact, safer meetings, and publication discipline for higher-risk work, now inside the field manual.',
    to: '/resources?tab=source-protection',
    cta: 'Open guide',
  },
  {
    kicker: '04 — Reference',
    title: 'OS guides & tools.',
    body: 'Platform hardening, source guidance, and curated field-ready picks.',
    to: '/resources',
    cta: 'Open manual',
  },
  {
    kicker: '05 — Discussion',
    title: 'Simulations.',
    body: 'Scenario drills for phishing, source contact, and device-search pressure.',
    to: '/simulations',
    cta: 'Run drills',
  },
  {
    kicker: '06 — Discussion',
    title: 'Community.',
    body: 'Public field notes and open questions from peers facing similar pressure.',
    to: '/community',
    cta: 'Read threads',
  },
  {
    kicker: '07 — Direct help',
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
    title: 'Source protection guide.',
    body: 'Operational guidance journalists are pointed to across higher-risk reporting, kept inside the field manual.',
    to: '/resources?tab=source-protection',
    cta: 'Open guide',
  },
  {
    kicker: '04 — Reference',
    title: 'OS guides & tools.',
    body: 'Keep hardening guidance, source protocols, and vetted tools close.',
    to: '/resources',
    cta: 'Open manual',
  },
  {
    kicker: '05 — Training',
    title: 'Simulations.',
    body: 'Walk the same scenario drills reporters use when pressure is high.',
    to: '/simulations',
    cta: 'Run drills',
  },
  {
    kicker: '06 — Account',
    title: 'Settings.',
    body: 'Profile, verification state, and account details.',
    to: '/settings',
    cta: 'Open settings',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const SCORE_TONES = {
  strong:   'var(--color-ink)',
  moderate: 'var(--color-brass)',
  fragile:  'var(--color-oxblood)',
};

export const emphasis = (text) => (
  <em className="italic" style={{ color: 'var(--color-oxblood)' }}>{text}</em>
);

const getScoreBand = (score) => {
  if (score >= 80) return { label: 'strong',   tone: SCORE_TONES.strong };
  if (score >= 60) return { label: 'moderate', tone: SCORE_TONES.moderate };
  return               { label: 'fragile',  tone: SCORE_TONES.fragile };
};

const getCrisisLabel = (type) => {
  if (type === 'hacked')   return 'hacked account';
  if (type === 'source')   return 'source exposure';
  if (type === 'doxxed')   return 'doxxing incident';
  if (type === 'phishing') return 'phishing attempt';
  return 'security concern';
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

// ── Brief builders ───────────────────────────────────────────────────────────

const buildJournalistBrief = ({ user, latestScore, setupProgress, latestRequest, loading }) => {
  const scoreBand    = latestScore ? getScoreBand(latestScore.score) : null;
  const supportValue = loading
    ? 'updating'
    : latestRequest
      ? getSupportStatusLabel(latestRequest.status)
      : 'none active';

  let nextAction = {
    label: 'Review the source protection guide',
    to: '/resources?tab=source-protection',
    note: 'Good posture still needs routine maintenance and better source habits.',
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
      to: '/request-support',
      note: 'Keep the case close until it is resolved.',
    };
  } else if (latestRequest?.status === 'resolved' && !latestRequest.feedback) {
    nextAction = {
      label: 'Leave specialist feedback',
      to: '/request-support',
      note: 'Close the loop while the support case is still fresh.',
    };
  } else if (latestScore.score < 70) {
    nextAction = {
      label: 'Review your weakest areas',
      to: '/security-score',
      note: 'Raise the riskiest categories first — the score breakdown shows where to start.',
    };
  } else {
    nextAction = {
      label: 'Review the source protection guide',
      to: '/resources?tab=source-protection',
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
      detail: "That keeps some account and support flows at arm’s length until you confirm it.",
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
    headingNode: <>Today&apos;s brief, {emphasis(firstName)}.</>,
    lede: 'Home reads your current score, setup progress, and support state so the next move is always obvious. The toolkit you actually reach for is running down the left rail; the figures describing your posture are on the right; the activity callout below this paragraph names the next sensible step.',
    ledeBody: 'No account theatre, no extra clicks. The front page reflects where you stand, points at the next action, and steps aside while you do the work. Crisis access stays visible up top in case the assignment turns sharp.',
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
      to: '/secure-setup',
      label: 'Open the workbench',
    },
  };
};

const buildApprovedSpecialistBrief = ({ stats, loading }) => {
  const openCount     = loading ? '...' : `${stats.openCount}`;
  const claimedCount  = loading ? '...' : `${stats.claimedCount}`;
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
      detail: 'Community, the field manual, and the source-protection guide stay useful while you wait for new work.',
    };
  }

  return {
    headingNode: <>Today on {emphasis('the desk.')}</>,
    lede: 'Home keeps the summary light: open queue, active cases, resolved work, and one next move back into the specialist workflow. The casework itself still happens inside the specialist dashboard. This page is only the front-page brief — the counts and the way back in.',
    ledeBody: 'The instruments running down the left are the supporting tools you reach for when the queue is quiet: community, the source-protection guide in the field manual, OS guides, account. The figures on the right name the state of your queue right now. The activity callout below this paragraph names the next sensible move into the work.',
    metrics: [
      { label: 'Open queue',   value: openCount,     detail: 'redacted until claimed',     tone: 'var(--color-ink)' },
      { label: 'Active cases', value: claimedCount,  detail: 'currently assigned',          tone: 'var(--color-ink)' },
      { label: 'Resolved',     value: resolvedCount, detail: 'completed with you attached', tone: 'var(--color-ink)' },
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
    'pending-details': {
      heading: 'Your basic application is on file, but the review desk still needs your fuller dossier.',
      lede: 'Complete the verification file before the desk can evaluate you for live casework.',
      status: 'details required',
      detail: 'Proof of work, coverage areas, secure contact method, languages, and availability are still missing.',
      nextAction: {
        label: 'Complete verification',
        to: '/specialist-verification',
        note: 'That page is now the real file for specialist review.',
      },
      activity: {
        label: 'Current signal',
        title: 'Your review cannot start without the rest of the file.',
        detail: 'Until those details are in place, the queue remains unavailable even if the email address is already verified.',
      },
    },
    'needs-more-info': {
      heading: 'The review desk sent the file back with notes. Strengthen it, then resubmit.',
      lede: 'Add the missing detail the desk asked for, then send the dossier back for review.',
      status: 'revision requested',
      detail: 'Queue access stays locked until the dossier is resubmitted and approved.',
      nextAction: {
        label: 'Revise the dossier',
        to: '/specialist-verification',
        note: 'That is where the current review note and editable file now live.',
      },
      activity: {
        label: 'Current signal',
        title: 'Your verification file needs another pass.',
        detail: 'Use the verification page to answer the desk precisely instead of trying to infer the next move from the dashboard.',
      },
    },
    rejected: {
      heading: 'Your verification needs revision. Review the decision and reapply from the specialist workflow.',
      lede: 'Review the decision, revise the application, and reapply from the specialist workflow.',
      status: 'revision needed',
      detail: 'Review the rejection notes and reapply from the specialist workflow.',
      nextAction: {
        label: 'Review and rebuild',
        to: '/specialist-verification',
        note: 'That page now holds the fuller verification file and resubmission path.',
      },
      activity: {
        label: 'Current signal',
        title: 'Your previous verification attempt was not approved.',
        detail: 'The verification page is now the right place to review the decision and submit a cleaner application.',
      },
    },
  };

  const current = stateMap[verificationState] || stateMap.pending;

  return {
    headingNode: <>Your verification is {emphasis('reading.')}</>,
    lede: `${current.lede} Home keeps the state legible on the front page — verification status, email confirmation, and queue access — and points back into the specialist workflow when there is something to act on.`,
    ledeBody: `${current.heading} The instruments running down the left rail stay available while you wait — community discussion, the source-protection guide in the field manual, and the OS guides. None of them depend on queue access, and they keep the time before approval useful rather than idle.`,
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
      lead: 'The field manual, community, and the source-protection guide still matter before specialist approval is final.',
      to: current.nextAction.to,
      label: current.nextAction.label,
    },
  };
};

// ── Main export ──────────────────────────────────────────────────────────────

export const buildPageModel = ({
  user,
  verificationState,
  latestScore,
  setupProgress,
  journalistSnapshot,
  specialistStats,
}) => {
  if (!user) {
    return {
      hero: {
        headingNode: <>Journalism is as safe as {emphasis('the journalist.')}</>,
        lede: 'An editorial brief for journalists working under pressure. Assessment first, crisis access always visible, the rest of the toolkit close. The front page is meant to be read at a glance — masthead at the top, instruments running down the left, the lead in the middle, figures and field signals on the right.',
        ledeBody: 'No account is needed to read the crisis protocols, take the score, or browse the field manual. Crisis protocols sit on every page — four scenarios written for the first ten minutes after something goes wrong. The slower posture work, and the community feed, wait one column away until you decide they are the right tool for the moment.',
        actions: [
          { label: 'Take the security score',   to: '/security-score' },
          { label: 'Browse the field manual', to: '/resources' },
        ],
      },
      metrics: [
        { label: 'Score questions',  value: '31',   detail: 'six risk areas, about five minutes',          tone: 'var(--color-ink)' },
        { label: 'Crisis protocols', value: '4',    detail: 'hacked, source exposed, doxxed, phishing',   tone: 'var(--color-ink)' },
        { label: 'Access',           value: 'open', detail: 'protocols, score, and library need no account', tone: 'var(--color-ink)' },
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
};
