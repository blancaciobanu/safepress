import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Flag } from 'lucide-react';
import { useState } from 'react';
import { NewsModalCard, NewsTextarea } from '../../../components/editorial/NewsPage';

const REPORT_REASONS = [
  { id: 'spam',           label: 'spam or self-promotion' },
  { id: 'harassment',     label: 'harassment or abuse' },
  { id: 'misinformation', label: 'misinformation or bad security advice' },
  { id: 'off-topic',      label: 'off-topic' },
  { id: 'other',          label: 'other' },
];

/* Report modal.
   target: { type: 'post' | 'comment', postId, commentId? } | null
   onSubmit: async ({ reason, note }) => void — parent files the report
   onClose: () => void
   The modal owns its own form state (reason + note + submitting + success)
   — that state is internal UI, no business for the parent. */

export const ReportModal = ({ target, onSubmit, onClose }) => {
  const [reason, setReason]     = useState('spam');
  const [note, setNote]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]   = useState(false);

  const handleClose = () => {
    if (submitting) return;
    onClose();
    // Reset for next open
    setReason('spam');
    setNote('');
    setSuccess(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({ reason, note: note.trim() });
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {target && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <NewsModalCard
            as={motion.div}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-brass/12 border border-brass/30 flex items-center justify-center">
                <Flag className="w-5 h-5 text-brass" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-ink">
                  report {target.type}
                </h3>
                <p className="text-[11px] text-smoke">
                  an admin will review your report
                </p>
              </div>
            </div>

            {success ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-brass mx-auto mb-2" />
                <p className="text-sm text-ink">report filed — thank you</p>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-bold tracking-widest uppercase text-smoke mb-2">
                  reason
                </p>
                <div className="space-y-1.5 mb-4">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r.id}
                      className={`flex items-center gap-3 px-3 py-2 border cursor-pointer transition-all ${
                        reason === r.id
                          ? 'bg-brass/[0.06] border-brass/30'
                          : 'bg-paper-soft/40 border-ink/8 hover:border-ink/16'
                      }`}
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        value={r.id}
                        checked={reason === r.id}
                        onChange={() => setReason(r.id)}
                        className="accent-brass"
                      />
                      <span className="text-sm text-ink-soft">{r.label}</span>
                    </label>
                  ))}
                </div>
                <NewsTextarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows="2"
                  placeholder="optional: add context..."
                  className="mb-4"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleClose}
                    disabled={submitting}
                    className="px-4 py-2 text-smoke hover:text-ink text-xs font-semibold tracking-wide uppercase transition-colors disabled:opacity-50"
                  >
                    cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2 btn text-xs font-semibold uppercase tracking-wide transition-all disabled:opacity-50"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    {submitting ? 'filing...' : 'file report'}
                  </button>
                </div>
              </>
            )}
          </NewsModalCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
