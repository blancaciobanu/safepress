import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Eye, MessageSquare, MapPin, Scale,
  ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, X,
  ArrowRight, Lock
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { NewsModalCard, NewsPage } from '../components/editorial/NewsPage';

/* Field manual — Source Protection.
   Ink cover band → chapter tabs → accordion protocols → decision-tree scenarios. */

const TABS = [
  {
    id: 'compartmentalization',
    n: 'I',
    label: 'Compartmentalize',
    icon: Eye,
    brief: 'Keep your work life and source life in two separate worlds — different devices, accounts, browsers, even physical locations.',
    cards: [
      {
        title: 'Why compartmentalization is non-negotiable',
        body: `A single shared login, a single shared device, or a single shared identity is all it takes to burn a source. Compartmentalization is not paranoia — it's the default hygiene of investigative work.

What it buys you:
- If one identity is compromised, the others survive
- Your source cannot be identified by correlation of mundane data (browsing history, login times, contacts list)
- You can credibly claim in a hostile jurisdiction that you had no knowledge of a channel's contents from another device`,
      },
      {
        title: 'Device compartmentalization',
        body: `Keep a dedicated "source device" — a second phone and, ideally, a second laptop used only for sensitive work.

Minimum setup:
- Separate phone (prepaid, anonymous SIM where legal)
- Separate laptop with full-disk encryption (FileVault / LUKS / BitLocker)
- Different physical location for storage when not in use
- No personal apps, no work email, no social media logged in
- Never use the source device on your home wifi without a VPN or Tor`,
      },
      {
        title: 'Identity compartmentalization',
        body: `Each "life" gets its own identity stack.

Per identity you control:
- Unique email address (ProtonMail or similar, created from a clean network)
- Unique username — do not re-use handles from other platforms; adversaries correlate names across services
- Unique password and a dedicated password-manager vault (or entirely separate PM instance)
- Unique Signal number (a second number via a burner SIM or a privacy-respecting VoIP)
- Ideally: different writing style — cadence and vocabulary are identifiable`,
      },
      {
        title: 'Browser and account compartmentalization',
        body: `At minimum, use separate browsers or browser profiles for work and for source contact. Better: use the Tor Browser for anything sensitive.

Rules:
- No shared cookies, no shared extensions, no shared bookmarks
- Do not log in to a personal account from the source browser, ever
- Do not log in to a work account from the personal browser
- Clear state aggressively; "private mode" is not enough`,
      },
    ],
  },
  {
    id: 'first-contact',
    n: 'II',
    label: 'First contact',
    icon: MessageSquare,
    brief: 'The first message establishes whether you can be trusted — and whether the channel can.',
    cards: [
      {
        title: 'Choose the channel before you choose the person',
        body: `The first rule of source contact: the channel has to be secure before you verify the person's identity. If the channel is compromised, identity verification exposes the source.

Hierarchy (most to least preferred):
1. SecureDrop (anonymous, no metadata, no phone number)
2. Signal (with safety number verification on first contact)
3. SimpleX Chat (no phone number, bidirectional verification code)
4. Encrypted email (PGP — acceptable for low-risk initial contact only)
5. Anything else — do not use for sensitive source work`,
      },
      {
        title: 'Signal safety numbers',
        body: `Signal's safety number is a cryptographic fingerprint of your channel. Verify it out-of-band (in person, or via a second independent channel) before exchanging anything sensitive.

How:
- Open the conversation in Signal → tap the name → "View Safety Number"
- Compare every digit/word with the source by phone, in person, or via a different trusted channel
- If numbers don't match: the channel has been tampered with. Do not continue.

Set a verification reminder: re-check safety numbers every 30–90 days or any time the source gets a new device.`,
      },
      {
        title: 'Retention windows — agree on day one',
        body: `Agree a message-retention window at first contact, before anything sensitive is shared.

Standard:
- 1 week disappearing messages — adequate for most low-risk sources
- 24 hours — for sources in high-surveillance environments
- Message-per-message deletion — in active hostile situations

Document the agreed retention window in your case notes (offline), not in the channel itself.`,
      },
    ],
  },
  {
    id: 'meeting',
    n: 'III',
    label: 'Meeting & handoff',
    icon: MapPin,
    brief: 'Physical meetings are the hardest to monitor — but only if you plan them right.',
    cards: [
      {
        title: 'Location selection',
        body: `Criteria for a meeting location:
- Busy but not so loud you can't speak
- Multiple entrances and exits
- No CCTV or low-density CCTV (cafés, parks, libraries)
- Not near either person's home, workplace, or commute route
- Not a place either person has been seen before

Pre-agree backup locations: if one person doesn't appear within 10 minutes, the other leaves.`,
      },
      {
        title: 'Phones and devices at meetings',
        body: `Phones are tracking devices. There are three options for a sensitive meeting:

1. Leave all devices at home (strongest)
2. Use a Faraday bag for your phone during the meeting
3. Power down completely before approaching the meeting area (not airplane mode — fully off)

If you leave your phone at home: don't tell anyone where you're "really" going — your normal location data should show you at a plausible alternative location.`,
      },
      {
        title: 'Document handoff',
        body: `Physical document exchange:
- Never photograph documents at the meeting location itself
- Use a clean device to photograph — not your personal phone
- Strip all EXIF data before any digital transmission (Exiftool, Signal's "Remove" feature, or mat2)
- Physical originals: decide in advance whether you're keeping them, returning them, or destroying them

For digital documents: SecureDrop is the gold standard. For anything else, use a one-time-use ProtonMail address and PGP.`,
      },
    ],
  },
  {
    id: 'after',
    n: 'IV',
    label: 'After publication',
    icon: Shield,
    brief: 'The story is out. The work of protecting your source has just begun.',
    cards: [
      {
        title: 'The publication window',
        body: `In the 48–72 hours after publication, the attack surface is highest. Adversaries looking for the source will be:
- Correlating timing: who had access to this information, and when?
- Searching for digital footprints: shared documents, metadata, access logs
- Social-engineering your newsroom: asking who "the reporter close to the story" talked to

Minimum protocol: after publication, go silent on any channel that was used for source contact for at least 30 days.`,
      },
      {
        title: 'Source removal',
        body: `Source removal is the practice of systematically deleting all traces of a source after a story has been published.

What to remove:
- Message threads (confirm deletion from both devices)
- Contact entries
- Saved documents or photos that could identify them
- Browser history related to source research
- Cloud backups that captured any of the above

Keep: your own case journal (offline, encrypted), your legal notes, and any records required by your newsroom's document-retention policy.`,
      },
      {
        title: 'Legal hold',
        body: `If a subpoena, court order, or law-enforcement request is anticipated:

1. Call your newsroom's legal counsel before doing anything
2. Pause all document deletion until counsel advises
3. Note the date/time you became aware of the legal risk
4. Do not discuss specifics on any digital channel

Shield laws vary significantly by jurisdiction. Your counsel will know the applicable protections and exceptions in your territory.`,
      },
    ],
  },
  {
    id: 'legal',
    n: 'V',
    label: 'Legal protections',
    icon: Scale,
    brief: 'Know what the law protects before you need the protection.',
    cards: [
      {
        title: 'Shield laws: what they are and what they are not',
        body: `A shield law gives a journalist the right to refuse to identify a source in legal proceedings. Coverage and strength vary dramatically:

- US: No federal shield law; state laws differ widely in scope and exceptions
- UK: s.10 Contempt of Court Act — significant, but qualified
- EU: ECHR Article 10 provides the strongest baseline across member states
- Many jurisdictions: no shield law at all

What no shield law protects:
- Your digital records — metadata from telecoms can be obtained without your knowledge
- Your source if they voluntarily identify themselves
- Evidence of criminal conduct (in most jurisdictions)`,
      },
      {
        title: 'Digital surveillance and the law',
        body: `In most jurisdictions, law enforcement can obtain:
- Cell-site location records (often without a warrant)
- Email metadata (sender, recipient, subject, timestamps)
- Cloud storage (via legal process served to the provider)
- Call records

They typically cannot (or face higher bar to obtain):
- Content of encrypted messages (if implemented correctly)
- Content on devices with strong full-disk encryption and a strong passphrase
- Communications that never touched a server (e.g. local Signal messages on an offline device)

The practical implication: use end-to-end encryption for everything. Assume metadata is always available to a motivated adversary.`,
      },
      {
        title: 'When to call a lawyer',
        body: `Call legal counsel before:
- Publishing material that could expose a source
- Any meeting or call with law enforcement about your reporting
- Responding to any legal demand, subpoena, or preservation letter
- Crossing an international border with sensitive material on your device

Journalists should have a relationship with media-law counsel before a crisis arises — not during one. CPJ and RSF both provide emergency legal referrals.`,
      },
    ],
  },
];

