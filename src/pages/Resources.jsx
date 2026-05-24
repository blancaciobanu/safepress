import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor, Smartphone, Apple, Terminal, Shield,
  Brain, Wrench, MessageSquare,
  Radio, Mail, Globe, Lock, Key, ExternalLink, AlertTriangle,
  Eye, Mic, Camera, FileText, User, Fingerprint, ShieldAlert, Book,
  MapPin, Scale, ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { OSMockup } from '../features/resources/OSMockup';
import {
  NewsBadge,
  NewsCard,
  NewsNotice,
  NewsPage,
  NewsSectionHeader,
  NewsTabs,
} from '../components/editorial/NewsPage';

/* ─── Data ──────────────────────────────────────────────────────────────── */

const osGuides = [
  {
    id: 'windows', name: 'Windows', icon: Monitor, color: '#7B2E2E',
    description: 'Harden your Windows system for maximum security.',
    steps: [
      { title: 'Enable Windows Defender',         details: 'Settings → Update & Security → Windows Security → Virus & threat protection' },
      { title: 'Turn on BitLocker encryption',     details: 'Settings → Update & Security → Device encryption (Pro version required)' },
      { title: 'Enable firewall',                  details: 'Settings → Update & Security → Windows Security → Firewall & network protection' },
      { title: 'Disable unnecessary services',     details: 'Services.msc → Disable Remote Desktop, Remote Registry, and other unused services' },
      { title: 'Use strong password + 2FA',        details: 'Settings → Accounts → Sign-in options → Add Windows Hello or PIN' },
      { title: 'Keep Windows updated',             details: 'Settings → Update & Security → Windows Update → Check for updates' },
      { title: 'Disable telemetry',                details: 'Settings → Privacy → Diagnostics & feedback → Set to Basic' },
    ],
  },
  {
    id: 'macos', name: 'macOS', icon: Apple, color: '#8A6D2C',
    description: "Secure your Mac with Apple's built-in tools.",
    steps: [
      { title: 'Enable FileVault encryption',                details: 'System Settings → Privacy & Security → FileVault → Turn On FileVault' },
      { title: 'Turn on firewall',                           details: 'System Settings → Network → Firewall → Turn On' },
      { title: 'Disable automatic login',                    details: 'System Settings → Users & Groups → Login Options → Automatic login: Off' },
      { title: 'Require password immediately',               details: 'System Settings → Lock Screen → Require password: Immediately' },
      { title: 'Enable Gatekeeper',                          details: 'System Settings → Privacy & Security → Allow apps from: App Store and identified developers' },
      { title: 'Disable location services for unused apps',  details: 'System Settings → Privacy & Security → Location Services → review each app' },
      { title: 'Keep macOS updated',                         details: 'System Settings → General → Software Update → Install all updates' },
    ],
  },
  {
    id: 'linux', name: 'Linux', icon: Terminal, color: '#4D5D35',
    description: 'Lock down your Linux distribution.',
    steps: [
      { title: 'Enable full disk encryption (LUKS)', details: 'During install, or: sudo cryptsetup luksFormat /dev/sdX' },
      { title: 'Configure UFW firewall',             details: 'sudo ufw enable && sudo ufw default deny incoming' },
      { title: 'Disable root SSH login',             details: 'sudo nano /etc/ssh/sshd_config → PermitRootLogin no' },
      { title: 'Set up automatic updates',           details: 'sudo apt install unattended-upgrades (Debian/Ubuntu)' },
      { title: 'Use strong passwords',               details: 'passwd → Set a strong password; consider PAM password policies' },
      { title: 'Install fail2ban',                   details: 'sudo apt install fail2ban — protects against brute-force attacks' },
      { title: 'Harden SSH config',                  details: 'Disable password auth, use SSH keys only: PasswordAuthentication no' },
    ],
  },
  {
    id: 'ios', name: 'iOS', icon: Smartphone, color: '#34515E',
    description: 'Maximise privacy on your iPhone or iPad.',
    steps: [
      { title: 'Enable Face ID / Touch ID',          details: 'Settings → Face ID & Passcode → Turn on for all features' },
      { title: 'Use a strong alphanumeric passcode', details: 'Settings → Face ID & Passcode → Change Passcode → Custom Alphanumeric Code' },
      { title: 'Enable Find My iPhone',              details: 'Settings → [Your Name] → Find My → Find My iPhone → On' },
      { title: 'Disable lock screen previews',       details: 'Settings → Face ID & Passcode → Disable Today View and Notification Center on lock screen' },
      { title: 'Turn off cross-app tracking',        details: 'Settings → Privacy → Tracking → Ask Apps Not to Track' },
      { title: 'Enable Advanced Data Protection',    details: 'Settings → [Your Name] → iCloud → Advanced Data Protection → Turn On' },
      { title: 'Review app permissions',             details: 'Settings → Privacy → check Location, Camera, and Microphone for each app' },
    ],
  },
  {
    id: 'android', name: 'Android', icon: Smartphone, color: '#5C6B3C',
    description: 'Harden your Android device security.',
    steps: [
      { title: 'Enable device encryption',                  details: 'Settings → Security → Encryption → Encrypt phone (usually on by default)' },
      { title: 'Use a strong PIN or password',              details: 'Settings → Security → Screen lock → Password (alphanumeric)' },
      { title: 'Enable Find My Device',                     details: 'Settings → Security → Find My Device → Turn on' },
      { title: 'Hide sensitive lock screen notifications',  details: 'Settings → Lock screen → Notifications → Hide sensitive content' },
      { title: 'Disable location history',                  details: 'Settings → Location → Google Location History → Turn off' },
      { title: 'Install apps from Play Store only',         details: 'Settings → Security → Unknown sources → Disable' },
      { title: 'Review app permissions',                    details: 'Settings → Apps → Permission manager → Review all permissions' },
    ],
  },
];

