import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Eye, MessageSquare, MapPin, BookOpen, Scale,
  ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, X,
  ExternalLink, ArrowRight, Users, Lock
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const TABS = [
  {
    id: 'compartmentalization',
    label: 'compartmentalize',
    icon: Eye,
    color: '#A78BFA',
    summary: 'keep your work life and source life in two separate worlds — different devices, accounts, browsers, even physical locations.',
    cards: [
      {
        title: 'why compartmentalization is non-negotiable',
        body: `a single shared login, a single shared device, or a single shared identity is all it takes to burn a source. compartmentalization is not paranoia — it's the default hygiene of investigative work.

what it buys you:
- if one identity is compromised, the others survive
- your source cannot be identified by correlation of mundane data (browsing history, login times, contacts list)
- you can credibly claim in a hostile jurisdiction that you had no knowledge of a channel's contents from another device`,
      },
      {
        title: 'device compartmentalization',
        body: `keep a dedicated "source device" — a second phone and, ideally, a second laptop used only for sensitive work.

minimum setup:
- separate phone (prepaid, anonymous sim where legal)
- separate laptop with full-disk encryption (filevault / luks / bitlocker)
- different physical location for storage when not in use
- no personal apps, no work email, no social media logged in
- never use the source device on your home wifi without a vpn or tor`,
      },
      {
        title: 'identity compartmentalization',
        body: `each "life" gets its own identity stack.

per identity you control:
- unique email address (protonmail or similar, created from a clean network)
- unique username — do not re-use handles from other platforms; adversaries correlate names across services
- unique password and a dedicated password-manager vault (or entirely separate pm instance)
- unique signal number (a second number via a burner sim or a privacy-respecting voip)
- ideally: different writing style — cadence and vocabulary are identifiable`,
      },
      {
        title: 'browser and account compartmentalization',
        body: `at minimum, use separate browsers or browser profiles for work and for source contact. better: use the tor browser for anything sensitive.

rules:
- no shared cookies, no shared extensions, no shared bookmarks
- do not log in to a personal account from the source browser, ever
- do not log in to a work account from the personal browser
- clear state aggressively; "private mode" is not enough`,
      },
    ],
  },
  {
    id: 'first-contact',
    label: 'first contact',
    icon: MessageSquare,
    color: '#2DD4BF',
    summary: 'the first message sets the entire security posture. once an insecure channel is used, metadata is already leaked.',
    cards: [
      {
        title: 'secure inbound channels',
        body: `the best channels are ones you publish and they reach you through.

options ranked by strength:
1. securedrop — gold standard if your newsroom runs one. anonymous, tor-based, file-capable.
2. signal with your published username — journalist-only contact number, never tied to your personal phone.
3. protonmail address published on your author page — encrypted at rest, relatively anonymous.
4. a dedicated tip line voicemail (prepaid, never answered live) for sources who can't use apps.

never rely on: work email, direct twitter/linkedin DMs, sms, facebook messenger.`,
      },
      {
        title: 'what to never send in first contact',
        body: `the first few messages are the highest-risk moments. a single mistake here can deanonymize a source forever.

do not send:
- your real name or the real name of anyone involved
- specific document titles, file names, or dates
- links to unpublished or forthcoming articles
- screenshots that contain identifying metadata (exif, file paths, other windows)
- "hey, got your message" in cleartext email — that alone confirms the channel exists to anyone watching

do send:
- a neutral acknowledgment ("received — let's move to signal at +1…")
- a request to move to a more secure channel
- a verification phrase if you've pre-arranged one`,
      },
      {
        title: 'verification rituals',
        body: `before trusting that the person on the other end is who they claim, verify.

techniques:
- an in-person verification phrase agreed before the digital contact
- a detail only the real source would know (something non-public, non-obvious)
- a safety-word system ("i'll say X if i'm under duress")
- on signal, verify safety numbers out-of-band before sharing anything sensitive
- beware: adversaries may impersonate journalists to draw out sources — verify yourself to the source too`,
      },
      {
        title: 'dead drops and air-gapped handoffs',
        body: `when digital contact is too risky, physical handoffs still have a place.

basics:
- choose a neutral public location with no cameras (verify on foot, at the same time of day)
- neither party knows exactly who the other is
- paper documents > usb sticks; if usb, use a fresh one and a dedicated "burner" reader laptop
- never take the drop device home on your normal commute route`,
      },
    ],
  },
  {
    id: 'meeting',
    label: 'meeting & handoff',
    icon: MapPin,
    color: '#F59E0B',
    summary: 'in-person is often safer than digital — but only with planning. surveillance, metadata, and logistics all matter.',
    cards: [
      {
        title: 'picking a meeting location',
        body: `the ideal meeting spot is one chosen by you, unannounced in advance, and away from both your and your source's usual patterns.

criteria:
- no known cctv or obvious fixed cameras inside or at the entrance
- neutral — neither of your neighborhoods, not a usual haunt
- busy enough that you're not conspicuous, quiet enough to talk
- multiple exits
- somewhere you've been before and can navigate without your phone

decide the *final* location only within a few hours of the meeting. do not pin a location in a chat — verbal or hand-written only.`,
      },
      {
        title: 'counter-surveillance basics',
        body: `you are not a spy, but simple habits matter.

- leave your normal phone at home (or in a faraday bag). a phone in your pocket is a gps tracker.
- travel a non-obvious route. take at least one unnecessary turn; stop, look, and continue.
- wear plain, logo-free clothing; no distinctive shoes or bags
- do not arrive and leave together
- if you think you're being followed, abort — do not lead anyone to the source`,
      },
      {
        title: 'document & file handoff',
        body: `physical handoff is simpler when there are no devices. when there must be files:

- use a fresh usb stick. never use one from your personal desk.
- transfer to an air-gapped computer first (a laptop that has never touched the internet)
- strip metadata (exif, doc author fields, revision history) before anything goes on an internet-connected machine
- verify hashes (sha256) so you know the file wasn't swapped in transit
- if the source hands you paper, photograph it on the air-gapped device, then destroy your photos' exif data before sharing`,
      },
      {
        title: 'burner phones done right',
        body: `a burner is useless if you carry it next to your personal phone.

rules:
- buy with cash, ideally not near your home or workplace
- activate on a different network than your carrier
- never turn it on in the same location as your main phone (towers log co-location)
- don't call or text your personal contacts from it — ever
- discard by factory reset + physical destruction of the sim, at a location far from both your routine and the source's`,
      },
    ],
  },
  {
    id: 'after',
    label: 'after publication',
    icon: BookOpen,
    color: '#84CC16',
    summary: 'the story being out does not end the source protection work. sometimes that\'s when it starts.',
    cards: [
      {
        title: 'source aftercare checklist',
        body: `within 24 hours of publication:
- verify the source is safe and has not been identified
- re-confirm their "duress phrase" is still active
- review whether their identity could be reconstructed from the article (dates, quotes, locations, writing style)
- offer, if they want it, a pre-prepared legal / safety contact

within 2 weeks:
- check in again — public attention often takes days to reach certain communities
- be alert to sudden pattern changes in their digital presence (accounts going dark, last-seen dropping off signal)
- if they need to relocate, have resources ready (cpj, rsf, local unions)`,
      },
      {
        title: 'your own legal exposure',
        body: `publication can expose *you* too.

steps:
- secure your notes, recordings, and drafts in an encrypted, off-site backup before you publish
- delete working copies of source-identifying materials from your laptop (secure deletion, not trash)
- know who your newsroom's lawyer is and how to reach them on a weekend
- if you travel internationally after publication, leave sensitive material behind; carry a clean laptop`,
      },
      {
        title: 'metadata & draft scrub',
        body: `drafts and old messages are a rich target.

- strip metadata from every file before you or the newsroom archives them
- export signal chats only if essential; if exported, encrypt and store offline
- purge your cloud drafts, bin, and versions in google docs / onedrive / notion — the "revision history" holds your working text
- do not keep your source's real name in any file on an internet-connected machine after publication`,
      },
      {
        title: 'retention vs. secure deletion',
        body: `deciding what to keep is a balance: some evidence may be legally necessary (to defend the story), but every retained artifact is a future leak.

framework:
- ask your lawyer what the minimum legal retention period is
- store anything you must keep in a single, air-gapped, encrypted volume with a strong passphrase
- log every access — know who looked at it and when
- for everything else: use a tool that overwrites, not just deletes (srm / shred / disk-level secure erase)`,
      },
    ],
  },
  {
    id: 'legal',
    label: 'legal protections',
    icon: Scale,
    color: '#EF4444',
    summary: 'you are not your own lawyer. but you do need to know when to call one and what rights you have.',
    cards: [
      {
        title: 'shield laws — the basics',
        body: `shield laws protect journalists from being forced to identify sources or hand over unpublished material. they vary wildly by jurisdiction.

key things to know about your own jurisdiction:
- does a shield law exist at all? (many countries have none)
- who counts as a "journalist" under it? freelancers? bloggers? you?
- what materials are covered — just identities, or also notes, drafts, recordings?
- are there "national security" carve-outs?

if you don't know the answer to these, that's the first call to make — before you take a sensitive story, not after.`,
      },
      {
        title: 'when to call a lawyer',
        body: `earlier than feels comfortable. specifically:

- before you publish anything where a source could be subpoenaed
- the moment you're contacted by law enforcement, no matter how informal
- if you're served with a subpoena, search warrant, or national security letter — do not answer questions alone
- if the target of your story makes legal threats, even informal ones
- if you're traveling to a jurisdiction with weaker press protections

your newsroom usually has a standing lawyer. freelancers: know the press-freedom organizations in your region (cpj, rsf, eff, ipi) — many offer free first-contact legal advice.`,
      },
      {
        title: 'subpoenas and search warrants',
        body: `if something lands in your inbox or at your door:

- do not destroy anything. spoliation is a separate crime.
- do not consent to a search. require a warrant and read it carefully.
- call your lawyer immediately. do not answer questions, even "background" ones, without counsel.
- notify your source-protection contact (newsroom ethics officer, press-freedom org) — you may not be alone.

if you travel: your devices can be searched at many borders without a warrant. plan: travel clean, or use a device you're prepared to lose.`,
      },
      {
        title: 'press-freedom organizations',
        body: `organizations that support journalists under legal or physical threat. not hotlines to memorize — contacts to save now.

- committee to protect journalists (cpj) — global, emergency support, legal referrals
- reporters without borders (rsf) — advocacy and emergency grants
- electronic frontier foundation (eff) — u.s.-focused digital-rights legal help
- international press institute (ipi) — press-freedom advocacy
- freedom of the press foundation (fpf) — securedrop, training, emergency fund
- your local journalists' union or association — often has the fastest local response`,
      },
    ],
  },
];

