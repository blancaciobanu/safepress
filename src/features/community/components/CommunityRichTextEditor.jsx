import { useEffect, useRef } from 'react';
import { CommunityFormattingToolbar } from './CommunityFormattingToolbar';

const escapeHtml = (value = '') =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderInlineHtml = (value = '') =>
  escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>');

const markdownToEditorHtml = (content = '') => {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];

  for (let index = 0; index < lines.length;) {
    if (!lines[index].trim()) {
      index += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(lines[index])) {
      const items = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(`<li>${renderInlineHtml(lines[index].replace(/^\s*[-*]\s+/, ''))}</li>`);
        index += 1;
      }
      blocks.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    const paragraphLines = [];
    while (index < lines.length && lines[index].trim() && !/^\s*[-*]\s+/.test(lines[index])) {
      paragraphLines.push(renderInlineHtml(lines[index]));
      index += 1;
    }
    blocks.push(`<p>${paragraphLines.join('<br>')}</p>`);
  }

  return blocks.join('');
};

const inlineMarkdownFromNode = (node) => {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const tagName = node.tagName.toLowerCase();
  if (tagName === 'br') return '\n';

  const inner = [...node.childNodes].map(inlineMarkdownFromNode).join('');
  if (!inner) return '';

  if (tagName === 'strong' || tagName === 'b') return `**${inner}**`;
  if (tagName === 'em' || tagName === 'i') return `*${inner}*`;
  return inner;
};

const blockMarkdownFromNode = (node) => {
  if (node.nodeType === Node.TEXT_NODE) return (node.nodeValue || '').trim();
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const tagName = node.tagName.toLowerCase();

  if (tagName === 'ul' || tagName === 'ol') {
    return [...node.children]
      .filter((child) => child.tagName?.toLowerCase() === 'li')
      .map((child) => `- ${inlineMarkdownFromNode(child).trim()}`)
      .filter((line) => line.length > 2)
      .join('\n');
  }

  if (tagName === 'li') {
    const text = inlineMarkdownFromNode(node).trim();
    return text ? `- ${text}` : '';
  }

  return inlineMarkdownFromNode(node).trim();
};

const serializeEditorContent = (editor) =>
  [...editor.childNodes]
    .map(blockMarkdownFromNode)
    .filter(Boolean)
    .join('\n\n')
    .trim();

export const CommunityRichTextEditor = ({
  value,
  onChange,
  placeholder,
  rows = 3,
  className = '',
  editorClassName = '',
  toolbarClassName = '',
  ariaInvalid,
}) => {
  const editorRef = useRef(null);
  const currentValueRef = useRef(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || currentValueRef.current === value) return;
    currentValueRef.current = value || '';
    editor.innerHTML = markdownToEditorHtml(value || '');
  }, [value]);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const nextValue = serializeEditorContent(editor);
    if (!nextValue && !editor.textContent.trim()) {
      editor.innerHTML = '';
    }
    currentValueRef.current = nextValue;
    onChange(nextValue);
  };

  const runCommand = (command) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    document.execCommand(command, false, null);
    emitChange();
  };

  return (
    <div className={`community-rich-editor ${className}`}>
      <div className="community-rich-editor__toolbar">
        <CommunityFormattingToolbar
          className={toolbarClassName}
          onBold={() => runCommand('bold')}
          onItalic={() => runCommand('italic')}
          onBullets={() => runCommand('insertUnorderedList')}
        />
      </div>
      <div
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        aria-invalid={ariaInvalid}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className={`community-rich-editor__field ${editorClassName}`}
        style={{ minHeight: `${Math.max(rows, 2) * 1.65}rem` }}
        onInput={emitChange}
        onBlur={emitChange}
        onKeyDown={(event) => {
          if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
          const key = event.key.toLowerCase();
          if (key === 'b') {
            event.preventDefault();
            runCommand('bold');
          }
          if (key === 'i') {
            event.preventDefault();
            runCommand('italic');
          }
        }}
        onPaste={(event) => {
          event.preventDefault();
          const text = event.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
          emitChange();
        }}
      />
    </div>
  );
};
