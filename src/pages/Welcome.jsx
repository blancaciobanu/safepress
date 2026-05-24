import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPostAuthPath, needsWelcomePathChoice } from '../features/users/accountRouting';

const ease = [0.22, 1, 0.36, 1];

const Typewriter = ({ text, onDone }) => {
  const [displayed, setDisplayed] = useState('');
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; });

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); onDoneRef.current?.(); }
    }, 32);
    return () => clearInterval(id);
  }, [text]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span className="ink-caret" />
      )}
    </span>
  );
};

const Welcome = () => {
  const { user, completeWelcomeChoice } = useAuth();
  const navigate = useNavigate();

  const [typeStart, setTypeStart] = useState(false);
  const [showBody, setShowBody] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [routing, setRouting] = useState(false);
  const timerRef = useRef(null);

  const codename = user?.username || '';
  const typewriterText = `Your codename is ${codename}.`;

  useEffect(() => {
    if (!user) return;
    if (routing) return;
    if (!needsWelcomePathChoice(user)) {
      navigate(getPostAuthPath(user), { replace: true });
    }
  }, [user, navigate, routing]);

  useEffect(() => {
    const t = setTimeout(() => setTypeStart(true), 1100);
    return () => clearTimeout(t);
  }, []);

  const handleTypeDone = () => {
    setShowBody(true);
    timerRef.current = setTimeout(() => setShowChoices(true), 500);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleJournalistPath = async () => {
    try {
      setRouting(true);
      await completeWelcomeChoice();
      navigate('/', { replace: true });
    } catch {
      setRouting(false);
    }
  };

  const handleSpecialistPath = async () => {
    try {
      setRouting(true);
      await completeWelcomeChoice();
      navigate('/specialist-verification', { replace: true });
    } catch {
      setRouting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 bg-paper flex flex-col items-center justify-center px-8 text-center">
      <motion.div
        initial={{ scale: 0.75, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.55, ease }}
        className="w-14 h-14 bg-oxblood/[0.07] border border-oxblood/20 flex items-center justify-center mb-8"
      >
        <Shield className="w-7 h-7 text-oxblood" />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease }}
        className="display-soft text-2xl text-smoke leading-none"
      >
        Welcome to
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6, ease }}
        className="display italic-ox mt-1 leading-none"
        style={{ fontSize: 'clamp(4rem, 11vw, 7rem)' }}
      >
        SafePress
      </motion.h1>

      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.85, duration: 0.5, ease }}
        className="w-16 h-px bg-ink/20 mt-6 mb-6 origin-center"
      />

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.3 }}
        className="display-soft text-lg text-smoke max-w-xs leading-snug min-h-[2.5rem]"
      >
        {typeStart && <Typewriter text={typewriterText} onDone={handleTypeDone} />}
      </motion.p>

      <AnimatePresence>
        {showBody && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="mt-4 text-sm text-smoke-dim max-w-xs leading-relaxed"
          >
            This is your anonymous identity on SafePress. Now choose whether this account stays in the journalist lane or opens a specialist verification file.
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChoices && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="mt-8 w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4 text-left"
          >
            <button
              type="button"
              onClick={handleJournalistPath}
              disabled={routing}
              className="border border-ink/15 bg-paper-soft px-5 py-5 hover:bg-paper-dim transition-colors disabled:opacity-70 disabled:cursor-wait"
            >
              <p className="eyebrow sm text-oxblood">Journalist path</p>
              <p className="display-soft text-xl text-ink mt-3 leading-tight">
                Keep the anonymous codename and enter the reporting desk.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm text-ink-soft">
                Enter SafePress <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            <button
              type="button"
              onClick={handleSpecialistPath}
              disabled={routing}
              className="border border-ink/15 bg-paper-soft px-5 py-5 hover:bg-paper-dim transition-colors disabled:opacity-70 disabled:cursor-wait"
            >
              <p className="eyebrow sm text-oxblood">Specialist path</p>
              <p className="display-soft text-xl text-ink mt-3 leading-tight">
                Open a verification dossier and apply for reviewed casework.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm text-ink-soft">
                Open dossier <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Welcome;
