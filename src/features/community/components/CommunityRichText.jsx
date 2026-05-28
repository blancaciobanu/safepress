import { Fragment } from 'react';

const parseBlocks = (content = '') => {
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
        items.push(lines[index].replace(/^\s*[-*]\s+/, ''));
        index += 1;
      }
      blocks.push({ type: 'list', items });
      continue;
    }

    const paragraphLines = [];
    while (index < lines.length && lines[index].trim() && !/^\s*[-*]\s+/.test(lines[index])) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join('\n') });
  }

  return blocks;
};

const renderInline = (text = '', keyPrefix = 'inline') => {
  const nodes = [];
  let cursor = 0;
  let partIndex = 0;

  while (cursor < text.length) {
    if (text.startsWith('**', cursor)) {
      const closingIndex = text.indexOf('**', cursor + 2);
      if (closingIndex !== -1) {
        const inner = text.slice(cursor + 2, closingIndex);
        if (inner) {
          nodes.push(
            <strong key={`${keyPrefix}-bold-${partIndex += 1}`} className="font-semibold">
              {renderInline(inner, `${keyPrefix}-bold-inner-${partIndex}`)}
            </strong>,
          );
          cursor = closingIndex + 2;
          continue;
        }
      }
    }

    if (text[cursor] === '*' || text[cursor] === '_') {
      const marker = text[cursor];
      const closingIndex = text.indexOf(marker, cursor + 1);
      if (closingIndex !== -1) {
        const inner = text.slice(cursor + 1, closingIndex);
        if (inner.trim()) {
          nodes.push(
            <em key={`${keyPrefix}-italic-${partIndex += 1}`} className="italic">
              {renderInline(inner, `${keyPrefix}-italic-inner-${partIndex}`)}
            </em>,
          );
          cursor = closingIndex + 1;
          continue;
        }
      }
    }

    let nextCursor = cursor + 1;
    while (
      nextCursor < text.length
      && !text.startsWith('**', nextCursor)
      && text[nextCursor] !== '*'
      && text[nextCursor] !== '_'
    ) {
      nextCursor += 1;
    }

    nodes.push(text.slice(cursor, nextCursor));
    cursor = nextCursor;
  }

  return nodes;
};

const renderParagraphLines = (text = '', keyPrefix = 'paragraph') =>
  text.split('\n').flatMap((line, index, arr) => {
    const nodes = [<Fragment key={`${keyPrefix}-line-${index}`}>{renderInline(line, `${keyPrefix}-line-${index}`)}</Fragment>];
    if (index < arr.length - 1) {
      nodes.push(<br key={`${keyPrefix}-break-${index}`} />);
    }
    return nodes;
  });

export const CommunityRichText = ({
  content = '',
  className = '',
  paragraphClassName = '',
  listClassName = '',
  listItemClassName = '',
}) => {
  const blocks = parseBlocks(content);

  if (!blocks.length) return null;

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        if (block.type === 'list') {
          return (
            <ul
              key={`block-list-${index}`}
              className={`${index > 0 ? 'mt-4' : ''} list-disc ml-5 space-y-1 ${listClassName}`.trim()}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`block-list-${index}-item-${itemIndex}`} className={listItemClassName}>
                  {renderInline(item, `block-list-${index}-item-${itemIndex}`)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p
            key={`block-paragraph-${index}`}
            className={`${index > 0 ? 'mt-4' : ''} ${paragraphClassName}`.trim()}
          >
            {renderParagraphLines(block.text, `block-paragraph-${index}`)}
          </p>
        );
      })}
    </div>
  );
};
