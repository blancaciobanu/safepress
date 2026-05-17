import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, MessageSquare, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  addSupportCaseMessage,
  listenToSupportCaseFile,
  listenToSupportCaseMessages,
  SUPPORT_CASE_MARKERS,
  submitSupportFeedback,
} from '../features/support/services/supportService';
import { logError } from '../utils/logger';
import { NewsButton, NewsCard, NewsNotice, NewsPage, NewsRule } from '../components/editorial/NewsPage';

const CRISIS_LABELS = {
  hacked: 'hacked account',
  source: 'source exposed',
  doxxed: 'doxxing incident',
  phishing: 'phishing attempt',
  other: 'security concern',
};

const STATUS_COPY = {
  open: 'waiting in intake',
  claimed: 'with a specialist',
  resolved: 'resolution filed',
};

const CASE_MARKER_META = {
  [SUPPORT_CASE_MARKERS.AWAITING_SPECIALIST]: {
    label: 'awaiting specialist',
    note: 'Your last update is on file. A specialist needs to review or respond next.',
  },
  [SUPPORT_CASE_MARKERS.AWAITING_REPORTER]: {
    label: 'awaiting you',
    note: 'The specialist is waiting for a reply or confirmation before moving the case forward.',
  },
  [SUPPORT_CASE_MARKERS.MONITORING]: {
    label: 'monitoring',
    note: 'The specialist is actively working the case and watching for the next change.',
  },
  [SUPPORT_CASE_MARKERS.READY_TO_FILE]: {
    label: 'ready to file',
    note: 'The report is in place and the case is ready to be formally closed.',
  },
};

