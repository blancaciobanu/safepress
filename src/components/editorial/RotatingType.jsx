import { useState, useEffect } from 'react';

const RotatingType = ({ lines }) => {
  const [lineIndex, setLineIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const activeLine = lines[lineIndex] || '';
    const finishedTyping = displayed === activeLine;
    const finishedDeleting = displayed === '';

    const timeout = window.setTimeout(() => {
      if (!isDeleting && !finishedTyping) {
        setDisplayed(activeLine.slice(0, displayed.length + 1));
        return;
      }
      if (!isDeleting && finishedTyping) {
        setIsDeleting(true);
        return;
      }
      if (isDeleting && !finishedDeleting) {
        setDisplayed(activeLine.slice(0, displayed.length - 1));
        return;
      }
      setIsDeleting(false);
      setLineIndex((current) => (current + 1) % lines.length);
    }, !isDeleting && finishedTyping ? 1600 : isDeleting ? 28 : 48);

    return () => window.clearTimeout(timeout);
  }, [displayed, isDeleting, lineIndex, lines]);

  return (
    <span>
      {displayed}
      <span className="ink-caret" />
    </span>
  );
};

export default RotatingType;
