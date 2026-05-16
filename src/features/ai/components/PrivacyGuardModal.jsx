import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert, X } from 'lucide-react';
import { NewsBadge, NewsButton, NewsModalCard } from '../../../components/editorial/NewsPage';
import { REDACTION_FLAG_LABELS } from '../services/privacyGuard';

const PrivacyGuardModal = ({
  open,
  title,
  description,
  analysis,
  confirmLabel = 'Send redacted version',
  loading = false,
  onConfirm,
  onEdit,
  onClose,
}) => {
  if (!open || !analysis) return null;

  const visibleEntries = analysis.entries.filter((entry) => entry.original.trim());

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-ink/50"
        onClick={onClose}
      >
        <NewsModalCard
          as={motion.div}
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-3xl max-h-[88vh] overflow-y-auto"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-smoke hover:text-ink transition-colors z-10"
            aria-label="Close privacy guard"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="px-6 pt-6 pb-5 border-b border-ink/12">
            <p className="eyebrow sm text-oxblood mb-2">Privacy guard</p>
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-oxblood shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h3 className="display-soft text-xl leading-tight">{title}</h3>
                <p className="text-sm text-ink-soft mt-2 leading-relaxed">{description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {analysis.flags.map((flag) => (
                <NewsBadge key={flag} color="#7B2E2E">
                  {REDACTION_FLAG_LABELS[flag] || flag}
                </NewsBadge>
              ))}
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            {visibleEntries.map((entry) => (
              <div key={entry.label} className="border border-ink/10">
                <div className="px-4 py-3 border-b border-ink/10 bg-paper-soft/70">
                  <p className="eyebrow sm text-ink">{entry.label}</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="p-4 border-b lg:border-b-0 lg:border-r border-ink/10">
                    <p className="eyebrow sm text-smoke mb-2">Original</p>
                    <p className="text-sm leading-relaxed text-ink-soft whitespace-pre-wrap break-words">
                      {entry.original}
                    </p>
                  </div>
                  <div className="p-4 bg-paper-soft/40">
                    <p className="eyebrow sm text-oxblood mb-2">Redacted</p>
                    <p className="text-sm leading-relaxed text-ink-soft whitespace-pre-wrap break-words">
                      {entry.redacted}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <p className="text-xs leading-relaxed text-smoke">
                SafePress will still run server-side redaction before the model call. This screen lets you review the client-side version first.
              </p>
              <div className="flex flex-wrap gap-3">
                <NewsButton type="button" variant="ghost" onClick={onEdit} disabled={loading}>
                  Edit first
                </NewsButton>
                <NewsButton type="button" variant="mono" onClick={onClose} disabled={loading}>
                  Cancel
                </NewsButton>
                <NewsButton type="button" onClick={onConfirm} disabled={loading}>
                  {loading ? 'Sending...' : confirmLabel}
                </NewsButton>
              </div>
            </div>
          </div>
        </NewsModalCard>
      </motion.div>
    </AnimatePresence>
  );
};

export default PrivacyGuardModal;
