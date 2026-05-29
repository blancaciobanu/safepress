import { motion as Motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock3,
  FileText,
  Send,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import VerifiedBadge from '../components/VerifiedBadge';
import {
  createSupportRequest,
  draftSupportRequestWithAI,
  listApprovedSpecialists,
} from '../features/support/services/supportService';
import { EMERGENCY_SUPPORT_CONTACTS } from '../config/externalResources';
import { logError } from '../utils/logger';
import {
  NewsButton,
  NewsField,
  NewsNotice,
  NewsPage,
  NewsRule,
} from '../components/editorial/NewsPage';
import PrivacyGuardModal from '../features/ai/components/PrivacyGuardModal';
import { analyzePrivacyPayload, REDACTION_FLAG_LABELS } from '../features/ai/services/privacyGuard';

/* Intake form — typed carbon-copy. Numbered sections (§ 01 / § 02 / § 03),
   numbered fields (№ 01 / № 02 …), and a stamped "Filed at" success state.
   Vocabulary: .f-row, .btn, .italic-ox, .eyebrow, .news-notice.
   Color tokens via Tailwind @theme — text-ink, text-oxblood, bg-paper-soft. */

const CRISIS_TYPES = [
  { id: 'hacked',   label: "I've been hacked" },
  { id: 'source',   label: 'My source has been exposed' },
  { id: 'doxxed',   label: "I'm being doxxed" },
  { id: 'phishing', label: 'I received a phishing attempt' },
  { id: 'other',    label: 'Other security concern' },
];

const URGENCY_LEVELS = [
  { id: 'normal',    label: 'Normal',    desc: 'within 48 hours' },
  { id: 'urgent',    label: 'Urgent',    desc: 'within 24 hours' },
  { id: 'emergency', label: 'Emergency', desc: 'immediate threat', alarm: true },
];

const CONTACT_METHODS = [
  { id: 'email',  label: 'Email' },
  { id: 'phone',  label: 'Phone call' },
  { id: 'signal', label: 'Signal messenger' },
];

const INTAKE_STEPS = [
  {
    no: '01',
    title: 'File the incident',
    body: 'Capture the signal clearly enough that the queue can route it fast, even if you only have partial information.',
  },
  {
    no: '02',
    title: 'Specialist claims the file',
    body: 'Only after claim does the full reporter brief and contact route unlock to the specialist handling the case.',
  },
  {
    no: '03',
    title: 'Work the case inside the desk',
    body: 'Questions, containment notes, and the final resolution report stay in one place so the handoff stays calm.',
  },
];

const getMonogram = (value = '') =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '?';

const Section = ({ n, label, title, note, children }) => (
  <section className="editorial-form-sheet support-intake__section">
    <div className="editorial-form-sheet__head">
      <div>
        <p className="eyebrow sm">
          <span className="text-ink mr-2">§ {n}</span>
          <span className="text-ink-soft">{label}</span>
        </p>
        <h2 className="display-soft text-2xl md:text-3xl leading-none mt-3">
          {title}
        </h2>
        {note && (
          <p className="editorial-form-sheet__lede">{note}</p>
        )}
      </div>
    </div>
    <div className="editorial-form-sheet__body">
      {children}
    </div>
  </section>
);

const SupportSuccessView = ({ filedAt, specialistCount, submittedRequestId, formData }) => {
  // eslint-disable-next-line react-hooks/purity
  const fileRef = useRef(`SP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`).current;
  const filedStr = (filedAt || new Date()).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

  return (
    <NewsPage className="support-intake">
      <Motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="news-page-topline">
          <span className="eyebrow sm text-oxblood">Form SP-S · Request filed</span>
          <span className="eyebrow sm">Filed · {filedStr} UTC</span>
        </div>
        <NewsRule tone="oxblood" />

        <div className="support-intake__success-hero">
          <div>
            <h1 className="display text-4xl md:text-6xl mt-10 leading-none max-w-[18ch]">
              Your request is on <em className="italic-ox">the desk.</em>
            </h1>
            <p className="mt-6 text-base md:text-lg leading-relaxed text-ink-soft max-w-prose">
              {specialistCount > 0
                ? `${specialistCount} verified specialist${specialistCount === 1 ? ' is' : 's are'} on call. Expect first contact within 24h.`
                : 'A verified cybersecurity specialist will review your request and reach out to you soon.'}
            </p>
          </div>

          <div className="editorial-form-sheet editorial-form-sheet--aside support-intake__success-note">
            <div className="editorial-form-sheet__head">
              <div>
                <p className="eyebrow sm text-brass">Next movement</p>
                <h2 className="display-soft text-2xl leading-none mt-3">Keep the case thread as the single source of truth.</h2>
              </div>
            </div>
            <div className="editorial-form-sheet__body">
              <div className="editorial-timeline">
                <div className="editorial-timeline__item">
                  <span className="editorial-timeline__no">01</span>
                  <p>Watch for the first specialist message inside the case desk.</p>
                </div>
                <div className="editorial-timeline__item">
                  <span className="editorial-timeline__no">02</span>
                  <p>Reply there with any new developments instead of scattering updates across channels.</p>
                </div>
                <div className="editorial-timeline__item">
                  <span className="editorial-timeline__no">03</span>
                  <p>Once stabilized, the final report will stay filed with the case for future reference.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="support-intake__success-grid">
          <div className="support-intake__success-sheet">
            <div className="support-intake__meta-grid">
              <div className="support-intake__meta-card">
                <p className="eyebrow sm">File reference</p>
                <p className="display-soft text-2xl mt-2 leading-tight num">{fileRef}</p>
              </div>
              <div className="support-intake__meta-card">
                <p className="eyebrow sm">Filed at</p>
                <p className="display-soft text-2xl mt-2 leading-tight">{filedStr}</p>
              </div>
              <div className="support-intake__meta-card">
                <p className="eyebrow sm">Type</p>
                <p className="display-soft text-lg mt-2 leading-tight">
                  {CRISIS_TYPES.find((t) => t.id === formData.crisisType)?.label}
                </p>
              </div>
              <div className="support-intake__meta-card">
                <p className="eyebrow sm">Urgency</p>
                <p className={`display-soft text-lg mt-2 leading-tight ${formData.urgency === 'emergency' ? 'text-oxblood' : 'text-ink'}`}>
                  {URGENCY_LEVELS.find((u) => u.id === formData.urgency)?.label}
                </p>
              </div>
            </div>
          </div>

          <div className="support-intake__success-links">
            <Link to="/" className="support-intake__jump-link">
              <span>Return home</span>
              <span>→</span>
            </Link>
            {submittedRequestId && (
              <Link to={`/support-cases/${submittedRequestId}`} className="support-intake__jump-link">
                <span>Open case desk</span>
                <span>→</span>
              </Link>
            )}
            <Link to="/my-cases" className="support-intake__jump-link">
              <span>All my cases</span>
              <span>→</span>
            </Link>
            <Link to="/crisis" className="support-intake__jump-link">
              <span>View crisis steps</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </Motion.div>
    </NewsPage>
  );
};

const SupportIntakeSidebar = ({ specialistCount, recentSpecialists }) => (
  <aside className="editorial-form-rail support-intake__rail">
    <div className="editorial-form-sheet editorial-form-sheet--aside support-intake__dispatch">
      <div className="support-intake__dispatch-head">
        <div>
          <p className="eyebrow sm text-brass">Dispatch board</p>
          <h2 className="display-soft text-2xl leading-none mt-3">Live specialist coverage.</h2>
        </div>
        <VerifiedBadge size="sm" />
      </div>

      {specialistCount > 0 && (
        <div className="support-intake__dispatch-avatars">
          {recentSpecialists.map((sp) => (
            sp.avatarUrl ? (
              <img
                key={sp.id}
                src={sp.avatarUrl}
                alt={sp.realName || sp.username}
                title={sp.realName || sp.username}
                className="support-intake__dispatch-avatar"
              />
            ) : (
              <span
                key={sp.id}
                className="support-intake__dispatch-avatar support-intake__dispatch-avatar--mono"
                title={sp.realName || sp.username}
              >
                {getMonogram(sp.realName || sp.username || '')}
              </span>
            )
          ))}
        </div>
      )}

      <div className="support-intake__dispatch-grid">
        <div className="support-intake__dispatch-cell">
          <p className="eyebrow sm text-smoke">Verified desk</p>
          <p className="display-soft text-2xl leading-none mt-2">{specialistCount || '—'}</p>
          <p className="support-intake__dispatch-note">specialists currently visible to the queue</p>
        </div>
        <div className="support-intake__dispatch-cell">
          <p className="eyebrow sm text-smoke">Expected rhythm</p>
          <p className="display-soft text-2xl leading-none mt-2">24h</p>
          <p className="support-intake__dispatch-note">typical first reply when the desk is staffed</p>
        </div>
      </div>

      <p className="support-intake__dispatch-footnote">
        Full reporter details stay redacted in the intake tray until a verified specialist claims the file.
      </p>
    </div>

    <div className="editorial-form-sheet editorial-form-sheet--aside">
      <div className="editorial-form-sheet__head">
        <div>
          <p className="eyebrow sm text-oxblood">Intake protocol</p>
          <h2 className="display-soft text-2xl leading-none mt-3">How this request moves.</h2>
        </div>
      </div>
      <div className="editorial-form-sheet__body">
        <div className="editorial-timeline">
          {INTAKE_STEPS.map((step) => (
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
          <p className="eyebrow sm text-brass">Desk signals</p>
          <h2 className="display-soft text-2xl leading-none mt-3">What helps the triage pass.</h2>
        </div>
      </div>
      <div className="editorial-form-sheet__body">
        <div className="support-intake__signal-list">
          <div className="support-intake__signal-item">
            <Shield className="w-4 h-4 text-oxblood" />
            <p>Say whether a source, unpublished material, or a specific device is at risk.</p>
          </div>
          <div className="support-intake__signal-item">
            <Clock3 className="w-4 h-4 text-brass" />
            <p>Flag when the incident started and whether anything is still actively spreading or accessible.</p>
          </div>
          <div className="support-intake__signal-item">
            <FileText className="w-4 h-4 text-ink" />
            <p>Use the narrative box for sequence and scope, not just symptoms.</p>
          </div>
        </div>
      </div>
    </div>

    <div className="editorial-form-sheet editorial-form-sheet--aside">
      <div className="editorial-form-sheet__head">
        <div>
          <p className="eyebrow sm text-oxblood">Emergency route</p>
          <h2 className="display-soft text-2xl leading-none mt-3">If the situation is moving right now.</h2>
        </div>
      </div>
      <div className="editorial-form-sheet__body">
        <div className="support-intake__emergency">
          <Users className="w-4 h-4 text-oxblood" />
          <p>
            Call{' '}
            <a href={EMERGENCY_SUPPORT_CONTACTS[0].phoneHref} className="text-oxblood hover:underline">
              {EMERGENCY_SUPPORT_CONTACTS[0].phone}
            </a>{' '}
            for immediate escalation.
          </p>
        </div>
        <p className="support-intake__emergency-note">
          {EMERGENCY_SUPPORT_CONTACTS[0].org} · {EMERGENCY_SUPPORT_CONTACTS[0].available}
        </p>
      </div>
    </div>
  </aside>
);

const RequestSupport = () => {
  const { user, resendVerificationEmail, refreshUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [specialists, setSpecialists] = useState([]);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [filedAt, setFiledAt] = useState(null);
  const [submittedRequestId, setSubmittedRequestId] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [draftMeta, setDraftMeta] = useState(null);
  const [pendingPrivacyReview, setPendingPrivacyReview] = useState(null);

  useEffect(() => {
    const fetchSpecialists = async () => {
      try {
        const approved = await listApprovedSpecialists();
        setSpecialists(approved);
      } catch (error) {
        logError('Error fetching specialists:', error);
      }
    };
    fetchSpecialists();
  }, []);

  useEffect(() => {
    if (!user?.emailVerified) return;
    if (user?.tokenClaims?.email_verified) return;

    refreshUser().catch((error) => {
      logError('Failed to refresh verified session for support request:', error);
    });
  }, [user?.emailVerified, user?.tokenClaims?.email_verified, refreshUser]);

  const [formData, setFormData] = useState({
    name: user?.realName || '',
    email: user?.email || '',
    phone: '',
    crisisType: 'hacked',
    urgency: 'urgent',
    description: '',
    contactMethod: 'email',
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: user?.realName || '',
      email: user?.email || '',
    }));
  }, [user?.realName, user?.email]);

  if (user?.accountType === 'specialist') return <Navigate to="/specialist-dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!user || !user.emailVerified) return;

    let sessionUser = user;
    if (!user.tokenClaims?.email_verified) {
      try {
        const refreshedUser = await refreshUser();
        if (refreshedUser) {
          sessionUser = refreshedUser;
        }
      } catch (error) {
        logError('Failed to refresh auth token before support request submit:', error);
      }
    }

    if (!sessionUser?.tokenClaims?.email_verified) {
      setSubmitError(
        'Your email looks verified, but Firebase has not refreshed the secure session yet. Reload once or sign out and back in, then file the request again.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const created = await createSupportRequest({
        requesterId: sessionUser.uid,
        requesterName: formData.name,
        requesterEmail: formData.email,
        requesterPhone: formData.phone,
        crisisType: formData.crisisType,
        urgency: formData.urgency,
        description: formData.description,
        contactMethod: formData.contactMethod,
      });
      setSubmittedRequestId(created.id);
      setFiledAt(new Date());
      setSubmitted(true);
    } catch (error) {
      logError('Error submitting request:', error);
      if (error?.code === 'permission-denied' || error?.message?.includes('permission-denied')) {
        setSubmitError(
          'SafePress could not verify this session against the support-request rules. Reload once or sign in again, then try filing the request.'
        );
      } else {
        setSubmitError('Something went wrong while filing the request. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    const result = await resendVerificationEmail();
    setVerificationEmailSent(!!result?.sent);
  };

  const runDraftAssist = async (roughDetails, clientFlags = []) => {
    setDrafting(true);
    setDraftError('');

    try {
      const { draft, redaction } = await draftSupportRequestWithAI({ roughDetails });
      setFormData((prev) => ({
        ...prev,
        crisisType: draft.crisisType,
        urgency: draft.urgency,
        contactMethod: draft.contactMethod || prev.contactMethod,
        description: draft.description,
      }));
      const flags = [...new Set([...(clientFlags || []), ...(redaction?.flags || [])])];
      setDraftMeta({
        applied: flags.length > 0,
        flags,
        clientReviewed: clientFlags.length > 0,
      });
    } catch (error) {
      logError('Error drafting support request:', error);
      setDraftError('The drafting assistant is unavailable right now. You can still fill in the form manually.');
    } finally {
      setDrafting(false);
    }
  };

  const handleDraftAssist = async () => {
    const roughDetails = draftNotes.trim();
    if (!user || !user.emailVerified || drafting) return;

    if (roughDetails.length < 20) {
      setDraftError('Add a few more notes so the assistant has enough context to structure the request.');
      return;
    }

    const analysis = analyzePrivacyPayload([
      { key: 'roughNotes', label: 'Rough notes for the drafting assistant', text: roughDetails },
    ]);

    if (analysis.hasSensitive) {
      setPendingPrivacyReview({
        analysis,
        payload: roughDetails,
      });
      return;
    }

    await runDraftAssist(roughDetails);
  };

  const updateField = (field) => (e) =>
    setFormData({ ...formData, [field]: e.target.value });

  const specialistCount = specialists.length;
  const recentSpecialists = specialists.slice(0, 3);

  if (submitted) {
    return (
      <SupportSuccessView
        filedAt={filedAt}
        specialistCount={specialistCount}
        submittedRequestId={submittedRequestId}
        formData={formData}
      />
    );
  }

  /* ─── Form state ───────────────────────────────────────────────────── */

  const onDuty = specialistCount > 0
    ? `${specialistCount} specialist${specialistCount === 1 ? '' : 's'} on duty`
    : 'Specialists on call';

  return (
    <NewsPage className="support-intake">
      <PrivacyGuardModal
        open={Boolean(pendingPrivacyReview)}
        title="Review the redacted drafting notes"
        description="Your rough notes appear to contain identifying or source-sensitive details. Review the redacted version before SafePress drafts the specialist request."
        analysis={pendingPrivacyReview?.analysis}
        confirmLabel="Draft from redacted notes"
        loading={drafting}
        onClose={() => setPendingPrivacyReview(null)}
        onEdit={() => setPendingPrivacyReview(null)}
        onConfirm={async () => {
          const redactedText = pendingPrivacyReview?.analysis?.entries?.[0]?.redacted || '';
          const clientFlags = pendingPrivacyReview?.analysis?.flags || [];
          setPendingPrivacyReview(null);
          await runDraftAssist(redactedText, clientFlags);
        }}
      />
      {/* Form header — printed-form heading. */}
      <Motion.header
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="news-page-topline">
          <span className="eyebrow sm text-oxblood">
            Form SP-S — Specialist support request
          </span>
          <span className="eyebrow sm">{onDuty}</span>
        </div>
        <NewsRule />

        <div className="support-intake__hero">
          <div className="support-intake__hero-copy">
            <h1 className="display text-4xl md:text-6xl leading-none">
              Request specialist support<span className="italic-ox">.</span>
            </h1>
            <p className="mt-5 text-base md:text-lg leading-relaxed text-ink-soft">
              File the incident like a proper newsroom intake sheet. The clearer the first brief, the faster the desk can route you to the right specialist.
            </p>
            {user && (
              <p className="mt-3 text-sm text-smoke">
                Filed before?{' '}
                <Link to="/my-cases" className="link-handdrawn">
                  View your existing cases →
                </Link>
              </p>
            )}
          </div>
        </div>
      </Motion.header>

      {/* Form */}
      <Motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        onSubmit={handleSubmit}
        className="mt-10"
      >
        <div className="editorial-form-layout">
          <div className="editorial-form-main">
            {!user && (
              <NewsNotice tone="brass" icon={AlertCircle} className="mb-8">
                <p className="text-sm leading-relaxed text-ink-soft">
                  Sign in first to submit a confidential support request.{' '}
                  <Link to="/login" className="link-handdrawn">
                    Go to login
                  </Link>{' '}
                  or{' '}
                  <Link to="/signup" className="link-handdrawn">
                    create an account
                  </Link>
                  .
                </p>
              </NewsNotice>
            )}

            {user && !user.emailVerified && (
              <NewsNotice tone="brass" icon={AlertCircle} className="mb-8">
                <p className="text-sm leading-relaxed text-ink-soft">
                  Verify your email before sending a confidential support request.
                </p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="link-handdrawn mt-2 text-sm"
                >
                  Resend verification email
                </button>
                {verificationEmailSent && (
                  <p className="text-xs text-brass mt-2">Verification email sent.</p>
                )}
              </NewsNotice>
            )}

            {user?.emailVerified && !user?.tokenClaims?.email_verified && (
              <NewsNotice tone="info" icon={AlertCircle} className="mb-8">
                <p className="text-sm leading-relaxed text-ink-soft">
                  Your email is verified, but this browser session is still catching up with Firebase. Filing will work as soon as the secure session refresh finishes.
                </p>
              </NewsNotice>
            )}

            <Section
              n="00"
              label="Rapid draft"
              title="Get the first draft onto the desk."
              note="Use rough notes when the incident is still unfolding. You can edit every field before filing."
            >
              <NewsNotice tone="info" icon={Sparkles}>
                <p className="text-sm leading-relaxed text-ink-soft">
                  If you are under pressure, write rough notes here and SafePress will draft the crisis section for you.
                </p>
              </NewsNotice>

              <NewsField
                no="00"
                label="Rough notes for the drafting assistant"
                className="mt-7"
              >
                <textarea
                  value={draftNotes}
                  onChange={(event) => {
                    setDraftNotes(event.target.value);
                    if (draftError) setDraftError('');
                  }}
                  rows="5"
                  placeholder="What happened, when did it start, what accounts or devices are affected, whether a source may be at risk, and the safest way for a specialist to contact you."
                />
              </NewsField>

              <div className="support-intake__section-footer">
                <p className="eyebrow text-[10px] normal-case text-smoke">
                  The AI sees a redacted version of these notes, not the raw draft.
                </p>
                <NewsButton
                  type="button"
                  onClick={handleDraftAssist}
                  disabled={drafting || !user || !user.emailVerified}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  {drafting
                    ? 'Drafting the request...'
                    : !user
                      ? 'Sign in to use AI draft'
                      : !user.emailVerified
                        ? 'Verify email to use AI draft'
                        : 'Draft the crisis section'}
                </NewsButton>
              </div>

              {draftError && (
                <p className="mt-3 text-sm text-oxblood">{draftError}</p>
              )}

              {draftMeta && (
                <NewsNotice tone="info" icon={CheckCircle} className="mt-6">
                  <p className="text-sm leading-relaxed text-ink-soft">
                    The incident fields below were drafted from your notes.
                    {draftMeta.applied && draftMeta.flags?.length
                      ? ` Redacted before sending to the model: ${draftMeta.flags.map((flag) => REDACTION_FLAG_LABELS[flag] || flag).join(', ')}.`
                      : ' The current privacy scan did not flag obvious identifiers in the notes sent to the model.'}
                  </p>
                </NewsNotice>
              )}
            </Section>

            <Section
              n="01"
              label="Reporter"
              title="Confirm the safe identity details."
              note="These details stay inside the filed case and are only fully visible after a specialist claims it."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                <NewsField no="01" label={<>Name <span className="text-oxblood">*</span></>}>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={updateField('name')}
                    required
                    placeholder="Your full name"
                  />
                </NewsField>

                <NewsField no="02" label={<>Email <span className="text-oxblood">*</span></>}>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={updateField('email')}
                    required
                    placeholder="your@email.com"
                  />
                </NewsField>

                <NewsField no="03" label="Phone number (optional)" className="md:col-span-2">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={updateField('phone')}
                    placeholder="+1 (555) 123-4567"
                  />
                </NewsField>
              </div>
            </Section>

            <Section
              n="02"
              label="Crisis details"
              title="Describe the incident and set the tempo."
              note="Think like an editor reading the file cold: type, urgency, and a clean narrative of what happened."
            >
              <div className="f-row">
                <span className="f-lbl">
                  <span className="no">№ 04</span>
                  <span>Type of crisis <span className="text-oxblood">*</span></span>
                </span>
                <div className="editorial-choice-grid editorial-choice-grid--two">
                  {CRISIS_TYPES.map((opt) => {
                    const active = formData.crisisType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFormData({ ...formData, crisisType: opt.id })}
                        className={`editorial-choice-card ${active ? 'is-active' : ''}`}
                        style={{ '--choice-accent': 'var(--color-oxblood)' }}
                      >
                        <div className="editorial-choice-card__topline">
                          <span className="eyebrow sm text-smoke">{opt.id}</span>
                          <span className="editorial-choice-card__dot" aria-hidden="true" />
                        </div>
                        <p className="editorial-choice-card__title">{opt.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="f-row mt-8">
                <span className="f-lbl">
                  <span className="no">№ 05</span>
                  <span>Urgency level <span className="text-oxblood">*</span></span>
                </span>
                <div className="editorial-choice-grid editorial-choice-grid--three">
                  {URGENCY_LEVELS.map((opt) => {
                    const active = formData.urgency === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFormData({ ...formData, urgency: opt.id })}
                        className={`editorial-choice-card ${active ? 'is-active' : ''} ${opt.alarm ? 'is-alarm' : ''}`}
                        style={{ '--choice-accent': opt.alarm ? 'var(--color-oxblood)' : 'var(--color-brass)' }}
                      >
                        <div className="editorial-choice-card__topline">
                          <span className="eyebrow sm text-smoke">{opt.desc}</span>
                          <span className="editorial-choice-card__dot" aria-hidden="true" />
                        </div>
                        <p className="editorial-choice-card__title">{opt.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <NewsField
                no="06"
                label={<>Describe your situation <span className="text-oxblood">*</span></>}
                className="mt-8"
              >
                <textarea
                  value={formData.description}
                  onChange={updateField('description')}
                  required
                  rows="6"
                  placeholder="What happened, what changed, which devices or accounts may be affected, what pressure you are under, and what kind of help you need first."
                />
              </NewsField>
            </Section>

            <Section
              n="03"
              label="Reply route"
              title="Choose the safest return channel."
              note="Tell the desk how a specialist should reach you first, especially if one channel may already be compromised."
            >
              <div className="f-row">
                <span className="f-lbl">
                  <span className="no">№ 07</span>
                  <span>Preferred contact method <span className="text-oxblood">*</span></span>
                </span>
                <div className="editorial-choice-grid editorial-choice-grid--three">
                  {CONTACT_METHODS.map((opt) => {
                    const active = formData.contactMethod === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFormData({ ...formData, contactMethod: opt.id })}
                        className={`editorial-choice-card ${active ? 'is-active' : ''}`}
                        style={{ '--choice-accent': 'var(--color-ink)' }}
                      >
                        <div className="editorial-choice-card__topline">
                          <span className="eyebrow sm text-smoke">Preferred route</span>
                          <span className="editorial-choice-card__dot" aria-hidden="true" />
                        </div>
                        <p className="editorial-choice-card__title">{opt.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Section>

            <NewsNotice tone="info" className="mt-10">
              <p className="text-xs leading-relaxed text-ink-soft">
                <span className="font-semibold text-ink">Privacy notice:</span> your
                request is stored in Firebase and is only shown in full to you,
                admins, and the specialist who claims your case. The specialist queue
                only exposes redacted crisis metadata until a case is claimed.
              </p>
            </NewsNotice>

            {submitError && (
              <NewsNotice tone="danger" icon={AlertCircle} className="mt-6">
                <p className="text-sm leading-relaxed text-ink-soft">{submitError}</p>
              </NewsNotice>
            )}

            <div className="support-intake__submit">
              <div>
                <span className="eyebrow sm">
                  Signed by reporter · {formData.name || 'unsigned'}
                </span>
                <p className="support-intake__submit-note">
                  The filed case becomes the working record for all follow-up.
                </p>
              </div>
              <NewsButton
                type="submit"
                disabled={submitting || !user || !user.emailVerified}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {submitting
                  ? 'Filing the request...'
                  : !user
                    ? 'Sign in to submit'
                    : !user.emailVerified
                      ? 'Verify email to submit'
                      : 'File the request'}
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </NewsButton>
            </div>
          </div>

          <SupportIntakeSidebar
            specialistCount={specialistCount}
            recentSpecialists={recentSpecialists}
          />
        </div>
      </Motion.form>
    </NewsPage>
  );
};

export default RequestSupport;