const SCENARIOS = [
  {
    id: 'followed',
    icon: AlertTriangle,
    accent: '#EF4444',
    title: "your source texts: 'i think i'm being followed'",
    context: "they've messaged you on signal. they don't know where they're going next. what do you advise?",
    options: [
      {
        label: 'meet in person at the pre-arranged location asap',
        correct: false,
        consequence: "if they're being followed, you've just handed the surveiller the meeting point. the source burns and so does your next meeting spot.",
      },
      {
        label: "stop digital contact, use the pre-arranged 'go-dark' protocol",
        correct: true,
        consequence: "this is why you agreed on one in the first contact. shared silence until the next scheduled, unmonitored contact window.",
        followup: "if you don't have a go-dark protocol yet, it's the single most valuable addendum to your first-contact hygiene.",
      },
      {
        label: 'call them to figure out what they saw',
        correct: false,
        consequence: "a phone call is the worst of all worlds: cell-tower metadata, content interception, and a live voice that makes them identifiable on the other end.",
      },
    ],
    link: { to: '/resources', label: 'review encrypted comms tools in resources' },
  },
  {
    id: 'shared-doc',
    icon: Lock,
    accent: '#F59E0B',
    title: 'an editor asks you to name your source in a shared doc',
    context: 'they want a quick cross-check. the doc is in the newsroom google workspace. what do you do?',
    options: [
      {
        label: "add the source's real name with a note 'please delete once verified'",
        correct: false,
        consequence: "google docs keeps revision history. 'delete' doesn't delete. the name is now in the newsroom's audit logs forever.",
      },
      {
        label: 'use a codename you agreed with the editor in person',
        correct: true,
        consequence: 'pre-arranged codenames are standard operating procedure in investigative rooms. the real name never touches a networked system.',
      },
      {
        label: 'email the real name to the editor privately',
        correct: false,
        consequence: "email is the most subpoenaed medium in journalism. work email is owned by your employer — not you. it's discoverable.",
      },
    ],
    link: { to: '/secure-setup', label: 'check your data-protection setup tasks' },
  },
  {
    id: 'phishing-reveal',
    icon: AlertTriangle,
    accent: '#A78BFA',
    title: 'a phishing email references an unpublished detail only your source would know',
    context: "the email looks like a calendar invite. it mentions a specific location where you met your source. what does this tell you?",
    options: [
      {
        label: "ignore it — it's probably coincidence",
        correct: false,
        consequence: "it is almost never coincidence. unpublished, specific detail = someone has access to a channel you thought was private.",
      },
      {
        label: 'click the link to see where it leads',
        correct: false,
        consequence: "you\u2019ve just given the attacker a device fingerprint, ip, and possibly executed a payload. assume full device compromise.",
      },
      {
        label: 'assume the source-contact channel is compromised — move to a clean device & notify the source',
        correct: true,
        consequence: "correct. the phishing email is confirming a real access. new clean device, new clean channel, and a call to your lawyer + newsroom security lead.",
      },
    ],
    link: { to: '/secure-setup', label: 'harden your device setup' },
  },
];

