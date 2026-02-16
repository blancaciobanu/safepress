import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor, Smartphone, Apple, Terminal, Shield,
  Brain, Wrench, MessageSquare,
  Radio, Mail, Globe, Lock, Key, ExternalLink, AlertTriangle,
  Eye, Mic, Camera, FileText, User, Fingerprint, ShieldAlert, Book,
} from 'lucide-react';
import { useState } from 'react';

const Resources = () => {
  const [activeTab, setActiveTab]   = useState('os-guides');
  const [selectedOS, setSelectedOS] = useState('windows');

  const tabs = [
    { id: 'os-guides',   label: 'OS Security Guides', desc: 'step-by-step hardening for every platform', icon: Monitor },
    { id: 'tools',       label: 'Recommended Tools',  desc: 'vetted apps for messaging, privacy & more', icon: Wrench  },
    { id: 'ai-security', label: 'AI Security',        desc: 'threats, safe tools & what never to share', icon: Brain   },
  ];

  /* ─── Data ──────────────────────────────────────────────────────────────── */

  const osGuides = [
    {
      id: 'windows',
      name: 'Windows',
      icon: Monitor,
      color: '#4361EE',
      description: 'Harden your Windows system for maximum security.',
      steps: [
        { title: 'Enable Windows Defender', details: 'Settings → Update & Security → Windows Security → Virus & threat protection' },
        { title: 'Turn on BitLocker encryption', details: 'Settings → Update & Security → Device encryption (Pro version required)' },
        { title: 'Enable firewall', details: 'Settings → Update & Security → Windows Security → Firewall & network protection' },
        { title: 'Disable unnecessary services', details: 'Services.msc → Disable Remote Desktop, Remote Registry, and other unused services' },
        { title: 'Use strong password + 2FA', details: 'Settings → Accounts → Sign-in options → Add Windows Hello or PIN' },
        { title: 'Keep Windows updated', details: 'Settings → Update & Security → Windows Update → Check for updates' },
        { title: 'Disable telemetry', details: 'Settings → Privacy → Diagnostics & feedback → Set to Basic' },
      ],
    },
    {
      id: 'macos',
      name: 'macOS',
      icon: Apple,
      color: '#A78BFA',
      description: "Secure your Mac with Apple's built-in tools.",
      steps: [
        { title: 'Enable FileVault encryption', details: 'System Settings → Privacy & Security → FileVault → Turn On FileVault' },
        { title: 'Turn on firewall', details: 'System Settings → Network → Firewall → Turn On' },
        { title: 'Disable automatic login', details: 'System Settings → Users & Groups → Login Options → Automatic login: Off' },
        { title: 'Require password immediately', details: 'System Settings → Lock Screen → Require password: Immediately' },
        { title: 'Enable Gatekeeper', details: 'System Settings → Privacy & Security → Allow apps from: App Store and identified developers' },
        { title: 'Disable location services for unused apps', details: 'System Settings → Privacy & Security → Location Services → review each app' },
        { title: 'Keep macOS updated', details: 'System Settings → General → Software Update → Install all updates' },
      ],
    },
    {
      id: 'linux',
      name: 'Linux',
      icon: Terminal,
      color: '#84CC16',
      description: 'Lock down your Linux distribution.',
      steps: [
        { title: 'Enable full disk encryption (LUKS)', details: 'During install, or: sudo cryptsetup luksFormat /dev/sdX' },
        { title: 'Configure UFW firewall', details: 'sudo ufw enable && sudo ufw default deny incoming' },
        { title: 'Disable root SSH login', details: 'sudo nano /etc/ssh/sshd_config → PermitRootLogin no' },
        { title: 'Set up automatic updates', details: 'sudo apt install unattended-upgrades (Debian/Ubuntu)' },
        { title: 'Use strong passwords', details: 'passwd → Set a strong password; consider PAM password policies' },
        { title: 'Install fail2ban', details: 'sudo apt install fail2ban — protects against brute-force attacks' },
        { title: 'Harden SSH config', details: 'Disable password auth, use SSH keys only: PasswordAuthentication no' },
      ],
    },
    {
      id: 'ios',
      name: 'iOS',
      icon: Smartphone,
      color: '#2DD4BF',
      description: 'Maximise privacy on your iPhone or iPad.',
      steps: [
        { title: 'Enable Face ID / Touch ID', details: 'Settings → Face ID & Passcode → Turn on for all features' },
        { title: 'Use a strong alphanumeric passcode', details: 'Settings → Face ID & Passcode → Change Passcode → Custom Alphanumeric Code' },
        { title: 'Enable Find My iPhone', details: 'Settings → [Your Name] → Find My → Find My iPhone → On' },
        { title: 'Disable lock screen previews', details: 'Settings → Face ID & Passcode → Disable Today View and Notification Center on lock screen' },
        { title: 'Turn off cross-app tracking', details: 'Settings → Privacy → Tracking → Ask Apps Not to Track' },
        { title: 'Enable Advanced Data Protection', details: 'Settings → [Your Name] → iCloud → Advanced Data Protection → Turn On' },
        { title: 'Review app permissions', details: 'Settings → Privacy → check Location, Camera, and Microphone for each app' },
      ],
    },
    {
      id: 'android',
      name: 'Android',
      icon: Smartphone,
      color: '#4CAF50',
      description: 'Harden your Android device security.',
      steps: [
        { title: 'Enable device encryption', details: 'Settings → Security → Encryption → Encrypt phone (usually on by default)' },
        { title: 'Use a strong PIN or password', details: 'Settings → Security → Screen lock → Password (alphanumeric)' },
        { title: 'Enable Find My Device', details: 'Settings → Security → Find My Device → Turn on' },
        { title: 'Hide sensitive lock screen notifications', details: 'Settings → Lock screen → Notifications → Hide sensitive content' },
        { title: 'Disable location history', details: 'Settings → Location → Google Location History → Turn off' },
        { title: 'Install apps from Play Store only', details: 'Settings → Security → Unknown sources → Disable' },
        { title: 'Review app permissions', details: 'Settings → Apps → Permission manager → Review all permissions' },
      ],
    },
  ];

  const toolCategories = [
    {
      id: 'messaging',
      name: 'Secure Messaging',
      icon: MessageSquare,
      color: 'from-teal-500 to-teal-600',
      description: 'End-to-end encrypted communication tools.',
      tools: [
        { name: 'Signal',          description: 'The gold standard for secure messaging — end-to-end encrypted calls, messages, and file sharing.',               url: 'https://signal.org',         priority: 'essential',   platforms: ['iOS', 'Android', 'Windows', 'macOS', 'Linux'] },
        { name: 'Session',         description: 'Decentralised messenger requiring no phone number — routes traffic through an onion network.',                    url: 'https://getsession.org',     priority: 'high-threat', platforms: ['iOS', 'Android', 'Windows', 'macOS', 'Linux'] },
        { name: 'Element / Matrix', description: 'Federated messaging for team collaboration with end-to-end encryption.',                                        url: 'https://element.io',         priority: 'recommended', platforms: ['iOS', 'Android', 'Web', 'Windows', 'macOS', 'Linux'] },
      ],
    },
    {
      id: 'offline',
      name: 'Offline & Blackout Comms',
      icon: Radio,
      color: 'from-purple-500 to-purple-600',
      description: 'Peer-to-peer communication without internet.',
      tools: [
        { name: 'Bridgefy', description: 'Bluetooth mesh networking — works when cellular and Wi-Fi networks are down.',           url: 'https://bridgefy.me',        priority: 'emergency',    platforms: ['iOS', 'Android'] },
        { name: 'Briar',    description: 'P2P messaging via Wi-Fi or Bluetooth — designed for activists and journalists.',        url: 'https://briarproject.org',   priority: 'high-threat',  platforms: ['Android'] },
        { name: 'Berty',    description: 'P2P messenger using Bluetooth LE and Wi-Fi Direct — works fully offline.',             url: 'https://berty.tech',         priority: 'experimental', platforms: ['iOS', 'Android'] },
      ],
    },
    {
      id: 'email',
      name: 'Secure Email & File Transfer',
      icon: Mail,
      color: 'from-blue-500 to-blue-600',
      description: 'Encrypted email and anonymous document submission.',
      tools: [
        { name: 'ProtonMail',  description: 'End-to-end encrypted email — Swiss-based with strong privacy laws.',                           url: 'https://proton.me',          priority: 'essential',          platforms: ['Web', 'iOS', 'Android'] },
        { name: 'Tuta',        description: 'Encrypted email with automatic encryption and no phone number required.',                      url: 'https://tuta.com',           priority: 'recommended',        platforms: ['Web', 'iOS', 'Android', 'Windows', 'macOS', 'Linux'] },
        { name: 'SecureDrop',  description: 'Anonymous whistleblower submission system — the standard for secure document leaks.',          url: 'https://securedrop.org',     priority: 'source-protection',  platforms: ['Web (Tor)'] },
      ],
    },
    {
      id: 'browser',
      name: 'Browser Privacy',
      icon: Globe,
      color: 'from-indigo-500 to-indigo-600',
      description: 'Anonymous browsing and tracker blocking.',
      tools: [
        { name: 'Tor Browser',    description: 'Routes all traffic through the Tor network — essential for sensitive research.',       url: 'https://www.torproject.org', priority: 'essential', platforms: ['Windows', 'macOS', 'Linux', 'Android'] },
        { name: 'uBlock Origin',  description: 'Advanced ad and tracker blocker — stops malicious scripts and fingerprinting.',       url: 'https://ublockorigin.com',   priority: 'essential', platforms: ['Browser Extension'] },
        { name: 'NoScript',       description: 'JavaScript blocker — prevents malicious scripts from executing.',                     url: 'https://noscript.net',       priority: 'advanced',  platforms: ['Browser Extension'] },
      ],
    },
    {
      id: 'encryption',
      name: 'Encryption & Containers',
      icon: Lock,
      color: 'from-crimson-500 to-crimson-600',
      description: 'Encrypt files, folders, and entire drives.',
      tools: [
        { name: 'VeraCrypt',    description: 'Create encrypted containers — open-source disk encryption for any platform.',          url: 'https://www.veracrypt.fr',   priority: 'recommended', platforms: ['Windows', 'macOS', 'Linux'] },
        { name: 'Cryptomator', description: 'Encrypts files before uploading to cloud storage — transparent and easy to use.',       url: 'https://cryptomator.org',    priority: 'essential',   platforms: ['Windows', 'macOS', 'Linux', 'iOS', 'Android'] },
        { name: 'Tails OS',    description: 'Live operating system that leaves no trace and routes all traffic through Tor.',        url: 'https://tails.boum.org',     priority: 'high-threat', platforms: ['USB Drive (Live OS)'] },
      ],
    },
    {
      id: 'passwords',
      name: 'Passwords & 2FA',
      icon: Key,
      color: 'from-olive-500 to-olive-600',
      description: 'Password management and two-factor authentication.',
      tools: [
        { name: 'Bitwarden',              description: 'Open-source password manager — encrypted vault with cross-platform sync.',           url: 'https://bitwarden.com',      priority: 'essential',   platforms: ['Web', 'iOS', 'Android', 'Windows', 'macOS', 'Linux', 'Browser Extension'] },
        { name: '1Password',              description: 'Premium password manager with excellent UX, secure vaults, and family sharing.',     url: 'https://1password.com',      priority: 'recommended', platforms: ['Web', 'iOS', 'Android', 'Windows', 'macOS', 'Linux'] },
        { name: 'Authy / Google Auth',    description: 'Time-based one-time password (TOTP) 2FA app — much safer than SMS codes.',          url: null,                         priority: 'essential',   platforms: ['iOS', 'Android'] },
        { name: 'YubiKey',                description: 'Hardware security key — the most secure form of two-factor authentication.',        url: 'https://www.yubico.com',     priority: 'high-threat', platforms: ['Physical Device'] },
      ],
    },
  ];

  const aiSecurityCategories = [
    {
      id: 'never-share',
      name: 'Never share with AI chatbots',
      icon: ShieldAlert,
      color: 'from-crimson-500 to-crimson-600',
      description: 'Data you should never input into commercial AI systems.',
      items: [
        { title: 'Source identities',           description: 'Real names, contact info, or identifying details of confidential sources — AI companies may log this data.',               icon: User,        severity: 'critical' },
        { title: 'Unpublished findings',         description: 'Drafts, investigation notes, or unreleased stories — could be exposed via AI training pipelines or data breaches.',       icon: FileText,    severity: 'critical' },
        { title: 'Personal identifiable info',  description: 'Passport numbers, addresses, phone numbers, or email addresses of yourself or your sources.',                             icon: Fingerprint, severity: 'critical' },
        { title: 'Location data',               description: 'Exact coordinates, safe house addresses, or movement patterns of you or any source.',                                     icon: Eye,         severity: 'high'     },
        { title: 'Sensitive media',             description: 'Photos or videos that could identify sources or reveal sensitive locations before publication.',                           icon: Camera,      severity: 'critical' },
        { title: 'Confidential audio',          description: 'Interview recordings or voice notes containing identifiable voices or unreleased information.',                            icon: Mic,         severity: 'high'     },
      ],
    },
    {
      id: 'ai-threats',
      name: 'AI threats to journalists',
      icon: AlertTriangle,
      color: 'from-amber-500 to-amber-600',
      description: 'Emerging AI-powered threats targeting press freedom.',
      items: [
        { title: 'Deepfake videos',          description: 'AI-generated fake videos used to discredit journalists or fabricate statements.',                                           icon: Camera,      severity: 'critical' },
        { title: 'Voice cloning',            description: 'Synthetic voice generation used to impersonate journalists or extract information from sources.',                           icon: Mic,         severity: 'high'     },
        { title: 'Identity theft via AI',   description: 'AI scraping social media photos to create fake profiles or deepfakes of journalists.',                                      icon: Eye,         severity: 'high'     },
        { title: 'Automated disinformation', description: 'AI-generated fake news, bot armies, and coordinated harassment campaigns targeting journalist credibility.',                icon: FileText,    severity: 'critical' },
        { title: 'De-anonymisation',         description: 'AI models correlating metadata, writing style, and public data to unmask anonymous journalists.',                          icon: Fingerprint, severity: 'critical' },
        { title: 'Content surveillance',     description: 'Governments using AI to scan and flag journalist content, communications, or sources.',                                    icon: ShieldAlert, severity: 'high'     },
      ],
    },
    {
      id: 'safer-ai',
      name: 'Privacy-respecting AI tools',
      icon: Lock,
      color: 'from-olive-500 to-olive-600',
      description: 'AI assistants with better privacy guarantees.',
      tools: [
        { name: 'Ollama',            description: 'Run AI models locally on your computer — no data leaves your device, fully offline capable.',                   url: 'https://ollama.ai',                          platforms: ['Windows', 'macOS', 'Linux'],  privacy: 'fully local'  },
        { name: 'LM Studio',         description: 'Local AI interface — download and run open-source models without an internet connection.',                       url: 'https://lmstudio.ai',                        platforms: ['Windows', 'macOS', 'Linux'],  privacy: 'fully local'  },
        { name: 'DuckDuckGo AI Chat', description: 'No login required — conversations are not saved or used for training.',                                        url: 'https://duckduckgo.com/chat',                platforms: ['Web'],                        privacy: 'anonymous'    },
        { name: 'HuggingChat',       description: 'Open-source AI models with transparent data handling and EU-based hosting options.',                            url: 'https://huggingface.co/chat',                platforms: ['Web'],                        privacy: 'transparent'  },
      ],
    },
    {
      id: 'protection',
      name: 'Protection & Detection Tools',
      icon: Shield,
      color: 'from-midnight-400 to-midnight-500',
      description: 'Protect yourself from AI surveillance and detect synthetic media.',
      tools: [
        { name: 'Fawkes',             description: 'Subtly alters your photos to prevent AI facial recognition while remaining visually normal to humans.',        url: 'https://sandlab.cs.uchicago.edu/fawkes/', platforms: ['Windows', 'macOS', 'Linux'],  use: 'face protection'    },
        { name: 'Hive Moderation',    description: 'Detects deepfakes, synthetic media, and AI-generated content via a web API.',                                 url: 'https://hivemoderation.com',              platforms: ['Web', 'API'],                use: 'deepfake detection' },
        { name: 'Reality Defender',   description: 'Deepfake detection platform — analyses audio, video, and images for AI manipulation.',                        url: 'https://realitydefender.com',             platforms: ['Web'],                       use: 'deepfake detection' },
        { name: 'Content Credentials', description: 'C2PA-standard media watermarking to prove photo and video authenticity and provenance.',                     url: 'https://contentcredentials.org',          platforms: ['Web', 'Camera Tools'],       use: 'authenticity'       },
      ],
    },
  ];

  const currentOS = osGuides.find(o => o.id === selectedOS);

  /* ─── Render ─────────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen pt-32 pb-24 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-midnight-400/10 border border-midnight-400/20 mb-5">
            <Book className="w-7 h-7 text-midnight-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 lowercase">
            resources
          </h1>
          <p className="text-base text-gray-500 lowercase max-w-md mx-auto leading-relaxed"
            style={{ letterSpacing: '0.03em' }}>
            security guides and tools, built for journalists
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12"
        >
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all text-center ${
                  active
                    ? 'bg-midnight-400/10 border-midnight-400/20 text-white'
                    : 'bg-white/[0.02] border-white/[0.07] text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  active ? 'bg-midnight-400/20' : 'bg-white/[0.05]'
                }`}>
                  <Icon className={`w-5 h-5 ${active ? 'text-midnight-400' : ''}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold lowercase leading-tight">{tab.label}</p>
                  <p className={`text-[11px] mt-0.5 lowercase leading-snug ${active ? 'text-gray-400' : 'text-gray-600'}`}>
                    {tab.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">

          {/* ── OS Security Guides ── */}
          {activeTab === 'os-guides' && (
            <motion.div
              key="os-guides"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              {/* OS selector */}
              <div className="flex flex-wrap gap-2 mb-8">
                {osGuides.map(os => {
                  const Icon = os.icon;
                  const active = selectedOS === os.id;
                  return (
                    <button
                      key={os.id}
                      onClick={() => setSelectedOS(os.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border lowercase"
                      style={active ? {
                        backgroundColor: `${os.color}18`,
                        borderColor: `${os.color}40`,
                        color: os.color,
                      } : {
                        borderColor: 'transparent',
                        color: '#6b7280',
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      {os.name}
                    </button>
                  );
                })}
              </div>

              {/* Steps for selected OS */}
              <p className="text-sm text-gray-500 mb-6 lowercase">{currentOS.description}</p>
              <div className="space-y-3">
                {currentOS.steps.map((step, i) => (
                  <div
                    key={i}
                    className="glass-card p-5 flex gap-4 items-start border-l-4"
                    style={{ borderLeftColor: `${currentOS.color}60` }}
                  >
                    <span
                      className="flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor: `${currentOS.color}15`,
                        borderColor: `${currentOS.color}35`,
                        color: currentOS.color,
                      }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1 lowercase">{step.title}</h4>
                      <p className="text-sm text-gray-400 leading-relaxed">{step.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Recommended Tools ── */}
          {activeTab === 'tools' && (
            <motion.div
              key="tools"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-12"
            >
              {toolCategories.map((category) => {
                const CategoryIcon = category.icon;
                return (
                  <div key={category.id}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0`}>
                        <CategoryIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-0.5">category</p>
                        <h2 className="text-sm font-semibold text-white lowercase">{category.name}</h2>
                        <p className="text-xs text-gray-500 lowercase">{category.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.tools.map((tool, i) => (
                        <ToolCard key={i} tool={tool} />
                      ))}
                    </div>
                  </div>
                );
              })}

              <p className="text-xs text-gray-600 pt-4 border-t border-white/5">
                Always verify downloads from official sources · Keep software updated · Enable 2FA everywhere
              </p>
            </motion.div>
          )}

          {/* ── AI Security ── */}
          {activeTab === 'ai-security' && (
            <motion.div
              key="ai-security"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-10"
            >
              {/* Warning banner */}
              <div className="glass-card p-5 border-l-4 border-crimson-500 flex gap-4 items-start">
                <ShieldAlert className="w-5 h-5 text-crimson-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-crimson-400 mb-1 text-sm">
                    AI is not secure by default
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Commercial AI chatbots (ChatGPT, Gemini, etc.) log your conversations, may use them for model training, and can be subpoenaed by governments.{' '}
                    <span className="text-white font-medium">Never input sensitive source information or unpublished findings.</span>
                  </p>
                </div>
              </div>

              {aiSecurityCategories.map((category) => {
                const CategoryIcon = category.icon;
                return (
                  <div key={category.id}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0`}>
                        <CategoryIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-0.5">category</p>
                        <h2 className="text-sm font-semibold text-white lowercase">{category.name}</h2>
                        <p className="text-xs text-gray-500 lowercase">{category.description}</p>
                      </div>
                    </div>

                    {category.items && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {category.items.map((item, i) => {
                          const ItemIcon = item.icon;
                          return (
                            <div
                              key={i}
                              className={`glass-card p-4 border-l-4 flex gap-3 items-start ${
                                item.severity === 'critical' ? 'border-l-crimson-500' : 'border-l-amber-500'
                              }`}
                            >
                              <ItemIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {category.tools && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {category.tools.map((tool, i) => (
                          <AIToolCard key={i} tool={tool} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

/* ─── Tool card (recommended tools tab) ─────────────────────────────────── */

const priorityConfig = {
  'essential':         { label: 'Essential',         cls: 'bg-teal-500/10 text-teal-400 border-teal-500/20'           },
  'recommended':       { label: 'Recommended',       cls: 'bg-midnight-400/10 text-midnight-300 border-midnight-400/20' },
  'high-threat':       { label: 'High-threat',       cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20'         },
  'source-protection': { label: 'Source protection', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20'      },
  'emergency':         { label: 'Emergency',         cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20'      },
  'advanced':          { label: 'Advanced',          cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20'            },
  'experimental':      { label: 'Experimental',      cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20'            },
};

const ToolCard = ({ tool }) => {
  const p = priorityConfig[tool.priority] ?? priorityConfig['recommended'];
  return (
    <div className="glass-card p-4 flex flex-col gap-3 hover:border-white/15 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-white text-sm">{tool.name}</span>
        {tool.url && (
          <a href={tool.url} target="_blank" rel="noopener noreferrer"
            className="text-gray-600 hover:text-midnight-400 transition-colors flex-shrink-0">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
      <p className="text-xs text-gray-400 leading-relaxed flex-1">{tool.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {tool.platforms.map((pl, i) => (
          <span key={i} className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/8 rounded text-gray-500">
            {pl}
          </span>
        ))}
      </div>
      <span className={`self-start text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${p.cls}`}>
        {p.label}
      </span>
    </div>
  );
};

/* ─── AI tool card (AI security tab) ────────────────────────────────────── */

const privacyConfig = {
  'fully local': { label: 'Fully local',  cls: 'bg-teal-500/10 text-teal-400 border-teal-500/20'             },
  'anonymous':   { label: 'Anonymous',    cls: 'bg-midnight-400/10 text-midnight-300 border-midnight-400/20'  },
  'transparent': { label: 'Transparent',  cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20'              },
  'commercial':  { label: 'Commercial',   cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20'           },
};

const useConfig = {
  'face protection':    { label: 'Face protection',    cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20'  },
  'deepfake detection': { label: 'Deepfake detection', cls: 'bg-crimson-500/10 text-crimson-400 border-crimson-500/20' },
  'authenticity':       { label: 'Authenticity',       cls: 'bg-teal-500/10 text-teal-400 border-teal-500/20'        },
};

const AIToolCard = ({ tool }) => {
  const badge = tool.privacy ? privacyConfig[tool.privacy]
              : tool.use     ? useConfig[tool.use]
              : null;
  return (
    <div className="glass-card p-4 flex flex-col gap-3 hover:border-white/15 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-white text-sm">{tool.name}</span>
        {tool.url && (
          <a href={tool.url} target="_blank" rel="noopener noreferrer"
            className="text-gray-600 hover:text-midnight-400 transition-colors flex-shrink-0">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
      <p className="text-xs text-gray-400 leading-relaxed flex-1">{tool.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {tool.platforms.map((pl, i) => (
          <span key={i} className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/8 rounded text-gray-500">
            {pl}
          </span>
        ))}
      </div>
      {badge && (
        <span className={`self-start text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${badge.cls}`}>
          {badge.label}
        </span>
      )}
    </div>
  );
};

export default Resources;
