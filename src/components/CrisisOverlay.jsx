import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, Lock, Users, Shield,
  ArrowRight, ShieldCheck, Check, Phone, ChevronDown,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCrisis } from '../contexts/CrisisContext';
import { useAuth } from '../contexts/AuthContext';

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
  const { user } = useAuth();

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
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] overflow-y-auto"
          style={{ backgroundColor: 'var(--color-paper)' }}
        >
          {/* ── Toggle pill — matches the header crisis toggle exactly ── */}
          <div
            className="fixed bottom-4 right-4 md:bottom-5 md:right-6 flex items-center gap-3 px-3.5 py-2 backdrop-blur-md"
            style={{
              zIndex: 3,
              backgroundColor: 'rgba(248, 244, 236, 0.92)',
              border: '1px solid rgba(21,17,12,0.12)',
              boxShadow: '0 8px 24px -12px rgba(21,17,12,0.18)',
            }}
          >
            <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-[0.2em] text-oxblood">
              Crisis · active
            </span>
            <button
              onClick={closeOverlay}
              role="switch"
              aria-checked={true}
              className="relative flex-shrink-0 w-14 h-7 transition-colors duration-200 focus:outline-none"
              style={{
                backgroundColor: 'var(--color-oxblood)',
                border: '1px solid rgba(21,17,12,0.22)',
              }}
            >
              <span
                className="absolute w-[22px] h-[22px] transition-transform duration-200"
                style={{
                  left: 3,
                  top: '50%',
                  transform: 'translate(28px, -50%)',
                  backgroundColor: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                }}
              />
            </button>
          </div>

          {/* ── Masthead ── */}
          <div
            className="sticky top-0 z-10 px-6 py-3"
            style={{ background: 'var(--color-paper)', borderBottom: '1px solid rgba(21,17,12,0.10)' }}
          >
            <div style={{ borderTop: '4px solid var(--color-oxblood)', paddingTop: 8 }}>
              <div className="flex items-baseline justify-between max-w-5xl mx-auto">
                <span className="eyebrow sm text-oxblood">SafePress · Extra</span>
                <button
                  onClick={closeOverlay}
                  className="eyebrow text-[10px] normal-case text-smoke hover:text-ink transition-colors"
                >
                  Close (keep crisis active)
                </button>
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence mode="wait">

              {/* ── Selection view ── */}
              {!displayId && (
                <motion.div
                  key="selection"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="text-center mb-12 max-w-lg"
                  >
                    <div className="inline-flex items-center gap-2 mb-5">
                      <span className="w-1.5 h-1.5 bg-oxblood animate-pulse" />
                      <span className="eyebrow sm text-oxblood">Crisis Mode</span>
                    </div>
                    <h1 className="display text-5xl md:text-6xl text-ink leading-none mb-4">
                      You're going to be <em className="italic-ox">okay.</em>
                    </h1>
                    <p className="text-smoke text-sm leading-relaxed">
                      Select the scenario that matches what's happening right now.
                    </p>
                  </motion.div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
                    {SCENARIOS.map((s, i) => {
                      const Icon = s.icon;
                      return (
                        <motion.button
                          key={s.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: 0.05 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                          onClick={() => handleSelect(s.id)}
                          className="bg-paper-soft border border-ink/12 p-7 text-left group hover:border-oxblood/30 hover:bg-paper transition-colors"
                        >
                          <div className="flex items-start justify-between mb-6">
                            <Icon className="w-6 h-6 text-smoke group-hover:text-oxblood transition-colors" />
                            <ArrowRight className="w-3.5 h-3.5 text-ink/20 group-hover:text-oxblood group-hover:translate-x-0.5 transition-all" />
                          </div>
                          <h3 className="display text-2xl text-ink mb-2 leading-tight">{s.title}</h3>
                          <p className="text-sm text-smoke leading-relaxed">{s.subtitle}</p>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ── Expanded view ── */}
              {displayId && currentScenario && (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="min-h-screen px-6 sm:px-8 pb-20 pt-10"
                >
                  <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">

                      {/* ── Left: scenario content ── */}
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
                              <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-oxblood/8 border border-oxblood/20 flex items-center justify-center">
                                  <Icon className="w-6 h-6 text-oxblood" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className="w-1.5 h-1.5 bg-oxblood animate-pulse" />
                                    <span className="eyebrow sm text-oxblood">Crisis Mode Active</span>
                                  </div>
                                  <h2 className="display text-3xl md:text-4xl text-ink leading-tight mb-1">
                                    {currentScenario.title}
                                  </h2>
                                  <p className="eyebrow sm text-oxblood">{currentScenario.urgency}</p>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Progress — flat rule */}
                          <div className="flex items-center gap-3 mb-8">
                            <div className="flex-1 h-px bg-ink/10 relative overflow-hidden">
                              <motion.div
                                className="absolute top-0 left-0 h-full bg-oxblood"
                                initial={{ width: 0 }}
                                animate={{ width: `${(completedSteps.length / currentScenario.actions.length) * 100}%` }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                              />
                            </div>
                            <span className="eyebrow sm text-smoke flex-shrink-0">
                              {completedSteps.length}/{currentScenario.actions.length} done
                            </span>
                          </div>

                          {/* Checklist */}
                          <p className="eyebrow sm text-smoke mb-4">Immediate actions — complete in order</p>
                          <div className="space-y-1.5 mb-6">
                            {currentScenario.actions.map((action, index) => {
                              const done      = completedSteps.includes(action.id);
                              const guideOpen = openGuides.includes(action.id);
                              return (
                                <div
                                  key={action.id}
                                  className={`border transition-colors ${done ? 'border-ink/8 bg-paper-dim/40' : 'border-ink/12 bg-paper-soft'}`}
                                >
                                  <div className="flex items-start gap-4 p-4">
                                    <button
                                      onClick={() => toggleStep(action.id)}
                                      className={`flex-shrink-0 mt-0.5 w-5 h-5 border flex items-center justify-center transition-colors ${
                                        done ? 'bg-oxblood border-oxblood' : 'border-ink/30 hover:border-oxblood'
                                      }`}
                                    >
                                      {done && (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                                        >
                                          <Check className="w-3 h-3 text-paper" />
                                        </motion.div>
                                      )}
                                    </button>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-3">
                                        <p
                                          className={`text-sm leading-snug cursor-pointer ${done ? 'text-smoke line-through' : 'text-ink'}`}
                                          onClick={() => toggleStep(action.id)}
                                        >
                                          <span className={`font-mono text-[10px] mr-2 ${done ? 'text-smoke' : 'text-oxblood'}`}>
                                            {String(index + 1).padStart(2, '0')}
                                          </span>
                                          {action.text}
                                        </p>
                                        {action.guide && (
                                          <button
                                            onClick={() => toggleGuide(action.id)}
                                            className="flex-shrink-0 flex items-center gap-0.5 eyebrow sm text-oxblood hover:text-ink transition-colors mt-0.5"
                                          >
                                            how?
                                            <ChevronDown className={`w-3 h-3 transition-transform ${guideOpen ? 'rotate-180' : ''}`} />
                                          </button>
                                        )}
                                      </div>

                                      <AnimatePresence>
                                        {guideOpen && action.guide && (
                                          <motion.ul
                                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                            animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
                                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                            className="space-y-2 overflow-hidden"
                                            style={{ borderLeft: '2px solid var(--color-oxblood)', paddingLeft: 10 }}
                                          >
                                            {action.guide.map((point, pi) => (
                                              <li key={pi} className="flex items-start gap-2 text-xs text-smoke leading-relaxed">
                                                <span className="w-1 h-1 bg-oxblood flex-shrink-0 mt-[5px]" />
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
                                className="p-4 flex items-center gap-3 border"
                                style={{ backgroundColor: 'rgba(107,31,31,0.04)', borderColor: 'rgba(107,31,31,0.25)' }}
                              >
                                <ShieldCheck className="w-4 h-4 flex-shrink-0 text-oxblood" />
                                <div>
                                  <p className="eyebrow sm text-oxblood">All steps completed.</p>
                                  <p className="text-xs mt-0.5 text-smoke">When you're safe, click "I'm Safe" on the right.</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </AnimatePresence>

                      {/* ── Right sidebar ── */}
                      <div className="space-y-4 lg:sticky lg:top-14">

                        <div>
                          <p className="eyebrow sm text-smoke mb-3">Other scenarios</p>
                          <div className="space-y-1.5">
                            {otherScenarios.map((s) => {
                              const Icon = s.icon;
                              return (
                                <button
                                  key={s.id}
                                  onClick={() => handleSelect(s.id)}
                                  className="w-full bg-paper-soft border border-ink/12 p-3 flex items-center gap-3 text-left group hover:border-ink/25 hover:bg-paper transition-colors"
                                >
                                  <div className="flex-shrink-0 w-7 h-7 bg-paper-dim border border-ink/15 flex items-center justify-center group-hover:border-oxblood/30 transition-colors">
                                    <Icon className="w-3.5 h-3.5 text-smoke group-hover:text-oxblood transition-colors" />
                                  </div>
                                  <span className="flex-1 text-sm text-ink truncate">{s.title}</span>
                                  <ArrowRight className="w-3.5 h-3.5 text-ink/20 group-hover:text-oxblood flex-shrink-0 transition-colors" />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Get help now — flat bordered section */}
                        <div className="border border-ink/12 bg-paper-soft p-4">
                          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-ink/10">
                            <Phone className="w-3.5 h-3.5 text-ink-soft" />
                            <p className="eyebrow sm text-ink">Get help now</p>
                          </div>
                          <p className="text-xs text-smoke mb-3 leading-relaxed">
                            Call a press freedom organization directly — no forms, no waiting.
                          </p>
                          <div className="space-y-1.5 mb-3">
                            {HELP_LINES.map(h => (
                              <a
                                key={h.tel}
                                href={`tel:${h.tel}`}
                                className="flex items-center justify-between w-full border border-ink/10 bg-paper px-3 py-2.5 hover:border-ink/25 transition-colors group"
                              >
                                <div>
                                  <p className="text-xs font-medium text-ink">{h.short}</p>
                                  <p className="text-[10px] text-smoke">{h.note}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-mono text-ink">{h.display}</p>
                                  <p className="eyebrow sm text-smoke group-hover:text-ink transition-colors">call →</p>
                                </div>
                              </a>
                            ))}
                          </div>
                          {user?.accountType !== 'specialist' && (
                            <Link
                              to="/request-support"
                              onClick={closeOverlay}
                              className="flex items-center justify-center gap-1.5 w-full py-2 border border-ink/12 hover:border-ink/25 text-ink-soft hover:text-ink text-xs transition-colors"
                            >
                              Request a specialist <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>

                        {/* I'm Safe */}
                        <button
                          onClick={handleSafe}
                          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-ink text-ink text-sm hover:bg-ink hover:text-paper transition-colors"
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
