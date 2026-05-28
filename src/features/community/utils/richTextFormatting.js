const restoreSelection = (textarea, selectionStart, selectionEnd) => {
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(selectionStart, selectionEnd);
  });
};

const applyFormattingResult = (textarea, onChange, result) => {
  if (!result) return;
  onChange(result.value);
  restoreSelection(textarea, result.selectionStart, result.selectionEnd);
};

const wrapSelection = (value, selectionStart, selectionEnd, marker) => {
  const selectedText = value.slice(selectionStart, selectionEnd);
  const markerLength = marker.length;

  if (!selectedText) {
    return {
      value: `${value.slice(0, selectionStart)}${marker}${marker}${value.slice(selectionEnd)}`,
      selectionStart: selectionStart + markerLength,
      selectionEnd: selectionStart + markerLength,
    };
  }

  if (
    selectedText.startsWith(marker)
    && selectedText.endsWith(marker)
    && selectedText.length >= markerLength * 2
  ) {
    const unwrapped = selectedText.slice(markerLength, selectedText.length - markerLength);
    return {
      value: `${value.slice(0, selectionStart)}${unwrapped}${value.slice(selectionEnd)}`,
      selectionStart,
      selectionEnd: selectionStart + unwrapped.length,
    };
  }

  return {
    value: `${value.slice(0, selectionStart)}${marker}${selectedText}${marker}${value.slice(selectionEnd)}`,
    selectionStart: selectionStart + markerLength,
    selectionEnd: selectionEnd + markerLength,
  };
};

const toggleLinePrefix = (value, selectionStart, selectionEnd, prefix = '- ') => {
  const blockStart = value.lastIndexOf('\n', Math.max(selectionStart - 1, 0)) + 1;
  const blockEndIndex = value.indexOf('\n', selectionEnd);
  const blockEnd = blockEndIndex === -1 ? value.length : blockEndIndex;
  const selectedBlock = value.slice(blockStart, blockEnd);
  const lines = selectedBlock.split('\n');
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const alreadyBulleted = nonEmptyLines.length > 0
    && nonEmptyLines.every((line) => line.trimStart().startsWith(prefix));

  const nextLines = lines.map((line) => {
    if (!line.trim()) return line;

    if (alreadyBulleted) {
      return line.replace(/^(\s*)-\s/, '$1');
    }

    return line.replace(/^(\s*)/, `$1${prefix}`);
  });

  const nextBlock = nextLines.join('\n');
  const nextValue = `${value.slice(0, blockStart)}${nextBlock}${value.slice(blockEnd)}`;
  const selectionDelta = nextBlock.length - selectedBlock.length;

  return {
    value: nextValue,
    selectionStart: blockStart,
    selectionEnd: blockEnd + selectionDelta,
  };
};

export const applyBoldFormatting = ({ textarea, value, onChange }) => {
  applyFormattingResult(
    textarea,
    onChange,
    wrapSelection(value, textarea.selectionStart, textarea.selectionEnd, '**'),
  );
};

export const applyItalicFormatting = ({ textarea, value, onChange }) => {
  applyFormattingResult(
    textarea,
    onChange,
    wrapSelection(value, textarea.selectionStart, textarea.selectionEnd, '*'),
  );
};

export const applyBulletFormatting = ({ textarea, value, onChange }) => {
  applyFormattingResult(
    textarea,
    onChange,
    toggleLinePrefix(value, textarea.selectionStart, textarea.selectionEnd),
  );
};

export const handleRichTextKeyDown = ({ event, value, onChange }) => {
  if (!(event.metaKey || event.ctrlKey) || event.altKey) return false;

  const key = event.key.toLowerCase();
  const textarea = event.currentTarget;

  if (key === 'b') {
    event.preventDefault();
    applyBoldFormatting({ textarea, value, onChange });
    return true;
  }

  if (key === 'i') {
    event.preventDefault();
    applyItalicFormatting({ textarea, value, onChange });
    return true;
  }

  return false;
};

export const stripCommunityFormatting = (value = '') =>
  value
    .replace(/\r\n?/g, '\n')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