const SupportCaseDesk = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [caseFile, setCaseFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageBusy, setMessageBusy] = useState(false);
  const [messageDraft, setMessageDraft] = useState('');
  const [error, setError] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackBusy, setFeedbackBusy] = useState(false);

  useEffect(() => {
    if (!user || !requestId) return;

    setLoading(true);
    setError('');

    const unsubscribe = listenToSupportCaseFile({
      requestId,
      onData: (rawCase) => {
        if (rawCase.requesterId !== user.uid) {
          setError('This case desk is unavailable right now.');
          setLoading(false);
          return;
        }

        setCaseFile(rawCase);
        setLoading(false);
      },
      onError: (err) => {
        logError('Error loading requester case file:', err);
        setError('This case desk is unavailable right now.');
        setLoading(false);
      },
    });

    return unsubscribe;
  }, [requestId, user]);

  useEffect(() => {
    if (!requestId || !caseFile) return undefined;

    const unsubscribe = listenToSupportCaseMessages({
      requestId,
      onData: setMessages,
      onError: (err) => {
        logError('Error loading requester case messages:', err);
      },
    });

    return unsubscribe;
  }, [requestId, caseFile]);

  const handleSubmitFeedback = async () => {
    if (!caseFile || !feedbackRating || feedbackBusy) return;
    setFeedbackBusy(true);
    try {
      await submitSupportFeedback({
        requestId: caseFile.id,
        rating: feedbackRating,
        comment: feedbackComment.trim(),
      });
    } catch (err) {
      logError('Error submitting feedback:', err);
      setError('Your feedback could not be submitted right now.');
    } finally {
      setFeedbackBusy(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !caseFile || messageBusy || !messageDraft.trim()) return;

    setMessageBusy(true);
    try {
      await addSupportCaseMessage({
        requestId: caseFile.id,
        authorId: user.uid,
        authorName: user.realName || user.username || 'Reporter',
        authorRole: 'requester',
        body: messageDraft,
      });
      setMessageDraft('');
    } catch (err) {
      logError('Error sending requester case message:', err);
      setError('Your update could not be sent right now.');
    } finally {
      setMessageBusy(false);
    }
  };

  if (loading) {
    return (
      <NewsPage className="specialist-casefile" max="reading">
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="eyebrow sm">Loading case desk…</p>
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
            <span className="eyebrow sm text-oxblood">Support case desk</span>
            <button onClick={() => navigate('/request-support')} className="eyebrow sm text-smoke hover:text-ink-soft transition-colors">
              back to support
            </button>
          </div>
          <NewsRule />
          <NewsNotice tone="danger" icon={AlertTriangle}>
            <p className="text-sm text-ink-soft">{error || 'This case desk could not be opened.'}</p>
          </NewsNotice>
        </div>
      </NewsPage>
    );
  }

  const markerMeta = CASE_MARKER_META[caseFile.caseMarker] || CASE_MARKER_META[SUPPORT_CASE_MARKERS.AWAITING_SPECIALIST];

  return (
    <NewsPage className="specialist-casefile" max="reading">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-baseline justify-between pb-3">
          <span className="eyebrow sm text-oxblood">Support case desk</span>
          <Link to="/request-support" className="eyebrow sm text-smoke hover:text-ink-soft transition-colors">
            request another case
          </Link>
        </div>
        <NewsRule />

        <div className="specialist-casefile__hero">
          <div>
            <p className="eyebrow sm text-smoke-dim">
              {STATUS_COPY[caseFile.status] || caseFile.status}
            </p>
            <div className="mt-4">
              <span className="specialist-casefile__marker">
                {markerMeta.label}
              </span>
            </div>
            <h1 className="display text-4xl md:text-6xl leading-none mt-4">
              {CRISIS_LABELS[caseFile.crisisType] || caseFile.crisisType}
              <span className="italic-ox">.</span>
            </h1>
            <p className="text-base text-smoke leading-relaxed max-w-2xl mt-5">
              Use this desk to follow your case, answer specialist questions, and keep the final report in one place.
            </p>
          </div>

          <div className="specialist-casefile__clipcard">
            <div className="specialist-casefile__clip" aria-hidden="true" />
            <p className="eyebrow sm text-oxblood">Case status</p>
            <div className="space-y-3 mt-4 text-sm">
              <div>
                <span className="text-smoke-dim">filed: </span>
                <span className="text-ink-soft">{new Date(caseFile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div>
                <span className="text-smoke-dim">specialist: </span>
                <span className="text-ink-soft">{caseFile.claimedByName || 'waiting to be claimed'}</span>
              </div>
              <div>
                <span className="text-smoke-dim">marker: </span>
                <span className="text-ink-soft">{markerMeta.label}</span>
              </div>
              {caseFile.resolvedAt && (
                <div>
                  <span className="text-smoke-dim">resolved: </span>
                  <span className="text-ink-soft">{new Date(caseFile.resolvedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {caseFile.status === 'open' && (
          <NewsNotice tone="info" icon={AlertTriangle} className="mt-8">
            <p className="text-sm text-ink-soft">
              Your request is still in the intake tray. You can add more context below, and the thread will be ready once a specialist claims the case.
            </p>
          </NewsNotice>
        )}

        {caseFile.status !== 'open' && (
          <NewsNotice tone="info" icon={MessageSquare} className="mt-8">
            <p className="text-sm text-ink-soft">
              {markerMeta.note}
            </p>
          </NewsNotice>
        )}

        <div className="specialist-casefile__grid">
          <NewsCard accent="#7B2E2E" className="specialist-casefile__sheet">
            <p className="eyebrow sm text-oxblood">Filed request</p>
            <p className="text-base text-ink-soft leading-relaxed mt-4">
              {caseFile.description}
            </p>
          </NewsCard>

          <NewsCard accent="#8A6D2C" className="specialist-casefile__sheet">
            <p className="eyebrow sm text-brass">Contact route</p>
            <div className="specialist-casefile__ledger">
              <div>
                <span className="text-smoke-dim">preferred method</span>
                <p>{caseFile.contactMethod}</p>
              </div>
              <div>
                <span className="text-smoke-dim">email</span>
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
        </div>

        <div className="specialist-casefile__workspace">
          <NewsCard accent="#15110C" className="specialist-casefile__sheet">
            <div className="specialist-casefile__section-head">
              <div>
                <p className="eyebrow sm text-ink">Case thread</p>
                <h2 className="news-card-title mt-2">Keep questions, updates, and confirmations inside the file.</h2>
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
                <p className="text-sm text-smoke">No messages yet. Add any new developments here so the specialist sees them in the file.</p>
              )}
            </div>

            {caseFile.status === 'open' && (
              <p className="text-sm text-smoke mt-4 pt-4 border-t border-ink/8">
                The thread opens once a specialist claims your case. You can add more context to your request in the meantime by filing a new request with updated details.
              </p>
            )}

            {caseFile.status === 'claimed' && (
              <div className="specialist-casefile__composer">
                <textarea
                  value={messageDraft}
                  onChange={(event) => setMessageDraft(event.target.value)}
                  rows="4"
                  placeholder="Add new developments, answer specialist questions, or clarify what has changed since the request was filed."
                />
                <div className="specialist-casefile__composer-actions">
                  <NewsButton
                    type="button"
                    onClick={handleSendMessage}
                    disabled={messageBusy || !messageDraft.trim()}
                  >
                    <MessageSquare className="w-4 h-4" />
                    {messageBusy ? 'sending…' : 'send update'}
                  </NewsButton>
                </div>
              </div>
            )}
          </NewsCard>

          <NewsCard accent="#375E5A" className="specialist-casefile__sheet">
            <div className="specialist-casefile__section-head">
              <div>
                <p className="eyebrow sm text-[#375E5A]">Resolution report</p>
                <h2 className="news-card-title mt-2">What the specialist documents at the end of the case.</h2>
              </div>
            </div>

            {caseFile.caseReport ? (
              <div className="specialist-casefile__report-readout">
                {[
                  ['Situation summary', caseFile.caseReport.summary],
                  ['Actions taken', caseFile.caseReport.actionsTaken],
                  ['Outstanding risks', caseFile.caseReport.outstandingRisks],
                  ['Next steps', caseFile.caseReport.nextSteps],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="eyebrow sm text-smoke-dim">{label}</p>
                    <p className="text-sm text-ink-soft leading-relaxed mt-2">{value || 'Not provided.'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-smoke">
                The report will appear here once the specialist has documented what happened, what they did, and what you should do next.
              </p>
            )}
          </NewsCard>

          {caseFile.status === 'resolved' && !caseFile.feedback && (
            <NewsCard accent="#8A6D2C" className="specialist-casefile__sheet">
              <p className="eyebrow sm text-brass">Close-out feedback</p>
              <h2 className="news-card-title mt-2">How did the specialist support go?</h2>
              <p className="text-sm text-smoke leading-relaxed mt-4 mb-6">
                Your rating and comments help improve matching and response quality for future reporters.
              </p>

              <div className="flex gap-3 mb-6">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setFeedbackRating(n)}
                    className="transition-opacity hover:opacity-80"
                    aria-label={`Rate ${n} out of 5`}
                  >
                    <Star className={`w-6 h-6 ${n <= feedbackRating ? 'text-brass fill-amber-400' : 'text-smoke'}`} />
                  </button>
                ))}
              </div>

              <label className="f-row">
                <span className="f-lbl">Comment (optional)</span>
                <textarea
                  value={feedbackComment}
                  onChange={(event) => setFeedbackComment(event.target.value)}
                  rows="3"
                  placeholder="What went well, what could have been clearer, or anything the specialist should know for future cases."
                />
              </label>

              <div className="specialist-casefile__actionrow mt-4">
                <NewsButton
                  type="button"
                  onClick={handleSubmitFeedback}
                  disabled={feedbackBusy || !feedbackRating}
                >
                  {feedbackBusy ? 'submitting…' : 'submit feedback'}
                </NewsButton>
                {!feedbackRating && (
                  <p className="text-xs text-smoke">Select a rating to submit.</p>
                )}
              </div>
            </NewsCard>
          )}

          {caseFile.status === 'resolved' && caseFile.feedback && (
            <NewsCard accent="#375E5A" className="specialist-casefile__sheet">
              <p className="eyebrow sm text-[#375E5A]">Feedback filed</p>
              <div className="flex gap-1 mt-4 mb-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`w-4 h-4 ${n <= caseFile.feedback.rating ? 'text-brass fill-amber-400' : 'text-smoke'}`} />
                ))}
              </div>
              {caseFile.feedback.comment && (
                <p className="text-sm text-ink-soft leading-relaxed">{caseFile.feedback.comment}</p>
              )}
              <p className="text-[10px] text-smoke-dim uppercase tracking-widest mt-4">
                filed · {new Date(caseFile.feedback.submittedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </NewsCard>
          )}
        </div>
      </motion.div>
    </NewsPage>
  );
};

export default SupportCaseDesk;
