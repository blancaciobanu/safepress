import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, Lock, Users, Shield,
  ArrowRight, ShieldCheck, Check, Phone, ChevronDown,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCrisis } from '../contexts/CrisisContext';

/* ─── Data ──────────────────────────────────────────────────────────────── */

const SCENARIOS = [
  {
    id: 'hacked',
    title: "I've Been Hacked",
    subtitle: "Someone has unauthorized access to your accounts, devices, or communications",
    icon: Lock,
    urgency: "Act within the next 10 minutes",
    actions: [
      {
        id: 'h1',
        text: 'Disconnect from WiFi and disable mobile data immediately',
        guide: [
          'iPhone: Settings → Wi-Fi → toggle off. Then Settings → Cellular → toggle off.',
          'Android: Pull down the notification shade, tap the Wi-Fi and Mobile Data icons.',
          'Mac: Click the Wi-Fi icon in the menu bar → Turn Wi-Fi Off.',
          'Windows: Click the network icon in the system tray → Wi-Fi → toggle off.',
        ],
      },
      {
        id: 'h2',
        text: 'Change all passwords from a clean, uncompromised device',
        guide: [
          'Use a device you haven\'t used recently — a friend\'s phone or a fresh browser session.',
          'Change your password manager first (Bitwarden, 1Password), then email, then everything else.',
          'Use long random passwords — 16+ characters minimum.',
          'If you don\'t have a password manager, Bitwarden is free and easy to set up.',
        ],
      },
      {
        id: 'h3',
        text: 'Enable two-factor authentication on all critical accounts',
        guide: [
          '2FA means even if someone steals your password, they can\'t log in without a second code.',
          'Go to each account\'s Settings → Security → Two-Factor Authentication (or 2-Step Verification).',
          'Use an authenticator app (Google Authenticator, Authy) — not SMS, which can be intercepted.',
          'Start with your email account and password manager first.',
        ],
      },
      {
        id: 'h4',
        text: 'Check for unauthorized access, logins, or changes',
        guide: [
          'Gmail: Account icon → Manage Google Account → Security → Your devices / Recent security activity.',
          'Also check Settings → See all settings → Forwarding and POP/IMAP for unknown forwarding addresses.',
          'For other accounts: look in Settings → Security or Settings → Activity for unrecognized devices.',
          'Screenshot anything suspicious.',
        ],
      },
      {
        id: 'h5',
        text: 'Document everything — screenshots, logs, timestamps',
        guide: [
          'Use your phone (not the compromised device) to take screenshots.',
          'Capture: unknown logins, changed settings, unexpected emails.',
          'Note the exact date and time of each observation.',
          'This documentation is critical for law enforcement and press freedom organizations.',
        ],
      },
      {
        id: 'h6',
        text: 'Contact press freedom organizations for emergency support',
        guide: [
          'CPJ (+1 212 465-1004) and RSF (+33 1 44 83 84 84) have emergency desks for journalists under attack.',
          'EFF (+1 415 436-9333) specializes in digital security.',
          'Access Now\'s Digital Security Helpline (accessnow.org/help) also provides free emergency support.',
        ],
      },
    ],
  },
  {
    id: 'source',
    title: "Source Exposed",
    subtitle: "Your source's identity may have been revealed or is at risk of exposure",
    icon: Users,
    urgency: "Alert your source first",
    actions: [
      {
        id: 's1',
        text: 'Alert the source immediately through a secure channel',
        guide: [
          'Signal (signal.org) is free, end-to-end encrypted, and the gold standard — download it now if needed.',
          'Do NOT use SMS, regular calls, Gmail, WhatsApp, or social media DMs — these can be monitored.',
          'If you haven\'t used Signal with this source before, verify their "safety number" (tap their name → Safety Number).',
        ],
      },
      {
        id: 's2',
        text: 'Delete all communication records if safe to do so',
        guide: [
          'On Signal: long-press the conversation → Delete conversation.',
          'Clear browser history if you communicated via secure web forms.',
          'Only delete if it won\'t destroy evidence you may need for legal proceedings — ask legal counsel first.',
          'Use Signal\'s disappearing messages to prevent this problem in future conversations.',
        ],
      },
      {
        id: 's3',
        text: 'Contact legal support and press freedom organizations',
        guide: [
          'US: Reporters Committee for Freedom of the Press — free legal defense hotline: +1 (800) 336-4243.',
          'CPJ and RSF connect journalists with local legal support in many countries.',
          'They\'ve handled many source exposure cases and know your legal options.',
        ],
      },
      {
        id: 's4',
        text: 'Document the exposure incident in full detail',
        guide: [
          'Record who might have had access to the identifying information.',
          'Note when you believe the exposure happened and how you found out.',
          'Include any suspicious activity you noticed beforehand.',
          'Add exact dates and times — this helps legal counsel assess the situation.',
        ],
      },
      {
        id: 's5',
        text: 'Review and secure all other source communications',
        guide: [
          'The same vulnerability may affect other sources — review your full contact list for anyone at risk.',
          'Enable disappearing messages on all sensitive Signal conversations (tap the contact name → Disappearing messages).',
          'Consider compartmentalizing: separate device or Signal account per sensitive story.',
        ],
      },
      {
        id: 's6',
        text: 'Prepare a public statement if the situation demands one',
        guide: [
          'Do not say anything publicly without consulting your editor and legal counsel first.',
          'CPJ and RSF can advise on whether going public helps or hurts in your specific situation.',
          'If a statement becomes necessary: keep it factual, brief, and reviewed by counsel.',
        ],
      },
    ],
  },
  {
    id: 'doxxed',
    title: "Being Doxxed",
    subtitle: "Your personal information is being publicly shared without your consent",
    icon: AlertCircle,
    urgency: "Secure your physical safety first",
    actions: [
      {
        id: 'd1',
        text: 'Alert trusted contacts and family members immediately',
        guide: [
          'Call or meet in person — don\'t use channels that may be compromised.',
          'Tell them what\'s happening and share your real-time location if you feel unsafe.',
          'If you\'re in immediate physical danger: call 911 (US), 999 (UK), 112 (EU), or your local emergency number first.',
        ],
      },
      {
        id: 'd2',
        text: 'Document all doxxing posts with screenshots and timestamps',
        guide: [
          'Screenshot every post: the content, the account name, the URL, and any visible timestamp.',
          'Use archive.ph to create permanent, legally admissible records — paste any URL to archive it.',
          'This documentation is essential for platform reports and police reports.',
        ],
      },
      {
        id: 'd3',
        text: 'Report to platform administrators and law enforcement',
        guide: [
          'X/Twitter: three dots on the post → Report → It\'s a privacy violation.',
          'Facebook/Instagram: three dots → Find support or report.',
          'File a police report even if they seem dismissive — you need the report number for future legal action.',
          'US: The FBI\'s IC3 (ic3.gov) handles cybercrime including doxxing.',
        ],
      },
      {
        id: 'd4',
        text: 'Enable maximum privacy settings on all accounts',
        guide: [
          'Review all profiles: X/Twitter, Instagram, LinkedIn, Facebook, GitHub.',
          'Remove your home address, phone number, and workplace from all public profiles.',
          'On Google: search your name → "Results about you" (myactivity.google.com/results-about-you) to request removal.',
        ],
      },
      {
        id: 'd5',
        text: 'Consider temporary relocation if physical safety is at risk',
        guide: [
          'If your home address was published alongside threats, take it seriously even if threats seem empty.',
          'Contact your newsroom\'s security officer if you have one.',
          'CPJ and RSF can connect you with emergency housing resources and security professionals.',
          'Document all threats before relocating.',
        ],
      },
      {
        id: 'd6',
        text: 'Contact press freedom organizations for support',
        guide: [
          'CPJ and RSF document doxxing cases and provide security assessments and legal referrals.',
          'PEN America\'s Online Harassment Field Manual (onlineharassmentfieldmanual.pen.org) is a detailed resource for journalists facing doxxing.',
        ],
      },
    ],
  },
  {
    id: 'phishing',
    title: "Phishing Attempt",
    subtitle: "You received a message designed to steal credentials or install malware",
    icon: Shield,
    urgency: "Do not click anything else",
    actions: [
      {
        id: 'p1',
        text: 'Do not click any links or download any attachments',
        guide: [
          'Even previewing images can trigger tracking pixels that reveal your IP address.',
          'If the email is open in your browser, close the tab immediately.',
          'In an email client, don\'t hover over links — some clients pre-fetch link previews.',
          'Leave the email closed while you report it.',
        ],
      },
      {
        id: 'p2',
        text: 'Forward the message to your IT or security contact',
        guide: [
          'At a newsroom: contact your IT department or security officer immediately.',
          'If freelance: contact Access Now\'s Digital Security Helpline (accessnow.org/help) — free for journalists.',
          'Include full email headers if possible — in Gmail: three dots → Show original.',
        ],
      },
      {
        id: 'p3',
        text: 'Mark as phishing/spam and delete from all devices',
        guide: [
          'Gmail: open the email → three dots (top right) → Report phishing.',
          'Outlook: select the email → Report Message (in the ribbon) → Phishing.',
          'Apple Mail: Message menu → Move to Junk.',
          'Delete from Trash/Deleted Items too, so the deletion syncs to all devices.',
        ],
      },
      {
        id: 'p4',
        text: 'Check whether any credentials were already entered',
        guide: [
          'Did you click a link or enter any username, password, or 2FA code before noticing it was phishing?',
          'If yes: treat those credentials as fully compromised.',
          'Change those passwords immediately and check for active sessions in the account\'s security settings.',
        ],
      },
      {
        id: 'p5',
        text: 'Change passwords for any accounts you may have entered',
        guide: [
          'Priority: email accounts first (attackers use these to reset everything else).',
          'Then: your password manager, then banking and financial accounts.',
          'Change from a trusted device — not the one that opened the phishing link.',
          'Enable 2FA on each account you change, using an authenticator app rather than SMS.',
        ],
      },
      {
        id: 'p6',
        text: 'Alert colleagues — phishing is often targeted at entire newsrooms',
        guide: [
          'Spear-phishing campaigns frequently target all reporters covering the same story or outlet.',
          'Alert colleagues via a secure internal channel.',
          'Describe the attack: sender address, subject line, any visible link domains.',
        ],
      },
    ],
  },
];

