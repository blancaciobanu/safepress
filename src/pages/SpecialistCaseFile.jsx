import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  addSupportCaseMessage,
  claimSupportRequest,
  listenToSupportCaseFile,
  listenToSupportCaseMessages,
  listenToSupportQueueEntry,
  resolveSupportRequest,
  saveSupportCaseReport,
  SUPPORT_CASE_MARKERS,
  updateSupportCaseMarker,
} from '../features/support/services/supportService';
import { logError } from '../utils/logger';
import {
  NewsButton,
  NewsCard,
  NewsNotice,
  NewsPage,
  NewsRule,
} from '../components/editorial/NewsPage';
import { caseFileRef } from '../utils/caseRef';

const CRISIS_LABELS = {
  hacked: 'hacked account',
  source: 'source exposed',
  doxxed: 'doxxing incident',
  phishing: 'phishing attempt',
  other: 'security concern',
};

const STATUS_COPY = {
  open: 'redacted intake',
  claimed: 'active case file',
  resolved: 'filed resolution',
};

const URGENCY_LABELS = {
  emergency: 'emergency',
  urgent: 'urgent',
  normal: 'normal',
};

const URGENCY_TONES = {
  emergency: 'text-oxblood',
  urgent: 'text-brass',
  normal: 'text-ink-soft',
};

const CONTACT_LABELS = {
  email: 'email',
  phone: 'phone',
  signal: 'signal',
};

const CRISIS_DETAILS = {
  hacked: {
    overview: 'Account takeover — an email, social media, cloud service, or device account has been compromised. The requester may still be locked out or uncertain of the full scope.',
    scope: 'Account access and linked credentials may still be at risk. Recovery windows narrow quickly on most platforms.',
    requires: [
      'Account recovery and platform-specific lockdown steps',
      'Password and 2FA reset across linked and recovery accounts',
      'Audit of connected apps and data access scope',
      'Source communication hygiene check if sensitive material is involved',
    ],
    timeNote: 'Every hour matters. Treat as high urgency regardless of the label.',
  },
  source: {
    overview: 'A confidential source identity or information trail may have been exposed — through a security breach, a leaked document, or an inadvertent disclosure.',
    scope: 'Source exposure carries serious safety and legal risk. The exposure window may already be open and growing.',
    requires: [
      'Source protection audit and exposure scope assessment',
      'Secure communication channel setup',
      'Legal exposure assessment',
      'Possible referral to press freedom legal resources',
    ],
    timeNote: 'This case demands maximum discretion. Scope assessment should begin immediately after claiming.',
  },
  doxxed: {
    overview: 'Personal information has been published or is actively spreading — home address, family details, phone number, employer, or daily routine.',
    scope: 'Doxxing can escalate to physical threats. Containment and physical safety both need immediate assessment.',
    requires: [
      'Platform takedown requests and formal reporting',
      'Physical safety assessment and precautionary steps',
      'Documentation of published material and spread scope',
      'Ongoing monitoring and escalation plan',
    ],
    timeNote: 'Active spread is harder to contain the longer it runs.',
  },
  phishing: {
    overview: 'A suspicious message, link, or contact has been identified — targeting credentials, device access, or source identity.',
    scope: 'If credentials were entered or attachments opened, treat this as a hacked account case. Scope assessment comes first.',
    requires: [
      'Link and attachment analysis',
      'Credential audit and immediate reset if compromised',
      'Briefing on the specific attack pattern used',
      'Device integrity check if malware is suspected',
    ],
    timeNote: 'If credentials were entered, scope assessment must happen within hours.',
  },
  other: {
    overview: 'A security concern that does not fit standard categories. Full context unlocks after claiming.',
    scope: 'Scope and severity are unknown until the case is opened. Urgency level is the best available signal.',
    requires: [
      'Initial intake and triage',
      'Category and scope assessment',
      'Routing or escalation if outside your speciality',
    ],
    timeNote: 'Assess urgency and scope from the incident notes immediately after claiming.',
  },
};