const SCENARIOS = [
  {
    id: 'followed',
    icon: AlertTriangle,
    title: "Your source texts: 'I think I'm being followed'",
    context: "They've messaged you on Signal. They don't know where they're going next. What do you advise?",
    options: [
      { label: 'Meet in person at the pre-arranged location asap', correct: false, consequence: "If they're being followed, you've just handed the surveiller the meeting point. The source burns and so does your next meeting spot." },
      { label: "Stop digital contact, use the pre-arranged 'go-dark' protocol", correct: true, consequence: "This is why you agreed on one in the first contact. Shared silence until the next scheduled, unmonitored contact window.", followup: "If you don't have a go-dark protocol yet, it's the single most valuable addendum to your first-contact hygiene." },
      { label: 'Call them to figure out what they saw', correct: false, consequence: "A phone call is the worst of all worlds: cell-tower metadata, content interception, and a live voice that makes them identifiable on the other end." },
    ],
    link: { to: '/resources', label: 'Review encrypted comms tools in Resources' },
  },
  {
    id: 'shared-doc',
    icon: Lock,
    title: 'An editor asks you to name your source in a shared doc',
    context: 'They want a quick cross-check. The doc is in the newsroom Google Workspace. What do you do?',
    options: [
      { label: "Add the source's real name with a note 'please delete once verified'", correct: false, consequence: "Google Docs keeps revision history. 'Delete' doesn't delete. The name is now in the newsroom's audit logs forever." },
      { label: 'Use a codename you agreed with the editor in person', correct: true, consequence: 'Pre-arranged codenames are standard operating procedure in investigative rooms. The real name never touches a networked system.' },
      { label: 'Email the real name to the editor privately', correct: false, consequence: "Email is the most subpoenaed medium in journalism. Work email is owned by your employer — not you. It's discoverable." },
    ],
    link: { to: '/secure-setup', label: 'Check your data-protection setup tasks' },
  },
  {
    id: 'phishing-reveal',
    icon: AlertTriangle,
    title: 'A phishing email references an unpublished detail only your source would know',
    context: "The email looks like a calendar invite. It mentions a specific location where you met your source. What does this tell you?",
    options: [
      { label: "Ignore it — it's probably coincidence", correct: false, consequence: "It is almost never coincidence. Unpublished, specific detail = someone has access to a channel you thought was private." },
      { label: 'Click the link to see where it leads', correct: false, consequence: "You've just given the attacker a device fingerprint, IP, and possibly executed a payload. Assume full device compromise." },
      { label: 'Assume the source-contact channel is compromised — move to a clean device & notify the source', correct: true, consequence: "Correct. The phishing email is confirming a real access. New clean device, new clean channel, and a call to your lawyer + newsroom security lead." },
    ],
    link: { to: '/secure-setup', label: 'Harden your device setup' },
  },
];

