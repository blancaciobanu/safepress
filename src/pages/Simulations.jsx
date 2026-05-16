import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lock,
  MailWarning,
  MapPin,
  Radar,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  NewsBadge,
  NewsButton,
  NewsCard,
  NewsNotice,
  NewsPage,
  NewsRule,
  NewsSectionHeader,
  NewsTabs,
} from '../components/editorial/NewsPage';

const CONFIDENCE_OPTIONS = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Uneasy' },
  { value: 3, label: 'Moderate' },
  { value: 4, label: 'Confident' },
  { value: 5, label: 'Very confident' },
];

const SCENARIOS = [
  {
    id: 'phishing-editor',
    label: 'Phishing',
    desc: 'Suspicious editor outreach',
    icon: MailWarning,
    accent: '#7B2E2E',
    duration: '4-5 min',
    overview: 'A familiar editor asks for an urgent login and a file review while you are on deadline. The wrong instinct here burns both your account and your source trail.',
    learningGoals: [
      'Spot urgency and authority cues in newsroom phishing',
      'Choose verification steps that do not deepen compromise',
      'Sequence the first ten minutes after suspicion appears',
    ],
    steps: [
      {
        prompt: 'An email that looks like it came from your editor says the publishing system locked your account. It asks you to sign in through a link before the next edition closes.',
        context: 'You are on a live deadline and the sender display name matches your editor.',
        options: [
          {
            label: 'Open the link immediately so you do not hold the desk up',
            correct: false,
            outcome: 'The time pressure is the bait. Logging in through the supplied link risks handing over your newsroom credentials.',
            takeaway: 'Urgent account-recovery requests should be verified out-of-band before any sign-in.',
          },
          {
            label: 'Open the CMS from your own bookmark and message the editor in Signal to confirm',
            correct: true,
            outcome: 'Good call. You avoid the attacker-controlled link and verify the request in a separate channel you already trust.',
            takeaway: 'Use a known-good path and an independent channel when the message touches credentials.',
          },
          {
            label: 'Reply to the same email asking if this is legitimate',
            correct: false,
            outcome: 'Replying keeps you in the attacker’s lane and does nothing to verify who controls the inbox you are answering.',
            takeaway: 'Never verify suspicious messages inside the same thread that raised the suspicion.',
          },
        ],
      },
      {
        prompt: 'Your editor replies on Signal: they did not send the email. You clicked the message but did not log in anywhere. What now?',
        context: 'You have not entered a password yet, but the browser tab is still open.',
        options: [
          {
            label: 'Close the tab, report the phish, and check whether the domain matches the real newsroom login page',
            correct: true,
            outcome: 'That contains the incident without feeding it. Reporting helps the newsroom warn others before the lure spreads.',
            takeaway: 'After a suspected phish, contain first, verify indicators, and notify the team quickly.',
          },
          {
            label: 'Ignore it because you never typed a password',
            correct: false,
            outcome: 'Ignoring it leaves the campaign active against the rest of the newsroom and wastes an early warning opportunity.',
            takeaway: 'Phishing response includes helping others avoid the same trap.',
          },
          {
            label: 'Forward the email to your personal account so you can inspect it later',
            correct: false,
            outcome: 'Forwarding a malicious lure to another account expands the blast radius and can strip useful headers in the process.',
            takeaway: 'Do not move suspicious artifacts into other accounts unless your response process calls for it.',
          },
        ],
      },
      {
        prompt: 'Later that day, you discover a colleague did enter their password into the same fake page. What is the best advice for their first move?',
        context: 'They still have access to their email and CMS account.',
        options: [
          {
            label: 'Change the password, revoke active sessions, and enable or re-check MFA immediately',
            correct: true,
            outcome: 'Yes. That is the shortest route to retaking the account before the attacker settles in.',
            takeaway: 'Credential compromise response starts with password reset, session revocation, and MFA review.',
          },
          {
            label: 'Wait to see if anything suspicious actually happens',
            correct: false,
            outcome: 'Waiting hands the attacker time to pivot, persist, and quietly collect source or newsroom data.',
            takeaway: 'Assume compromised credentials are active abuse until proven otherwise.',
          },
          {
            label: 'Delete the phishing email and carry on working',
            correct: false,
            outcome: 'Deleting the lure does not invalidate a stolen password or existing attacker session.',
            takeaway: 'Deleting evidence is not incident response.',
          },
        ],
      },
    ],
    nextSteps: [
      { label: 'Open Secure Setup', to: '/secure-setup' },
      { label: 'Open Manual', to: '/resources' },
    ],
  },
  {
    id: 'source-channel',
    label: 'Source contact',
    desc: 'Unsafe first-contact decisions',
    icon: Lock,
    accent: '#8A6D2C',
    duration: '5-6 min',
    overview: 'A sensitive new source wants to talk fast, but they are reaching for the most convenient channel instead of the safest one.',
    learningGoals: [
      'Separate source trust from channel trust',
      'Choose a safer migration path for first contact',
      'Set retention and verification rules early',
    ],
    steps: [
      {
        prompt: 'A new source DMs you on Instagram: “I have documents about a minister. Can we talk here?”',
        context: 'They seem genuine and mention details that line up with your reporting beat.',
        options: [
          {
            label: 'Keep talking on Instagram so you do not lose them',
            correct: false,
            outcome: 'That keeps sensitive contact inside a platform built for profiling, retention, and account compromise.',
            takeaway: 'Convenient first contact is not safe first contact.',
          },
          {
            label: 'Move them to Signal or SecureDrop before discussing anything sensitive',
            correct: true,
            outcome: 'Exactly. You protect the substance of the contact before asking for specifics.',
            takeaway: 'Choose the secure channel before you deepen the relationship.',
          },
          {
            label: 'Ask them to email the documents to your newsroom account',
            correct: false,
            outcome: 'Work email is discoverable, retained, and often accessible across newsroom systems.',
            takeaway: 'Newsroom email should not be the first home for a high-risk source exchange.',
          },
        ],
      },
      {
        prompt: 'The source agrees to move to Signal, but they want to send names right away. You have not verified safety numbers yet.',
        context: 'They are anxious and say the situation is urgent.',
        options: [
          {
            label: 'Let them send the names because speed matters more right now',
            correct: false,
            outcome: 'Urgency is real, but unverified channels are precisely where sensitive names should not go first.',
            takeaway: 'If the channel is not verified, the most sensitive facts should wait.',
          },
          {
            label: 'Ask for non-identifying context first and verify the channel out-of-band before names',
            correct: true,
            outcome: 'Right. You keep the conversation moving without exposing the source at maximum depth immediately.',
            takeaway: 'You can gather shape and timeline before exposing identities.',
          },
          {
            label: 'Switch to a phone call because it feels more direct',
            correct: false,
            outcome: 'A call produces a dense metadata trail and offers less control over retention or interception.',
            takeaway: 'Direct is not the same thing as discreet.',
          },
        ],
      },
      {
        prompt: 'You have verified the Signal channel. What should you agree on before documents start flowing regularly?',
        context: 'You expect the relationship to continue for weeks.',
        options: [
          {
            label: 'A disappearing-message window and what to do if either side feels watched',
            correct: true,
            outcome: 'Yes. Retention and go-dark rules should be normal practice, not crisis improvisation.',
            takeaway: 'Source safety improves when protocols are agreed before things get messy.',
          },
          {
            label: 'Nothing formal; too many rules may scare them off',
            correct: false,
            outcome: 'Without agreed rules, every future decision happens under pressure instead of protocol.',
            takeaway: 'Calm structure is often what makes a source feel protected rather than abandoned.',
          },
          {
            label: 'Your personal WhatsApp as an emergency fallback',
            correct: false,
            outcome: 'Fallbacks should reduce exposure, not jump back into more correlated personal channels.',
            takeaway: 'Do not casually bridge sensitive work back into personal comms.',
          },
        ],
      },
    ],
    nextSteps: [
      { label: 'Open Source Protection Guide', to: '/resources?tab=source-protection' },
      { label: 'Continue in AI Advisor', to: '/ai-advisor' },
    ],
  },
  {
    id: 'border-search',
    label: 'Border crossing',
    desc: 'Device pressure at the checkpoint',
    icon: MapPin,
    accent: '#375E5A',
    duration: '5-6 min',
    overview: 'You are crossing a border after reporting on a sensitive story. Your device posture before the checkpoint determines how much harm a search can do.',
    learningGoals: [
      'Reduce what is carried into a high-surveillance crossing',
      'Choose the least damaging response under inspection pressure',
      'Think in advance about document, app, and contact minimisation',
    ],
    steps: [
      {
        prompt: 'The night before a cross-border trip, you still have source chat history and drafts on your main laptop. What is the best preparation step?',
        context: 'You have enough time to change your plan before travel day.',
        options: [
          {
            label: 'Travel with the same fully populated laptop because encryption is already enabled',
            correct: false,
            outcome: 'Encryption matters, but device minimisation matters too. A fully loaded machine is still a rich target if unlocked or seized.',
            takeaway: 'The safest data at a border is often the data you did not bring.',
          },
          {
            label: 'Use a cleaner travel device and strip non-essential source material before crossing',
            correct: true,
            outcome: 'Exactly. Minimise the data carried and separate sensitive work from routine travel where possible.',
            takeaway: 'Travel posture starts before you leave home, not at the checkpoint.',
          },
          {
            label: 'Export everything to cloud storage and delete it locally right before the airport',
            correct: false,
            outcome: 'Cloud copies may still be discoverable and deletion under time pressure is easy to do badly.',
            takeaway: 'Last-minute cloud shuffling is not a substitute for a deliberate travel plan.',
          },
        ],
      },
      {
        prompt: 'At the checkpoint, an officer asks you to unlock your phone for inspection.',
        context: 'Local law and newsroom counsel guidance vary, but you need to make the least harmful operational choice.',
        options: [
          {
            label: 'Open every app proactively to look cooperative',
            correct: false,
            outcome: 'Volunteering extra material expands the search beyond what is already being demanded.',
            takeaway: 'Never widen access beyond the immediate requirement.',
          },
          {
            label: 'Keep the device scope as limited as possible and avoid carrying sensitive content you cannot afford to expose',
            correct: true,
            outcome: 'That is the operational point of travel minimisation: if access is compelled, the device reveals far less.',
            takeaway: 'Preparation is what gives you options when legal leverage is limited.',
          },
          {
            label: 'Hand over your main newsroom laptop instead because the phone feels more personal',
            correct: false,
            outcome: 'The larger device may contain much richer caches, notes, downloads, and account access than the phone.',
            takeaway: 'Do not swap into a device with a worse blast radius.',
          },
        ],
      },
      {
        prompt: 'After the crossing, you think the device may have been examined more deeply than expected. What should you do next?',
        context: 'You are now away from the checkpoint and can contact your team.',
        options: [
          {
            label: 'Treat the device as potentially compromised and notify your newsroom or specialist support',
            correct: true,
            outcome: 'Yes. Post-crossing review matters because compromise may not announce itself immediately.',
            takeaway: 'Suspicion after a device search deserves containment, not shrugging.',
          },
          {
            label: 'Resume normal source contact on the same device to avoid disruption',
            correct: false,
            outcome: 'That risks carrying sensitive conversations forward on a device you no longer fully trust.',
            takeaway: 'Do not route fresh source contact through a possibly compromised device.',
          },
          {
            label: 'Wait a few weeks and only react if something obvious goes wrong',
            correct: false,
            outcome: 'Delayed response wastes the window when you could rotate credentials and isolate risk before follow-on harm.',
            takeaway: 'Uncertainty after a search is a reason to escalate carefully, not to go passive.',
          },
        ],
      },
    ],
    nextSteps: [
      { label: 'Request Specialist Support', to: '/request-support' },
      { label: 'Open Threat Model', to: '/threat-model' },
    ],
  },
];