const CASE_MARKER_META = {
  [SUPPORT_CASE_MARKERS.AWAITING_SPECIALIST]: {
    label: 'awaiting specialist',
    tone: 'text-oxblood',
    accent: '#7B2E2E',
  },
  [SUPPORT_CASE_MARKERS.AWAITING_REPORTER]: {
    label: 'awaiting reporter',
    tone: 'text-brass',
    accent: '#8A6D2C',
  },
  [SUPPORT_CASE_MARKERS.MONITORING]: {
    label: 'monitoring',
    tone: 'text-[#375E5A]',
    accent: '#375E5A',
  },
  [SUPPORT_CASE_MARKERS.READY_TO_FILE]: {
    label: 'ready to file',
    tone: 'text-ink',
    accent: '#15110C',
  },
};

const timeInQueue = (createdAt) => {
  const hours = Math.floor((Date.now() - new Date(createdAt).getTime()) / 3_600_000);
  if (hours < 1) return 'less than 1h';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day' : `${days} days`;
};

const formatDate = (iso, opts = { month: 'long', day: 'numeric', year: 'numeric' }) =>
  new Date(iso).toLocaleDateString('en-US', opts);

const REPORT_FIELDS = [
  {
    key: 'summary',
    no: '01',
    label: 'Situation summary',
    hint: 'What the reporter described and what the case actually was.',
    placeholder: 'What happened and what the journalist reported.',
  },
  {
    key: 'actionsTaken',
    no: '02',
    label: 'Actions taken',
    hint: 'Containment, recovery, verification, and route changes already completed.',
    placeholder: 'Containment, verification, resets, notifications, or source-protection steps already completed.',
  },
  {
    key: 'outstandingRisks',
    no: '03',
    label: 'Outstanding risks',
    hint: 'What is still exposed, uncertain, or waiting on confirmation.',
    placeholder: 'Anything still unresolved or unsafe.',
  },
  {
    key: 'nextSteps',
    no: '04',
    label: 'Next steps for the journalist',
    hint: 'The smallest clear sequence the reporter should follow after this handoff.',
    placeholder: 'What the reporter should do next and when to escalate again.',
  },
];