/* ─── Accordion — editorial restyle ─────────────────────────────────── */
const Accordion = ({ cards }) => {
  const [open, setOpen] = useState(new Set([0]));
  const toggle = (i) => setOpen(prev => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });

  return (
    <div className="flex flex-col">
      {cards.map((card, i) => {
        const isOpen = open.has(i);
        return (
          <div key={i} className="border-b border-ink/12 last:border-b-0">
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-baseline justify-between gap-4 py-4 text-left"
            >
              <span className="flex items-baseline gap-3">
                <span className="eyebrow sm text-smoke shrink-0">
                  {String(i + 1).padStart(2, '0')}.
                </span>
                <span className="text-sm font-medium text-ink">{card.title}</span>
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-smoke shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-5 pl-9">
                    <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-wrap">{card.body}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Scenario modal — paper aesthetic ──────────────────────────────── */
const ScenarioModal = ({ scenario, onClose }) => {
  const [selected, setSelected] = useState(null);
  if (!scenario) return null;
  const Icon = scenario.icon;
  const chosen = selected !== null ? scenario.options[selected] : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-ink/50"
        onClick={onClose}
      >
        <NewsModalCard
          as={motion.div}
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-smoke hover:text-ink transition-colors z-10">
            <X className="w-4 h-4" />
          </button>

          <div className="px-6 pt-6 pb-5 border-b border-ink/12">
            <p className="eyebrow sm text-oxblood mb-2">Scenario · Decision tree</p>
            <div className="flex items-start gap-3">
              <Icon className="w-4 h-4 text-oxblood shrink-0 mt-0.5" />
              <div>
                <h3 className="display-soft text-xl leading-tight">{scenario.title}</h3>
                <p className="text-sm text-ink-soft mt-2 leading-relaxed">{scenario.context}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <p className="eyebrow sm mb-3">What do you do?</p>
            <div className="flex flex-col gap-2">
              {scenario.options.map((opt, i) => {
                const isSelected = selected === i;
                const wrong = isSelected && !opt.correct;
                const right = isSelected && opt.correct;
                const revealRight = selected !== null && opt.correct && !isSelected;
                return (
                  <button
                    key={i}
                    onClick={() => !selected && setSelected(i)}
                    disabled={selected !== null}
                    className={`w-full text-left px-4 py-3 border transition-colors flex items-start gap-3 ${
                      wrong ? 'border-oxblood/40 bg-oxblood/[0.06]'
                      : right ? 'border-brass/40 bg-brass/[0.06]'
                      : revealRight ? 'border-brass/25 bg-brass/[0.04]'
                      : 'border-ink/10 hover:border-ink/25 hover:bg-paper'
                    } ${selected !== null ? 'cursor-default' : ''}`}
                  >
                    <span className="mt-0.5 shrink-0">
                      {right && <CheckCircle2 className="w-4 h-4 text-brass" />}
                      {wrong && <X className="w-4 h-4 text-oxblood" />}
                      {!isSelected && selected !== null && opt.correct && <CheckCircle2 className="w-4 h-4 text-brass/60" />}
                      {selected === null && <ChevronRight className="w-4 h-4 text-smoke" />}
                    </span>
                    <p className="text-sm text-ink-soft">{opt.label}</p>
                  </button>
                );
              })}
            </div>

            {chosen && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-5 p-4 border-l-2 ${chosen.correct ? 'border-l-brass bg-brass/[0.05]' : 'border-l-oxblood bg-oxblood/[0.05]'} border border-ink/10`}
              >
                <p className={`eyebrow sm mb-2 ${chosen.correct ? 'text-brass' : 'text-oxblood'}`}>
                  {chosen.correct ? 'Well done' : 'What this costs you'}
                </p>
                <p className="text-sm text-ink-soft leading-relaxed">{chosen.consequence}</p>
                {chosen.followup && <p className="text-xs text-smoke leading-relaxed mt-2 italic">{chosen.followup}</p>}
              </motion.div>
            )}

            {selected !== null && (
              <div className="flex items-center gap-4 mt-5 pt-4 border-t border-ink/12 flex-wrap">
                <Link
                  to={scenario.link.to}
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 btn"
                >
                  {scenario.link.label}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button onClick={() => setSelected(null)} className="text-sm text-smoke hover:text-ink transition-colors">
                  Try another answer
                </button>
              </div>
            )}
          </div>
        </NewsModalCard>
      </motion.div>
    </AnimatePresence>
  );
};

/* ─── Main ────────────────────────────────────────────────────────────── */
const SourceProtection = () => {
  const [activeTab, setActiveTab] = useState('compartmentalization');
  const [scenario, setScenario] = useState(null);
  const active = TABS.find(t => t.id === activeTab);

  return (
    <NewsPage >
      {/* Ink cover band — printed pocket guide masthead */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="-mx-6 md:-mx-10 lg:-mx-14 -mt-8 md:-mt-12 bg-ink text-paper px-6 md:px-10 lg:px-14 py-6"
      >
        <div className="max-w-[920px] mx-auto flex items-baseline justify-between gap-4 flex-wrap">
          <div>
            <p className="eyebrow sm text-brass-soft">Field Manual · Pocket Ed.</p>
            <h1 className="display text-3xl md:text-5xl mt-2 leading-none text-paper">
              Source protection<span className="text-oxblood-soft italic">.</span>
            </h1>
          </div>
          <p className="eyebrow sm opacity-60">Issue III · Rev. 2026</p>
        </div>

        {/* Chapter tabs — hanging from the cover band */}
        <div className="-mx-6 md:-mx-10 lg:-mx-14 mt-4 flex gap-0.5 px-6 md:px-10 lg:px-14">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 pt-2.5 pb-3 font-mono uppercase text-[10px] tracking-[0.18em] transition-colors ${
                activeTab === t.id
                  ? 'bg-paper text-ink'
                  : 'bg-paper/10 text-paper/60 hover:bg-paper/20 hover:text-paper'
              }`}
            >
              <em className={`font-[var(--font-display)] not-italic italic mr-2 text-sm ${activeTab === t.id ? 'text-oxblood' : 'text-brass-soft'}`}>
                {t.n}.
              </em>
              {t.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Chapter content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10"
        >
          <p className="eyebrow sm text-oxblood">Chapter {active.n}</p>
          <h2 className="display text-3xl md:text-4xl mt-3 leading-none max-w-[24ch]">
            {active.label}<span className="italic-ox">.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-soft max-w-prose">
            {active.brief}
          </p>

          <hr className="border-t border-ink/22 mt-8 mb-0" />

          <p className="eyebrow sm mt-5 mb-2">Numbered protocols — read in order</p>
          <Accordion cards={active.cards} />
        </motion.div>
      </AnimatePresence>

      {/* Footer navigation */}
      <div className="mt-8 pt-4 border-t border-ink/22 flex items-baseline justify-between">
        <span className="eyebrow sm">
          Pocket field manual · § {active.n} of V
        </span>
        {TABS.findIndex(t => t.id === activeTab) < TABS.length - 1 && (
          <button
            onClick={() => {
              const i = TABS.findIndex(t => t.id === activeTab);
              setActiveTab(TABS[i + 1].id);
            }}
            className="inline-flex items-center gap-1.5 btn ghost"
          >
            Next chapter <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Decision tree scenarios */}
      <section className="mt-16 pt-8 border-t border-ink/22">
        <p className="eyebrow sm text-oxblood">Scenario · Decision tree</p>
        <h2 className="display text-3xl md:text-4xl mt-3 leading-none max-w-[22ch]">
          Test your field judgement<span className="italic-ox">.</span>
        </h2>
        <p className="mt-4 text-base text-ink-soft max-w-prose leading-relaxed">
          Three scenarios drawn from real reporting situations. Each has one right answer — and knowing why the wrong answers are wrong is as important as the right one.
        </p>

        <div className="mt-8 flex flex-col gap-0 border-t border-ink/22">
          {SCENARIOS.map((sc, i) => {
            const Icon = sc.icon;
            return (
              <div
                key={sc.id}
                className="flex items-baseline gap-5 py-5 border-b border-ink/12 cursor-pointer hover:bg-paper-soft/50 transition-colors px-1 -mx-1"
                onClick={() => setScenario(sc)}
              >
                <span className="eyebrow sm text-smoke shrink-0">{String(i + 1).padStart(2, '0')}.</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <Icon className="w-3.5 h-3.5 text-oxblood shrink-0 mt-0.5" />
                    <p className="display-soft text-lg leading-snug">{sc.title}</p>
                  </div>
                  <p className="text-sm text-smoke mt-1 leading-relaxed">{sc.context}</p>
                </div>
                <span className="eyebrow sm text-oxblood shrink-0">Open →</span>
              </div>
            );
          })}
        </div>
      </section>

      <ScenarioModal scenario={scenario} onClose={() => setScenario(null)} />
    </NewsPage>
  );
};

export default SourceProtection;