const toolCategories = [
  {
    id: 'messaging', name: 'Secure Messaging', icon: MessageSquare, color: '#375E5A',
    description: 'End-to-end encrypted communication tools.',
    tools: [
      { name: 'Signal',           description: 'The gold standard for secure messaging — end-to-end encrypted calls, messages, and file sharing.',               url: 'https://signal.org',         priority: 'essential',          platforms: ['iOS', 'Android', 'Windows', 'macOS', 'Linux'] },
      { name: 'Session',          description: 'Decentralised messenger requiring no phone number — routes traffic through an onion network.',                    url: 'https://getsession.org',     priority: 'high-threat',        platforms: ['iOS', 'Android', 'Windows', 'macOS', 'Linux'] },
      { name: 'Element / Matrix', description: 'Federated messaging for team collaboration with end-to-end encryption.',                                         url: 'https://element.io',         priority: 'recommended',        platforms: ['iOS', 'Android', 'Web', 'Windows', 'macOS', 'Linux'] },
    ],
  },
  {
    id: 'offline', name: 'Offline & Blackout Comms', icon: Radio, color: '#7B2E2E',
    description: 'Peer-to-peer communication without internet.',
    tools: [
      { name: 'Bridgefy', description: 'Bluetooth mesh networking — works when cellular and Wi-Fi networks are down.',         url: 'https://bridgefy.me',       priority: 'emergency',    platforms: ['iOS', 'Android'] },
      { name: 'Briar',    description: 'P2P messaging via Wi-Fi or Bluetooth — designed for activists and journalists.',      url: 'https://briarproject.org',  priority: 'high-threat',  platforms: ['Android'] },
      { name: 'Berty',    description: 'P2P messenger using Bluetooth LE and Wi-Fi Direct — works fully offline.',           url: 'https://berty.tech',        priority: 'experimental', platforms: ['iOS', 'Android'] },
    ],
  },
  {
    id: 'email', name: 'Secure Email & File Transfer', icon: Mail, color: '#34515E',
    description: 'Encrypted email and anonymous document submission.',
    tools: [
      { name: 'ProtonMail', description: 'End-to-end encrypted email — Swiss-based with strong privacy laws.',                         url: 'https://proton.me',       priority: 'essential',         platforms: ['Web', 'iOS', 'Android'] },
      { name: 'Tuta',       description: 'Encrypted email with automatic encryption and no phone number required.',                    url: 'https://tuta.com',        priority: 'recommended',       platforms: ['Web', 'iOS', 'Android', 'Windows', 'macOS', 'Linux'] },
      { name: 'SecureDrop', description: 'Anonymous whistleblower submission system — the standard for secure document leaks.',        url: 'https://securedrop.org',  priority: 'source-protection', platforms: ['Web (Tor)'] },
    ],
  },
  {
    id: 'browser', name: 'Browser Privacy', icon: Globe, color: '#6B6253',
    description: 'Anonymous browsing and tracker blocking.',
    tools: [
      { name: 'Tor Browser',   description: 'Routes all traffic through the Tor network — essential for sensitive research.',      url: 'https://www.torproject.org', priority: 'essential', platforms: ['Windows', 'macOS', 'Linux', 'Android'] },
      { name: 'uBlock Origin', description: 'Advanced ad and tracker blocker — stops malicious scripts and fingerprinting.',       url: 'https://ublockorigin.com',   priority: 'essential', platforms: ['Browser Extension'] },
      { name: 'NoScript',      description: 'JavaScript blocker — prevents malicious scripts from executing.',                     url: 'https://noscript.net',       priority: 'advanced',  platforms: ['Browser Extension'] },
    ],
  },
  {
    id: 'encryption', name: 'Encryption & Containers', icon: Lock, color: '#7B2E2E',
    description: 'Encrypt files, folders, and entire drives.',
    tools: [
      { name: 'VeraCrypt',    description: 'Create encrypted containers — open-source disk encryption for any platform.',        url: 'https://www.veracrypt.fr',   priority: 'recommended', platforms: ['Windows', 'macOS', 'Linux'] },
      { name: 'Cryptomator',  description: 'Encrypts files before uploading to cloud storage — transparent and easy to use.',    url: 'https://cryptomator.org',    priority: 'essential',   platforms: ['Windows', 'macOS', 'Linux', 'iOS', 'Android'] },
      { name: 'Tails OS',     description: 'Live operating system that leaves no trace and routes all traffic through Tor.',     url: 'https://tails.boum.org',     priority: 'high-threat', platforms: ['USB Drive (Live OS)'] },
    ],
  },
  {
    id: 'passwords', name: 'Passwords & 2FA', icon: Key, color: '#8A6D2C',
    description: 'Password management and two-factor authentication.',
    tools: [
      { name: 'Bitwarden',           description: 'Open-source password manager — encrypted vault with cross-platform sync.',           url: 'https://bitwarden.com',   priority: 'essential',   platforms: ['Web', 'iOS', 'Android', 'Windows', 'macOS', 'Linux', 'Browser Extension'] },
      { name: '1Password',           description: 'Premium password manager with excellent UX, secure vaults, and family sharing.',     url: 'https://1password.com',   priority: 'recommended', platforms: ['Web', 'iOS', 'Android', 'Windows', 'macOS', 'Linux'] },
      { name: 'Authy / Google Auth', description: 'Time-based one-time password (TOTP) 2FA app — much safer than SMS codes.',          url: null,                      priority: 'essential',   platforms: ['iOS', 'Android'] },
      { name: 'YubiKey',             description: 'Hardware security key — the most secure form of two-factor authentication.',        url: 'https://www.yubico.com',  priority: 'high-threat', platforms: ['Physical Device'] },
    ],
  },
];

