import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Clock, FileText, Shield } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  NewsButton,
  NewsField,
  NewsNotice,
  NewsPage,
  NewsRule,
} from '../components/editorial/NewsPage';
import { useAuth } from '../contexts/AuthContext';
import { submitSpecialistVerificationDossier } from '../features/users/services/userService';
import {
  SPECIALIST_AVAILABILITY_OPTIONS,
  SPECIALIST_SECURE_CONTACT_METHODS,
  SPECIALIST_SUPPORT_AREAS,
  SPECIALIST_VERIFICATION_STATUSES,
} from '../features/users/verification';
import { logError } from '../utils/logger';

const normalize = (value = '') => value.trim();

const SpecialistVerification = () => {
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const verificationData = user?.verificationData || {};
  const isSpecialistAccount = user?.accountType === 'specialist';
  const status = !user?.emailVerified
    ? SPECIALIST_VERIFICATION_STATUSES.PENDING_EMAIL
    : (
      isSpecialistAccount
        ? (user?.verificationStatus || SPECIALIST_VERIFICATION_STATUSES.PENDING_DETAILS)
        : SPECIALIST_VERIFICATION_STATUSES.PENDING_DETAILS
    );
  const isReadOnly = status === SPECIALIST_VERIFICATION_STATUSES.PENDING_REVIEW;
  const needsAction = [
    SPECIALIST_VERIFICATION_STATUSES.PENDING_DETAILS,
    SPECIALIST_VERIFICATION_STATUSES.NEEDS_MORE_INFO,
    SPECIALIST_VERIFICATION_STATUSES.REJECTED,
  ].includes(status);

  const [formData, setFormData] = useState({
    realName: user?.realName || '',
    expertise: verificationData.expertise || '',
    credentials: verificationData.credentials || '',
    organization: verificationData.organization || '',
    linkedinUrl: verificationData.linkedinUrl || '',
    portfolioUrl: verificationData.portfolioUrl || '',
    certifications: verificationData.certifications || '',
    secureContactMethod: verificationData.secureContactMethod || 'signal',
    secureContactHandle: verificationData.secureContactHandle || '',
    region: verificationData.region || '',
    languages: verificationData.languages || '',
    availability: verificationData.availability || '',
    supportAreas: Array.isArray(verificationData.supportAreas) ? verificationData.supportAreas : [],
    notes: verificationData.notes || '',
    responseToReviewNote: verificationData.responseToReviewNote || '',
  });

  const submittedLabel = useMemo(() => {
    const value = verificationData.dossierSubmittedAt || verificationData.submittedAt;
    if (!value) return null;
    return new Date(value).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [verificationData.dossierSubmittedAt, verificationData.submittedAt]);

  const reviewReplyLabel = useMemo(() => {
    if (!verificationData.resubmittedAt) return null;
    return new Date(verificationData.resubmittedAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [verificationData.resubmittedAt]);

  const dossierChecks = [
    {
      label: 'Identity and organization',
      done: Boolean(normalize(formData.realName) && normalize(formData.organization)),
    },
    {
      label: 'Credentials and proof of work',
      done: Boolean(normalize(formData.credentials) && normalize(formData.portfolioUrl)),
    },
    {
      label: 'Secure contact route',
      done: Boolean(normalize(formData.secureContactHandle)),
    },
    {
      label: 'Field coverage and availability',
      done: Boolean(
        normalize(formData.region)
        && normalize(formData.languages)
        && normalize(formData.availability)
      ),
    },
    {
      label: 'Support areas selected',
      done: formData.supportAreas.length > 0,
    },
  ];

  const dossierReadyCount = dossierChecks.filter((item) => item.done).length;

  if (!user) return <Navigate to="/login" replace />;
  if (user.accountType === 'specialist' && status === SPECIALIST_VERIFICATION_STATUSES.APPROVED) {
    return <Navigate to="/specialist-dashboard" replace />;
  }

  const toggleSupportArea = (area) => {
    setFormData((current) => ({
      ...current,
      supportAreas: current.supportAreas.includes(area)
        ? current.supportAreas.filter((entry) => entry !== area)
        : [...current.supportAreas, area],
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (!user.emailVerified) {
      setMessage({ type: 'error', text: 'Confirm your email first, then return here.' });
      return;
    }

    if (!normalize(formData.realName)) {
      setMessage({ type: 'error', text: 'Add your full name so the review desk can verify who is applying.' });
      return;
    }
    if (!normalize(formData.expertise) || !normalize(formData.credentials) || !normalize(formData.organization)) {
      setMessage({ type: 'error', text: 'Full name, expertise, credentials, and organization are all required before review.' });
      return;
    }
    if (!normalize(formData.certifications)) {
      setMessage({ type: 'error', text: 'Add certifications, training, or equivalent experience.' });
      return;
    }
    if (!normalize(formData.secureContactHandle)) {
      setMessage({ type: 'error', text: 'Add a secure contact handle so journalists know how to reach you.' });
      return;
    }
    if (!normalize(formData.region) || !normalize(formData.languages) || !normalize(formData.availability)) {
      setMessage({ type: 'error', text: 'Region, language, and availability all need a clear answer.' });
      return;
    }
    if (!formData.supportAreas.length) {
      setMessage({ type: 'error', text: 'Choose at least one area you can reliably handle.' });
      return;
    }

    setSaving(true);
    try {
      await submitSpecialistVerificationDossier(user.uid, {
        realName: normalize(formData.realName),
        expertise: normalize(formData.expertise),
        credentials: normalize(formData.credentials),
        organization: normalize(formData.organization),
        linkedinUrl: normalize(formData.linkedinUrl),
        portfolioUrl: normalize(formData.portfolioUrl),
        certifications: normalize(formData.certifications),
        secureContactMethod: normalize(formData.secureContactMethod),
        secureContactHandle: normalize(formData.secureContactHandle),
        region: normalize(formData.region),
        languages: normalize(formData.languages),
        availability: normalize(formData.availability),
        supportAreas: formData.supportAreas,
        notes: normalize(formData.notes),
        responseToReviewNote: normalize(formData.responseToReviewNote),
      });
      await refreshUser();
      setMessage({ type: 'success', text: 'Verification dossier submitted. The review desk can see the updated file now.' });
    } catch (error) {
      logError('Failed to submit specialist verification dossier:', error);
      setMessage({ type: 'error', text: 'The dossier did not save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <NewsPage className="verification-dossier">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="news-page-topline">
          <span className="eyebrow sm text-oxblood">Specialist dossier · Verification</span>
          {submittedLabel && <span className="eyebrow sm">Last filed · {submittedLabel}</span>}
        </div>
        <NewsRule />

        <div className="verification-dossier__hero">
          <div className="verification-dossier__hero-copy">
            <h1 className="display text-4xl md:text-5xl leading-none">
              {isSpecialistAccount ? 'Complete your verification file' : 'Apply as a specialist'}<span className="italic-ox">.</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-smoke max-w-2xl">
              Add the working detail the review desk needs before it lets you claim cases: identity,
              credentials, proof of work, secure contact preferences, coverage areas, languages, and availability.
            </p>
          </div>

          <div className="editorial-form-sheet editorial-form-sheet--aside verification-dossier__hero-card">
            <div className="editorial-form-sheet__head">
              <div>
                <p className="eyebrow sm text-brass">Review readiness</p>
                <h2 className="display-soft text-2xl leading-none mt-3">File completion snapshot.</h2>
              </div>
            </div>
            <div className="editorial-form-sheet__body">
              <div className="verification-dossier__readiness-grid">
                <div className="verification-dossier__readiness-card">
                  <p className="eyebrow sm text-smoke">Checklist</p>
                  <p className="display-soft text-3xl leading-none mt-2">
                    {dossierReadyCount}<span className="text-smoke text-lg">/{dossierChecks.length}</span>
                  </p>
                </div>
                <div className="verification-dossier__readiness-card">
                  <p className="eyebrow sm text-smoke">Current state</p>
                  <p className="display-soft text-xl leading-tight mt-2">
                    {status === SPECIALIST_VERIFICATION_STATUSES.PENDING_REVIEW
                      ? 'In review'
                      : needsAction
                        ? 'Needs action'
                        : 'Awaiting email'}
                  </p>
                </div>
              </div>
              <p className="verification-dossier__hero-note">
                Journalists only ever feel the result of this file: calm routing, clear expertise, and a contact path they can trust under pressure.
              </p>
            </div>
          </div>
        </div>

        {status === SPECIALIST_VERIFICATION_STATUSES.PENDING_EMAIL && (
          <NewsNotice tone="brass" icon={Clock} className="mb-6">
            <p className="eyebrow sm text-brass">Email confirmation still comes first</p>
            <p className="mt-2 text-sm text-ink-soft leading-relaxed">
              Your application is saved, but the review desk cannot open this file until the address is confirmed.
              Use Settings to resend the email if you need to.
            </p>
            <div className="mt-3">
              <Link to="/settings" className="text-sm text-oxblood hover:text-ink transition-colors">
                Open settings →
              </Link>
            </div>
          </NewsNotice>
        )}

        {status === SPECIALIST_VERIFICATION_STATUSES.NEEDS_MORE_INFO && (
          <NewsNotice tone="danger" icon={AlertCircle} className="mb-6">
            <p className="eyebrow sm text-oxblood">The review desk asked for more detail</p>
            <p className="mt-2 text-sm text-ink-soft leading-relaxed">
              {user.verificationReviewNote || 'Strengthen the file below, then resubmit it for review.'}
            </p>
            {verificationData.responseToReviewNote && (
              <div className="mt-4 border-t border-ink/10 pt-4">
                <p className="eyebrow sm text-smoke">Your last response</p>
                <p className="mt-2 text-sm text-ink-soft leading-relaxed">
                  {verificationData.responseToReviewNote}
                </p>
                {reviewReplyLabel && (
                  <p className="eyebrow sm mt-3">Filed back · {reviewReplyLabel}</p>
                )}
              </div>
            )}
          </NewsNotice>
        )}

        {status === SPECIALIST_VERIFICATION_STATUSES.REJECTED && (
          <NewsNotice tone="danger" icon={AlertCircle} className="mb-6">
            <p className="eyebrow sm text-oxblood">The previous verification was not approved</p>
            <p className="mt-2 text-sm text-ink-soft leading-relaxed">
              {user.verificationRejectionReason || 'Revise the dossier if you want the review desk to take another pass.'}
            </p>
          </NewsNotice>
        )}

        {status === SPECIALIST_VERIFICATION_STATUSES.PENDING_REVIEW && (
          <NewsNotice tone="brass" icon={CheckCircle2} className="mb-6">
            <p className="eyebrow sm text-brass">Your dossier is with the review desk</p>
            <p className="mt-2 text-sm text-ink-soft leading-relaxed">
              You can read the submitted file here while you wait. If the desk needs more context, it will send the file back with notes.
            </p>
            {verificationData.responseToReviewNote && (
              <div className="mt-4 border-t border-ink/10 pt-4">
                <p className="eyebrow sm text-smoke">Included response to the review desk</p>
                <p className="mt-2 text-sm text-ink-soft leading-relaxed">
                  {verificationData.responseToReviewNote}
                </p>
              </div>
            )}
          </NewsNotice>
        )}

        {message && (
          <NewsNotice tone={message.type === 'success' ? 'brass' : 'danger'} icon={message.type === 'success' ? CheckCircle2 : AlertCircle} className="mb-6">
            <p className="text-sm text-ink-soft">{message.text}</p>
          </NewsNotice>
        )}

        <div className="editorial-form-layout verification-dossier__layout">
          <form onSubmit={handleSubmit} className="editorial-form-main verification-dossier__main">
            <Section
              n="00"
              label="Identity and proof"
              title="Show the desk who is taking responsibility."
              note="This is the file the review desk uses to decide whether a journalist can safely trust you in a live case."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NewsField no="00" label="Full name">
                  <input
                    type="text"
                    name="realName"
                    value={formData.realName}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    disabled={isReadOnly}
                  />
                </NewsField>

                <NewsField no="00A" label="Organization">
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    placeholder="Independent / newsroom / lab / consultancy"
                    disabled={isReadOnly}
                  />
                </NewsField>

                <NewsField no="00B" label="Primary expertise">
                  <input
                    type="text"
                    name="expertise"
                    value={formData.expertise}
                    onChange={handleChange}
                    placeholder="Incident response, secure comms, source protection, etc."
                    disabled={isReadOnly}
                  />
                </NewsField>

                <NewsField no="00C" label="LinkedIn profile (optional)">
                  <input
                    type="url"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/yourprofile"
                    disabled={isReadOnly}
                  />
                </NewsField>

                <NewsField no="00D" label="Credentials and experience" className="md:col-span-2">
                  <textarea
                    name="credentials"
                    value={formData.credentials}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Relevant work, certifications, teaching, incident handling, newsroom support, research, etc."
                    disabled={isReadOnly}
                  />
                </NewsField>

                <NewsField no="01" label="Proof of work / portfolio" className="md:col-span-2">
                  <input
                    type="url"
                    name="portfolioUrl"
                    value={formData.portfolioUrl}
                    onChange={handleChange}
                    placeholder="https://your-site-or-portfolio"
                    disabled={isReadOnly}
                  />
                </NewsField>
              </div>
            </Section>

            <Section
              n="01"
              label="Field operations"
              title="Document how you actually work in the field."
              note="The useful specialist profile is not just credentials. It is reach, availability, and a secure contact route that holds under stress."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NewsField no="02" label="Region and primary context">
                  <input
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    placeholder="Romania / EU, remote worldwide, etc."
                    disabled={isReadOnly}
                  />
                </NewsField>

                <NewsField no="04" label="Languages">
                  <input
                    type="text"
                    name="languages"
                    value={formData.languages}
                    onChange={handleChange}
                    placeholder="English, Romanian, French"
                    disabled={isReadOnly}
                  />
                </NewsField>

                <NewsField no="03" label="Certifications or training" className="md:col-span-2">
                  <textarea
                    name="certifications"
                    value={formData.certifications}
                    onChange={handleChange}
                    rows={4}
                    placeholder="CISSP, newsroom security training, incident response work, research, teaching, etc."
                    disabled={isReadOnly}
                  />
                </NewsField>

                <NewsField no="05" label="Preferred secure contact method">
                  <select
                    name="secureContactMethod"
                    value={formData.secureContactMethod}
                    onChange={handleChange}
                    disabled={isReadOnly}
                  >
                    {SPECIALIST_SECURE_CONTACT_METHODS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </NewsField>

                <NewsField no="06" label="Secure contact handle">
                  <input
                    type="text"
                    name="secureContactHandle"
                    value={formData.secureContactHandle}
                    onChange={handleChange}
                    placeholder="@handle / address / contact note"
                    disabled={isReadOnly}
                  />
                </NewsField>

                <NewsField no="07" label="Availability">
                  <select
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    disabled={isReadOnly}
                  >
                    <option value="">Choose one</option>
                    {SPECIALIST_AVAILABILITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </NewsField>

                <NewsField no="08" label="Additional context for the desk">
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Cross-border experience, newsroom work, emergency constraints, sectors you know well, etc."
                    disabled={isReadOnly}
                  />
                </NewsField>
              </div>
            </Section>

            <Section
              n="02"
              label="Coverage areas"
              title="Mark the kinds of cases you can reliably hold."
              note="The desk uses these coverage signals to avoid forcing reporters to guess who can handle source protection, incident response, or harassment safely."
            >
              <div className="editorial-choice-grid editorial-choice-grid--two">
                {SPECIALIST_SUPPORT_AREAS.map((area, index) => {
                  const active = formData.supportAreas.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleSupportArea(area)}
                      disabled={isReadOnly}
                      className={`editorial-choice-card verification-dossier__coverage-card ${active ? 'is-active' : ''}`}
                      style={{ '--choice-accent': 'var(--color-oxblood)' }}
                    >
                      <div className="editorial-choice-card__topline">
                        <span className="eyebrow sm text-smoke">{String(index + 1).padStart(2, '0')}</span>
                        <span className="editorial-choice-card__dot" aria-hidden="true" />
                      </div>
                      <p className="editorial-choice-card__title">{area}</p>
                    </button>
                  );
                })}
              </div>
            </Section>

            {status === SPECIALIST_VERIFICATION_STATUSES.NEEDS_MORE_INFO && (
              <Section
                n="03"
                label="Review response"
                title="Answer the desk directly."
                note="Use this when you are filing clarifications or revisions against a reviewer note."
              >
                <NewsField no="08A" label="Reply to the review desk">
                  <textarea
                    name="responseToReviewNote"
                    value={formData.responseToReviewNote}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Summarize what you added, clarified, or changed in response to the request."
                    disabled={isReadOnly}
                  />
                  <p className="eyebrow sm text-smoke mt-2 normal-case">
                    Keep it brief and practical so the reviewer can immediately see what changed.
                  </p>
                </NewsField>
              </Section>
            )}

            <div className="editorial-form-sheet editorial-form-sheet--aside verification-dossier__journalist-note">
              <div className="editorial-form-sheet__body">
                <div className="flex gap-3">
                  <Shield className="w-4 h-4 text-ink flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="eyebrow sm text-ink">What journalists will feel</p>
                    <p className="mt-2 text-sm text-smoke leading-relaxed">
                      This file helps the desk route high-pressure cases to the right specialist quickly,
                      without forcing reporters to guess who can handle source protection, incident response, or harassment safely.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="verification-dossier__submit">
              <Link to={isSpecialistAccount ? '/specialist-dashboard' : '/settings'} className="text-sm text-smoke hover:text-ink transition-colors">
                {isSpecialistAccount ? 'Back to specialist desk' : 'Back to settings'}
              </Link>
              {needsAction && (
                <NewsButton type="submit" className="justify-center min-w-[240px]" disabled={saving}>
                  <FileText className="w-4 h-4" />
                  {saving ? 'Submitting…' : status === SPECIALIST_VERIFICATION_STATUSES.NEEDS_MORE_INFO || status === SPECIALIST_VERIFICATION_STATUSES.REJECTED ? 'Resubmit verification file' : 'Submit verification file'}
                </NewsButton>
              )}
            </div>
          </form>

          <aside className="editorial-form-rail verification-dossier__rail">
            <div className="editorial-form-sheet editorial-form-sheet--aside">
              <div className="editorial-form-sheet__head">
                <div>
                  <p className="eyebrow sm text-oxblood">Review checklist</p>
                  <h2 className="display-soft text-2xl leading-none mt-3">What the desk still needs.</h2>
                </div>
              </div>
              <div className="editorial-form-sheet__body">
                <div className="editorial-timeline">
                  {dossierChecks.map((item, index) => (
                    <div key={item.label} className="editorial-timeline__item">
                      <span className={`editorial-timeline__no ${item.done ? 'is-complete' : ''}`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <p className="editorial-timeline__title">{item.label}</p>
                        <p className="editorial-timeline__body">
                          {item.done ? 'On file.' : 'Still missing or incomplete.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="editorial-form-sheet editorial-form-sheet--aside">
              <div className="editorial-form-sheet__head">
                <div>
                  <p className="eyebrow sm text-brass">Desk preview</p>
                  <h2 className="display-soft text-2xl leading-none mt-3">How your dossier currently reads.</h2>
                </div>
              </div>
              <div className="editorial-form-sheet__body">
                <div className="verification-dossier__summary-grid">
                  <div className="verification-dossier__summary-item">
                    <span>Name</span>
                    <p>{formData.realName || 'Not added yet'}</p>
                  </div>
                  <div className="verification-dossier__summary-item">
                    <span>Expertise</span>
                    <p>{formData.expertise || 'Not added yet'}</p>
                  </div>
                  <div className="verification-dossier__summary-item">
                    <span>Coverage</span>
                    <p>{formData.supportAreas.length ? `${formData.supportAreas.length} areas selected` : 'No areas selected'}</p>
                  </div>
                  <div className="verification-dossier__summary-item">
                    <span>Availability</span>
                    <p>{formData.availability || 'Not added yet'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="editorial-form-sheet editorial-form-sheet--aside">
              <div className="editorial-form-sheet__head">
                <div>
                  <p className="eyebrow sm text-ink">Review rhythm</p>
                  <h2 className="display-soft text-2xl leading-none mt-3">What happens after filing.</h2>
                </div>
              </div>
              <div className="editorial-form-sheet__body">
                <div className="verification-dossier__signal-list">
                  <div className="verification-dossier__signal-item">
                    <Clock className="w-4 h-4 text-brass" />
                    <p>Files usually move through review in a couple of business days once complete.</p>
                  </div>
                  <div className="verification-dossier__signal-item">
                    <CheckCircle2 className="w-4 h-4 text-ink" />
                    <p>If the desk needs stronger proof or clearer operating detail, it sends the file back with notes.</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </motion.div>
    </NewsPage>
  );
};

const Section = ({ n, label, title, note, children }) => (
  <section className="editorial-form-sheet verification-dossier__section">
    <div className="editorial-form-sheet__head">
      <div>
        <p className="eyebrow sm">
          <span className="text-ink mr-2">§ {n}</span>
          <span className="text-ink-soft">{label}</span>
        </p>
        <h2 className="display-soft text-2xl md:text-3xl leading-none mt-3">{title}</h2>
        {note && <p className="editorial-form-sheet__lede">{note}</p>}
      </div>
    </div>
    <div className="editorial-form-sheet__body">
      {children}
    </div>
  </section>
);

export default SpecialistVerification;
