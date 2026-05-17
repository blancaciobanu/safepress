import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
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
} from '../components/editorial/NewsPage';
import { CONFIDENCE_OPTIONS, TRACKS } from './simulations.data';
import { useAuth } from '../contexts/AuthContext';
import {
  getSimulationProgress,
  saveSimulationConfidence,
} from '../features/simulations/services/simulationService';

const scoreTone = (ratio) => {
  if (ratio >= 0.8) return { label: 'Strong handling', color: '#375E5A' };
  if (ratio >= 0.5) return { label: 'Mixed handling', color: '#8A6D2C' };
  return { label: 'High exposure', color: '#7B2E2E' };
};

const getStepState = ({ stepIndex, currentStepIndex, selectedOption }) => {
  if (selectedOption?.correct) return 'resolved';
  if (selectedOption && !selectedOption.correct) return 'exposed';
  if (stepIndex === currentStepIndex) return 'active';
  if (stepIndex < currentStepIndex) return 'passed';
  return 'queued';
};

const relativeTime = (iso) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const Simulations = () => {
  const { user } = useAuth();
  const [activeTrackId, setActiveTrackId] = useState(TRACKS[0].id);
  const [activeScenarioId, setActiveScenarioId] = useState(TRACKS[0].drills[0].id);
  const [confidenceAfter, setConfidenceAfter] = useState({});
  const [answers, setAnswers] = useState({});
  const [revealedSteps, setRevealedSteps] = useState({});
  const [stepCursor, setStepCursor] = useState({});

  useEffect(() => {
    if (!user?.uid) return;
    getSimulationProgress(user.uid)
      .then((progress) => setConfidenceAfter(progress))
      .catch(() => {});
  }, [user?.uid]);

  const track = useMemo(
    () => TRACKS.find((entry) => entry.id === activeTrackId) || TRACKS[0],
    [activeTrackId]
  );

  const scenario = useMemo(
    () => track.drills.find((entry) => entry.id === activeScenarioId) || track.drills[0],
    [activeScenarioId, track]
  );

  const scenarioAnswers = answers[scenario.id] || {};
  const scenarioReveal = revealedSteps[scenario.id] || {};
  const answeredCount = Object.keys(scenarioAnswers).length;
  const savedCursor = stepCursor[scenario.id];
  const currentStepIndex = Number.isInteger(savedCursor)
    ? Math.min(savedCursor, scenario.steps.length - 1)
    : Math.min(answeredCount, scenario.steps.length - 1);
  const allAnswered = answeredCount === scenario.steps.length;
  const correctCount = scenario.steps.reduce(
    (count, step, index) => count + (scenarioAnswers[index]?.correct ? 1 : 0),
    0
  );
  const scoreRatio = scenario.steps.length ? correctCount / scenario.steps.length : 0;
  const scoreMeta = scoreTone(scoreRatio);
  const activeStep = scenario.steps[currentStepIndex];
  const activeSelectedOption = scenarioAnswers[currentStepIndex];

  const recommendedTakeaways = scenario.steps
    .map((_, index) => scenarioAnswers[index]?.takeaway)
    .filter(Boolean);

  const handleSelectTrack = (trackId) => {
    const nextTrack = TRACKS.find((entry) => entry.id === trackId) || TRACKS[0];
    setActiveTrackId(nextTrack.id);
    setActiveScenarioId(nextTrack.drills[0].id);
  };

  const handleSelectScenario = (scenarioId) => {
    setActiveScenarioId(scenarioId);
    setStepCursor((current) => ({
      ...current,
      [scenarioId]: current[scenarioId] ?? 0,
    }));
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
    setStepCursor((current) => ({
      ...current,
      [scenario.id]: stepIndex,
    }));
  };

  const handleAdvanceStep = () => {
    if (currentStepIndex >= scenario.steps.length - 1) return;

    setStepCursor((current) => ({
      ...current,
      [scenario.id]: currentStepIndex + 1,
    }));
  };

  const restartScenario = () => {
    setAnswers((current) => ({ ...current, [scenario.id]: {} }));
    setRevealedSteps((current) => ({ ...current, [scenario.id]: {} }));
    setStepCursor((current) => ({ ...current, [scenario.id]: 0 }));
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
          <span className="eyebrow sm">
            {TRACKS.reduce((count, entry) => count + entry.drills.length, 0)} live exercises
          </span>
        </div>
        <NewsRule />

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.2fr_0.9fr] gap-10 items-start lg:items-center">
          <div>
            <h1 className="display text-4xl md:text-6xl leading-none">
              Interactive security<br />simulations<span className="italic-ox">.</span>
            </h1>
            <p className="mt-5 text-base md:text-lg leading-relaxed text-ink-soft max-w-[38rem]">
              Practice the first decisions that define whether a phishing lure, source contact, or border search stays containable. Each simulation gives you consequences, takeaways, and a confidence check before and after the drill.
            </p>
          </div>

          <NewsCard accent="#8A6D2C" className="sim-sidecard sim-hero-note">
            <div className="flex items-center gap-3">
              <Radar className="w-4 h-4 text-brass" />
              <p className="eyebrow sm text-brass">How to use this desk</p>
            </div>
            <div className="mt-4 space-y-3">
              <p className="news-card-copy">
                Treat each scenario like a rehearsal sheet: read the prompt, make one decision, then absorb the consequence before you move to the next card.
              </p>
              <p className="news-card-copy">
                The drills stay grounded in newsroom realities instead of generic cyber-awareness quizzes, so the habits transfer more cleanly to actual reporting pressure.
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
          <div className="sim-track-rail" role="tablist" aria-label="Simulation tracks">
            {TRACKS.map((entry) => {
              const Icon = entry.icon;
              const active = entry.id === track.id;

              return (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleSelectTrack(entry.id)}
                  className={`sim-track-rail__tab ${active ? 'is-active' : ''}`}
                  style={{ '--track-accent': entry.accent }}
                >
                  <Icon className="sim-track-rail__icon" />
                  <span className="sim-track-rail__label">{entry.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.section>

      <div className="mt-10 grid grid-cols-1 xl:grid-cols-[0.78fr_1.42fr] gap-6 items-start">
        <div className="sim-left-column">
          <div className="sim-drill-index">
            <div className="sim-drill-index__header">
              <div>
                <p className="eyebrow sm text-ink-soft">Drill index</p>
                <h2 className="news-card-title mt-2">{track.label}</h2>
              </div>
              <p className="sim-transcript__meta">{track.drills.length} drills</p>
            </div>
            <div className="sim-drill-index__rows">
              {track.drills.map((entry, index) => {
                const entryAnswers = answers[entry.id] || {};
                const entryAnswered = Object.keys(entryAnswers).length;
                const entryCorrect = entry.steps.reduce(
                  (count, step, stepIndex) => count + (entryAnswers[stepIndex]?.correct ? 1 : 0),
                  0
                );
                const isActive = entry.id === scenario.id;
                const entryConfidence = confidenceAfter[entry.id];
                const confidenceLabel = entryConfidence
                  ? CONFIDENCE_OPTIONS.find((o) => o.value === entryConfidence.confidence)?.label
                  : null;

                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => handleSelectScenario(entry.id)}
                    className={`sim-drill-index__row ${isActive ? 'is-active' : ''}`}
                  >
                    <div className="sim-drill-index__row-no">{String(index + 1).padStart(2, '0')}</div>
                    <div className="min-w-0">
                      <div className="sim-drill-index__row-topline">
                        <p className="sim-drill-index__row-title">{entry.label}</p>
                        <span className="sim-cuecard__stamp">{entry.duration}</span>
                      </div>
                      <p className="sim-drill-index__row-desc">{entry.desc}</p>
                    </div>
                    <div className="sim-drill-index__row-meta">
                      <span>{entryAnswered}/{entry.steps.length} marked</span>
                      {entryAnswered === entry.steps.length && (
                        <span>{entryCorrect}/{entry.steps.length} held</span>
                      )}
                      {confidenceLabel && (
                        <span className="sim-drill-index__row-confidence">
                          {confidenceLabel} · {relativeTime(entryConfidence.recordedAt)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <NewsCard accent={track.accent} className="sim-sidecard">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow sm text-ink-soft">Scenario brief</p>
                <h2 className="news-card-title mt-2">{scenario.label}</h2>
              </div>
              <NewsBadge color={track.accent}>{scenario.duration}</NewsBadge>
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

        <div className="sim-main-column">
          <NewsSectionHeader
            className="sim-main-header"
            kicker={`${answeredCount}/${scenario.steps.length} decisions completed`}
            title="Field drill card"
            lede="One decision at a time: mark the move, read the consequence, then continue the drill."
            icon={track.icon}
            accent={track.accent}
          />

          <article className="sim-cuecard" style={{ '--sim-accent': track.accent }}>
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
                    <div className="sim-annotation__footer">
                      <p className="sim-annotation__takeaway">
                        <span>Carry forward:</span> {activeSelectedOption.takeaway}
                      </p>
                      {currentStepIndex < scenario.steps.length - 1 && (
                        <NewsButton type="button" className="shrink-0 whitespace-nowrap" onClick={handleAdvanceStep}>
                          Continue to next card
                          <ArrowRight className="w-4 h-4" />
                        </NewsButton>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </article>

          {!allAnswered && (
            <p className="sim-cuecard__footer">
              The next card unlocks as soon as this decision is marked.
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
                className="sim-main-header"
                kicker="Debrief"
                title="Scenario summary"
                lede="A compact after-action review to show what held up, what slipped, and where to go next in SafePress."
                icon={Radar}
                accent={scoreMeta.color}
              />

              <div className="sim-debrief grid grid-cols-1 lg:grid-cols-[0.95fr_1.15fr] gap-5 mt-5">
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
                          const active = confidenceAfter[scenario.id]?.confidence === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                const recordedAt = new Date().toISOString();
                                setConfidenceAfter((current) => ({ ...current, [scenario.id]: { confidence: option.value, recordedAt } }));
                                if (user?.uid) {
                                  saveSimulationConfidence(user.uid, scenario.id, option.value).catch(() => {});
                                }
                              }}
                              className={`sim-chip ${active ? 'is-active' : ''}`}
                              aria-pressed={active}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
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
