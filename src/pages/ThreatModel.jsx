import { useEffect, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ShieldAlert,
  Radar,
  Users,
  NotebookPen,
  AlertTriangle,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { requestThreatModelReport, persistLatestThreatModel } from '../features/ai/services/aiService';
import PrivacyGuardModal from '../features/ai/components/PrivacyGuardModal';
import { analyzePrivacyPayload, REDACTION_FLAG_LABELS } from '../features/ai/services/privacyGuard';
import { logError } from '../utils/logger';
import {
  NewsBadge,
  NewsButton,
  NewsCard,
  NewsField,
  NewsNotice,
  NewsPage,
  NewsRule,
} from '../components/editorial/NewsPage';
import {
  THREAT_LEVEL_META,
  REPORT_BLOCKS,
  DESTINATION_META,
  SOURCE_SENSITIVITY_OPTIONS,
  PUBLIC_VISIBILITY_OPTIONS,
  TRAVEL_PROFILE_OPTIONS,
  THREAT_WORKFLOW,
  DEFAULT_FORM_DATA,
} from '../features/ai/threatModel.data';

const formatFiledDate = (value = new Date()) =>
  new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const toTitleCase = (value = '') =>
  value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

const Section = ({ n, label, title, note, children }) => (
  <section className="threat-section">
    <div className="threat-section__header">
      <p className="eyebrow sm">
        <span className="text-ink mr-2">§ {n}</span>
        <span className="text-ink-soft">{label}</span>
      </p>
      {title && <h2 className="display-soft text-2xl md:text-3xl leading-none mt-3">{title}</h2>}
      {note && <p className="threat-section__lede">{note}</p>}
    </div>
    {children}
  </section>
);

const OptionGroup = ({ legendNo, legend, options, value, onChange }) => (
  <div className="f-row">
    <span className="f-lbl">
      <span className="no">№ {legendNo}</span>
      <span>{legend}</span>
    </span>
    <div className="editorial-choice-grid editorial-choice-grid--two threat-option-grid">
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`editorial-choice-card threat-option ${active ? 'is-active' : ''}`}
            style={{ '--choice-accent': 'var(--color-ink)' }}
          >
            <div className="editorial-choice-card__topline">
              <span className="eyebrow sm text-ink">{option.label}</span>
              <span className="editorial-choice-card__dot" aria-hidden="true" />
            </div>
            <p className="text-sm leading-relaxed text-ink-soft mt-3">{option.desc}</p>
          </button>
        );
      })}
    </div>
  </div>
);

