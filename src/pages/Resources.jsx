import { motion } from 'framer-motion';
import {
  Monitor, Smartphone, Apple, Terminal, Shield, ChevronDown,
  CheckCircle2, Circle, Book, Brain, Wrench, MessageSquare,
  Radio, Mail, Globe, Lock, Key, ExternalLink, AlertTriangle,
  Eye, Mic, Camera, FileText, User, Fingerprint, ShieldAlert, Filter
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Resources = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('os-guides');
  const [expandedOS, setExpandedOS] = useState(null);
  const [viewMode, setViewMode] = useState('personalized'); // 'personalized' or 'all'

  // Get user's risk level (default to 'medium' if not taken quiz yet)
  const userRiskLevel = user?.riskLevel || 'medium';

  const tabs = [
    { id: 'os-guides', name: 'os security guides', icon: Monitor },
    { id: 'tools', name: 'recommended tools', icon: Wrench },
    { id: 'ai-security', name: 'ai security', icon: Brain },
  ];

  const osGuides = [
    {
      id: 'windows',
      name: 'windows',
      icon: Monitor,
      color: 'from-blue-500 to-blue-600',
      description: 'harden your windows system for maximum security',
      steps: [
        {
          title: 'enable windows defender',
          details: 'Settings → Update & Security → Windows Security → Virus & threat protection',
          completed: false
        },
        {
          title: 'turn on bitlocker encryption',
          details: 'Settings → Update & Security → Device encryption (Pro version required)',
          completed: false
        },
        {
          title: 'enable firewall',
          details: 'Settings → Update & Security → Windows Security → Firewall & network protection',
          completed: false
        },
        {
          title: 'disable unnecessary services',
          details: 'Services.msc → Disable Remote Desktop, Remote Registry, and other unused services',
          completed: false
        },
        {
          title: 'use strong password + 2FA',
          details: 'Settings → Accounts → Sign-in options → Add Windows Hello or PIN',
          completed: false
        },
        {
          title: 'keep windows updated',
          details: 'Settings → Update & Security → Windows Update → Check for updates',
          completed: false
        },
        {
          title: 'disable telemetry',
          details: 'Settings → Privacy → Diagnostics & feedback → Set to Basic',
          completed: false
        }
      ]
    },
    {
      id: 'macos',
      name: 'macOS',
      icon: Apple,
      color: 'from-gray-500 to-gray-600',
      description: 'secure your mac with apple\'s built-in tools',
      steps: [
        {
          title: 'enable filevault encryption',
          details: 'System Settings → Privacy & Security → FileVault → Turn On FileVault',
          completed: false
        },
        {
          title: 'turn on firewall',
          details: 'System Settings → Network → Firewall → Turn On',
          completed: false
        },
        {
          title: 'disable automatic login',
          details: 'System Settings → Users & Groups → Login Options → Automatic login: Off',
          completed: false
        },
        {
          title: 'require password immediately',
          details: 'System Settings → Lock Screen → Require password: Immediately',
          completed: false
        },
        {
          title: 'enable gatekeeper',
          details: 'System Settings → Privacy & Security → Allow apps from: App Store and identified developers',
          completed: false
        },
        {
          title: 'disable location services',
          details: 'System Settings → Privacy & Security → Location Services → Disable for unused apps',
          completed: false
        },
        {
          title: 'keep macos updated',
          details: 'System Settings → General → Software Update → Install all updates',
          completed: false
        }
      ]
    },
    {
      id: 'linux',
      name: 'linux',
      icon: Terminal,
      color: 'from-orange-500 to-orange-600',
      description: 'lock down your linux distribution',
      steps: [
        {
          title: 'enable full disk encryption (LUKS)',
          details: 'During install or: sudo cryptsetup luksFormat /dev/sdX',
          completed: false
        },
        {
          title: 'configure ufw firewall',
          details: 'sudo ufw enable && sudo ufw default deny incoming',
          completed: false
        },
        {
          title: 'disable root login',
          details: 'sudo nano /etc/ssh/sshd_config → PermitRootLogin no',
          completed: false
        },
        {
          title: 'setup automatic updates',
          details: 'sudo apt install unattended-upgrades (Debian/Ubuntu)',
          completed: false
        },
        {
          title: 'use strong passwords',
          details: 'passwd → Set strong password, consider using PAM password policies',
          completed: false
        },
        {
          title: 'install fail2ban',
          details: 'sudo apt install fail2ban → Protects against brute force attacks',
          completed: false
        },
        {
          title: 'harden ssh config',
          details: 'Disable password auth, use SSH keys only: PasswordAuthentication no',
          completed: false
        }
      ]
    },
    {
      id: 'ios',
      name: 'iOS',
      icon: Smartphone,
      color: 'from-cyan-500 to-cyan-600',
      description: 'maximize privacy on your iphone/ipad',
      steps: [
        {
          title: 'enable face id / touch id',
          details: 'Settings → Face ID & Passcode → Turn on for all features',
          completed: false
        },
        {
          title: 'use strong alphanumeric passcode',
          details: 'Settings → Face ID & Passcode → Change Passcode → Custom Alphanumeric Code',
          completed: false
        },
        {
          title: 'enable find my iphone',
          details: 'Settings → [Your Name] → Find My → Find My iPhone → On',
          completed: false
        },
        {
          title: 'disable lock screen features',
          details: 'Settings → Face ID & Passcode → Disable Today View, Notification Center on lock screen',
          completed: false
        },
        {
          title: 'turn off tracking',
          details: 'Settings → Privacy → Tracking → Ask Apps Not to Track',
          completed: false
        },
        {
          title: 'use advanced data protection',
          details: 'Settings → [Your Name] → iCloud → Advanced Data Protection → Turn On',
          completed: false
        },
        {
          title: 'review app permissions',
          details: 'Settings → Privacy → Check Location, Camera, Microphone permissions',
          completed: false
        }
      ]
    },
    {
      id: 'android',
      name: 'android',
      icon: Smartphone,
      color: 'from-green-500 to-green-600',
      description: 'harden your android device security',
      steps: [
        {
          title: 'enable device encryption',
          details: 'Settings → Security → Encryption → Encrypt phone (usually enabled by default)',
          completed: false
        },
        {
          title: 'use strong pin/password',
          details: 'Settings → Security → Screen lock → Password (alphanumeric)',
          completed: false
        },
        {
          title: 'enable find my device',
          details: 'Settings → Security → Find My Device → Turn on',
          completed: false
        },
        {
          title: 'disable lock screen notifications',
          details: 'Settings → Lock screen → Notifications → Hide sensitive content',
          completed: false
        },
        {
          title: 'disable location history',
          details: 'Settings → Location → Google Location History → Turn off',
          completed: false
        },
        {
          title: 'install from play store only',
          details: 'Settings → Security → Unknown sources → Disable',
          completed: false
        },
        {
          title: 'review app permissions',
          details: 'Settings → Apps → Permission manager → Review all permissions',
          completed: false
        }
      ]
    }
  ];

  const toolCategories = [
    {
      id: 'messaging',
      name: 'secure messaging',
      icon: MessageSquare,
      color: 'from-teal-500 to-teal-600',
      description: 'end-to-end encrypted communication tools',
      tools: [
        {
          name: 'Signal',
          description: 'primary secure messaging app - end-to-end encrypted calls, messages, and file sharing',
          url: 'https://signal.org',
          priority: 'essential',
          platforms: ['iOS', 'Android', 'Windows', 'macOS', 'Linux'],
          minRiskLevel: 'low' // Show to everyone
        },
        {
          name: 'Session',
          description: 'decentralized messenger - no phone number required, routes through onion network',
          url: 'https://getsession.org',
          priority: 'high-threat',
          platforms: ['iOS', 'Android', 'Windows', 'macOS', 'Linux'],
          minRiskLevel: 'high' // High-risk and above
        },
        {
          name: 'Element / Matrix',
          description: 'federated messaging - great for team collaboration with E2E encryption',
          url: 'https://element.io',
          priority: 'recommended',
          platforms: ['iOS', 'Android', 'Web', 'Windows', 'macOS', 'Linux'],
          minRiskLevel: 'medium' // Medium-risk and above
        }
      ]
    },
    {
      id: 'offline',
      name: 'offline & blackout comms',
      icon: Radio,
      color: 'from-purple-500 to-purple-600',
      description: 'peer-to-peer communication without internet',
      tools: [
        {
          name: 'Bridgefy',
          description: 'bluetooth mesh networking - works when cell/wifi networks are down',
          url: 'https://bridgefy.me',
          priority: 'emergency',
          platforms: ['iOS', 'Android'],
          minRiskLevel: 'high' // Emergency/blackout scenarios
        },
        {
          name: 'Briar',
          description: 'p2p messaging via wifi/bluetooth - designed for activists and journalists',
          url: 'https://briarproject.org',
          priority: 'high-threat',
          platforms: ['Android'],
          minRiskLevel: 'high' // High-threat environments
        },
        {
          name: 'Berty',
          description: 'p2p messenger using bluetooth LE and wifi direct - works offline',
          url: 'https://berty.tech',
          priority: 'experimental',
          platforms: ['iOS', 'Android'],
          minRiskLevel: 'high' // Experimental, for high-risk users
        }
      ]
    },
    {
      id: 'email',
      name: 'secure email & file transfer',
      icon: Mail,
      color: 'from-blue-500 to-blue-600',
      description: 'encrypted email and anonymous file sharing',
      tools: [
        {
          name: 'ProtonMail',
          description: 'end-to-end encrypted email - based in Switzerland with strong privacy laws',
          url: 'https://proton.me',
          priority: 'essential',
          platforms: ['Web', 'iOS', 'Android'],
          minRiskLevel: 'low' // Essential for all
        },
        {
          name: 'Tutanota',
          description: 'encrypted email service - automatic encryption, no phone number required',
          url: 'https://tutanota.com',
          priority: 'recommended',
          platforms: ['Web', 'iOS', 'Android', 'Windows', 'macOS', 'Linux'],
          minRiskLevel: 'medium' // Alternative secure email
        },
        {
          name: 'SecureDrop',
          description: 'anonymous whistleblower submission system - for secure document leaks',
          url: 'https://securedrop.org',
          priority: 'source-protection',
          platforms: ['Web (Tor)'],
          minRiskLevel: 'high' // Source protection critical
        }
      ]
    },
    {
      id: 'browser',
      name: 'browser privacy',
      icon: Globe,
      color: 'from-indigo-500 to-indigo-600',
      description: 'anonymous browsing and tracker blocking',
      tools: [
        {
          name: 'Tor Browser',
          description: 'anonymity browser - routes traffic through tor network, essential for research',
          url: 'https://www.torproject.org',
          priority: 'essential',
          platforms: ['Windows', 'macOS', 'Linux', 'Android'],
          minRiskLevel: 'low' // Essential for all journalists
        },
        {
          name: 'uBlock Origin',
          description: 'advanced ad/tracker blocker - blocks malicious scripts and trackers',
          url: 'https://ublockorigin.com',
          priority: 'essential',
          platforms: ['Browser Extension'],
          minRiskLevel: 'low' // Essential for all
        },
        {
          name: 'NoScript',
          description: 'javascript blocker - prevents malicious scripts from running',
          url: 'https://noscript.net',
          priority: 'advanced',
          platforms: ['Browser Extension'],
          minRiskLevel: 'medium' // Advanced users
        }
      ]
    },
    {
      id: 'encryption',
      name: 'encryption & containers',
      icon: Lock,
      color: 'from-crimson-500 to-crimson-600',
      description: 'encrypt files, folders, and entire drives',
      tools: [
        {
          name: 'VeraCrypt',
          description: 'create encrypted containers - open-source disk encryption',
          url: 'https://www.veracrypt.fr',
          priority: 'recommended',
          platforms: ['Windows', 'macOS', 'Linux'],
          minRiskLevel: 'medium' // For sensitive file storage
        },
        {
          name: 'Cryptomator',
          description: 'cloud storage encryption - encrypts files before uploading to cloud',
          url: 'https://cryptomator.org',
          priority: 'essential',
          platforms: ['Windows', 'macOS', 'Linux', 'iOS', 'Android'],
          minRiskLevel: 'low' // Essential for cloud users
        },
        {
          name: 'BitLocker',
          description: 'full disk encryption for windows - built into windows pro',
          url: null,
          priority: 'essential',
          platforms: ['Windows'],
          minRiskLevel: 'low' // Essential disk encryption
        },
        {
          name: 'FileVault',
          description: 'full disk encryption for mac - built into macOS',
          url: null,
          priority: 'essential',
          platforms: ['macOS'],
          minRiskLevel: 'low' // Essential disk encryption
        },
        {
          name: 'Tails OS',
          description: 'live operating system - leaves no trace, routes through tor',
          url: 'https://tails.boum.org',
          priority: 'high-threat',
          platforms: ['USB Drive (Live OS)'],
          minRiskLevel: 'high' // High-threat environments only
        }
      ]
    },
    {
      id: 'essentials',
      name: 'password & 2FA',
      icon: Key,
      color: 'from-olive-500 to-olive-600',
      description: 'password management and two-factor authentication',
      tools: [
        {
          name: 'Bitwarden',
          description: 'open-source password manager - encrypted vault, cross-platform sync',
          url: 'https://bitwarden.com',
          priority: 'essential',
          platforms: ['Web', 'iOS', 'Android', 'Windows', 'macOS', 'Linux', 'Browser Extension'],
          minRiskLevel: 'low' // Essential for everyone
        },
        {
          name: '1Password',
          description: 'premium password manager - excellent UX, secure vaults, family sharing',
          url: 'https://1password.com',
          priority: 'recommended',
          platforms: ['Web', 'iOS', 'Android', 'Windows', 'macOS', 'Linux'],
          minRiskLevel: 'low' // Alternative password manager
        },
        {
          name: 'Google Authenticator',
          description: '2FA app - time-based one-time passwords (not SMS!)',
          url: null,
          priority: 'essential',
          platforms: ['iOS', 'Android'],
          minRiskLevel: 'low' // Essential 2FA
        },
        {
          name: 'Microsoft Authenticator',
          description: '2FA app with backup - alternative to google auth with cloud sync',
          url: null,
          priority: 'recommended',
          platforms: ['iOS', 'Android'],
          minRiskLevel: 'low' // Alternative 2FA
        },
        {
          name: 'YubiKey',
          description: 'hardware 2FA key - physical security key, most secure 2FA option',
          url: 'https://www.yubico.com',
          priority: 'high-threat',
          platforms: ['Physical Device'],
          minRiskLevel: 'high' // Hardware security for high-risk
        }
      ]
    }
  ];

  const aiSecurityCategories = [
    {
      id: 'never-share',
      name: 'never share with AI chatbots',
      icon: ShieldAlert,
      color: 'from-crimson-500 to-crimson-600',
      description: 'data you should NEVER input into commercial AI systems',
      items: [
        {
          title: 'source identities',
          description: 'real names, contact info, or identifying details of confidential sources - AI companies may log this data',
          icon: User,
          severity: 'critical'
        },
        {
          title: 'unpublished findings',
          description: 'drafts, investigation notes, or unreleased stories - could be accessed by AI training or data breaches',
          icon: FileText,
          severity: 'critical'
        },
        {
          title: 'personal identifiable information (PII)',
          description: 'passport numbers, addresses, phone numbers, email addresses of yourself or sources',
          icon: Fingerprint,
          severity: 'critical'
        },
        {
          title: 'location data',
          description: 'exact coordinates, safe house addresses, or movement patterns of you or your sources',
          icon: Eye,
          severity: 'high'
        },
        {
          title: 'sensitive media',
          description: 'photos/videos that could identify sources or reveal sensitive locations before publication',
          icon: Camera,
          severity: 'critical'
        },
        {
          title: 'confidential audio',
          description: 'interview recordings or voice notes that contain identifiable voices or unreleased information',
          icon: Mic,
          severity: 'high'
        }
      ]
    },
    {
      id: 'ai-threats',
      name: 'AI threats to journalists',
      icon: AlertTriangle,
      color: 'from-amber-500 to-amber-600',
      description: 'emerging AI-powered threats targeting press freedom',
      items: [
        {
          title: 'deepfake videos',
          description: 'AI-generated fake videos used to discredit journalists or fabricate false statements',
          icon: Camera,
          severity: 'critical'
        },
        {
          title: 'voice cloning',
          description: 'synthetic voice generation used to impersonate journalists or extract information from sources',
          icon: Mic,
          severity: 'high'
        },
        {
          title: 'face theft / identity theft',
          description: 'AI scraping photos from social media to create fake profiles or deepfakes of journalists',
          icon: Eye,
          severity: 'high'
        },
        {
          title: 'automated disinformation',
          description: 'AI-generated fake news, bot armies, and coordinated harassment campaigns targeting credibility',
          icon: MessageSquare,
          severity: 'critical'
        },
        {
          title: 'de-anonymization',
          description: 'AI models correlating metadata, writing style, and public data to unmask anonymous journalists',
          icon: Fingerprint,
          severity: 'critical'
        },
        {
          title: 'content surveillance',
          description: 'governments using AI to scan and flag journalist content, communications, or sources',
          icon: ShieldAlert,
          severity: 'high'
        }
      ]
    },
    {
      id: 'safer-ai',
      name: 'privacy-respecting AI tools',
      icon: Lock,
      color: 'from-olive-500 to-olive-600',
      description: 'AI assistants with better privacy guarantees',
      tools: [
        {
          name: 'Ollama',
          description: 'run AI models locally on your computer - no data leaves your device, fully offline capable',
          url: 'https://ollama.ai',
          platforms: ['Windows', 'macOS', 'Linux'],
          privacy: 'fully local'
        },
        {
          name: 'LM Studio',
          description: 'local AI interface - download and run open source models without internet connection',
          url: 'https://lmstudio.ai',
          platforms: ['Windows', 'macOS', 'Linux'],
          privacy: 'fully local'
        },
        {
          name: 'DuckDuckGo AI Chat',
          description: 'anonymous AI chat - no login required, conversations not saved or used for training',
          url: 'https://duckduckgo.com/chat',
          platforms: ['Web'],
          privacy: 'anonymous'
        },
        {
          name: 'HuggingChat',
          description: 'open source AI models - transparent about data handling, EU-based hosting options',
          url: 'https://huggingface.co/chat',
          platforms: ['Web'],
          privacy: 'transparent'
        },
        {
          name: 'Claude (with caveats)',
          description: 'commercial AI but with stronger privacy policies - clearly states data not used for training by default',
          url: 'https://claude.ai',
          platforms: ['Web'],
          privacy: 'commercial'
        }
      ]
    },
    {
      id: 'protection',
      name: 'protection & detection tools',
      icon: Shield,
      color: 'from-midnight-400 to-midnight-500',
      description: 'tools to protect yourself and detect AI-generated content',
      tools: [
        {
          name: 'Fawkes',
          description: 'image cloaking tool - subtly alters photos to prevent AI facial recognition while staying human-visible',
          url: 'https://sandlab.cs.uchicago.edu/fawkes/',
          platforms: ['Windows', 'macOS', 'Linux'],
          use: 'face protection'
        },
        {
          name: 'Lowkey',
          description: 'anti-facial recognition glasses - physical protection against face recognition in public',
          url: 'https://www.reflectacles.com',
          platforms: ['Physical Device'],
          use: 'face protection'
        },
        {
          name: 'Hive Moderation',
          description: 'AI detection API - detects deepfakes, synthetic media, and AI-generated content',
          url: 'https://hivemoderation.com',
          platforms: ['Web', 'API'],
          use: 'deepfake detection'
        },
        {
          name: 'Reality Defender',
          description: 'deepfake detection platform - analyzes audio, video, and images for AI manipulation',
          url: 'https://realitydefender.com',
          platforms: ['Web'],
          use: 'deepfake detection'
        },
        {
          name: 'Content Credentials',
          description: 'media watermarking - C2PA standard for proving photo/video authenticity and provenance',
          url: 'https://contentcredentials.org',
          platforms: ['Web', 'Camera Tools'],
          use: 'authenticity'
        }
      ]
    }
  ];

  const toggleOS = (osId) => {
    setExpandedOS(expandedOS === osId ? null : osId);
  };

  // Helper function to determine if a tool should be shown
  const shouldShowTool = (tool) => {
    if (viewMode === 'all') return true; // Show all tools in "all" mode
    if (!tool.minRiskLevel) return true; // Show if no restriction

    // Risk level hierarchy: low < medium < high < critical
    const riskHierarchy = { low: 1, medium: 2, high: 3, critical: 4 };
    const userLevel = riskHierarchy[userRiskLevel] || 2;
    const toolMinLevel = riskHierarchy[tool.minRiskLevel] || 1;

    return userLevel >= toolMinLevel;
  };

  // Helper function to determine if tool is recommended for user's profile
  const isRecommendedForUser = (tool) => {
    if (!tool.minRiskLevel) return false;
    const riskHierarchy = { low: 1, medium: 2, high: 3, critical: 4 };
    const userLevel = riskHierarchy[userRiskLevel] || 2;
    const toolMinLevel = riskHierarchy[tool.minRiskLevel] || 1;

    // Recommended if it's at or just above user's level (not too advanced)
    return toolMinLevel <= userLevel && toolMinLevel >= (userLevel - 1);
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-midnight-400/20 flex items-center justify-center">
              <Book className="w-6 h-6 text-midnight-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold lowercase">
              resources
            </h1>
          </div>
          <p className="text-lg text-gray-400 lowercase leading-relaxed">
            step-by-step guides to harden your security
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => !tab.coming && setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-midnight-400 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  } ${tab.coming ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="lowercase">{tab.name}</span>
                  {tab.coming && (
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full lowercase">
                      soon
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* OS Security Guides */}
        {activeTab === 'os-guides' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {osGuides.map((os, index) => {
              const Icon = os.icon;
              const isExpanded = expandedOS === os.id;

              return (
                <motion.div
                  key={os.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="glass-card overflow-hidden"
                >
                  {/* OS Header */}
                  <button
                    onClick={() => toggleOS(os.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${os.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-display font-bold lowercase">{os.name}</h3>
                        <p className="text-sm text-gray-400 lowercase">{os.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 lowercase">
                        {os.steps.length} steps
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Expanded Steps */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-white/10 p-6 space-y-4"
                    >
                      {os.steps.map((step, stepIndex) => (
                        <div
                          key={stepIndex}
                          className="flex items-start gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <div className="flex-shrink-0 mt-1">
                            {step.completed ? (
                              <CheckCircle2 className="w-6 h-6 text-olive-500" />
                            ) : (
                              <Circle className="w-6 h-6 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white lowercase mb-1">
                              {stepIndex + 1}. {step.title}
                            </h4>
                            <p className="text-sm text-gray-400 lowercase leading-relaxed">
                              {step.details}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Footer Note */}
                      <div className="mt-6 p-4 bg-midnight-400/10 border border-midnight-400/20 rounded-lg">
                        <p className="text-sm text-midnight-400 lowercase leading-relaxed">
                          <Shield className="w-4 h-4 inline mr-2" />
                          complete these steps to significantly improve your {os.name} security posture
                        </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Recommended Tools */}
        {activeTab === 'tools' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-8"
          >
            {/* View Mode Toggle */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="glass-card p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Filter className="w-5 h-5 text-midnight-400" />
                  <div>
                    <p className="text-sm font-semibold text-white lowercase">
                      {viewMode === 'personalized'
                        ? `showing tools for ${userRiskLevel}-risk journalists`
                        : 'showing all available tools'}
                    </p>
                    <p className="text-xs text-gray-400 lowercase">
                      {viewMode === 'personalized'
                        ? 'personalized based on your security assessment'
                        : 'complete tool catalog'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewMode(viewMode === 'personalized' ? 'all' : 'personalized')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-sm font-semibold transition-all lowercase"
                >
                  {viewMode === 'personalized' ? 'view all tools' : 'view recommended'}
                </button>
              </motion.div>
            )}

            {!user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="glass-card p-4 border-l-4 border-midnight-400"
              >
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-midnight-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-white font-semibold lowercase mb-1">
                      get personalized tool recommendations
                    </p>
                    <p className="text-xs text-gray-400 lowercase">
                      take our security assessment to see tools matched to your risk profile
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {toolCategories.map((category, categoryIndex) => {
              const CategoryIcon = category.icon;

              // Filter tools for this category
              const filteredTools = category.tools.filter(shouldShowTool);
              const hiddenToolsCount = category.tools.length - filteredTools.length;

              // Skip empty categories in personalized mode
              if (filteredTools.length === 0 && viewMode === 'personalized') return null;

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + categoryIndex * 0.1 }}
                  className="glass-card p-6"
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                        <CategoryIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-bold lowercase">{category.name}</h3>
                        <p className="text-sm text-gray-400 lowercase">{category.description}</p>
                      </div>
                    </div>
                    {hiddenToolsCount > 0 && viewMode === 'personalized' && (
                      <div className="text-xs text-gray-500 lowercase">
                        +{hiddenToolsCount} more in "all tools"
                      </div>
                    )}
                  </div>

                  {/* Tools Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTools.map((tool, toolIndex) => {
                      const priorityColors = {
                        'essential': 'bg-crimson-500/20 text-crimson-400 border-crimson-500/30',
                        'recommended': 'bg-olive-500/20 text-olive-400 border-olive-500/30',
                        'high-threat': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                        'source-protection': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                        'emergency': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                        'advanced': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                        'experimental': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      };

                      return (
                        <div
                          key={toolIndex}
                          className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-white lowercase">{tool.name}</h4>
                            {tool.url && (
                              <a
                                href={tool.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-midnight-400 hover:text-midnight-300 transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>

                          <p className="text-xs text-gray-400 lowercase leading-relaxed mb-3">
                            {tool.description}
                          </p>

                          <div className="flex flex-wrap gap-2 mb-2">
                            {tool.platforms.map((platform, platformIndex) => (
                              <span
                                key={platformIndex}
                                className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 rounded lowercase text-gray-400"
                              >
                                {platform}
                              </span>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-block text-xs px-2 py-1 rounded-full border uppercase tracking-wider font-semibold ${priorityColors[tool.priority]}`}>
                              {tool.priority.replace('-', ' ')}
                            </span>
                            {viewMode === 'personalized' && isRecommendedForUser(tool) && (
                              <span className="inline-block text-xs px-2 py-1 rounded-full border bg-midnight-400/20 text-midnight-300 border-midnight-400/30 uppercase tracking-wider font-semibold">
                                recommended
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}

            {/* Footer Note */}
            <div className="glass-card p-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-midnight-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-midnight-400 font-semibold lowercase mb-2">
                    remember: tools are only as secure as how you use them
                  </p>
                  <p className="text-sm text-gray-400 lowercase leading-relaxed">
                    always verify downloads from official sources • keep software updated • use strong unique passwords • enable 2FA everywhere • never mix personal and source communications
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Security */}
        {activeTab === 'ai-security' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Warning Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="glass-card p-6 border-l-4 border-crimson-500"
            >
              <div className="flex items-start gap-4">
                <ShieldAlert className="w-6 h-6 text-crimson-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-display font-bold text-crimson-400 mb-2 lowercase">
                    critical: AI is NOT secure by default
                  </h3>
                  <p className="text-sm text-gray-300 lowercase leading-relaxed">
                    commercial AI chatbots (ChatGPT, Gemini, etc.) log your conversations, may use them for training, and can be subpoenaed by governments. <span className="text-white font-semibold">never input sensitive source information or unpublished findings into these tools.</span>
                  </p>
                </div>
              </div>
            </motion.div>

            {aiSecurityCategories.map((category, categoryIndex) => {
              const CategoryIcon = category.icon;

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + categoryIndex * 0.1 }}
                  className="glass-card p-6"
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                      <CategoryIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-bold lowercase">{category.name}</h3>
                      <p className="text-sm text-gray-400 lowercase">{category.description}</p>
                    </div>
                  </div>

                  {/* Items Grid (for never-share and ai-threats) */}
                  {category.items && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {category.items.map((item, itemIndex) => {
                        const ItemIcon = item.icon;
                        const severityColors = {
                          'critical': 'border-l-crimson-500 bg-crimson-500/5',
                          'high': 'border-l-amber-500 bg-amber-500/5',
                          'medium': 'border-l-olive-500 bg-olive-500/5'
                        };

                        return (
                          <div
                            key={itemIndex}
                            className={`p-4 bg-white/5 rounded-lg border-l-4 ${severityColors[item.severity]} hover:bg-white/10 transition-all`}
                          >
                            <div className="flex items-start gap-3">
                              <ItemIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <h4 className="font-semibold text-white lowercase mb-1">
                                  {item.title}
                                </h4>
                                <p className="text-xs text-gray-400 lowercase leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Tools Grid (for safer-ai and protection) */}
                  {category.tools && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.tools.map((tool, toolIndex) => {
                        const privacyColors = {
                          'fully local': 'bg-olive-500/20 text-olive-400 border-olive-500/30',
                          'anonymous': 'bg-midnight-400/20 text-midnight-300 border-midnight-400/30',
                          'transparent': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                          'commercial': 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        };

                        const useColors = {
                          'face protection': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                          'deepfake detection': 'bg-crimson-500/20 text-crimson-400 border-crimson-500/30',
                          'authenticity': 'bg-olive-500/20 text-olive-400 border-olive-500/30'
                        };

                        return (
                          <div
                            key={toolIndex}
                            className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-white lowercase">{tool.name}</h4>
                              {tool.url && (
                                <a
                                  href={tool.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-midnight-400 hover:text-midnight-300 transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>

                            <p className="text-xs text-gray-400 lowercase leading-relaxed mb-3">
                              {tool.description}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-2">
                              {tool.platforms.map((platform, platformIndex) => (
                                <span
                                  key={platformIndex}
                                  className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 rounded lowercase text-gray-400"
                                >
                                  {platform}
                                </span>
                              ))}
                            </div>

                            {tool.privacy && (
                              <span className={`inline-block text-xs px-2 py-1 rounded-full border uppercase tracking-wider font-semibold ${privacyColors[tool.privacy]}`}>
                                {tool.privacy}
                              </span>
                            )}

                            {tool.use && (
                              <span className={`inline-block text-xs px-2 py-1 rounded-full border uppercase tracking-wider font-semibold ${useColors[tool.use]}`}>
                                {tool.use}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* Best Practices Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="glass-card p-6"
            >
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-midnight-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-midnight-400 font-semibold lowercase mb-2">
                    AI security best practices for journalists
                  </p>
                  <ul className="text-sm text-gray-400 lowercase leading-relaxed space-y-1">
                    <li>• use local AI tools (Ollama, LM Studio) for sensitive work - data never leaves your device</li>
                    <li>• never paste source names, contact details, or unreleased findings into commercial AI</li>
                    <li>• protect your face: use Fawkes to cloak social media photos against AI facial recognition</li>
                    <li>• verify media authenticity: use deepfake detection tools before sharing suspicious content</li>
                    <li>• watermark your original content: use C2PA standards to prove authenticity</li>
                    <li>• assume all AI conversations are logged unless proven otherwise (local tools only)</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Resources;
