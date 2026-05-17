import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, MessageSquare, Shield, User } from 'lucide-react';
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

const buildSpecialistView = (rawCase, specialistId) => {
  if (rawCase.status === 'open') {
    return {
      ...rawCase,
      queueOnly: true,
      description: 'confidential details unlock after you claim this request',
      requesterName: 'confidential until claimed',
      requesterEmail: 'claim to view contact details',
      requesterPhone: null,
    };
  }

  if (rawCase.claimedBy !== specialistId) {
    throw new Error('support-request-access-denied');
  }

  return rawCase;
};

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
            description: 'confidential details unlock after you claim this request',
            requesterName: 'confidential until claimed',
            requesterEmail: 'claim to view contact details',
            requesterPhone: null,
          });
          setLoading(false);
          return;
        }

        if (!privateUnsubscribe) {
          privateUnsubscribe = listenToSupportCaseFile({
            requestId,
            onData: (rawCase) => {
              try {
                const visibleCase = buildSpecialistView(rawCase, user.uid);
                setCaseFile(visibleCase);
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
    if (!user || !caseFile || messageBusy) return;
    if (!messageDraft.trim()) return;

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
      await updateSupportCaseMarker({
        requestId: caseFile.id,
        marker,
      });
    } catch (err) {
      logError('Error updating case marker:', err);
      setError('The case marker could not be updated right now.');
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) {
    return (
      <NewsPage className="specialist-casefile" max="reading">
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
      <NewsPage className="specialist-casefile" max="reading">
        <div className="space-y-6">
          <div className="flex items-baseline justify-between pb-3">
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
  const canResolve = (
    reportDraft.summary.trim()
    && reportDraft.actionsTaken.trim()
    && reportDraft.nextSteps.trim()
    && caseFile.caseMarker === SUPPORT_CASE_MARKERS.READY_TO_FILE
  );

  return (
    <NewsPage className="specialist-casefile" max="reading">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-baseline justify-between pb-3">
          <span className="eyebrow sm text-oxblood">Specialist Desk · Case file</span>
          <button onClick={() => navigate('/specialist-dashboard')} className="eyebrow sm text-smoke hover:text-ink-soft transition-colors">
            back to desk
          </button>
        </div>
        <NewsRule />

        <div className="specialist-casefile__hero">
          <div>
            <p className="eyebrow sm text-smoke-dim">
              {STATUS_COPY[caseFile.status] || caseFile.status} · {URGENCY_LABELS[caseFile.urgency] || caseFile.urgency}
            </p>
            {!redacted && (
              <div className="mt-4">
                <span className={`specialist-casefile__marker ${markerMeta.tone}`}>
                  {markerMeta.label}
                </span>
              </div>
            )}
            <h1 className="display text-4xl md:text-6xl leading-none mt-4">
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
                <span className="text-ink-soft">{new Date(caseFile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              {caseFile.claimedAt && (
                <div>
                  <span className="text-smoke-dim">claimed: </span>
                  <span className="text-ink-soft">{new Date(caseFile.claimedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
              {caseFile.resolvedAt && (
                <div>
                  <span className="text-smoke-dim">filed: </span>
                  <span className="text-ink-soft">{new Date(caseFile.resolvedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
              {!redacted && (
                <div>
                  <span className="text-smoke-dim">marker: </span>
                  <span className="text-ink-soft">{markerMeta.label}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <NewsNotice tone="danger" icon={AlertTriangle} className="mt-8">
            <p className="text-sm text-ink-soft">{error}</p>
          </NewsNotice>
        )}

        {redacted ? (
          <NewsNotice tone="info" icon={Shield} className="mt-8">
            <div>
              <p className="eyebrow sm text-ink">redacted intake</p>
              <p className="mt-2 text-sm text-ink-soft">
                The requester&apos;s identity and detailed incident notes stay hidden until you claim the case. This protects the queue while specialists scan for fit and urgency.
              </p>
            </div>
          </NewsNotice>
        ) : null}

        <div className="specialist-casefile__grid">
          <NewsCard accent="#7B2E2E" className="specialist-casefile__sheet">
            <p className="eyebrow sm text-oxblood">Incident brief</p>
            <p className="text-base text-ink-soft leading-relaxed mt-4">
              {redacted ? 'confidential details unlock after you claim this request' : caseFile.description}
            </p>

            <div className="specialist-casefile__actionrow">
              {caseFile.status === 'open' && (
                <NewsButton
                  onClick={handleClaim}
                  disabled={actionBusy}
                >
                  <User className="w-4 h-4" />
                  {actionBusy ? 'claiming case…' : 'claim case'}
                </NewsButton>
              )}
              {caseFile.status === 'claimed' && (
                <NewsButton
                  onClick={handleResolve}
                  disabled={actionBusy || !canResolve}
                >
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
                  <p>{redacted ? 'confidential until claimed' : caseFile.requesterName}</p>
                </div>
                <div>
                  <span className="text-smoke-dim">{caseFile.contactMethod || 'email'}</span>
                  <p>{redacted ? 'claim to view contact details' : caseFile.requesterEmail}</p>
                </div>
                {!redacted && caseFile.requesterPhone && (
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

        {!redacted && (
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
                        {new Date(message.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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

            <NewsCard accent="#8A6D2C" className="specialist-casefile__sheet">
              <div className="specialist-casefile__section-head">
                <div>
                  <p className="eyebrow sm text-brass">Resolution report</p>
                  <h2 className="news-card-title mt-2">Document what happened, what you did, and what remains risky.</h2>
                </div>
              </div>

              <div className="specialist-casefile__report-grid">
                <label className="f-row">
                  <span className="f-lbl"><span className="no">№ 01</span><span>Situation summary</span></span>
                  <textarea
                    value={reportDraft.summary}
                    onChange={(event) => setReportDraft((current) => ({ ...current, summary: event.target.value }))}
                    rows="4"
                    placeholder="What happened and what the journalist reported."
                  />
                </label>
                <label className="f-row">
                  <span className="f-lbl"><span className="no">№ 02</span><span>Actions taken</span></span>
                  <textarea
                    value={reportDraft.actionsTaken}
                    onChange={(event) => setReportDraft((current) => ({ ...current, actionsTaken: event.target.value }))}
                    rows="4"
                    placeholder="Containment, verification, resets, notifications, or source-protection steps already completed."
                  />
                </label>
                <label className="f-row">
                  <span className="f-lbl"><span className="no">№ 03</span><span>Outstanding risks</span></span>
                  <textarea
                    value={reportDraft.outstandingRisks}
                    onChange={(event) => setReportDraft((current) => ({ ...current, outstandingRisks: event.target.value }))}
                    rows="4"
                    placeholder="Anything still unresolved or unsafe."
                  />
                </label>
                <label className="f-row">
                  <span className="f-lbl"><span className="no">№ 04</span><span>Next steps for the journalist</span></span>
                  <textarea
                    value={reportDraft.nextSteps}
                    onChange={(event) => setReportDraft((current) => ({ ...current, nextSteps: event.target.value }))}
                    rows="4"
                    placeholder="What the reporter should do next and when to escalate again."
                  />
                </label>
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
        )}
      </motion.div>
    </NewsPage>
  );
};

export default SpecialistCaseFile;