const priorityConfig = {
  'essential':         { label: 'Essential',         color: '#375E5A' },
  'recommended':       { label: 'Recommended',       color: '#15110C' },
  'high-threat':       { label: 'High-threat',       color: '#8A6D2C' },
  'source-protection': { label: 'Source protection', color: '#7B2E2E' },
  'emergency':         { label: 'Emergency',         color: '#7B2E2E' },
  'advanced':          { label: 'Advanced',          color: '#34515E' },
  'experimental':      { label: 'Experimental',      color: '#6B6253' },
};

const aiNeverShare = [
  { title: 'Source identities',          description: 'Real names, contact info, or identifying details of confidential sources — AI companies may log this data.',               icon: User,        severity: 'critical' },
  { title: 'Unpublished findings',        description: 'Drafts, investigation notes, or unreleased stories — could be exposed via AI training pipelines or data breaches.',       icon: FileText,    severity: 'critical' },
  { title: 'Personal identifiable info', description: 'Passport numbers, addresses, phone numbers, or email addresses of yourself or your sources.',                              icon: Fingerprint, severity: 'critical' },
  { title: 'Location data',              description: 'Exact coordinates, safe house addresses, or movement patterns of you or any source.',                                      icon: Eye,         severity: 'high'     },
  { title: 'Sensitive media',            description: 'Photos or videos that could identify sources or reveal sensitive locations before publication.',                            icon: Camera,      severity: 'critical' },
  { title: 'Confidential audio',         description: 'Interview recordings or voice notes containing identifiable voices or unreleased information.',                            icon: Mic,         severity: 'high'     },
];

