import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ShieldAlert,
  Radar,
  Users,
  NotebookPen,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { requestThreatModelReport } from '../features/ai/services/aiService';
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
  NewsSectionHeader,
} from '../components/editorial/NewsPage';

const THREAT_LEVEL_META = {
  low: { label: 'Low risk', color: '#375E5A' },
  medium: { label: 'Medium risk', color: '#8A6D2C' },
  high: { label: 'High risk', color: '#7B2E2E' },
  critical: { label: 'Critical risk', color: '#7B2E2E' },
};

const DESTINATION_META = {
  'secure-setup': { to: '/secure-setup', label: 'Open Secure Setup' },
  resources: { to: '/resources', label: 'Open Manual' },
  'source-protection': { to: '/resources?tab=source-protection', label: 'Open Source Protection Guide' },
  'request-support': { to: '/request-support', label: 'Request Specialist Support' },
  'ai-advisor': { to: '/ai-advisor', label: 'Continue in AI Advisor' },
};

const SOURCE_SENSITIVITY_OPTIONS = [
  { id: 'low', label: 'Low', desc: 'mostly public or low-risk sources' },
  { id: 'moderate', label: 'Moderate', desc: 'some confidential sources or sensitive interviews' },
  { id: 'high', label: 'High', desc: 'confidential sources could face retaliation' },
  { id: 'critical', label: 'Critical', desc: 'source exposure could cause arrest, violence, or severe reprisal' },
];

const PUBLIC_VISIBILITY_OPTIONS = [
  { id: 'low', label: 'Low', desc: 'few bylines, limited public profile' },
  { id: 'medium', label: 'Medium', desc: 'regular bylines or moderate social visibility' },
  { id: 'high', label: 'High', desc: 'high public exposure, broadcast presence, or targeted profile' },
];

const TRAVEL_PROFILE_OPTIONS = [
  { id: 'rare', label: 'Rare', desc: 'mostly desk-based work' },
  { id: 'regional', label: 'Regional', desc: 'regular domestic or nearby travel' },
  { id: 'cross-border', label: 'Cross-border', desc: 'international travel or border crossings' },
  { id: 'hostile', label: 'Hostile', desc: 'authoritarian, conflict, or high-surveillance environments' },
];

const Section = ({ n, label, children }) => (
  <section className="threat-section">
    <p className="eyebrow sm threat-section__header">
      <span className="text-ink mr-2">§ {n}</span>
      <span className="text-ink-soft">{label}</span>
    </p>
    {children}
  </section>
);

const OptionGroup = ({ legendNo, legend, options, value, onChange }) => (
  <div className="f-row">
    <span className="f-lbl">
      <span className="no">№ {legendNo}</span>
      <span>{legend}</span>
    </span>
    <div className="threat-option-grid">
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`threat-option ${active ? 'is-active' : ''} ${
              active
                ? 'border-ink bg-paper-soft'
                : 'border-ink/12 hover:border-ink/25 hover:bg-paper-soft/50'
            }`}
          >
            <p className="eyebrow sm text-ink">{option.label}</p>
            <p className="text-sm leading-relaxed text-ink-soft mt-1">{option.desc}</p>
          </button>
        );
      })}
    </div>
  </div>
);