const HELP_LINES = [
  { short: 'CPJ',  full: 'Committee to Protect Journalists', tel: '+12124651004',  display: '+1 (212) 465-1004',  note: '24/7 emergency' },
  { short: 'RSF',  full: 'Reporters Without Borders',        tel: '+33144838484',  display: '+33 1 44 83 84 84',  note: 'Emergency assistance' },
  { short: 'EFF',  full: 'Electronic Frontier Foundation',   tel: '+14154369333',  display: '+1 (415) 436-9333',  note: 'Digital rights support' },
];

/* ─── Main overlay ───────────────────────────────────────────────────────── */

const CrisisOverlay = () => {
  const {
    overlayOpen, closeOverlay,
    activateCrisis, deactivateCrisis,
    isInCrisis, activeScenario,
  } = useCrisis();

  const [localId, setLocalId]          = useState(null);
  const [completedSteps, setCompleted] = useState([]);
  const [openGuides, setOpenGuides]    = useState([]);

  useEffect(() => {
    if (!overlayOpen) { setLocalId(null); setCompleted([]); setOpenGuides([]); }
  }, [overlayOpen]);

  useEffect(() => {
    if (!overlayOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') closeOverlay(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [overlayOpen, closeOverlay]);

  const displayId       = localId ?? (isInCrisis && overlayOpen ? activeScenario : null);
  const currentScenario = SCENARIOS.find(s => s.id === displayId);
  const otherScenarios  = SCENARIOS.filter(s => s.id !== displayId);
  const allDone = currentScenario
    ? completedSteps.length === currentScenario.actions.length
    : false;

  const handleSelect = (id) => {
    setLocalId(id);
    setCompleted([]);
    setOpenGuides([]);
    activateCrisis(id);
  };

  const handleSafe = () => {
    deactivateCrisis();
    closeOverlay();
  };

  const toggleStep = (stepId) =>
    setCompleted(prev =>
      prev.includes(stepId) ? prev.filter(id => id !== stepId) : [...prev, stepId]
    );

  const toggleGuide = (stepId) =>
    setOpenGuides(prev =>
      prev.includes(stepId) ? prev.filter(id => id !== stepId) : [...prev, stepId]
    );

  return (
    <AnimatePresence>
      {overlayOpen && (
        <motion.div
          key="crisis-overlay"
          initial={{ clipPath: 'circle(0% at calc(100% - 56px) calc(100% - 36px))' }}
          animate={{ clipPath: 'circle(150% at calc(100% - 56px) calc(100% - 36px))' }}
          exit={{ clipPath: 'circle(0% at calc(100% - 56px) calc(100% - 36px))' }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.15, 1] }}
          className="fixed inset-0 z-[100] overflow-y-auto"
          style={{ backgroundColor: '#FAF8F5', filter: 'drop-shadow(0 0 30px rgba(250,248,245,0.5))' }}
        >
          {/* ── Toggle pill — bottom-right, matches header crisis toggle position ── */}
          <div className="fixed bottom-4 right-4 flex items-center gap-2" style={{ zIndex: 3 }}>
            <span className="hidden sm:inline text-xs font-bold uppercase tracking-[0.1em] text-[#8A8680]">
              Crisis
            </span>
            <button
              onClick={closeOverlay}
              role="switch"
              aria-checked={true}
              className="relative flex-shrink-0 w-20 h-10 rounded-full focus:outline-none"
              style={{ backgroundColor: '#e53e3e' }}
            >
              <span
                className="absolute top-[4px] w-8 h-8 rounded-full bg-white"
                style={{ left: 4, transform: 'translateX(40px)', boxShadow: '0 1px 4px rgba(0,0,0,0.35)' }}
              />
            </button>
          </div>

          {/* Content — fades in as the circle expands */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
          <AnimatePresence mode="wait">

            {/* ── Selection view ──────────────────────────────────────────── */}
            {!displayId && (
              <motion.div
                key="selection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20"
              >
                {/* Breathing glow */}
                <motion.div
                  className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(61,168,144,0.08) 0%, transparent 60%)' }}
                  animate={{ scale: [1, 1.14, 1] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="relative text-center mb-12"
                >
                  <div className="inline-flex items-center gap-2 mb-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-red-600">
                      Crisis Mode
                    </span>
                  </div>
                  <h1 className="text-5xl md:text-6xl font-display font-bold text-[#1A1714] mb-4 tracking-tight lowercase leading-none">
                    you're going to be{' '}
                    <span style={{ color: '#3DA890' }}>okay.</span>
                  </h1>
                  <p className="text-[#8A8680] max-w-xs mx-auto leading-relaxed text-sm lowercase">
                    what's happening right now?
                  </p>
                </motion.div>

                <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full">
                  {SCENARIOS.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <motion.button
                        key={s.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.08 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ y: -3, boxShadow: '0 16px 40px rgba(0,0,0,0.1)', transition: { duration: 0.18 } }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelect(s.id)}
                        className="bg-white rounded-2xl border border-[#E8E4DC] p-8 text-left group"
                        style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
                      >
                        <div className="flex items-start justify-between mb-7">
                          <Icon className="w-8 h-8 text-[#A8A49E] group-hover:text-red-500 transition-colors duration-200" />
                          <ArrowRight className="w-4 h-4 text-[#C8C4BE] group-hover:text-red-400 group-hover:translate-x-0.5 transition-all duration-200" />
                        </div>
                        <h3 className="text-[1.6rem] font-display font-bold text-[#1A1714] mb-2 tracking-tight leading-tight">
                          {s.title}
                        </h3>
                        <p className="text-sm text-[#8A8680] leading-relaxed">
                          {s.subtitle}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Expanded view ───────────────────────────────────────────── */}
            {displayId && currentScenario && (
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative min-h-screen px-4 sm:px-8 pb-16 pt-14"
              >
                {/* Breathing glow */}
                <motion.div
                  className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(61,168,144,0.05) 0%, transparent 60%)' }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                />

                <div className="relative max-w-5xl mx-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">

                    {/* ── Left: scenario content */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={displayId}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {(() => {
                          const Icon = currentScenario.icon;
                          return (
                            <div className="flex items-start gap-5 mb-4">
                              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                                <Icon className="w-7 h-7 text-red-500" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-500">
                                    Crisis Mode Active
                                  </span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-display font-bold text-[#1A1714] tracking-tight leading-tight mb-1.5">
                                  {currentScenario.title}
                                </h2>
                                <p className="text-sm font-medium" style={{ color: '#3DA890' }}>
                                  {currentScenario.urgency}
                                </p>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Progress */}
                        <div className="flex items-center gap-3 mb-7">
                          <div className="flex-1 h-1 bg-[#E8E4DC] rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: '#3DA890' }}
                              initial={{ width: 0 }}
                              animate={{ width: `${(completedSteps.length / currentScenario.actions.length) * 100}%` }}
                              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </div>
                          <span className="text-xs font-medium text-[#8A8680] flex-shrink-0">
                            {completedSteps.length}/{currentScenario.actions.length} done
                          </span>
                        </div>

                        {/* Checklist */}
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A8A49E] mb-4">
                          Immediate Actions — Complete In Order
                        </p>
                        <div className="space-y-2 mb-6">
                          {currentScenario.actions.map((action, index) => {
                            const done      = completedSteps.includes(action.id);
                            const guideOpen = openGuides.includes(action.id);
                            return (
                              <div
                                key={action.id}
                                className={`w-full rounded-xl border transition-all duration-150 ${
                                  done ? 'bg-[#F0EDE8] border-transparent' : 'bg-white border-[#E8E4DC]'
                                }`}
                              >
                                <div className="flex items-start gap-4 p-4">
                                  {/* Checkbox */}
                                  <button
                                    onClick={() => toggleStep(action.id)}
                                    className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                      done ? 'bg-[#3DA890] border-[#3DA890]' : 'border-[#C8C4BE] hover:border-[#3DA890]'
                                    }`}
                                  >
                                    {done && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                                      >
                                        <Check className="w-3.5 h-3.5 text-white" />
                                      </motion.div>
                                    )}
                                  </button>

                                  {/* Text + how? */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3">
                                      <p
                                        className={`text-sm font-medium leading-snug cursor-pointer ${
                                          done ? 'text-[#9E9A94] line-through' : 'text-[#2D2B27]'
                                        }`}
                                        onClick={() => toggleStep(action.id)}
                                      >
                                        <span className={`font-bold mr-1.5 ${done ? 'text-[#9E9A94]' : 'text-red-500'}`}>
                                          {index + 1}.
                                        </span>
                                        {action.text}
                                      </p>
                                      {action.guide && (
                                        <button
                                          onClick={() => toggleGuide(action.id)}
                                          className="flex-shrink-0 flex items-center gap-0.5 text-[10px] font-semibold text-[#3DA890] hover:text-[#2A8C7A] transition-colors mt-0.5"
                                        >
                                          how?
                                          <ChevronDown
                                            className={`w-3 h-3 transition-transform duration-200 ${guideOpen ? 'rotate-180' : ''}`}
                                          />
                                        </button>
                                      )}
                                    </div>

                                    {/* Guide bullets */}
                                    <AnimatePresence>
                                      {guideOpen && action.guide && (
                                        <motion.ul
                                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                          animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
                                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                          className="space-y-2 overflow-hidden"
                                          style={{ borderLeft: '2px solid #3DA890', paddingLeft: 10 }}
                                        >
                                          {action.guide.map((point, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-[#6A6660] leading-relaxed">
                                              <span className="w-1 h-1 rounded-full bg-[#3DA890] flex-shrink-0 mt-[5px]" />
                                              {point}
                                            </li>
                                          ))}
                                        </motion.ul>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <AnimatePresence>
                          {allDone && (
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="p-4 rounded-xl flex items-center gap-3"
                              style={{ backgroundColor: 'rgba(61,168,144,0.08)', border: '1px solid rgba(61,168,144,0.3)' }}
                            >
                              <ShieldCheck className="w-5 h-5 flex-shrink-0" style={{ color: '#3DA890' }} />
                              <div>
                                <p className="text-sm font-semibold" style={{ color: '#2A8C7A' }}>
                                  All steps completed.
                                </p>
                                <p className="text-xs mt-0.5 text-[#8A8680]">
                                  When you're safe, click "I'm Safe" on the right.
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </AnimatePresence>

                    {/* ── Right sidebar ── */}
                    <div className="space-y-5 lg:sticky lg:top-14">

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A8A49E] mb-3">
                          Other Scenarios
                        </p>
                        <div className="space-y-2">
                          {otherScenarios.map((s) => {
                            const Icon = s.icon;
                            return (
                              <button
                                key={s.id}
                                onClick={() => handleSelect(s.id)}
                                className="w-full bg-white rounded-xl border border-[#E8E4DC] p-3.5 flex items-center gap-3 text-left group hover:border-red-200 hover:bg-red-50/40 transition-all"
                                style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
                              >
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#F5F3EF] border border-[#E0DDD7] flex items-center justify-center group-hover:bg-red-50 group-hover:border-red-200 transition-all">
                                  <Icon className="w-4 h-4 text-[#8A8680] group-hover:text-red-500 transition-colors" />
                                </div>
                                <span className="flex-1 text-sm font-semibold text-[#2D2B27] truncate">
                                  {s.title}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5 text-[#C8C4BE] group-hover:text-red-400 flex-shrink-0 transition-colors" />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Get help now */}
                      <div className="rounded-2xl p-5" style={{ backgroundColor: '#2A7A6E' }}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
                            <Phone className="w-3.5 h-3.5 text-white" />
                          </div>
                          <p className="text-white font-semibold text-sm">Get help now</p>
                        </div>
                        <p className="text-white/60 text-xs mb-4 leading-relaxed">
                          Call a press freedom organization directly — no forms, no waiting.
                        </p>
                        <div className="space-y-2 mb-4">
                          {HELP_LINES.map(h => (
                            <a
                              key={h.tel}
                              href={`tel:${h.tel}`}
                              className="flex items-center justify-between w-full bg-white/10 hover:bg-white/20 rounded-xl px-3.5 py-2.5 transition-all group"
                            >
                              <div>
                                <p className="text-white text-xs font-bold">{h.short}</p>
                                <p className="text-white/50 text-[10px]">{h.note}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-white text-xs font-mono">{h.display}</p>
                                <p className="text-white/60 text-[10px] group-hover:text-white/90 transition-colors">tap to call →</p>
                              </div>
                            </a>
                          ))}
                        </div>
                        <Link
                          to="/request-support"
                          onClick={closeOverlay}
                          className="flex items-center justify-center gap-1.5 w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium transition-all"
                        >
                          Request a specialist <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>

                      {/* I'm Safe */}
                      <button
                        onClick={handleSafe}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-[#1A1714] text-[#1A1714] rounded-2xl text-sm font-bold transition-all hover:bg-[#1A1714] hover:text-white"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        I'm Safe Now
                      </button>

                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CrisisOverlay;