const SpecialistCaseFile = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [caseFile, setCaseFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [messageBusy, setMessageBusy] = useState(false);
  const [error, setError] = useState('');
  const [messageDraft, setMessageDraft] = useState('');
  const [reportDraft, setReportDraft] = useState({
    summary: '',
    actionsTaken: '',
    outstandingRisks: '',
    nextSteps: '',
  });

  useEffect(() => {
    if (!user || !requestId) return;

    setLoading(true);
    setError('');
    let privateUnsubscribe = null;

    const queueUnsubscribe = listenToSupportQueueEntry({
      requestId,
      onData: (queueCase) => {
        if (queueCase.status === 'open' || queueCase.claimedBy !== user.uid) {
          setCaseFile({
            ...queueCase,
            queueOnly: true,
          });
          setLoading(false);
          return;
        }

        if (!privateUnsubscribe) {
          privateUnsubscribe = listenToSupportCaseFile({
            requestId,
            onData: (rawCase) => {
              try {
                if (rawCase.claimedBy !== user.uid) {
                  throw new Error('support-request-access-denied');
                }
                setCaseFile(rawCase);
                setLoading(false);
              } catch (err) {
                logError('Error normalizing specialist case file:', err);
                setError('This case file is unavailable right now.');
                setLoading(false);
              }
            },
            onError: (err) => {
              logError('Error loading specialist case file:', err);
              setError('This case file is unavailable right now.');
              setLoading(false);
            },
          });
        }
      },
      onError: (err) => {
        logError('Error loading support queue entry:', err);
        setError('This case file is unavailable right now.');
        setLoading(false);
      },
    });

    return () => {
      queueUnsubscribe?.();
      privateUnsubscribe?.();
    };
  }, [requestId, user]);

  useEffect(() => {
    if (!requestId || !caseFile || caseFile.status === 'open') {
      setMessages([]);
      return undefined;
    }

    const unsubscribe = listenToSupportCaseMessages({
      requestId,
      onData: setMessages,
      onError: (err) => {
        logError('Error loading specialist case messages:', err);
      },
    });

    return unsubscribe;
  }, [requestId, caseFile?.status]);

  useEffect(() => {
    if (!caseFile) return;
    setReportDraft({
      summary: caseFile.caseReport?.summary || '',
      actionsTaken: caseFile.caseReport?.actionsTaken || '',
      outstandingRisks: caseFile.caseReport?.outstandingRisks || '',
      nextSteps: caseFile.caseReport?.nextSteps || '',
    });
  }, [caseFile?.id, caseFile?.caseReport?.updatedAt]);

  const handleClaim = async () => {
    if (!user || !caseFile) return;
    setActionBusy(true);
    try {
      const claimData = await claimSupportRequest({
        requestId: caseFile.id,
        specialistId: user.uid,
        specialistName: user.realName || user.username,
      });
      setCaseFile((current) => (current ? { ...current, ...claimData, queueOnly: false } : current));
    } catch (err) {
      logError('Error claiming case file:', err);
      setError('The case could not be claimed right now.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleResolve = async () => {
    if (!caseFile) return;
    setActionBusy(true);
    try {
      const resolutionData = await resolveSupportRequest(caseFile.id);
      setCaseFile((current) => (current ? { ...current, ...resolutionData } : current));
    } catch (err) {
      logError('Error resolving case file:', err);
      setError('The case could not be filed right now.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !caseFile || messageBusy || !messageDraft.trim()) return;
    setMessageBusy(true);
    try {
      await addSupportCaseMessage({
        requestId: caseFile.id,
        authorId: user.uid,
        authorName: user.username,
        authorRole: 'specialist',
        body: messageDraft,
      });
      setMessageDraft('');
    } catch (err) {
      logError('Error sending specialist case message:', err);
      setError('Your message could not be sent right now.');
    } finally {
      setMessageBusy(false);
    }
  };

  const handleSaveReport = async () => {
    if (!user || !caseFile) return;
    setActionBusy(true);
    try {
      await saveSupportCaseReport({
        requestId: caseFile.id,
        specialistId: user.uid,
        specialistName: user.realName || user.username,
        report: reportDraft,
      });
    } catch (err) {
      logError('Error saving specialist report:', err);
      setError('The report could not be saved right now.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleSetMarker = async (marker) => {
    if (!caseFile || actionBusy || caseFile.status !== 'claimed') return;
    setActionBusy(true);
    try {
      await updateSupportCaseMarker({ requestId: caseFile.id, marker });
    } catch (err) {
      logError('Error updating case marker:', err);
      setError('The case marker could not be updated right now.');
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) {
    return (
      <NewsPage className="specialist-casefile">
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="eyebrow sm">Loading case file…</p>
          </div>
        </div>
      </NewsPage>
    );
  }

  if (error || !caseFile) {
    return (
      <NewsPage className="specialist-casefile">
        <div className="space-y-6">
          <div className="news-page-topline">
            <span className="eyebrow sm text-oxblood">Specialist Desk · Case file</span>
            <Link to="/specialist-dashboard" className="eyebrow sm text-smoke hover:text-ink-soft transition-colors">
              back to desk
            </Link>
          </div>
          <NewsRule />
          <NewsNotice tone="danger" icon={AlertTriangle}>
            <p className="text-sm text-ink-soft">{error || 'This case file could not be opened.'}</p>
          </NewsNotice>
        </div>
      </NewsPage>
    );
  }

  const redacted = caseFile.queueOnly && caseFile.status === 'open';
  const markerMeta = CASE_MARKER_META[caseFile.caseMarker] || CASE_MARKER_META[SUPPORT_CASE_MARKERS.MONITORING];
  const crisisDetails = CRISIS_DETAILS[caseFile.crisisType] || CRISIS_DETAILS.other;
  const canResolve = (
    reportDraft.summary.trim()
    && reportDraft.actionsTaken.trim()
    && reportDraft.nextSteps.trim()
    && caseFile.caseMarker === SUPPORT_CASE_MARKERS.READY_TO_FILE
  );
  const reportCompletionCount = REPORT_FIELDS.filter((field) => reportDraft[field.key]?.trim()).length;

  return (
    <NewsPage className="specialist-casefile">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="news-page-topline">
          <span className="eyebrow sm text-oxblood">
            Specialist Desk · {caseFileRef(caseFile)} · {redacted ? 'Intake queue' : STATUS_COPY[caseFile.status] || caseFile.status}
          </span>
          <button
            onClick={() => navigate('/specialist-dashboard')}
            className="eyebrow sm text-smoke hover:text-ink-soft transition-colors"
          >
            back to desk
          </button>
        </div>
        <NewsRule />

        {error && (
          <NewsNotice tone="danger" icon={AlertTriangle} className="mt-8">
            <p className="text-sm text-ink-soft">{error}</p>
          </NewsNotice>
        )}

        {redacted ? (
          /* ── Redacted intake view ──────────────────────────────────── */
          <>
            <div className="specialist-casefile__intake-header">
              <p className="eyebrow sm text-smoke-dim">
                redacted intake · {URGENCY_LABELS[caseFile.urgency] || caseFile.urgency}
              </p>
              <h1 className="display text-4xl md:text-6xl leading-none mt-4">
                {CRISIS_LABELS[caseFile.crisisType] || caseFile.crisisType}
                <span className="italic-ox">.</span>
              </h1>
              <p className="text-base text-smoke leading-relaxed max-w-2xl mt-5">
                Review what this case involves and what will be required before you commit. Reporter identity and incident notes unlock after claiming.
              </p>
            </div>

            <div className="specialist-casefile__metastrip">
              <div className="specialist-casefile__metacard">
                <p className="eyebrow sm text-smoke-dim">Case type</p>
                <p className="display-soft text-xl mt-2 leading-tight capitalize">
                  {CRISIS_LABELS[caseFile.crisisType] || caseFile.crisisType}
                </p>
              </div>
              <div className="specialist-casefile__metacard">
                <p className="eyebrow sm text-smoke-dim">Urgency</p>
                <p className={`display-soft text-xl mt-2 leading-tight capitalize ${URGENCY_TONES[caseFile.urgency] || ''}`}>
                  {URGENCY_LABELS[caseFile.urgency] || caseFile.urgency}
                </p>
                <p className="eyebrow text-[10px] normal-case text-smoke mt-1">
                  in queue · {timeInQueue(caseFile.createdAt)}
                </p>
              </div>
              <div className="specialist-casefile__metacard">
                <p className="eyebrow sm text-smoke-dim">Contact preference</p>
                <p className="display-soft text-xl mt-2 leading-tight capitalize">
                  {CONTACT_LABELS[caseFile.contactMethod] || caseFile.contactMethod || '—'}
                </p>
                <p className="eyebrow text-[10px] normal-case text-smoke mt-1">
                  contact details confirmed after claiming
                </p>
              </div>
            </div>

            <div className="specialist-casefile__intake-grid">
              <NewsCard accent="#7B2E2E" className="specialist-casefile__sheet">
                <p className="eyebrow sm text-oxblood">Incident overview</p>

                {caseFile.previewNote ? (
                  <div className="specialist-casefile__preview-note">
                    <p className="eyebrow text-[10px] normal-case text-smoke-dim mb-2">from the reporter's brief</p>
                    <p className="text-base text-ink-soft leading-relaxed italic">"{caseFile.previewNote}"</p>
                  </div>
                ) : (
                  <p className="text-base text-ink-soft leading-relaxed mt-4">{crisisDetails.overview}</p>
                )}

                <p className="text-sm text-smoke leading-relaxed mt-4">{crisisDetails.scope}</p>

                <div className="specialist-casefile__requirements">
                  <p className="eyebrow sm text-smoke-dim" style={{ marginTop: '1.4rem', marginBottom: '0.5rem' }}>
                    This case may require
                  </p>
                  {crisisDetails.requires.map((req, i) => (
                    <div key={req} className="specialist-casefile__req-item">
                      <span className="eyebrow sm num text-smoke-dim" style={{ minWidth: '1.6rem', flexShrink: 0 }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm text-ink-soft">{req}</span>
                    </div>
                  ))}
                </div>
              </NewsCard>

              <div className="specialist-casefile__intake-rail">
                <NewsCard accent="#8A6D2C" className="specialist-casefile__sheet">
                  <p className="eyebrow sm text-brass">Before you claim</p>
                  <p className="text-sm text-ink-soft leading-relaxed mt-4">
                    Claiming locks this case to you. The reporter's identity and full incident notes become visible, and you take responsibility for triage and resolution.
                  </p>
                  <p className="text-sm text-smoke leading-relaxed mt-3">{crisisDetails.timeNote}</p>
                  <div className="specialist-casefile__actionrow">
                    <NewsButton onClick={handleClaim} disabled={actionBusy}>
                      <User className="w-4 h-4" />
                      {actionBusy ? 'claiming case…' : 'claim case'}
                    </NewsButton>
                  </div>
                </NewsCard>

                <div className="specialist-casefile__clipcard">
                  <div className="specialist-casefile__clip" aria-hidden="true" />
                  <p className="eyebrow sm text-oxblood">Filed details</p>
                  <div className="space-y-3 mt-4 text-sm">
                    <div>
                      <span className="text-smoke-dim">opened: </span>
                      <span className="text-ink-soft">{formatDate(caseFile.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-smoke-dim">in queue: </span>
                      <span className="text-ink-soft">{timeInQueue(caseFile.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-smoke-dim">contact: </span>
                      <span className="text-ink-soft">{CONTACT_LABELS[caseFile.contactMethod] || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ── Active / resolved case view ────────────────────────────── */
          <>
            <div className="specialist-casefile__hero">
              <div>
                <p className="eyebrow sm text-smoke-dim">
                  {STATUS_COPY[caseFile.status] || caseFile.status} · {URGENCY_LABELS[caseFile.urgency] || caseFile.urgency}
                </p>
                <div className="mt-4">
                  <span className={`specialist-casefile__marker ${markerMeta.tone}`}>
                    {markerMeta.label}
                  </span>
                </div>
                <h1 className="display text-4xl md:text-6xl leading-none mt-4 capitalize">
                  {CRISIS_LABELS[caseFile.crisisType] || caseFile.crisisType}
                  <span className="italic-ox">.</span>
                </h1>
                <p className="text-base text-smoke leading-relaxed max-w-2xl mt-5">
                  Open the case like a proper paper file: identify the contact route, read the brief, and move it only when the next step is clear.
                </p>
              </div>

              <div className="specialist-casefile__clipcard">
                <div className="specialist-casefile__clip" aria-hidden="true" />
                <p className="eyebrow sm text-oxblood">Filed details</p>
                <div className="space-y-3 mt-4 text-sm">
                  <div>
                    <span className="text-smoke-dim">opened: </span>
                    <span className="text-ink-soft">{formatDate(caseFile.createdAt)}</span>
                  </div>
                  {caseFile.claimedAt && (
                    <div>
                      <span className="text-smoke-dim">claimed: </span>
                      <span className="text-ink-soft">{formatDate(caseFile.claimedAt)}</span>
                    </div>
                  )}
                  {caseFile.resolvedAt && (
                    <div>
                      <span className="text-smoke-dim">filed: </span>
                      <span className="text-ink-soft">{formatDate(caseFile.resolvedAt)}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-smoke-dim">marker: </span>
                    <span className="text-ink-soft">{markerMeta.label}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="specialist-casefile__grid">
              <NewsCard accent="#7B2E2E" className="specialist-casefile__sheet">
                <p className="eyebrow sm text-oxblood">Incident brief</p>
                <p className="text-base text-ink-soft leading-relaxed mt-4">{caseFile.description}</p>

                <div className="specialist-casefile__actionrow">
                  {caseFile.status === 'claimed' && (
                    <NewsButton onClick={handleResolve} disabled={actionBusy || !canResolve}>
                      <CheckCircle className="w-4 h-4" />
                      {actionBusy ? 'filing case…' : 'file as resolved'}
                    </NewsButton>
                  )}
                </div>
              </NewsCard>

              <div className="specialist-casefile__rail">
                <NewsCard accent="#8A6D2C" className="specialist-casefile__sheet">
                  <p className="eyebrow sm text-brass">Contact ledger</p>
                  <div className="specialist-casefile__ledger">
                    <div>
                      <span className="text-smoke-dim">name</span>
                      <p>{caseFile.requesterName}</p>
                    </div>
                    <div>
                      <span className="text-smoke-dim">{caseFile.contactMethod || 'email'}</span>
                      <p>{caseFile.requesterEmail}</p>
                    </div>
                    {caseFile.requesterPhone && (
                      <div>
                        <span className="text-smoke-dim">phone</span>
                        <p>{caseFile.requesterPhone}</p>
                      </div>
                    )}
                  </div>
                </NewsCard>

                {caseFile.feedback && (
                  <NewsCard accent="#375E5A" className="specialist-casefile__sheet">
                    <p className="eyebrow sm text-[#375E5A]">Journalist feedback</p>
                    <p className="text-sm text-ink-soft leading-relaxed mt-4">
                      {caseFile.feedback.comment || 'no written comment'}
                    </p>
                    <p className="text-[10px] text-smoke-dim uppercase tracking-widest mt-4">
                      rating · {caseFile.feedback.rating}/5
                    </p>
                  </NewsCard>
                )}
              </div>
            </div>

            <div className="specialist-casefile__workspace">
              {caseFile.status === 'claimed' && (
                <NewsCard accent={markerMeta.accent} className="specialist-casefile__sheet">
                  <div className="specialist-casefile__section-head">
                    <div>
                      <p className="eyebrow sm text-ink">Operational marker</p>
                      <h2 className="news-card-title mt-2">Show whose move it is before you file the case.</h2>
                    </div>
                  </div>
                  <div className="specialist-casefile__marker-row">
                    {Object.values(SUPPORT_CASE_MARKERS).map((marker) => {
                      const meta = CASE_MARKER_META[marker];
                      const active = caseFile.caseMarker === marker;
                      return (
                        <button
                          key={marker}
                          type="button"
                          onClick={() => handleSetMarker(marker)}
                          disabled={actionBusy}
                          className={`specialist-casefile__marker-button ${active ? 'is-active' : ''}`}
                        >
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </NewsCard>
              )}

              <div className="specialist-casefile__workspace-top">
                <NewsCard accent="#15110C" className="specialist-casefile__sheet">
                  <div className="specialist-casefile__section-head">
                    <div>
                      <p className="eyebrow sm text-ink">Secure thread</p>
                      <h2 className="news-card-title mt-2">Clarify details with the reporter inside the case file.</h2>
                    </div>
                  </div>

                  <div className="specialist-casefile__thread">
                    {messages.length > 0 ? messages.map((message) => (
                      <div
                        key={message.id}
                        className={`specialist-casefile__message specialist-casefile__message--${message.authorRole}`}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="eyebrow sm text-oxblood">
                            {message.authorRole === 'specialist' ? 'Specialist note' : 'Reporter update'}
                          </p>
                          <span className="text-[10px] text-smoke-dim uppercase tracking-widest">
                            {formatDate(message.createdAt, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm text-ink-soft leading-relaxed mt-3">{message.body}</p>
                      </div>
                    )) : (
                      <p className="text-sm text-smoke">No messages yet. Use the thread to ask for clarifications or confirm next steps.</p>
                    )}
                  </div>

                  {caseFile.status !== 'resolved' && (
                    <div className="specialist-casefile__composer">
                      <p className="specialist-casefile__composer-note">
                        Keep each message action-oriented so the thread reads like a clean running log, not a loose inbox.
                      </p>
                      <textarea
                        value={messageDraft}
                        onChange={(event) => setMessageDraft(event.target.value)}
                        rows="4"
                        placeholder="Ask for more detail, confirm a containment step, or explain what you need from the reporter next."
                      />
                      <div className="specialist-casefile__composer-actions">
                        <NewsButton
                          type="button"
                          onClick={handleSendMessage}
                          disabled={messageBusy || !messageDraft.trim()}
                        >
                          <MessageSquare className="w-4 h-4" />
                          {messageBusy ? 'sending…' : 'send note'}
                        </NewsButton>
                      </div>
                    </div>
                  )}
                </NewsCard>

                <div className="specialist-casefile__workspace-rail">
                  <NewsCard accent={markerMeta.accent} className="specialist-casefile__sheet">
                    <div className="specialist-casefile__section-head">
                      <div>
                        <p className="eyebrow sm text-ink">Case cadence</p>
                        <h2 className="news-card-title mt-2">Keep the next move obvious.</h2>
                      </div>
                    </div>

                    <div className="specialist-casefile__report-readout">
                      <div>
                        <p className="eyebrow sm text-smoke-dim">Current marker</p>
                        <p className="text-sm text-ink-soft leading-relaxed mt-2">{markerMeta.label}</p>
                      </div>
                      <div>
                        <p className="eyebrow sm text-smoke-dim">Contact route</p>
                        <p className="text-sm text-ink-soft leading-relaxed mt-2">
                          {CONTACT_LABELS[caseFile.contactMethod] || caseFile.contactMethod || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="eyebrow sm text-smoke-dim">Closure rule</p>
                        <p className="text-sm text-ink-soft leading-relaxed mt-2">
                          Move the marker to ready to file and complete the summary, actions taken, and next steps before closing.
                        </p>
                      </div>
                    </div>
                  </NewsCard>
                </div>
              </div>

              <NewsCard accent="#8A6D2C" className="specialist-casefile__sheet specialist-casefile__sheet--report">
                <div className="specialist-casefile__section-head">
                  <div>
                    <p className="eyebrow sm text-brass">Resolution report</p>
                    <h2 className="news-card-title mt-2">Document what happened, what you did, and what remains risky.</h2>
                  </div>
                </div>

                <div className="specialist-casefile__report-status">
                  <div className="specialist-casefile__report-status-card">
                    <span className="eyebrow sm text-smoke">Draft completion</span>
                    <p className="display-soft text-3xl leading-none mt-2">
                      {reportCompletionCount}
                      <span className="text-smoke text-lg">/{REPORT_FIELDS.length}</span>
                    </p>
                  </div>
                  <div className="specialist-casefile__report-status-card">
                    <span className="eyebrow sm text-smoke">Closure status</span>
                    <p className="display-soft text-xl leading-tight mt-2">
                      {canResolve ? 'Ready to file' : 'Still open'}
                    </p>
                  </div>
                </div>

                <div className="specialist-casefile__report-grid">
                  {REPORT_FIELDS.map((field) => (
                    <label key={field.key} className="specialist-casefile__report-field f-row">
                      <div className="specialist-casefile__report-field-head">
                        <span className="f-lbl">
                          <span className="no">№ {field.no}</span>
                          <span>{field.label}</span>
                        </span>
                        <p className="specialist-casefile__report-field-hint">{field.hint}</p>
                      </div>
                      <textarea
                        value={reportDraft[field.key]}
                        onChange={(event) => setReportDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                        rows="5"
                        placeholder={field.placeholder}
                      />
                    </label>
                  ))}
                </div>

                <div className="specialist-casefile__actionrow">
                  <NewsButton type="button" onClick={handleSaveReport} disabled={actionBusy}>
                    {actionBusy ? 'saving…' : 'save report draft'}
                  </NewsButton>
                  {caseFile.status === 'claimed' && !canResolve && (
                    <p className="text-xs text-smoke">Save the report and move the marker to ready to file before closing the case.</p>
                  )}
                </div>
              </NewsCard>
            </div>
          </>
        )}
      </motion.div>
    </NewsPage>
  );
};

export default SpecialistCaseFile;