const scoreTone = (ratio) => {
  if (ratio >= 0.8) return { label: 'Strong handling', color: '#375E5A' };
  if (ratio >= 0.5) return { label: 'Mixed handling', color: '#8A6D2C' };
  return { label: 'High exposure', color: '#7B2E2E' };
};

const getStepState = ({ stepIndex, currentStepIndex, selectedOption, allAnswered }) => {
  if (selectedOption?.correct) return 'resolved';
  if (selectedOption && !selectedOption.correct) return 'exposed';
  if (stepIndex === currentStepIndex && !allAnswered) return 'active';
  if (stepIndex < currentStepIndex) return 'passed';
  return 'queued';
};

const Simulations = () => {
  const [activeScenarioId, setActiveScenarioId] = useState(SCENARIOS[0].id);
  const [confidenceBefore, setConfidenceBefore] = useState({});
  const [confidenceAfter, setConfidenceAfter] = useState({});
  const [answers, setAnswers] = useState({});
  const [revealedSteps, setRevealedSteps] = useState({});

  const scenario = useMemo(
    () => SCENARIOS.find((entry) => entry.id === activeScenarioId) || SCENARIOS[0],
    [activeScenarioId]
  );

  const scenarioAnswers = answers[scenario.id] || {};
  const scenarioReveal = revealedSteps[scenario.id] || {};
  const answeredCount = Object.keys(scenarioAnswers).length;
  const currentStepIndex = Math.min(answeredCount, scenario.steps.length - 1);
  const allAnswered = answeredCount === scenario.steps.length;
  const correctCount = scenario.steps.reduce(
    (count, step, index) => count + (scenarioAnswers[index]?.correct ? 1 : 0),
    0
  );
  const scoreRatio = scenario.steps.length ? correctCount / scenario.steps.length : 0;
  const scoreMeta = scoreTone(scoreRatio);
  const confidenceDelta = Number.isFinite(confidenceBefore[scenario.id]) && Number.isFinite(confidenceAfter[scenario.id])
    ? confidenceAfter[scenario.id] - confidenceBefore[scenario.id]
    : null;
  const activeStep = scenario.steps[currentStepIndex];
  const activeSelectedOption = scenarioAnswers[currentStepIndex];

  const recommendedTakeaways = scenario.steps
    .map((step, index) => scenarioAnswers[index]?.takeaway || step.options.find((option) => option.correct)?.takeaway)
    .filter(Boolean);

  const handleSelectScenario = (scenarioId) => {
    setActiveScenarioId(scenarioId);
  };

  const handleChooseOption = (stepIndex, option) => {
    if (scenarioAnswers[stepIndex]) return;

    setAnswers((current) => ({
      ...current,
      [scenario.id]: {
        ...(current[scenario.id] || {}),
        [stepIndex]: option,
      },
    }));
    setRevealedSteps((current) => ({
      ...current,
      [scenario.id]: {
        ...(current[scenario.id] || {}),
        [stepIndex]: true,
      },
    }));
  };

  const restartScenario = () => {
    setAnswers((current) => ({ ...current, [scenario.id]: {} }));
    setRevealedSteps((current) => ({ ...current, [scenario.id]: {} }));
    setConfidenceAfter((current) => {
      const next = { ...current };
      delete next[scenario.id];
      return next;
    });
  };

  return (
    <NewsPage className="simulation-desk">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-baseline justify-between pb-3">
          <span className="eyebrow sm text-oxblood">Simulation Desk · Scenario drills for journalists</span>
          <span className="eyebrow sm">3 live exercises</span>
        </div>
        <NewsRule />

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.2fr_0.9fr] gap-10 items-start">
          <div>
            <h1 className="display text-4xl md:text-6xl leading-none">
              Interactive security<br />simulations<span className="italic-ox">.</span>
            </h1>
            <p className="mt-5 text-base md:text-lg leading-relaxed text-ink-soft max-w-[38rem]">
              Practice the first decisions that define whether a phishing lure, source contact, or border search stays containable. Each simulation gives you consequences, takeaways, and a confidence check before and after the drill.
            </p>
          </div>

          <NewsCard accent="#8A6D2C" className="sim-sidecard">
            <div className="flex items-center gap-3">
              <Radar className="w-4 h-4 text-brass" />
              <p className="eyebrow sm text-brass">Designed for dissertation evaluation</p>
            </div>
            <div className="mt-4 space-y-3">
              <p className="news-card-copy">
                Each drill records a simple before/after confidence check in-session, which makes it easy to demonstrate perceived learning during a user study or supervisor demo.
              </p>
              <p className="news-card-copy">
                The scenarios stay grounded in newsroom realities instead of generic cyber-awareness quizzes.
              </p>
            </div>
          </NewsCard>
        </div>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="mt-10"
      >
        <NewsNotice tone="info" icon={ShieldAlert}>
          <p className="text-sm leading-relaxed text-ink-soft">
            These drills are meant to strengthen judgment under pressure, not replace legal counsel or incident-response support. When the real-world version of a scenario is already happening, jump to specialist support or crisis guidance early.
          </p>
        </NewsNotice>

        <div className="mt-8">
          <NewsTabs
            tabs={SCENARIOS.map((entry) => ({
              id: entry.id,
              label: entry.label,
              desc: entry.desc,
              icon: entry.icon,
              accent: entry.accent,
            }))}
            activeId={scenario.id}
            onChange={handleSelectScenario}
          />
        </div>
      </motion.section>

      <div className="mt-10 grid grid-cols-1 xl:grid-cols-[0.78fr_1.42fr] gap-6 items-start">
        <div className="space-y-5">
          <NewsCard accent={scenario.accent} className="sim-sidecard">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow sm text-ink-soft">Scenario brief</p>
                <h2 className="news-card-title mt-2">{scenario.label}</h2>
              </div>
              <NewsBadge color={scenario.accent}>{scenario.duration}</NewsBadge>
            </div>
            <p className="news-card-copy mt-4">{scenario.overview}</p>
          </NewsCard>

          <NewsCard accent="#15110C" className="sim-sidecard">
            <h3 className="news-card-title">Learning goals</h3>
            <div className="mt-4 space-y-3">
              {scenario.learningGoals.map((goal) => (
                <div key={goal} className="flex gap-3 items-start">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-ink" />
                  <p className="news-card-copy">{goal}</p>
                </div>
              ))}
            </div>
          </NewsCard>

          <div className="sim-confidence-note">
            <span className="sim-confidence-note__pin" aria-hidden="true" />
            <h3 className="news-card-title">Confidence check</h3>
            <p className="news-card-copy mt-3">
              How ready do you feel to make the first decision in this scenario?
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {CONFIDENCE_OPTIONS.map((option) => {
                const active = confidenceBefore[scenario.id] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setConfidenceBefore((current) => ({ ...current, [scenario.id]: option.value }))}
                    className={`sim-chip ${active ? 'is-active' : ''}`}
                    aria-pressed={active}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="sim-confidence-note__meta">
              Saved only in this session for the drill debrief.
            </p>
          </div>

          <div className="sim-transcript">
            <div className="sim-transcript__header">
              <p className="eyebrow sm text-ink-soft">Transcript rail</p>
              <p className="sim-transcript__meta">{answeredCount}/{scenario.steps.length} marked</p>
            </div>
            <div className="sim-transcript__rows">
              {scenario.steps.map((step, stepIndex) => {
                const selectedOption = scenarioAnswers[stepIndex];
                const state = getStepState({
                  stepIndex,
                  currentStepIndex,
                  selectedOption,
                  allAnswered,
                });

                return (
                  <div
                    key={`${scenario.id}-rail-${stepIndex}`}
                    className={`sim-transcript__row is-${state}`}
                  >
                    <div className="sim-transcript__row-index">{String(stepIndex + 1).padStart(2, '0')}</div>
                    <div className="min-w-0">
                      <p className="sim-transcript__row-title">{step.prompt}</p>
                      <p className="sim-transcript__row-detail">
                        {selectedOption
                          ? selectedOption.correct
                            ? 'Contained'
                            : 'Exposure increased'
                          : state === 'active'
                            ? 'On the desk now'
                            : 'Queued'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <NewsSectionHeader
            kicker={`${answeredCount}/${scenario.steps.length} decisions completed`}
            title="Field drill card"
            lede="Work through one cue card at a time. The active prompt stays wide and legible, while the transcript rail keeps your earlier decisions visible without turning the page into a stack of matching boxes."
            icon={scenario.icon}
            accent={scenario.accent}
          />

          <article className="sim-cuecard" style={{ '--sim-accent': scenario.accent }}>
            <div className="sim-cuecard__tabs" aria-hidden="true">
              <span />
              <span />
            </div>

            <div className="sim-cuecard__topline">
              <p className="eyebrow sm text-oxblood">
                {allAnswered ? 'Drill complete' : `Decision ${currentStepIndex + 1}`}
              </p>
              <div className="flex items-center gap-3">
                <span className="sim-cuecard__stamp">{scenario.duration}</span>
                {activeSelectedOption?.correct
                  ? <CheckCircle2 className="w-4 h-4 text-[#375E5A]" />
                  : activeSelectedOption
                    ? <AlertTriangle className="w-4 h-4 text-oxblood" />
                    : null}
              </div>
            </div>

            <div className="sim-cuecard__body">
              <div className="sim-cuecard__prompt">
                <h3 className="sim-cuecard__title">{activeStep.prompt}</h3>
                <p className="sim-cuecard__context">{activeStep.context}</p>
              </div>

              <div className="sim-cuecard__choices">
                {activeStep.options.map((option) => {
                  const selected = activeSelectedOption?.label === option.label;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      disabled={Boolean(activeSelectedOption)}
                      onClick={() => handleChooseOption(currentStepIndex, option)}
                      className={`sim-choice ${
                        selected
                          ? option.correct
                            ? 'is-correct'
                            : 'is-wrong'
                          : ''
                      }`}
                    >
                      <span className="sim-choice__marker" aria-hidden="true" />
                      <span className="sim-choice__text">{option.label}</span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {activeSelectedOption && scenarioReveal[currentStepIndex] && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className={`sim-annotation ${activeSelectedOption.correct ? 'is-correct' : 'is-wrong'}`}
                  >
                    <p className="sim-annotation__label">
                      {activeSelectedOption.correct ? 'Editorial note' : 'Exposure note'}
                    </p>
                    <p className="sim-annotation__body">{activeSelectedOption.outcome}</p>
                    <p className="sim-annotation__takeaway">
                      <span>Carry forward:</span> {activeSelectedOption.takeaway}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </article>

          {!allAnswered && (
            <p className="sim-cuecard__footer">
              The next card unlocks as soon as this decision is marked. The transcript rail keeps the sequence readable without collapsing everything into one long quiz sheet.
            </p>
          )}

          {allAnswered && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8"
            >
              <NewsSectionHeader
                kicker="Debrief"
                title="Scenario summary"
                lede="A compact after-action review to show what held up, what slipped, and where to go next in SafePress."
                icon={Radar}
                accent={scoreMeta.color}
              />

              <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.15fr] gap-5 mt-5">
                <NewsCard accent={scoreMeta.color} className="sim-sidecard">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="eyebrow sm text-ink-soft">Outcome</p>
                      <h3 className="display-soft text-3xl mt-2">{correctCount}/{scenario.steps.length}</h3>
                    </div>
                    <NewsBadge color={scoreMeta.color}>{scoreMeta.label}</NewsBadge>
                  </div>

                  <div className="mt-5 space-y-3">
                    <p className="news-card-copy">
                      {scoreRatio >= 0.8
                        ? 'You kept the scenario mostly contained and made decisions that reduce downstream exposure.'
                        : scoreRatio >= 0.5
                          ? 'You caught part of the risk picture, but a couple of decisions still opened avoidable exposure.'
                          : 'This scenario would likely escalate quickly under pressure without a stronger first-decision routine.'}
                    </p>

                    <div className="pt-2 border-t border-ink/10">
                      <p className="eyebrow sm text-ink-soft">Confidence after the drill</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {CONFIDENCE_OPTIONS.map((option) => {
                          const active = confidenceAfter[scenario.id] === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setConfidenceAfter((current) => ({ ...current, [scenario.id]: option.value }))}
                              className={`sim-chip ${active ? 'is-active' : ''}`}
                              aria-pressed={active}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                      {confidenceDelta !== null && (
                        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                          Confidence shift: <span className="text-ink font-medium">{confidenceDelta > 0 ? '+' : ''}{confidenceDelta}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </NewsCard>

                <NewsCard accent="#15110C" className="sim-sidecard">
                  <h3 className="news-card-title">What to carry forward</h3>
                  <div className="mt-4 space-y-3">
                    {recommendedTakeaways.map((item, index) => (
                      <div key={`${item}-${index}`} className="flex gap-3 items-start">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-ink" />
                        <p className="news-card-copy">{item}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-5 border-t border-ink/10 flex flex-wrap gap-3">
                    <NewsButton type="button" variant="ghost" onClick={restartScenario}>
                      <RotateCcw className="w-4 h-4" />
                      Retry scenario
                    </NewsButton>
                    {scenario.nextSteps.map((step) => (
                      <Link
                        key={step.to}
                        to={step.to}
                        className="inline-flex items-center gap-1 eyebrow sm text-oxblood hover:text-ink transition-colors"
                      >
                        {step.label}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    ))}
                  </div>
                </NewsCard>
              </div>
            </motion.section>
          )}
        </div>
      </div>
    </NewsPage>
  );
};

export default Simulations;