const Accordion = ({ cards, accentColor }) => {
  const [open, setOpen] = useState(new Set([0]));
  const toggle = (i) => {
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };
  return (
    <div className="space-y-3">
      {cards.map((card, i) => {
        const isOpen = open.has(i);
        return (
          <div
            key={i}
            className="border rounded-2xl overflow-hidden transition-colors"
            style={{
              borderColor: isOpen ? `${accentColor}33` : 'rgba(255,255,255,0.08)',
              backgroundColor: isOpen ? `${accentColor}08` : 'rgba(255,255,255,0.02)',
            }}
          >
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
            >
              <span className="text-sm font-semibold text-white lowercase">{card.title}</span>
              <ChevronDown
                className="w-4 h-4 flex-shrink-0 transition-transform"
                style={{
                  color: accentColor,
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-0">
                    <div className="text-sm text-gray-300 lowercase leading-relaxed whitespace-pre-wrap">
                      {card.body}
                    </div>
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
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[80] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-xl glass-card rounded-2xl border border-white/[0.1] overflow-hidden max-h-[85vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors z-10">
            <X className="w-4 h-4" />
          </button>

          <div className="px-6 pt-6 pb-5 border-b border-white/[0.06]">
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${scenario.accent}15`, border: `1px solid ${scenario.accent}30` }}
              >
                <Icon className="w-5 h-5" style={{ color: scenario.accent }} />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1">scenario</p>
                <h3 className="text-lg font-semibold text-white lowercase leading-snug">{scenario.title}</h3>
              </div>
            </div>
            <p className="text-sm text-gray-400 lowercase leading-relaxed">{scenario.context}</p>
          </div>

          <div className="px-6 py-5">
            <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-3">what do you do?</p>
            <div className="space-y-2">
              {scenario.options.map((opt, i) => {
                const isSelected = selected === i;
                const wrongSelected = isSelected && !opt.correct;
                const rightSelected = isSelected && opt.correct;
                return (
                  <button
                    key={i}
                    onClick={() => setSelected(i)}
                    disabled={selected !== null}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      wrongSelected
                        ? 'border-crimson-500/40 bg-crimson-500/[0.08]'
                        : rightSelected
                          ? 'border-olive-500/40 bg-olive-500/[0.08]'
                          : selected !== null && opt.correct
                            ? 'border-olive-500/20 bg-olive-500/[0.04]'
                            : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]'
                    } ${selected !== null && 'cursor-default'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        {isSelected && opt.correct && <CheckCircle2 className="w-4 h-4 text-olive-500" />}
                        {isSelected && !opt.correct && <X className="w-4 h-4 text-crimson-500" />}
                        {!isSelected && selected !== null && opt.correct && <CheckCircle2 className="w-4 h-4 text-olive-500/60" />}
                        {selected === null && <ChevronRight className="w-4 h-4 text-gray-600" />}
                      </div>
                      <p className="text-sm text-gray-200 lowercase">{opt.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {chosen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-5 p-4 rounded-xl border ${
                  chosen.correct
                    ? 'border-olive-500/25 bg-olive-500/[0.06]'
                    : 'border-crimson-500/25 bg-crimson-500/[0.06]'
                }`}
              >
                <p className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${
                  chosen.correct ? 'text-olive-400' : 'text-crimson-400'
                }`}>
                  {chosen.correct ? 'well done' : 'what this costs you'}
                </p>
                <p className="text-sm text-gray-300 lowercase leading-relaxed">{chosen.consequence}</p>
                {chosen.followup && (
                  <p className="text-xs text-gray-400 lowercase leading-relaxed mt-2 italic">{chosen.followup}</p>
                )}
              </motion.div>
            )}

            {selected !== null && (
              <div className="flex items-center gap-3 mt-5 pt-5 border-t border-white/[0.06] flex-wrap">
                <Link
                  to={scenario.link.to}
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-midnight-400 hover:bg-midnight-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wide transition-all"
                >
                  {scenario.link.label}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-gray-400 hover:text-white lowercase transition-colors"
                >
                  try another answer
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const SourceProtection = () => {
  const [activeTab, setActiveTab] = useState('compartmentalization');
  const [scenario, setScenario] = useState(null);

  const active = TABS.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 mb-5">
            <Shield className="w-7 h-7 text-teal-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 lowercase">
            source protection playbook
          </h1>
          <p className="text-base text-gray-500 lowercase max-w-xl mx-auto leading-relaxed"
            style={{ letterSpacing: '0.03em' }}
          >
            practical operational security for investigative journalists — compartmentalization, first contact, meetings, and legal fallbacks
          </p>
        </motion.div>

        {/* Tab switcher */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center mb-8"
        >
          <div className="flex gap-1 bg-white/[0.03] border border-white/[0.07] rounded-xl p-1 flex-wrap justify-center">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all lowercase"
                  style={isActive ? {
                    backgroundColor: `${tab.color}18`,
                    color: 'white',
                  } : {
                    color: '#6b7280',
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: isActive ? tab.color : undefined }} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Active tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="rounded-2xl p-5 mb-6 border"
              style={{
                borderColor: `${active.color}25`,
                backgroundColor: `${active.color}08`,
              }}
            >
              <p className="text-sm text-gray-300 lowercase leading-relaxed">
                {active.summary}
              </p>
            </div>

            <Accordion cards={active.cards} accentColor={active.color} />
          </motion.div>
        </AnimatePresence>

        {/* Scenarios */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 pt-10 border-t border-white/[0.06]"
        >
          <div className="text-center mb-8">
            <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">practice</p>
            <h2 className="text-2xl md:text-3xl font-display font-bold lowercase mb-2">what would you actually do?</h2>
            <p className="text-sm text-gray-500 lowercase max-w-md mx-auto leading-relaxed">
              three realistic situations from investigative work. pick a response and see the consequence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SCENARIOS.map(s => {
              const SIcon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setScenario(s)}
                  className="group text-left rounded-2xl border p-5 transition-all hover:scale-[1.02]"
                  style={{
                    borderColor: `${s.accent}25`,
                    backgroundColor: `${s.accent}06`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${s.accent}15`, border: `1px solid ${s.accent}30` }}
                  >
                    <SIcon className="w-5 h-5" style={{ color: s.accent }} />
                  </div>
                  <h3 className="text-sm font-semibold text-white lowercase leading-snug mb-2">{s.title}</h3>
                  <p className="text-xs text-gray-500 lowercase leading-relaxed">{s.context}</p>
                  <div className="flex items-center gap-1.5 mt-4 text-[10px] font-bold tracking-widest uppercase" style={{ color: s.accent }}>
                    try scenario
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Related resources */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <Link
            to="/resources"
            className="group border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-5 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-midnight-400/10 border border-midnight-400/20 flex items-center justify-center mb-3">
              <BookOpen className="w-4 h-4 text-midnight-400" />
            </div>
            <p className="text-sm font-semibold text-white lowercase mb-1">encrypted tools</p>
            <p className="text-xs text-gray-500 lowercase">vetted signal, protonmail, tor, veracrypt, keepassxc</p>
          </Link>
          <Link
            to="/secure-setup"
            className="group border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-5 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-sm font-semibold text-white lowercase mb-1">secure setup</p>
            <p className="text-xs text-gray-500 lowercase">31 actionable tasks — the backbone of your op-sec</p>
          </Link>
          <Link
            to="/community"
            className="group border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-5 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-sm font-semibold text-white lowercase mb-1">ask the community</p>
            <p className="text-xs text-gray-500 lowercase">q&a with verified security specialists</p>
          </Link>
        </motion.div>

        {/* Citations footer */}
        <div className="mt-16 pt-8 border-t border-white/[0.05]">
          <div className="flex items-start gap-3">
            <ExternalLink className="w-4 h-4 text-gray-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] tracking-widest uppercase font-bold text-gray-600 mb-2">
                sources & further reading
              </p>
              <p className="text-xs text-gray-600 lowercase leading-relaxed">
                guidance synthesized from committee to protect journalists (cpj), freedom of the press foundation (fpf),
                electronic frontier foundation (eff), and reporters without borders (rsf).
                this playbook is educational — consult a lawyer and your newsroom's security team for high-stakes work.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ScenarioModal scenario={scenario} onClose={() => setScenario(null)} />
    </div>
  );
};

export default SourceProtection;