const aiThreats = [
  { title: 'Deepfake videos',          description: 'AI-generated fake videos used to discredit journalists or fabricate statements.',                                         icon: Camera,      severity: 'critical' },
  { title: 'Voice cloning',            description: 'Synthetic voice generation used to impersonate journalists or extract information from sources.',                          icon: Mic,         severity: 'high'     },
  { title: 'Identity theft via AI',    description: 'AI scraping social media photos to create fake profiles or deepfakes of journalists.',                                     icon: Eye,         severity: 'high'     },
  { title: 'Automated disinformation', description: 'AI-generated fake news, bot armies, and coordinated harassment campaigns targeting journalist credibility.',               icon: FileText,    severity: 'critical' },
  { title: 'De-anonymisation',         description: 'AI models correlating metadata, writing style, and public data to unmask anonymous journalists.',                          icon: Fingerprint, severity: 'critical' },
  { title: 'Content surveillance',     description: 'Governments using AI to scan and flag journalist content, communications, or sources.',                                    icon: ShieldAlert, severity: 'high'     },
];

const aiPrivacyTools = [
  { name: 'Ollama',             description: 'Run AI models locally on your computer — no data leaves your device, fully offline capable.',                   url: 'https://ollama.ai',                      platforms: ['Windows', 'macOS', 'Linux'],  badge: 'Fully local'  },
  { name: 'LM Studio',          description: 'Local AI interface — download and run open-source models without an internet connection.',                       url: 'https://lmstudio.ai',                    platforms: ['Windows', 'macOS', 'Linux'],  badge: 'Fully local'  },
  { name: 'DuckDuckGo AI Chat', description: 'No login required — conversations are not saved or used for training.',                                         url: 'https://duckduckgo.com/chat',            platforms: ['Web'],                        badge: 'Anonymous'    },
  { name: 'HuggingChat',        description: 'Open-source AI models with transparent data handling and EU-based hosting options.',                            url: 'https://huggingface.co/chat',            platforms: ['Web'],                        badge: 'Transparent'  },
];

const aiProtectionTools = [
  { name: 'Fawkes',               description: 'Subtly alters your photos to prevent AI facial recognition while remaining visually normal to humans.',       url: 'https://sandlab.cs.uchicago.edu/fawkes/', platforms: ['Windows', 'macOS', 'Linux'],  badge: 'Face protection'    },
  { name: 'Hive Moderation',      description: 'Detects deepfakes, synthetic media, and AI-generated content via a web API.',                                url: 'https://hivemoderation.com',              platforms: ['Web', 'API'],                badge: 'Deepfake detection' },
  { name: 'Reality Defender',     description: 'Deepfake detection platform — analyses audio, video, and images for AI manipulation.',                       url: 'https://realitydefender.com',             platforms: ['Web'],                       badge: 'Deepfake detection' },
  { name: 'Content Credentials',  description: 'C2PA-standard media watermarking to prove photo and video authenticity and provenance.',                     url: 'https://contentcredentials.org',          platforms: ['Web', 'Camera Tools'],       badge: 'Authenticity'       },
];