const ThreatListCard = ({ title, items = [], accent, Icon, summary, index = 0 }) => (
  <NewsCard accent={accent} className="threatBlockCard">
    <div className="threatBlockHead">
      <div className="threatBlockLabel">
        <Icon className="w-3.5 h-3.5 text-smoke" />
        <span>{String(index + 1).padStart(2, '0')} · {title}</span>
      </div>
      <NewsBadge color={accent}>
        {items.length} {items.length === 1 ? 'entry' : 'entries'}
      </NewsBadge>
    </div>

    <h3 className="threatBlockTitle">{title}</h3>

    {items.length > 0 ? (
      <ol className="threatList">
        {items.map((item, i) => (
          <li key={item} className="threatListItem">
            <span className="threatListNo" style={{ color: accent }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="threatListText">{item}</span>
          </li>
        ))}
      </ol>
    ) : (
      <p className="news-card-copy mt-3">No items generated in this section.</p>
    )}

    <p className="threatBlockSummary">{summary}</p>
  </NewsCard>
);

const ThreatModel = () => {
  const { user } = useAuth();
  const latestScore = user?.securityScores?.at(-1) ?? null;
  const categoryScores = latestScore?.categoryScores ?? {};
  const weakAreas = Object.values(categoryScores)
    .filter((entry) => (entry?.score ?? 100) < 70)
    .sort((left, right) => (left.score ?? 100) - (right.score ?? 100))
    .map((entry) => entry.name)
    .slice(0, 4);
  const completedTasks = user?.setupProgress?.completedTasks?.length ?? 0;
  const storedThreatModel = user?.latestThreatModel ?? null;

  const [formData, setFormData] = useState(() => ({
    ...DEFAULT_FORM_DATA,
    ...(storedThreatModel?.formData || {}),
  }));
  const [report, setReport] = useState(storedThreatModel?.report ?? null);
  const [redaction, setRedaction] = useState(storedThreatModel?.redaction ?? null);
  const [filedAt, setFiledAt] = useState(storedThreatModel?.generatedAt ?? null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [pendingPrivacyReview, setPendingPrivacyReview] = useState(null);

  /* Hydrate the form/report when the stored model arrives from the auth
     context after a refresh. Only patched once per stored timestamp so the
     journalist can keep editing without their input getting overwritten. */
  useEffect(() => {
    if (!storedThreatModel?.generatedAt) return;
    if (filedAt === storedThreatModel.generatedAt) return;
    setFormData((current) => ({
      ...current,
      ...(storedThreatModel.formData || {}),
    }));
    setReport(storedThreatModel.report ?? null);
    setRedaction(storedThreatModel.redaction ?? null);
    setFiledAt(storedThreatModel.generatedAt);
  }, [storedThreatModel?.generatedAt, filedAt, storedThreatModel]);

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      deviceProfile: current.deviceProfile || `Security score: ${latestScore?.score ?? 'unknown'}/100. Completed secure setup tasks: ${completedTasks}/31.`,
      communicationProfile: current.communicationProfile || (weakAreas.length
        ? `Weakest areas currently on file: ${weakAreas.join(', ')}.`
        : 'No weak areas are currently flagged in the security score.'),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestScore?.score, completedTasks, weakAreas.join(' | ')]);

  const updateField = (field) => (event) => {
    setFormData((current) => ({ ...current, [field]: event.target.value }));
    if (error) setError('');
  };

  const runThreatModel = async (payload, clientFlags = []) => {
    setGenerating(true);
    setError('');

    try {
      const result = await requestThreatModelReport({
        ...payload,
        overallScore: latestScore?.score ?? null,
        weakAreas,
        completedTasks,
      });
      const flags = [...new Set([...(clientFlags || []), ...(result?.redaction?.flags || [])])];
      const nextRedaction = {
        applied: flags.length > 0,
        flags,
        clientReviewed: clientFlags.length > 0,
      };
      const generatedAt = new Date().toISOString();

      setReport(result.report);
      setRedaction(nextRedaction);
      setFiledAt(generatedAt);

      if (user?.uid && result?.report) {
        try {
          await persistLatestThreatModel(user.uid, {
            generatedAt,
            formData: payload,
            report: result.report,
            redaction: nextRedaction,
          });
        } catch (persistError) {
          logError('Failed to persist threat model report:', persistError);
        }
      }
    } catch (requestError) {
      logError('Threat model generation failed:', requestError);
      setError('The threat desk could not generate a report right now. Please try again in a moment.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = async (event) => {
    event.preventDefault();

    if (!formData.beat.trim() || !formData.region.trim()) {
      setError('Add at least the reporting beat and the operating region before generating a threat model.');
      return;
    }

    const analysis = analyzePrivacyPayload([
      { key: 'publicationTimeline', label: 'Publication timeline', text: formData.publicationTimeline },
      { key: 'recentIncidents', label: 'Recent incidents or warning signs', text: formData.recentIncidents },
      { key: 'deviceProfile', label: 'Device profile', text: formData.deviceProfile },
      { key: 'communicationProfile', label: 'Communication profile', text: formData.communicationProfile },
      { key: 'notes', label: 'Additional notes', text: formData.notes },
    ]);

    if (analysis.hasSensitive) {
      setPendingPrivacyReview({
        analysis,
        payload: formData,
      });
      return;
    }

    await runThreatModel(formData);
  };

  const threatMeta = THREAT_LEVEL_META[report?.threatLevel] || THREAT_LEVEL_META.medium;
  const filedDate = formatFiledDate(filedAt || new Date());
  const primaryRoute = report?.fieldRecommendations?.[0]
    ? {
        ...report.fieldRecommendations[0],
        destinationMeta: DESTINATION_META[report.fieldRecommendations[0].destination] || DESTINATION_META.resources,
      }
    : null;

  return (
    <NewsPage className="threat-dossier scoreDossier">
      <PrivacyGuardModal
        open={Boolean(pendingPrivacyReview)}
        title="Review sensitive assignment details"
        description="The threat desk input appears to include details that could identify a source, meeting, or communication channel. Review the redacted version before generating the report."
        analysis={pendingPrivacyReview?.analysis}
        confirmLabel="Generate from redacted details"
        loading={generating}
        onClose={() => setPendingPrivacyReview(null)}
        onEdit={() => setPendingPrivacyReview(null)}
        onConfirm={async () => {
          const analysis = pendingPrivacyReview?.analysis;
          const payload = pendingPrivacyReview?.payload;
          if (!analysis || !payload) return;

          const redactedMap = Object.fromEntries(
            analysis.entries.map((entry) => [entry.key, entry.redacted])
          );
          const clientFlags = analysis.flags || [];

          setPendingPrivacyReview(null);
          await runThreatModel({
            ...payload,
            ...redactedMap,
          }, clientFlags);
        }}
      />
      <Motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="news-page-topline">
          <span className="eyebrow sm text-oxblood">Threat Desk · Structured Risk Assessment</span>
          <span className="eyebrow sm">Authenticated Workspace</span>
        </div>
        <NewsRule />

        <div className="threat-dossier__hero">
          <div className="threat-dossier__hero-copy">
            <h1 className="display text-4xl md:text-6xl leading-none">
              Threat Model<br />Generator<span className="italic-ox">.</span>
            </h1>
            <p className="mt-5 text-base md:text-lg leading-relaxed text-ink-soft max-w-[38rem]">
              Describe your reporting environment and SafePress will produce a structured threat model for your current work, likely adversaries, exposed workflows, and the next actions that matter most.
            </p>
          </div>
        </div>
      </Motion.div>

      <Motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        onSubmit={handleGenerate}
        className="mt-10"
      >
        <NewsNotice tone="info" icon={ShieldAlert}>
          <p className="text-sm leading-relaxed text-ink-soft">
            SafePress removes obvious identifying details from your notes before sending them for analysis. Use this report as a practical guide for next steps, then contact a specialist if the situation is urgent or high risk.
          </p>
        </NewsNotice>

        <div className="editorial-form-layout threat-dossier__form-layout">
          <div className="editorial-form-main">
            <div className="threat-intake-sheet">
              <Section
                n="01"
                label="Assignment profile"
                title="Describe the assignment the desk is reading."
                note="Give enough story context that the model can judge whether this is a routine beat, a pressure point, or something already escalating."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                  <NewsField no="01" label="Reporting beat">
                    <input
                      type="text"
                      value={formData.beat}
                      onChange={updateField('beat')}
                      placeholder="Investigative corruption, political accountability, organized crime..."
                    />
                  </NewsField>
                  <NewsField no="02" label="Primary region or country">
                    <input
                      type="text"
                      value={formData.region}
                      onChange={updateField('region')}
                      placeholder="Romania, Eastern Europe, cross-border EU reporting..."
                    />
                  </NewsField>
                  <NewsField no="03" label="Publication timeline">
                    <input
                      type="text"
                      value={formData.publicationTimeline}
                      onChange={updateField('publicationTimeline')}
                      placeholder="Publishing this week, long-running investigation, source contact just started..."
                    />
                  </NewsField>
                  <NewsField no="04" label="Recent incidents or warning signs">
                    <textarea
                      rows="4"
                      value={formData.recentIncidents}
                      onChange={updateField('recentIncidents')}
                      placeholder="Suspicious login, phishing, source intimidation, confiscated device, unusual surveillance..."
                    />
                  </NewsField>
                </div>
              </Section>

              <Section
                n="02"
                label="Risk posture"
                title="Mark how exposed this assignment really is."
                note="These posture choices tell the desk how expensive a weak habit becomes if this story is already drawing attention."
              >
                <OptionGroup
                  legendNo="05"
                  legend="Source sensitivity"
                  options={SOURCE_SENSITIVITY_OPTIONS}
                  value={formData.sourceSensitivity}
                  onChange={(value) => setFormData((current) => ({ ...current, sourceSensitivity: value }))}
                />

                <div className="mt-8">
                  <OptionGroup
                    legendNo="06"
                    legend="Public visibility"
                    options={PUBLIC_VISIBILITY_OPTIONS}
                    value={formData.publicVisibility}
                    onChange={(value) => setFormData((current) => ({ ...current, publicVisibility: value }))}
                  />
                </div>

                <div className="mt-8">
                  <OptionGroup
                    legendNo="07"
                    legend="Travel profile"
                    options={TRAVEL_PROFILE_OPTIONS}
                    value={formData.travelProfile}
                    onChange={(value) => setFormData((current) => ({ ...current, travelProfile: value }))}
                  />
                </div>
              </Section>

              <Section
                n="03"
                label="Operational habits"
                title="Show how you actually move through the work."
                note="The better this reflects your device, channel, and field routines, the more useful the model’s recommendations become."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                  <NewsField no="08" label="Device profile">
                    <textarea
                      rows="5"
                      value={formData.deviceProfile}
                      onChange={updateField('deviceProfile')}
                      placeholder="Laptop/phone mix, encryption status, personal vs work device separation, border crossing habits..."
                    />
                  </NewsField>

                  <NewsField no="09" label="Communication profile">
                    <textarea
                      rows="5"
                      value={formData.communicationProfile}
                      onChange={updateField('communicationProfile')}
                      placeholder="Signal, email, in-person meetings, burner devices, cloud collaboration, editor workflows..."
                    />
                  </NewsField>

                  <NewsField no="10" label="Additional notes for the threat desk" className="md:col-span-2">
                    <textarea
                      rows="5"
                      value={formData.notes}
                      onChange={updateField('notes')}
                      placeholder="Anything else that changes the threat picture: source vulnerability, legal pressure, upcoming travel, newsroom constraints, or operational concerns."
                    />
                  </NewsField>
                </div>
              </Section>
            </div>

            {error && (
              <NewsNotice tone="danger" icon={AlertTriangle} className="mt-10">
                <p className="text-sm leading-relaxed text-ink-soft">{error}</p>
              </NewsNotice>
            )}

            <div className="threat-dossier__submit">
              <div>
                <span className="eyebrow sm">Threat desk input prepared from your current profile and this assignment snapshot.</span>
                <p className="threat-dossier__submit-note">
                  The model works best when the desk can see both the story pressure and the habits carrying it.
                </p>
              </div>
              <div className="threat-dossier__submit-actions">
                <NewsButton type="submit" disabled={generating} className="threat-dossier__submit-button">
                  <Radar className={`w-4 h-4 ${generating ? 'animate-pulse' : ''}`} />
                  {generating ? 'Generating the report...' : 'Generate threat model'}
                </NewsButton>
              </div>
            </div>
          </div>

          <aside className="editorial-form-rail threat-dossier__rail">
            <div className="editorial-form-sheet editorial-form-sheet--aside">
              <div className="editorial-form-sheet__head">
                <div>
                  <p className="eyebrow sm text-oxblood">Threat desk workflow</p>
                  <h2 className="display-soft text-2xl leading-none mt-3">What this intake is trying to capture.</h2>
                </div>
              </div>
              <div className="editorial-form-sheet__body">
                <div className="editorial-timeline">
                  {THREAT_WORKFLOW.map((step) => (
                    <div key={step.no} className="editorial-timeline__item">
                      <span className="editorial-timeline__no">{step.no}</span>
                      <div>
                        <p className="editorial-timeline__title">{step.title}</p>
                        <p className="editorial-timeline__body">{step.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="editorial-form-sheet editorial-form-sheet--aside">
              <div className="editorial-form-sheet__head">
                <div>
                  <p className="eyebrow sm text-brass">Context in memory</p>
                  <h2 className="display-soft text-2xl leading-none mt-3">Signals already loaded.</h2>
                </div>
              </div>
              <div className="editorial-form-sheet__body">
                <div className="threat-dossier__memory-grid">
                  <div className="verification-dossier__summary-item">
                    <span>Latest score</span>
                    <p>{latestScore?.score ?? 'No score on file'}</p>
                  </div>
                  <div className="verification-dossier__summary-item">
                    <span>Setup progress</span>
                    <p>{completedTasks}/31 tasks complete</p>
                  </div>
                </div>
                <div className="verification-dossier__summary-grid threat-dossier__memory-summary">
                  <div className="verification-dossier__summary-item">
                    <span>Weak areas</span>
                    <p>{weakAreas.join(', ') || 'No current flags'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="editorial-form-sheet editorial-form-sheet--aside">
              <div className="editorial-form-sheet__head">
                <div>
                  <p className="eyebrow sm text-ink">Output shape</p>
                  <h2 className="display-soft text-2xl leading-none mt-3">What comes back.</h2>
                </div>
              </div>
              <div className="editorial-form-sheet__body">
                <div className="verification-dossier__signal-list">
                  <div className="verification-dossier__signal-item">
                    <Users className="w-4 h-4 text-oxblood" />
                    <p>Likely adversaries and who is most capable of creating pressure on this assignment.</p>
                  </div>
                  <div className="verification-dossier__signal-item">
                    <Compass className="w-4 h-4 text-brass" />
                    <p>Exposed workflows plus the first guided route that matters most.</p>
                  </div>
                  <div className="verification-dossier__signal-item">
                    <NotebookPen className="w-4 h-4 text-ink" />
                    <p>Immediate and longer-term actions you can carry straight into the field.</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <AnimatePresence>
          {generating && (
            <Motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="threat-generating-panel"
            >
              <div className="threat-generating-panel__stamp">Threat desk processing</div>
              <div className="threat-generating-panel__body">
                <div className="threat-generating-panel__dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div>
                  <p className="news-card-title">Assembling the dossier</p>
                  <p className="news-card-copy mt-2">
                    Reviewing the assignment, weighting current exposures, and drafting the first action set.
                  </p>
                </div>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </Motion.form>

      <AnimatePresence mode="wait">
        {report && (
          <Motion.div
            key={report.summary}
            className="scoreReport mt-14"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="news-page-topline scoreReportTopline">
              <span className="eyebrow sm text-oxblood">Threat Desk — Field assessment</span>
              <span className="eyebrow sm">Filed · {filedDate}</span>
            </div>
            <NewsRule />

            <div className="scoreMetaGrid">
              <div className="scoreMetaCard">
                <p className="eyebrow sm">Assignment</p>
                <p className="display-soft text-xl md:text-2xl mt-2 leading-tight line-clamp-2">
                  {formData.beat ? toTitleCase(formData.beat) : 'Unspecified'}
                </p>
                <p className="eyebrow text-[10px] normal-case text-smoke mt-1">
                  {formData.region ? toTitleCase(formData.region) : 'Region unspecified'}
                </p>
              </div>
              <div className="scoreMetaCard">
                <p className="eyebrow sm">Threat Level</p>
                <p className={`display-soft text-xl md:text-2xl mt-2 leading-tight ${threatMeta.tone}`}>
                  {threatMeta.label}
                </p>
                <p className="eyebrow text-[10px] normal-case text-smoke mt-1">
                  Generated assessment
                </p>
              </div>
              <div className="scoreMetaCard">
                <p className="eyebrow sm">Primary Focus</p>
                <p className="display-soft text-xl md:text-2xl mt-2 leading-tight">
                  {primaryRoute ? primaryRoute.title : 'Maintain Posture'}
                </p>
                <p className="eyebrow text-[10px] normal-case text-smoke mt-1">
                  {primaryRoute ? 'Top guided route' : 'No critical gaps flagged'}
                </p>
              </div>
            </div>

            <div className="scoreHero">
              <article className="scoreSheet">
                <div className="scoreSheetTabs" aria-hidden="true">
                  <span />
                  <span />
                </div>

                <div className="scoreSheetTopline">
                  <div>
                    <p className="eyebrow sm text-oxblood">Threat Assessment</p>
                    <p className="eyebrow text-[10px] normal-case text-smoke mt-1">{filedDate}</p>
                  </div>
                  <NewsBadge color={threatMeta.color}>{threatMeta.label}</NewsBadge>
                </div>

                <div className="scoreSheetBody threatSheetBody">
                  <div className="threatSheetMark">
                    <h1 className={`display text-5xl md:text-[5.5rem] leading-[0.92] num ${threatMeta.tone}`}>
                      {threatMeta.label.split(' ')[0]}<br />
                      <span className="text-smoke">risk</span><span className="italic-ox">.</span>
                    </h1>
                    <p className="display-soft text-xl md:text-2xl mt-4 leading-tight">
                      <em className="italic-ox">{threatMeta.headline}</em>
                    </p>
                  </div>

                  <div className="threatSheetCopyCol">
                    <p className="scoreSheetCopy threatSheetCopy">{report.summary}</p>
                    <div className="scoreSheetActions">
                      {primaryRoute && (
                        <Link to={primaryRoute.destinationMeta.to} className="btn">
                          {primaryRoute.destinationMeta.label} <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                      <Link to="/secure-setup" className="btn ghost">
                        Open secure setup <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="scoreStats">
                  <div className="scoreStat">
                    <span>Source Sensitivity</span>
                    <strong>{toTitleCase(formData.sourceSensitivity)}</strong>
                  </div>
                  <div className="scoreStat">
                    <span>Public Visibility</span>
                    <strong>{toTitleCase(formData.publicVisibility)}</strong>
                  </div>
                  <div className="scoreStat">
                    <span>Travel Profile</span>
                    <strong>{toTitleCase(formData.travelProfile)}</strong>
                  </div>
                  <div className="scoreStat">
                    <span>Setup Completed</span>
                    <strong>{completedTasks}/31</strong>
                  </div>
                </div>
              </article>

              <div className="scoreSide">
                <NewsCard accent={threatMeta.color} className="scoreSideCard">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className={`eyebrow sm ${threatMeta.tone}`}>Source Risk</p>
                      <h2 className="news-card-title mt-2">{threatMeta.label}</h2>
                    </div>
                    <ShieldAlert className={`w-4 h-4 shrink-0 mt-0.5 ${threatMeta.tone}`} />
                  </div>
                  <p className="news-card-copy mt-4">{report.sourceRisk}</p>
                  <p className="news-card-copy mt-3">{threatMeta.note}</p>
                </NewsCard>

                {redaction && (
                  <NewsCard accent="#375E5A" className="scoreSideCard">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="eyebrow sm text-ink">Privacy Guard</p>
                        <h2 className="news-card-title mt-2">
                          {redaction.applied ? 'Sensitive details masked' : 'No flags raised'}
                        </h2>
                      </div>
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-ink" />
                    </div>
                    <p className="news-card-copy mt-4">
                      {redaction.applied && redaction.flags?.length
                        ? `Before the model call we redacted: ${redaction.flags.map((flag) => REDACTION_FLAG_LABELS[flag] || flag).join(', ')}.`
                        : 'No obvious sensitive identifiers were detected in the free-text fields sent to the model.'}
                    </p>
                  </NewsCard>
                )}

                {report.immediateActions?.length > 0 && (
                  <NewsCard accent="#375E5A" className="scoreSideCard">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="eyebrow sm text-ink">Immediate actions</p>
                        <h2 className="news-card-title mt-2">
                          {report.immediateActions.length === 1
                            ? '1 step before next field activity'
                            : `${report.immediateActions.length} steps before next field activity`}
                        </h2>
                      </div>
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-ink" />
                    </div>
                    <ol className="scoreSideActions">
                      {report.immediateActions.slice(0, 4).map((action, i) => (
                        <li key={i} className="scoreSideAction">
                          <span className="scoreSideActionNo">{String(i + 1).padStart(2, '0')}</span>
                          <span className="scoreSideActionText">{action}</span>
                        </li>
                      ))}
                    </ol>
                    {report.immediateActions.length > 4 && (
                      <p className="eyebrow text-[9px] normal-case text-smoke mt-3">
                        +{report.immediateActions.length - 4} more in the full report below
                      </p>
                    )}
                  </NewsCard>
                )}
              </div>
            </div>

            <section className="scoreSection">
              <div className="scoreSectionHeader" style={{ '--section-accent': threatMeta.color }}>
                <div className="min-w-0">
                  <p className="news-kicker">Threat picture</p>
                  <h2 className="news-section-title">Adversaries and exposed routines.</h2>
                  <p className="news-section-lede">
                    Who is most likely to push back on this work, and where exposure currently sits.
                  </p>
                </div>
                <div className="news-section-mark" aria-hidden="true">
                  <Radar className="w-4 h-4" />
                </div>
              </div>

              <div className="threatBlockGrid">
                {[REPORT_BLOCKS[0], REPORT_BLOCKS[1]].map((block, idx) => (
                  <ThreatListCard
                    key={block.key}
                    title={block.title}
                    items={report[block.key] || []}
                    accent={block.accent}
                    Icon={block.Icon}
                    summary={block.summary}
                    index={idx}
                  />
                ))}
              </div>
            </section>

            <section className="scoreSection">
              <div className="scoreSectionHeader" style={{ '--section-accent': '#375E5A' }}>
                <div className="min-w-0">
                  <p className="news-kicker">Recommended moves</p>
                  <h2 className="news-section-title">Immediate and longer-term actions.</h2>
                  <p className="news-section-lede">
                    The shortlist of hardening moves, ordered by how soon they need to happen.
                  </p>
                </div>
                <div className="news-section-mark" aria-hidden="true">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>

              <div className="threatBlockGrid">
                {[REPORT_BLOCKS[2], REPORT_BLOCKS[3]].map((block, idx) => (
                  <ThreatListCard
                    key={block.key}
                    title={block.title}
                    items={report[block.key] || []}
                    accent={block.accent}
                    Icon={block.Icon}
                    summary={block.summary}
                    index={idx + 2}
                  />
                ))}
              </div>
            </section>

            {report.fieldRecommendations?.length > 0 && (
              <section className="scoreSection">
                <div className="scoreSectionHeader" style={{ '--section-accent': '#7B2E2E' }}>
                  <div className="min-w-0">
                    <p className="news-kicker">{report.fieldRecommendations.length} guided routes</p>
                    <h2 className="news-section-title">Routes through SafePress.</h2>
                    <p className="news-section-lede">
                      Direct paths back into the product to turn this assessment into concrete work.
                    </p>
                  </div>
                  <div className="news-section-mark" aria-hidden="true">
                    <Compass className="w-4 h-4" />
                  </div>
                </div>

                <div className="threatRouteGrid">
                  {report.fieldRecommendations.map((item, idx) => {
                    const destination = DESTINATION_META[item.destination] || DESTINATION_META.resources;
                    return (
                      <NewsCard
                        key={`${item.destination}-${item.title}`}
                        accent="#7B2E2E"
                        className="threatRouteCard"
                      >
                        <div className="threatBlockHead">
                          <div className="threatBlockLabel">
                            <NotebookPen className="w-3.5 h-3.5 text-smoke" />
                            <span>{String(idx + 1).padStart(2, '0')} · Guided route</span>
                          </div>
                          <NewsBadge color="#7B2E2E">Action</NewsBadge>
                        </div>
                        <h3 className="threatBlockTitle">{item.title}</h3>
                        <p className="news-card-copy mt-2">{item.rationale}</p>
                        <Link to={destination.to} className="scoreLink">
                          {destination.label} <ArrowRight className="w-3 h-3" />
                        </Link>
                      </NewsCard>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="scoreFooter">
              <span className="eyebrow sm">Threat assessment · Filed {filedDate}</span>
              <div className="flex gap-3 flex-wrap">
                <Link to="/resources?tab=source-protection" className="btn ghost">
                  Source protection guide <ArrowRight className="w-4 h-4" />
                </Link>
                {user?.accountType !== 'specialist' && (
                  <Link to="/request-support" className="btn ghost">
                    Request specialist support <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </NewsPage>
  );
};

export default ThreatModel;
