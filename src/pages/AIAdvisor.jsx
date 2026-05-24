import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Shield, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCrisis } from '../contexts/CrisisContext';
import {
  buildSystemPrompt,
  buildSuggestedPrompts,
  streamMessage,
  BRIEF_TRIGGER,
} from '../features/ai/services/aiService';
import PrivacyGuardModal from '../features/ai/components/PrivacyGuardModal';
import { analyzePrivacyPayload } from '../features/ai/services/privacyGuard';

const ease = [0.22, 1, 0.36, 1];

// ── Typewriter ────────────────────────────────────────────────────────────────
const TAGLINE = 'Your personal security advisor, built for journalists.';

const Typewriter = ({ onDone }) => {
  const [displayed, setDisplayed] = useState('');
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; });

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(TAGLINE.slice(0, i));
      if (i >= TAGLINE.length) { clearInterval(id); onDoneRef.current?.(); }
    }, 28);
    return () => clearInterval(id);
  }, []); // runs once — onDone stays current via ref

  return (
    <span>
      {displayed}
      {displayed.length < TAGLINE.length && <span className="ink-caret" />}
    </span>
  );
};

// ── Intro splash ──────────────────────────────────────────────────────────────
const INTRO_KEY = 'aegis:intro-seen';

const Intro = ({ onDone }) => {
  const [typeStart, setTypeStart] = useState(false);
  const [showBegin, setShowBegin] = useState(false);
  const timerRef = useRef(null);

  const dismiss = () => {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(INTRO_KEY, '1');
    onDone();
  };

  // Start typing after headline has faded in
  useEffect(() => {
    const t = setTimeout(() => setTypeStart(true), 1000);
    return () => clearTimeout(t);
  }, []);

  const handleTypeDone = () => {
    setShowBegin(true);
    timerRef.current = setTimeout(dismiss, 1800);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <motion.div
      className="absolute inset-0 z-20 bg-paper flex flex-col items-center justify-center px-8 text-center"
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.7, ease } }}
    >
      {/* Shield */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.55, ease }}
        className="w-16 h-16 bg-oxblood/[0.08] border border-oxblood/20 flex items-center justify-center mb-8"
      >
        <Shield className="w-8 h-8 text-oxblood" />
      </motion.div>

      {/* "Meet" */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease }}
        className="display-soft text-2xl text-smoke leading-none"
      >
        Meet
      </motion.p>

      {/* "Aegis" */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6, ease }}
        className="display italic-ox mt-1 leading-none"
        style={{ fontSize: 'clamp(4.5rem, 12vw, 8rem)' }}
      >
        Aegis
      </motion.h1>

      {/* Rule */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.85, duration: 0.5, ease }}
        className="w-16 h-px bg-ink/20 mt-6 mb-6 origin-center"
      />

      {/* Tagline — typewriter */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.3 }}
        className="display-soft text-lg text-smoke max-w-xs leading-snug min-h-[3rem]"
      >
        {typeStart && <Typewriter onDone={handleTypeDone} />}
      </motion.p>

      {/* Begin */}
      <AnimatePresence>
        {showBegin && (
          <motion.button
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            onClick={dismiss}
            className="mt-8 btn mono"
          >
            Begin <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const scoreColor = (s) => s >= 70 ? 'text-ink' : s >= 50 ? 'text-brass' : 'text-oxblood';
const scoreLabel = (s) => s >= 70 ? 'strong' : s >= 50 ? 'moderate' : 'weak';

const CATEGORY_ORDER = ['password', 'device', 'communication', 'data', 'physical'];

// ── Sub-components ────────────────────────────────────────────────────────────

const Avatar = () => (
  <div className="w-8 h-8 bg-oxblood flex items-center justify-center flex-shrink-0">
    <Shield className="w-4 h-4 text-paper" />
  </div>
);

const AiMessage = ({ content, streaming }) => (
  <div className="flex gap-4 items-start">
    <Avatar />
    <div className="flex-1 min-w-0 pt-0.5">
      <p className="eyebrow sm text-oxblood mb-2">Aegis</p>
      <p className="text-ink-soft leading-relaxed" style={{ fontSize: '0.95rem' }}>
        {content}
        {streaming && <span className="ink-caret" />}
      </p>
    </div>
  </div>
);

const UserMessage = ({ content }) => (
  <div className="flex justify-end">
    <div className="max-w-[85%] sm:max-w-[55%] bg-oxblood text-paper px-4 py-3 rounded-sm text-sm leading-relaxed">
      {content}
    </div>
  </div>
);

const AegisDeskPlate = ({ hasScores, latest }) => (
  <section className="aegis-desk-plate">
    <div className="news-page-topline">
      <span className="eyebrow sm text-oxblood">Aegis desk</span>
      <span className="eyebrow sm text-smoke">Digital security advisor for journalists</span>
    </div>

    <div className="aegis-desk-plate__body">
      <Avatar />
      <div className="min-w-0">
        <h1 className="display-soft text-3xl md:text-4xl leading-none text-ink">
          Aegis<span className="italic-ox">.</span>
        </h1>
        <p className="mt-3 max-w-[42rem] text-sm md:text-base leading-relaxed text-smoke">
          A quiet advisory desk for turning your SafePress profile into practical security judgment.
        </p>
      </div>
      {hasScores && (
        <div className="aegis-desk-plate__score">
          <p className={`display-soft text-2xl num leading-none ${scoreColor(latest.score)}`}>
            {latest.score}<span className="text-smoke text-sm">/100</span>
          </p>
          <p className="eyebrow sm text-smoke mt-1">{latest.riskLevel ?? ''} risk</p>
        </div>
      )}
    </div>
  </section>
);

// ── Page ─────────────────────────────────────────────────────────────────────

const AIAdvisor = () => {
  const { user }        = useAuth();
  const { isInCrisis }  = useCrisis();

  const [brief, setBrief]         = useState('');
  const [briefDone, setBriefDone] = useState(false);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [streaming, setStreaming] = useState(false);
  const [chips, setChips]         = useState([]);
  const [privacyNotice, setPrivacyNotice] = useState('');
  const [pendingPrivacyReview, setPendingPrivacyReview] = useState(null);

  const systemPromptRef = useRef('');
  const briefRef        = useRef(false);
  const scrollRef       = useRef(null);
  const textareaRef     = useRef(null);

  const [showIntro, setShowIntro] = useState(
    () => typeof window === 'undefined' || !window.sessionStorage.getItem(INTRO_KEY)
  );

  const latest    = user?.securityScores?.at(-1) ?? null;
  const hasScores = Boolean(latest);
  const cs        = latest?.categoryScores ?? {};

  useEffect(() => {
    if (!user || briefRef.current) return;
    briefRef.current = true;
    const sp = buildSystemPrompt(user);
    systemPromptRef.current = sp;
    setChips(buildSuggestedPrompts(user));

    let acc = '';
    streamMessage(
      [{ role: 'user', content: BRIEF_TRIGGER }],
      sp,
      (chunk) => { acc += chunk; setBrief(acc); },
      (redaction) => {
        setBriefDone(true);
        if (redaction?.applied && redaction.flags?.length) {
          setPrivacyNotice(`Aegis redacted sensitive details before sending your request: ${redaction.flags.join(', ')}.`);
        }
      },
      () => {
        setBriefDone(true);
        setBrief('Your communication practices present the most significant exposure risk, with unencrypted channels leaving source identities vulnerable. Prioritise switching to Signal for all sensitive contact and enabling disappearing messages before your next assignment.');
      },
    );
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, brief]);

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  const performSend = (text, clientFlags = []) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const apiMessages = [
      { role: 'user',      content: BRIEF_TRIGGER },
      { role: 'assistant', content: brief },
      ...messages.map(({ role, content }) => ({ role, content })),
      { role: 'user',      content: trimmed },
    ];

    setMessages(prev => [
      ...prev,
      { role: 'user',      content: trimmed },
      { role: 'assistant', content: '', streaming: true },
    ]);
    setStreaming(true);

    let acc = '';
    streamMessage(
      apiMessages,
      systemPromptRef.current,
      (chunk) => {
        acc += chunk;
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { ...copy[copy.length - 1], content: acc };
          return copy;
        });
      },
      (redaction) => {
        setStreaming(false);
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { ...copy[copy.length - 1], streaming: false };
          return copy;
        });
        const flags = [...new Set([...(clientFlags || []), ...(redaction?.flags || [])])];
        if (flags.length) {
          setPrivacyNotice(`Aegis redacted sensitive details before sending your message: ${flags.join(', ')}.`);
        } else {
          setPrivacyNotice('');
        }
      },
      () => setStreaming(false),
    );
  };

  const handleSend = (text) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const analysis = analyzePrivacyPayload([
      { key: 'message', label: 'Message to Aegis', text: trimmed },
    ]);

    if (analysis.hasSensitive) {
      setPendingPrivacyReview({
        originalText: trimmed,
        analysis,
      });
      return;
    }

    performSend(trimmed);
  };

  const topClass = isInCrisis ? 'top-28' : 'top-20';

  return (
    <div className={`fixed inset-x-0 bottom-0 ${topClass} bg-paper flex flex-col z-10 transition-[top] duration-300 overflow-hidden`}>
      <PrivacyGuardModal
        open={Boolean(pendingPrivacyReview)}
        title="Review sensitive details before sending"
        description="Your message appears to include source-sensitive or identifying details. Review the redacted version before it reaches the model."
        analysis={pendingPrivacyReview?.analysis}
        confirmLabel="Send redacted message"
        loading={streaming}
        onClose={() => setPendingPrivacyReview(null)}
        onEdit={() => setPendingPrivacyReview(null)}
        onConfirm={() => {
          const redactedText = pendingPrivacyReview?.analysis?.entries?.[0]?.redacted || '';
          const clientFlags = pendingPrivacyReview?.analysis?.flags || [];
          setPendingPrivacyReview(null);
          performSend(redactedText, clientFlags);
        }}
      />

      <AnimatePresence>
        {showIntro && <Intro onDone={() => setShowIntro(false)} />}
      </AnimatePresence>

      {/* ── Body: chat + sidebar ─────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex max-w-[1400px] w-full mx-auto">

        {/* LEFT — scrollable messages + input */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden border-r border-ink/[0.08]">

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-10 lg:px-14 py-8 space-y-6">
            <AegisDeskPlate hasScores={hasScores} latest={latest} />

            {/* No-quiz notice */}
            {!hasScores && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease }}
                className="flex gap-3 items-start p-4 border border-brass/30 bg-brass/[0.06] mb-4"
              >
                <AlertTriangle className="w-4 h-4 text-brass flex-shrink-0 mt-0.5" />
                <div>
                  <p className="eyebrow sm text-brass mb-1">No assessment on file</p>
                  <p className="text-sm text-ink-soft">Take the security quiz for personalised advice.</p>
                  <Link to="/security-score" className="mt-2 inline-flex items-center gap-1 eyebrow sm text-oxblood hover:text-ink transition-colors">
                    Take the quiz <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Opening brief */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
              <AiMessage content={brief || 'Generating your security brief…'} streaming={!briefDone} />
            </motion.div>

            {/* Conversation */}
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease }}
              >
                {msg.role === 'user'
                  ? <UserMessage content={msg.content} />
                  : <AiMessage content={msg.content} streaming={msg.streaming} />
                }
              </motion.div>
            ))}
          </div>

          {/* Input */}
          <div className="flex-none border-t border-ink/[0.1] bg-paper px-6 md:px-10 lg:px-14 py-4">
            <div className="flex gap-3 items-end border border-ink/[0.14] bg-paper-soft rounded-sm px-4 py-3 focus-within:border-oxblood/40 transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                rows={1}
                onChange={(e) => { setInput(e.target.value); resizeTextarea(); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); }
                }}
                placeholder="Ask Aegis about your security situation… (Enter to send)"
                disabled={streaming}
                className="flex-1 bg-transparent resize-none outline-none text-ink-soft text-sm leading-relaxed placeholder:text-smoke disabled:opacity-50"
                style={{ minHeight: '1.5rem', maxHeight: '160px' }}
              />
              <button
                onClick={() => handleSend(input)}
                disabled={streaming || !input.trim()}
                className="flex-shrink-0 w-8 h-8 rounded-sm bg-oxblood flex items-center justify-center text-paper hover:opacity-85 disabled:opacity-30 transition-opacity"
                aria-label="Send"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
            <p className="eyebrow sm text-smoke mt-2">Shift+Enter for new line · your scores and context are loaded</p>
            {privacyNotice && (
              <p className="eyebrow sm text-brass mt-1">{privacyNotice}</p>
            )}
          </div>
        </div>

        {/* RIGHT — sticky sidebar ──────────────────────────────────── */}
        <div className="hidden lg:flex flex-col w-80 xl:w-96 flex-shrink-0 overflow-y-auto px-8 py-8 space-y-8">

          {/* Score profile */}
          {hasScores && (
            <div>
              <p className="eyebrow sm text-smoke border-b border-ink/[0.12] pb-3 mb-5">Your security profile</p>
              <ul className="space-y-4">
                {CATEGORY_ORDER.map((key) => {
                  const cat = cs[key];
                  if (!cat) return null;
                  const pct = Math.round((cat.score ?? 0));
                  return (
                    <li key={key}>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="eyebrow sm text-smoke">{cat.name}</span>
                        <span className={`display-soft num text-lg leading-none ${scoreColor(pct)}`}>{pct}</span>
                      </div>
                      <div className="h-0.5 bg-ink/[0.07] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: pct >= 70 ? 'var(--color-ink)' : pct >= 50 ? 'var(--color-brass)' : 'var(--color-oxblood)' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease }}
                        />
                      </div>
                      <p className="eyebrow sm text-smoke/70 mt-1">{scoreLabel(pct)}</p>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-5 pt-5 border-t border-ink/[0.08]">
                <div className="flex items-baseline gap-2">
                  <span className={`display-soft num text-3xl ${scoreColor(latest.score)}`}>{latest.score}</span>
                  <span className="eyebrow sm text-smoke">overall · {latest.riskLevel} risk</span>
                </div>
              </div>
            </div>
          )}

          {/* Suggested questions */}
          {hasScores && briefDone && chips.length > 0 && (
            <div>
              <p className="eyebrow sm text-smoke border-b border-ink/[0.12] pb-3 mb-4">Quick questions</p>
              <ul className="space-y-2">
                {chips.map((chip) => (
                  <li key={chip}>
                    <button
                      onClick={() => handleSend(chip)}
                      disabled={streaming}
                      className="w-full text-left text-sm text-ink-soft hover:text-ink leading-snug py-2 border-b border-ink/[0.06] hover:border-ink/[0.18] transition-colors disabled:opacity-40 flex items-start gap-2 group"
                    >
                      <span className="text-oxblood mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      {chip}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No scores placeholder */}
          {!hasScores && briefDone && (
            <div>
              <p className="eyebrow sm text-smoke border-b border-ink/[0.12] pb-3 mb-4">Quick questions</p>
              <ul className="space-y-2">
                {chips.map((chip) => (
                  <li key={chip}>
                    <button
                      onClick={() => handleSend(chip)}
                      disabled={streaming}
                      className="w-full text-left text-sm text-ink-soft hover:text-ink leading-snug py-2 border-b border-ink/[0.06] hover:border-ink/[0.18] transition-colors disabled:opacity-40"
                    >
                      {chip}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AIAdvisor;
