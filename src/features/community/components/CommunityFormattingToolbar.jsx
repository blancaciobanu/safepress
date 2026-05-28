import { Bold, Italic, List } from 'lucide-react';

export const CommunityFormattingToolbar = ({
  onBold,
  onItalic,
  onBullets,
  className = '',
}) => (
  <div className={`inline-flex items-center border border-ink/12 bg-paper-soft/60 ${className}`}>
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onBold}
      className="w-8 h-8 inline-flex items-center justify-center text-smoke hover:text-ink hover:bg-ink/[0.04] transition-colors"
      title="Bold"
      aria-label="Bold"
    >
      <Bold className="w-3.5 h-3.5" />
    </button>
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onItalic}
      className="w-8 h-8 inline-flex items-center justify-center text-smoke hover:text-ink hover:bg-ink/[0.04] transition-colors border-l border-ink/10"
      title="Italic"
      aria-label="Italic"
    >
      <Italic className="w-3.5 h-3.5" />
    </button>
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onBullets}
      className="w-8 h-8 inline-flex items-center justify-center text-smoke hover:text-ink hover:bg-ink/[0.04] transition-colors border-l border-ink/10"
      title="Bullet list"
      aria-label="Bullet list"
    >
      <List className="w-3.5 h-3.5" />
    </button>
  </div>
);
