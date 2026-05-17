import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { NewsModalCard } from '../../../components/editorial/NewsPage';

/* Delete confirm modal.
   target: { type: 'post' | 'comment', id, commentId? } | null
   onConfirm: async (target) => void — called when user clicks delete
   onClose: () => void
   The parent owns the target state and chooses which delete handler runs. */

export const DeleteConfirmModal = ({ target, onConfirm, onClose }) => (
  <AnimatePresence>
    {target && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[80] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <NewsModalCard
          as={motion.div}
          borderColor="rgba(107, 31, 31, 0.2)"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative w-full max-w-sm p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-oxblood/10 border border-oxblood/25 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-oxblood" />
            </div>
            <h3 className="text-base font-semibold text-ink">
              delete {target.type === 'post' ? 'post' : 'comment'}?
            </h3>
          </div>
          <p className="text-sm text-smoke leading-relaxed mb-4">
            {target.type === 'post'
              ? 'this will permanently remove your post and all replies.'
              : 'the comment will be replaced with "[deleted]" so the thread stays readable.'}
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-smoke hover:text-ink text-xs font-semibold tracking-wide uppercase transition-colors"
            >
              cancel
            </button>
            <button
              onClick={async () => {
                await onConfirm(target);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-oxblood hover:bg-oxblood-soft text-paper text-xs font-semibold uppercase tracking-wide transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              delete
            </button>
          </div>
        </NewsModalCard>
      </motion.div>
    )}
  </AnimatePresence>
);
