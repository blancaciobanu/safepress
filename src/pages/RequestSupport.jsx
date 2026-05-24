import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle, Send, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
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

const RequestSupport = () => {
  const { user, resendVerificationEmail } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [specialists, setSpecialists] = useState([]);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [filedAt, setFiledAt] = useState(null);
  const [submittedRequestId, setSubmittedRequestId] = useState('');
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
    if (!user || !user.emailVerified) return;
    setSubmitting(true);
    try {
      const created = await createSupportRequest({
        requesterId: user.uid,
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
      alert('Something went wrong. Please try again.');
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

  /* ─── Success state ────────────────────────────────────────────────── */

  if (submitted) {
    const fileRef = `SP-${new Date().getFullYear()}-${String(
      Math.floor(Math.random() * 9000) + 1000,
    )}`;
    const filedStr = (filedAt || new Date()).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return (
      <NewsPage>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="news-page-topline">
            <span className="eyebrow sm text-oxblood">Form SP-S · Request filed</span>
            <span className="eyebrow sm">
              Filed · {filedStr} UTC
            </span>
          </div>
          <NewsRule tone="oxblood" />

          <h1 className="display text-4xl md:text-6xl mt-10 leading-none max-w-[18ch]">
            Your request is on <em className="italic-ox">the desk.</em>
          </h1>
          <p className="mt-6 text-base md:text-lg leading-relaxed text-ink-soft max-w-prose">
            {specialistCount > 0
              ? `${specialistCount} verified specialist${specialistCount === 1 ? ' is' : 's are'} on call. Expect first contact within 24h.`
              : 'A verified cybersecurity specialist will review your request and reach out to you soon.'}
          </p>

          <div className="mt-9 grid grid-cols-1 md:grid-cols-2 gap-7 p-6 bg-paper-soft border border-ink/10 border-l-2 border-l-oxblood">
            <div>
              <p className="eyebrow sm">File reference</p>
              <p className="display-soft text-2xl mt-2 leading-tight num">{fileRef}</p>
            </div>
            <div>
              <p className="eyebrow sm">Filed at</p>
              <p className="display-soft text-2xl mt-2 leading-tight">{filedStr}</p>
            </div>
            <div>
              <p className="eyebrow sm">Type</p>
              <p className="display-soft text-lg mt-2 leading-tight">
                {CRISIS_TYPES.find((t) => t.id === formData.crisisType)?.label}
              </p>
            </div>
            <div>
              <p className="eyebrow sm">Urgency</p>
              <p
                className={`display-soft text-lg mt-2 leading-tight ${
                  formData.urgency === 'emergency' ? 'text-oxblood' : 'text-ink'
                }`}
              >
                {URGENCY_LEVELS.find((u) => u.id === formData.urgency)?.label}
              </p>
            </div>
          </div>

          <div className="asterism mt-10 mb-8">⁂</div>

          <div className="flex flex-col sm:flex-row gap-5 items-baseline">
              <Link to="/" className="link-handdrawn">
                Return home
              </Link>
              {submittedRequestId && (
                <Link to={`/support-cases/${submittedRequestId}`} className="link-handdrawn">
                  Open case desk
                </Link>
              )}
              <Link to="/my-cases" className="link-handdrawn">
                All my cases
              </Link>
              <Link to="/crisis" className="link-handdrawn">
                View crisis steps
              </Link>
          </div>
        </motion.div>
      </NewsPage>
    );
  }

  /* ─── Form state ───────────────────────────────────────────────────── */

  const onDuty = specialistCount > 0
    ? `${specialistCount} specialist${specialistCount === 1 ? '' : 's'} on duty`
    : 'Specialists on call';

  return (
    <NewsPage>
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
      <motion.header
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

        <div className="mt-10 max-w-prose">
          <h1 className="display text-4xl md:text-6xl leading-none">
            Request specialist support<span className="italic-ox">.</span>
          </h1>
          <p className="mt-5 text-base md:text-lg leading-relaxed text-ink-soft">
            Fill out this form and a verified cybersecurity expert will contact you.
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

        {/* Specialist availability strip — kept quiet, no glass pill. */}
        {specialistCount > 0 && (
          <div className="mt-8 flex items-center gap-4 pt-4 pb-1 border-t border-ink/12">
            <div className="flex -space-x-1.5 flex-shrink-0">
              {recentSpecialists.map((sp) => (
                sp.avatarUrl ? (
                  <img
                    key={sp.id}
                    src={sp.avatarUrl}
                    alt={sp.realName || sp.username}
                    title={sp.realName || sp.username}
                    className="w-8 h-8 rounded-full object-cover border border-ink/15"
                  />
                ) : (
                  <span
                    key={sp.id}
                    className="w-8 h-8 inline-flex items-center justify-center bg-paper-soft border border-ink/15 font-display font-bold text-[11px] text-ink"
                    title={sp.realName || sp.username}
                  >
                    {(sp.realName || sp.username || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || '?'}
                  </span>
                )
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-ink">
                {specialistCount} verified specialist{specialistCount === 1 ? '' : 's'} on call
              </p>
              <p className="eyebrow text-[10px] normal-case text-smoke mt-0.5">
                Typical first contact within 24h · all credentials vetted by our team
              </p>
            </div>
            <VerifiedBadge size="sm" />
          </div>
        )}
      </motion.header>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        onSubmit={handleSubmit}
        className="mt-10"
      >
        {/* Auth gating banners */}
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

        <Section n="00" label="Rapid draft">
          <NewsNotice tone="info" icon={Sparkles}>
            <p className="text-sm leading-relaxed text-ink-soft">
              If you are under pressure, write rough notes here and SafePress will draft the crisis section for you. You can still review and edit every field before filing.
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

          <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

        {/* §01 Reporter */}
        <Section n="01" label="Reporter">
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

            <NewsField no="03" label="Phone number (optional)">
              <input
                type="tel"
                value={formData.phone}
                onChange={updateField('phone')}
                placeholder="+1 (555) 123-4567"
              />
            </NewsField>
          </div>
        </Section>

        {/* §02 Nature of the incident */}
        <Section n="02" label="Crisis details">
          {/* Type — radio cluster */}
          <div className="f-row">
            <span className="f-lbl">
              <span className="no">№ 04</span>
              <span>Type of crisis <span className="text-oxblood">*</span></span>
            </span>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-7 gap-y-3 pt-2">
              {CRISIS_TYPES.map((opt) => (
                <label
                  key={opt.id}
                  className="inline-flex items-center gap-2.5 cursor-pointer text-sm text-ink-soft"
                >
                  <span
                    className={`relative inline-block w-3.5 h-3.5 rounded-full border-[1.5px] flex-shrink-0 ${
                      formData.crisisType === opt.id
                        ? 'border-ink'
                        : 'border-ink/35'
                    }`}
                  >
                    {formData.crisisType === opt.id && (
                      <span className="absolute inset-[3px] rounded-full bg-ink" />
                    )}
                  </span>
                  <input
                    type="radio"
                    name="crisisType"
                    value={opt.id}
                    checked={formData.crisisType === opt.id}
                    onChange={updateField('crisisType')}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Urgency — segmented control */}
          <div className="f-row mt-8">
            <span className="f-lbl">
              <span className="no">№ 05</span>
              <span>Urgency level <span className="text-oxblood">*</span></span>
            </span>
            <div className="flex gap-0 mt-2">
              {URGENCY_LEVELS.map((opt, i) => {
                const active = formData.urgency === opt.id;
                const borderColor = opt.alarm ? 'border-oxblood' : 'border-ink';
                const activeBg = opt.alarm ? 'bg-oxblood' : 'bg-ink';
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, urgency: opt.id })}
                    className={`flex-1 px-4 py-2.5 font-mono uppercase text-[11px] tracking-[0.18em] transition-colors border ${borderColor} ${
                      i === 0 ? '' : '-ml-px'
                    } ${active
                      ? `${activeBg} text-paper`
                      : 'bg-transparent text-ink hover:bg-ink/[0.04]'
                    }`}
                  >
                    {opt.label}
                    <span className="block text-[9px] tracking-[0.16em] mt-0.5 opacity-70 normal-case">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description — textarea */}
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
              placeholder="Please provide details about what happened and what help you need…"
            />
          </NewsField>
        </Section>

        {/* §03 Contact preferences */}
        <Section n="03" label="How should we contact you?">
          <div className="f-row">
            <span className="f-lbl">
              <span className="no">№ 07</span>
              <span>Preferred contact method <span className="text-oxblood">*</span></span>
            </span>
            <div className="flex gap-0 mt-2">
              {CONTACT_METHODS.map((opt, i) => {
                const active = formData.contactMethod === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, contactMethod: opt.id })}
                    className={`flex-1 px-4 py-2.5 font-mono uppercase text-[11px] tracking-[0.18em] border border-ink transition-colors ${
                      i === 0 ? '' : '-ml-px'
                    } ${active
                      ? 'bg-ink text-paper'
                      : 'bg-transparent text-ink hover:bg-ink/[0.04]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        {/* Privacy notice */}
        <NewsNotice tone="info" className="mt-10">
          <p className="text-xs leading-relaxed text-ink-soft">
            <span className="font-semibold text-ink">Privacy notice:</span> your
            request is stored in Firebase and is only shown in full to you,
            admins, and the specialist who claims your case. The specialist queue
            only exposes redacted crisis metadata until a case is claimed.
          </p>
        </NewsNotice>

        {/* Submit */}
        <div className="mt-10 pt-5 border-t border-ink/22 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
          <span className="eyebrow sm">
            Signed by reporter · {formData.name || 'unsigned'}
          </span>
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

        <p className="eyebrow text-[10px] normal-case text-center text-smoke mt-6">
          Emergency? Call{' '}
          <a
            href={EMERGENCY_SUPPORT_CONTACTS[0].phoneHref}
            className="text-oxblood hover:underline"
          >
            {EMERGENCY_SUPPORT_CONTACTS[0].phone}
          </a>{' '}
          ({EMERGENCY_SUPPORT_CONTACTS[0].org} · {EMERGENCY_SUPPORT_CONTACTS[0].available})
        </p>
      </motion.form>
    </NewsPage>
  );
};

/* ─── Section header — § N · label, with hairline rule. ───────────────── */
const Section = ({ n, label, children }) => (
  <section className="mt-12">
    <p className="eyebrow sm pb-2.5 border-b border-ink mb-7">
      <span className="text-ink mr-2">§ {n}</span>
      <span className="text-ink-soft">{label}</span>
    </p>
    {children}
  </section>
);

export default RequestSupport;