const ListCard = ({ title, items, accent }) => (
  <NewsCard accent={accent} className="threat-list-card">
    <h3 className="news-card-title">{title}</h3>
    <div className="mt-3 space-y-3">
      {items.length > 0 ? items.map((item) => (
        <div key={item} className="flex gap-3 items-start">
          <span className="mt-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
          <p className="news-card-copy">{item}</p>
        </div>
      )) : (
        <p className="news-card-copy">No items generated in this section.</p>
      )}
    </div>
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

  const [formData, setFormData] = useState({
    beat: '',
    region: '',
    sourceSensitivity: 'high',
    publicVisibility: 'medium',
    travelProfile: 'regional',
    deviceProfile: '',
    communicationProfile: '',
    publicationTimeline: '',
    recentIncidents: '',
    notes: '',
  });
  const [report, setReport] = useState(null);
  const [redaction, setRedaction] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [pendingPrivacyReview, setPendingPrivacyReview] = useState(null);

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      deviceProfile: current.deviceProfile || `Security score: ${latestScore?.score ?? 'unknown'}/100. Completed secure setup tasks: ${completedTasks}/31.`,
      communicationProfile: current.communicationProfile || (weakAreas.length
        ? `Weakest areas currently on file: ${weakAreas.join(', ')}.`
        : 'No weak areas are currently flagged in the security score.'),
    }));
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
      setReport(result.report);
      const flags = [...new Set([...(clientFlags || []), ...(result?.redaction?.flags || [])])];
      setRedaction({
        applied: flags.length > 0,
        flags,
        clientReviewed: clientFlags.length > 0,
      });
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

  return (
    <NewsPage className="threat-dossier">
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
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-baseline justify-between pb-3">
          <span className="eyebrow sm text-oxblood">Threat Desk · Structured risk assessment</span>
          <span className="eyebrow sm">Authenticated workspace</span>
        </div>
        <NewsRule />

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.25fr_0.9fr] gap-10 items-start lg:items-center">
          <div>
            <h1 className="display text-4xl md:text-6xl leading-none">
              Threat model<br />generator<span className="italic-ox">.</span>
            </h1>
            <p className="mt-5 text-base md:text-lg leading-relaxed text-ink-soft max-w-[34rem]">
              Describe your reporting environment and SafePress will produce a structured threat model for your current work, likely adversaries, exposed workflows, and the next actions that matter most.
            </p>
          </div>

          <NewsCard accent="#8A6D2C" className="threat-context-card">
            <div className="flex items-center gap-3">
              <Radar className="w-4 h-4 text-brass" />
              <p className="eyebrow sm text-brass">Case context already loaded</p>
            </div>
            <div className="threat-context-card__grid">
              <div className="threat-context-card__item">
                <p className="eyebrow sm text-smoke">Latest score</p>
                <p className="display-soft text-2xl mt-2 leading-none">{latestScore?.score ?? '—'}</p>
              </div>
              <div className="threat-context-card__item">
                <p className="eyebrow sm text-smoke">Setup completed</p>
                <p className="display-soft text-2xl mt-2 leading-none">{completedTasks}<span className="text-smoke text-base">/31</span></p>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-ink/10">
              <p className="eyebrow sm text-smoke">Weak areas already in context</p>
              <p className="news-card-copy mt-2">
                <span className="text-ink">{weakAreas.join(', ') || 'none currently flagged'}</span>
              </p>
            </div>
          </NewsCard>
        </div>
      </motion.div>

      <motion.form
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

        <div className="threat-intake-sheet">
          <Section n="01" label="Assignment profile">
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

          <Section n="02" label="Risk posture">
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

          <Section n="03" label="Operational habits">
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
          <span className="eyebrow sm">Threat desk input prepared from your current profile and this assignment snapshot.</span>
          <div className="threat-dossier__submit-actions">
            <NewsButton type="submit" disabled={generating} className="threat-dossier__submit-button">
              <Radar className={`w-4 h-4 ${generating ? 'animate-pulse' : ''}`} />
              {generating ? 'Generating the report...' : 'Generate threat model'}
            </NewsButton>
          </div>
        </div>

        <AnimatePresence>
          {generating && (
            <motion.div
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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>

      <AnimatePresence mode="wait">
        {report && (
          <motion.div
            key={report.summary}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-14"
          >
            <NewsSectionHeader
              className="threat-report-header"
              kicker="Generated report"
              title="Current threat model"
              lede="A structured risk picture for this assignment, based on your current posture and the reporting conditions you described."
              icon={Radar}
              accent={threatMeta.color}
            />

            <div className="threat-report-overview">
              <NewsCard accent={threatMeta.color} className="threat-report-summary">
                <div className="flex items-center justify-between gap-4">
                  <p className="news-card-title">Threat summary</p>
                  <NewsBadge color={threatMeta.color}>{threatMeta.label}</NewsBadge>
                </div>
                <p className="news-card-copy mt-3">{report.summary}</p>
              </NewsCard>

              <div className="threat-report-sidecards">
                <NewsNotice
                  tone={report.threatLevel === 'high' || report.threatLevel === 'critical' ? 'danger' : 'info'}
                  icon={ShieldAlert}
                  className="threat-report-slip"
                >
                  <p className="text-sm leading-relaxed text-ink-soft">
                    <span className="text-ink font-medium">Source risk:</span> {report.sourceRisk}
                  </p>
                </NewsNotice>

                {redaction && (
                  <NewsNotice tone="info" icon={CheckCircle2} className="threat-report-slip">
                    <p className="text-sm leading-relaxed text-ink-soft">
                      {redaction.applied && redaction.flags?.length
                        ? `Sensitive details were redacted before the model call: ${redaction.flags.map((flag) => REDACTION_FLAG_LABELS[flag] || flag).join(', ')}.`
                        : 'The current privacy scan did not flag obvious sensitive identifiers in the free-text fields sent to the model.'}
                    </p>
                  </NewsNotice>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              <ListCard title="Likely adversaries" items={report.adversaries} accent="#7B2E2E" />
              <ListCard title="Exposed workflows and attack surfaces" items={report.attackSurfaces} accent="#8A6D2C" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <ListCard title="Immediate actions" items={report.immediateActions} accent="#375E5A" />
              <ListCard title="Longer-term protections" items={report.longerTermActions} accent="#15110C" />
            </div>

            <section className="mt-12">
              <NewsSectionHeader
                kicker={`${report.fieldRecommendations.length} guided next steps`}
                title="Recommended routes through SafePress"
                lede="These links turn the threat model into concrete next actions inside the product."
                icon={NotebookPen}
                accent="#7B2E2E"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {report.fieldRecommendations.map((item) => {
                  const destination = DESTINATION_META[item.destination] || DESTINATION_META.resources;
                  return (
                    <NewsCard key={`${item.destination}-${item.title}`} accent="#7B2E2E" className="threat-route-card">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="news-card-title">{item.title}</h3>
                          <p className="news-card-copy mt-2">{item.rationale}</p>
                        </div>
                        <Users className="w-4 h-4 flex-shrink-0 text-oxblood mt-0.5" />
                      </div>
                      <Link
                        to={destination.to}
                        className="mt-4 inline-flex items-center gap-1 eyebrow sm text-oxblood hover:text-ink transition-colors"
                      >
                        {destination.label}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </NewsCard>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/secure-setup" className="link-handdrawn">Open secure setup</Link>
                <Link to="/resources?tab=source-protection" className="link-handdrawn">Open source protection guide</Link>
                {user?.accountType !== 'specialist' && (
                  <Link to="/request-support" className="link-handdrawn">Request specialist support</Link>
                )}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </NewsPage>
  );
};

export default ThreatModel;