const sourceProtectionChapters = [
  {
    id: 'compartmentalization',
    label: 'Compartmentalize',
    icon: Eye,
    color: '#7B2E2E',
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
    label: 'First contact',
    icon: MessageSquare,
    color: '#8A6D2C',
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
    label: 'Meeting & handoff',
    icon: MapPin,
    color: '#34515E',
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
    label: 'After publication',
    icon: Shield,
    color: '#375E5A',
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
    label: 'Legal protections',
    icon: Scale,
    color: '#6B6253',
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

/* ─── Sub-components ─────────────────────────────────────────────────────── */

const ToolLedgerRow = ({ tool, index, color }) => {
  const p = priorityConfig[tool.priority] ?? priorityConfig['recommended'];
  return (
    <div className="news-ledger-row notebook-ledger-row">
      <span className="news-row-index" style={{ '--row-accent': color }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="news-card-title">{tool.name}</h3>
            <p className="news-card-copy mt-1">{tool.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tool.platforms.map((pl, i) => (
                <span key={i} className="news-chip">{pl}</span>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2.5 shrink-0 pt-0.5">
            <NewsBadge color={p.color} className="notebook-stamp whitespace-nowrap">{p.label}</NewsBadge>
            {tool.url && (
              <a href={tool.url} target="_blank" rel="noopener noreferrer"
                className="text-smoke hover:text-oxblood transition-colors mt-0.5"
                aria-label={`Open ${tool.name}`}>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const GenericLedgerRow = ({ tool, index, color, badgeLabel, badgeColor }) => (
  <div className="news-ledger-row notebook-ledger-row">
    <span className="news-row-index" style={{ '--row-accent': color }}>
      {String(index + 1).padStart(2, '0')}
    </span>
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="news-card-title">{tool.name}</h3>
          <p className="news-card-copy mt-1">{tool.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tool.platforms.map((pl, i) => (
              <span key={i} className="news-chip">{pl}</span>
            ))}
          </div>
        </div>
        <div className="flex items-start gap-2.5 shrink-0 pt-0.5">
          <NewsBadge color={badgeColor || color} className="notebook-stamp whitespace-nowrap">
            {badgeLabel || tool.badge}
          </NewsBadge>
          {tool.url && (
            <a href={tool.url} target="_blank" rel="noopener noreferrer"
              className="text-smoke hover:text-oxblood transition-colors mt-0.5"
              aria-label={`Open ${tool.name}`}>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  </div>
);

const WarningCard = ({ item }) => {
  const ItemIcon = item.icon;
  const accent = item.severity === 'critical' ? '#7B2E2E' : '#8A6D2C';
  return (
    <NewsCard className="notebook-card flex gap-3 items-start" accent={accent}>
      <ItemIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: accent }} />
      <div>
        <h3 className="news-card-title">{item.title}</h3>
        <p className="news-card-copy mt-1">{item.description}</p>
      </div>
    </NewsCard>
  );
};

/* ─── Page ───────────────────────────────────────────────────────────────── */

const Resources = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab]   = useState(() => searchParams.get('tab') || 'os-guides');
  const [selectedOS, setSelectedOS] = useState(() => searchParams.get('os') || 'windows');
  const [activeSourceChapter, setActiveSourceChapter] = useState(() => searchParams.get('chapter') || 'compartmentalization');

  const targetSection = searchParams.get('section');

  useEffect(() => {
    if (!targetSection || activeTab !== 'tools') return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`section-${targetSection}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
    return () => clearTimeout(timer);
  }, [targetSection, activeTab]);

  const tabs = [
    { id: 'os-guides',   label: 'OS Guides', desc: 'platform hardening',              icon: Monitor, accent: '#7B2E2E' },
    { id: 'tools',       label: 'Tools',     desc: 'vetted field kit',                icon: Wrench,  accent: '#8A6D2C' },
    { id: 'source-protection', label: 'Sources', desc: 'contact, meetings, publication', icon: Shield, accent: '#375E5A' },
    { id: 'ai-security', label: 'AI Safety', desc: 'threats and safer practice',      icon: Brain,   accent: '#15110C' },
  ];

  const currentOS = osGuides.find(o => o.id === selectedOS);
  const currentSourceChapter = sourceProtectionChapters.find((chapter) => chapter.id === activeSourceChapter) || sourceProtectionChapters[0];

  const [expandedStep, setExpandedStep] = useState(null);
  useEffect(() => setExpandedStep(null), [selectedOS]);

  return (
    <NewsPage className="resource-notebook">
      <div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="notebook-cover"
        >
          <div className="flex items-center gap-3 mb-4">
            <Book className="w-5 h-5 text-smoke" />
            <span className="eyebrow sm text-smoke">Field desk</span>
          </div>
          <h1 className="display text-4xl md:text-6xl leading-none">
            Field Manual<em className="italic-ox">.</em>
          </h1>
          <p className="mt-4 text-base md:text-lg text-ink-soft leading-relaxed max-w-[52ch]">
            Security guides, source-handling protocols, and field-ready tools for journalists. Start with operating-system hardening, then move into communications, storage, source contact, and AI-risk habits.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <NewsTabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} className="notebook-index" />
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── OS guides ──────────────────────────────────────────── */}
          {activeTab === 'os-guides' && (
            <motion.div
              key="os-guides"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <NewsSectionHeader
                className="notebook-section"
                kicker={`${currentOS.steps.length} steps`}
                title={currentOS.name}
                lede={currentOS.description}
                icon={currentOS.icon}
                accent={currentOS.color}
              />

              <div className="news-selector">
                {osGuides.map((os) => {
                  const Icon = os.icon;
                  return (
                    <button
                      key={os.id}
                      type="button"
                      onClick={() => setSelectedOS(os.id)}
                      className={`news-selector-button ${selectedOS === os.id ? 'is-active' : ''}`}
                      style={{ '--selector-accent': os.color }}
                    >
                      <Icon className="w-4 h-4" />
                      {os.name}
                    </button>
                  );
                })}
              </div>

              <div className="news-ledger notebook-ledger">
                {(() => { const StepIcon = currentOS.icon; return currentOS.steps.map((step, i) => {
                  const isExpanded = expandedStep === i;
                  return (
                    <div key={step.title}>
                      <button
                        type="button"
                        onClick={() => setExpandedStep(isExpanded ? null : i)}
                        aria-expanded={isExpanded}
                        className="news-ledger-row resource-step-row w-full text-left transition-colors hover:bg-paper-dim/40 group"
                        style={{ '--accent': currentOS.color }}
                      >
                        <span className="news-row-index" style={{ '--row-accent': currentOS.color }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="flex items-start justify-between gap-3 min-w-0">
                          <div className="min-w-0">
                            <h3 className="news-card-title">{step.title}</h3>
                            <p className="news-card-copy mt-1">{step.details}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 mt-0.5">
                            <motion.div
                              animate={isExpanded ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                            >
                              <StepIcon
                                className="resource-step-icon w-4 h-4 transition-colors text-smoke-dim"
                                style={isExpanded ? { color: currentOS.color } : {}}
                              />
                            </motion.div>
                            <ChevronDown
                              className="w-3.5 h-3.5 text-smoke transition-transform"
                              style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            />
                          </div>
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            key="mockup"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div className="border-t border-ink/8 bg-paper-soft/50 flex justify-center py-8">
                              <OSMockup osId={currentOS.id} step={step} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }); })()}
              </div>
            </motion.div>
          )}

          {/* ── Tools ──────────────────────────────────────────────── */}
          {activeTab === 'tools' && (
            <motion.div
              key="tools"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              {toolCategories.map((category, catIdx) => {
                const CatIcon = category.icon;
                return (
                  <section key={category.id} id={`section-${category.id}`} className={catIdx > 0 ? 'mt-12' : ''}>
                    <NewsSectionHeader
                      className="notebook-section"
                      kicker={`§ ${String(catIdx + 1).padStart(2, '0')} · ${category.tools.length} tools`}
                      title={category.name}
                      lede={category.description}
                      icon={CatIcon}
                      accent={category.color}
                    />
                    <div className="news-ledger notebook-ledger">
                      {category.tools.map((tool, i) => (
                        <ToolLedgerRow key={tool.name} tool={tool} index={i} color={category.color} />
                      ))}
                    </div>
                  </section>
                );
              })}

              <p className="border-t border-ink/15 pt-4 mt-12 text-xs leading-relaxed text-smoke">
                Always verify downloads from official sources. Keep software updated. Enable 2FA everywhere.
              </p>
            </motion.div>
          )}

          {/* ── Source protection ─────────────────────────────────── */}
          {activeTab === 'source-protection' && (
            <motion.div
              key="source-protection"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <NewsNotice tone="info" icon={ShieldAlert} className="notebook-warning">
                <h2 className="news-card-title">Pocket manual for source-facing work</h2>
                <p className="news-card-copy mt-1">
                  This section belongs in the reference desk: it is the slower, consultative layer for first contact, safer meetings, publication windows, and legal posture. For rehearsal under pressure, move into the Simulation Desk.
                </p>
              </NewsNotice>

              <NewsSectionHeader
                className="notebook-section"
                kicker={`§ ${String(sourceProtectionChapters.findIndex((chapter) => chapter.id === currentSourceChapter.id) + 1).padStart(2, '0')} · Pocket manual`}
                title={currentSourceChapter.label}
                lede={currentSourceChapter.brief}
                icon={currentSourceChapter.icon}
                accent={currentSourceChapter.color}
              />

              <div className="news-selector">
                {sourceProtectionChapters.map((chapter) => {
                  const Icon = chapter.icon;
                  return (
                    <button
                      key={chapter.id}
                      type="button"
                      onClick={() => setActiveSourceChapter(chapter.id)}
                      className={`news-selector-button ${activeSourceChapter === chapter.id ? 'is-active' : ''}`}
                      style={{ '--selector-accent': chapter.color }}
                    >
                      <Icon className="w-4 h-4" />
                      {chapter.label}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4 mt-4">
                {currentSourceChapter.cards.map((card) => (
                  <NewsCard key={card.title} accent={currentSourceChapter.color}>
                    <h3 className="news-card-title">{card.title}</h3>
                    <p className="news-card-copy mt-3 whitespace-pre-wrap">{card.body}</p>
                  </NewsCard>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5 mt-8">
                <NewsCard accent="#7B2E2E">
                  <h3 className="news-card-title">Practice the judgment layer</h3>
                  <p className="news-card-copy mt-3">
                    Once the manual feels familiar, use the simulations to test phishing response, safer source contact, and border-search choices with immediate consequence feedback.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link to="/simulations" className="inline-flex items-center gap-1.5 btn">
                      Open simulations
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to="/threat-model"
                      className="inline-flex items-center gap-1 eyebrow sm text-oxblood hover:text-ink transition-colors"
                    >
                      Build a threat model
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </NewsCard>

                <NewsCard accent="#8A6D2C">
                  <h3 className="news-card-title">Related tools in this library</h3>
                  <p className="news-card-copy mt-3">
                    The most relevant resources here are SecureDrop, Signal, Tor Browser, ProtonMail, and encrypted storage tools. They already live under the tools tab, which makes this merge cleaner than maintaining a separate manual page.
                  </p>
                </NewsCard>
              </div>
            </motion.div>
          )}

          {/* ── AI security ────────────────────────────────────────── */}
          {activeTab === 'ai-security' && (
            <motion.div
              key="ai-security"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <NewsNotice tone="danger" icon={ShieldAlert} className="notebook-warning">
                <h2 className="news-card-title text-oxblood">AI is not secure by default</h2>
                <p className="news-card-copy mt-1">
                  Commercial AI chatbots can log conversations, use them for model improvement, or expose them through legal demands and breaches.{' '}
                  <strong className="text-ink">Never input sensitive source information or unpublished findings.</strong>
                </p>
              </NewsNotice>

              {/* Never share */}
              <section>
                <NewsSectionHeader
                  className="notebook-section"
                  kicker={`§ 01 · ${aiNeverShare.length} entries`}
                  title="Never share with AI chatbots"
                  lede="Data you should never input into commercial AI systems."
                  icon={ShieldAlert}
                  accent="#7B2E2E"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {aiNeverShare.map((item) => (
                    <WarningCard key={item.title} item={item} />
                  ))}
                </div>
              </section>

              {/* AI threats */}
              <section className="mt-12">
                <NewsSectionHeader
                  className="notebook-section"
                  kicker={`§ 02 · ${aiThreats.length} entries`}
                  title="AI threats to journalists"
                  lede="Emerging AI-powered threats targeting press freedom."
                  icon={AlertTriangle}
                  accent="#8A6D2C"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {aiThreats.map((item) => (
                    <WarningCard key={item.title} item={item} />
                  ))}
                </div>
              </section>

              {/* Privacy-respecting AI tools */}
              <section className="mt-12">
                <NewsSectionHeader
                  className="notebook-section"
                  kicker={`§ 03 · ${aiPrivacyTools.length} tools`}
                  title="Privacy-respecting AI tools"
                  lede="AI assistants with better privacy guarantees."
                  icon={Lock}
                  accent="#4D5D35"
                />
                <div className="news-ledger notebook-ledger">
                  {aiPrivacyTools.map((tool, i) => (
                    <GenericLedgerRow key={tool.name} tool={tool} index={i} color="#4D5D35" />
                  ))}
                </div>
              </section>

              {/* Protection & detection */}
              <section className="mt-12">
                <NewsSectionHeader
                  className="notebook-section"
                  kicker={`§ 04 · ${aiProtectionTools.length} tools`}
                  title="Protection & Detection Tools"
                  lede="Protect yourself from AI surveillance and detect synthetic media."
                  icon={Shield}
                  accent="#34515E"
                />
                <div className="news-ledger notebook-ledger">
                  {aiProtectionTools.map((tool, i) => (
                    <GenericLedgerRow key={tool.name} tool={tool} index={i} color="#34515E" />
                  ))}
                </div>
              </section>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </NewsPage>
  );
};

export default Resources;
