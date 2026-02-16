import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, CheckCircle2, Phone, Lock, Shield,
  Database, MapPin, Users, Smartphone, ShieldCheck,
  ArrowRight, RotateCcw,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCrisis } from '../contexts/CrisisContext';

/* ─── Data ──────────────────────────────────────────────────────────────── */

const scenarios = [
  {
    id: 'hacked',
    title: "I've Been Hacked",
    description: "Someone has unauthorized access to your accounts, devices, or communications",
    icon: Lock,
    urgency: "Act within the next 10 minutes",
    actions: [
      { id: 'h1', text: 'Disconnect from WiFi and disable mobile data immediately' },
      { id: 'h2', text: 'Change all passwords from a clean, uncompromised device' },
      { id: 'h3', text: 'Enable two-factor authentication on all critical accounts' },
      { id: 'h4', text: 'Check for unauthorized access, logins, or changes' },
      { id: 'h5', text: 'Document everything — screenshots, logs, timestamps' },
      { id: 'h6', text: 'Contact press freedom organizations for emergency support' },
    ],
  },
  {
    id: 'source',
    title: "My Source Was Exposed",
    description: "Your source's identity may have been revealed or is at risk of exposure",
    icon: Users,
    urgency: "Alert your source first",
    actions: [
      { id: 's1', text: 'Alert the source immediately through a secure channel' },
      { id: 's2', text: 'Delete all communication records if safe to do so' },
      { id: 's3', text: 'Contact legal support and press freedom organizations' },
      { id: 's4', text: 'Document the exposure incident in full detail' },
      { id: 's5', text: 'Review and secure all other source communications' },
      { id: 's6', text: 'Prepare a public statement if the situation demands one' },
    ],
  },
  {
    id: 'doxxed',
    title: "I'm Being Doxxed",
    description: "Your personal information is being publicly shared without your consent",
    icon: AlertCircle,
    urgency: "Secure your physical safety first",
    actions: [
      { id: 'd1', text: 'Alert trusted contacts and family members immediately' },
      { id: 'd2', text: 'Document all doxxing posts, screenshots with timestamps' },
      { id: 'd3', text: 'Report to platform administrators and law enforcement' },
      { id: 'd4', text: 'Enable maximum privacy settings on all accounts' },
      { id: 'd5', text: 'Consider temporary relocation if physical safety is at risk' },
      { id: 'd6', text: 'Contact press freedom organizations for support' },
    ],
  },
  {
    id: 'phishing',
    title: "I Received a Phishing Attempt",
    description: "You received a message designed to steal your credentials or install malware",
    icon: Shield,
    urgency: "Do not click anything else",
    actions: [
      { id: 'p1', text: 'Do not click any links or download any attachments' },
      { id: 'p2', text: 'Forward the message to your IT or security contact' },
      { id: 'p3', text: 'Mark as phishing/spam and delete from all devices' },
      { id: 'p4', text: 'Check whether any credentials were already entered' },
      { id: 'p5', text: 'Change passwords for any accounts you may have entered' },
      { id: 'p6', text: 'Alert colleagues — phishing is often targeted at entire newsrooms' },
    ],
  },
];

const emergencyContacts = [
  { org: 'Committee to Protect Journalists', phone: '+1 (212) 465-1004', email: 'emergencies@cpj.org', available: '24/7 hotline' },
  { org: 'Reporters Without Borders',        phone: '+33 1 44 83 84 84',  email: 'sos@rsf.org',          available: 'Emergency assistance' },
  { org: 'Electronic Frontier Foundation',   phone: '+1 (415) 436-9333',  email: 'info@eff.org',          available: 'Digital rights support' },
];

const securityProtocols = [
  {
    title: 'Device Security', icon: Smartphone,
    steps: ['Turn off device location services', 'Factory reset compromised devices', 'Use encrypted communications only', 'Install security updates immediately'],
  },
  {
    title: 'Data Protection', icon: Database,
    steps: ['Backup sensitive materials to encrypted storage', 'Delete exposed data from compromised systems', 'Use secure file deletion tools', 'Encrypt all remaining files'],
  },
  {
    title: 'Communication', icon: Lock,
    steps: ['Switch to Signal or other E2E-encrypted apps', 'Verify contact identities before sharing info', 'Use secure email (ProtonMail, Tutanota)', 'Avoid phone calls — assume monitoring'],
  },
  {
    title: 'Physical Safety', icon: MapPin,
    steps: ['Vary your daily routes and patterns', 'Inform trusted contacts of your location', 'Secure physical documents and devices', 'Consider temporary relocation if needed'],
  },
];

/* ─── Sub-components ─────────────────────────────────────────────────────── */

const ScenarioCard = ({ scenario, onActivate }) => {
  const Icon = scenario.icon;
  return (
    <button
      onClick={() => onActivate(scenario.id)}
      className="w-full text-left rounded-xl border p-6 transition-all duration-200 group bg-white/[0.03] border-white/[0.08] hover:bg-crimson-500/[0.07] hover:border-crimson-500/30"
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 bg-white/5 border border-white/10 group-hover:bg-crimson-500/15 group-hover:border-crimson-500/25 transition-colors">
        <Icon className="w-6 h-6 text-gray-500 group-hover:text-crimson-400 transition-colors" />
      </div>

      <h3 className="text-lg font-display font-bold mb-2 leading-tight tracking-tight text-gray-200 group-hover:text-white transition-colors">
        {scenario.title}
      </h3>
      <p className="text-sm leading-relaxed mb-5 text-gray-500 group-hover:text-gray-400 transition-colors">
        {scenario.description}
      </p>

      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-600 group-hover:text-crimson-400 transition-colors">
        <ArrowRight className="w-3 h-3" />
        Start Protocol
      </div>
    </button>
  );
};

const ActiveView = ({ scenario, completedSteps, onToggleStep, onDeactivate, onSwitchScenario }) => {
  const Icon = scenario.icon;
  const allDone = completedSteps.length === scenario.actions.length;

  return (
    <motion.div
      key="active"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header bar */}
      <div className="flex items-start justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-crimson-500/15 border border-crimson-500/30 flex-shrink-0">
            <Icon className="w-6 h-6 text-crimson-400" />
          </div>
          <div>
            <p className="label text-crimson-500 mb-1">Crisis Mode Active</p>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-white leading-none">
              {scenario.title}
            </h1>
            <p className="text-xs text-crimson-400 mt-1.5 font-medium">{scenario.urgency}</p>
          </div>
        </div>

        <button
          onClick={onSwitchScenario}
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Switch scenario
        </button>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-crimson-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedSteps.length / scenario.actions.length) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <span className="text-xs font-medium text-gray-500 num flex-shrink-0">
          {completedSteps.length}/{scenario.actions.length} done
        </span>
      </div>

      {/* Checklist */}
      <div className="mb-10">
        <p className="label mb-5">Immediate Actions — Complete In Order</p>
        <div className="space-y-2">
          {scenario.actions.map((action, index) => {
            const done = completedSteps.includes(action.id);
            return (
              <button
                key={action.id}
                onClick={() => onToggleStep(action.id)}
                className={`w-full flex items-start gap-4 p-4 rounded-lg text-left transition-all group ${
                  done ? 'bg-white/[0.02]' : 'hover:bg-white/[0.04]'
                }`}
              >
                {/* Checkbox */}
                <div className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  done ? 'border-olive-500 bg-olive-500/20' : 'border-gray-600 group-hover:border-crimson-500'
                }`}>
                  {done && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-olive-400" />
                    </motion.div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className={`text-sm md:text-base font-medium leading-snug ${
                    done ? 'text-gray-600 line-through' : 'text-gray-200'
                  }`}>
                    <span className={`inline-block w-6 font-bold num mr-1 ${done ? 'text-gray-600' : 'text-crimson-500'}`}>
                      {index + 1}.
                    </span>
                    {action.text}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-olive-500/10 border border-olive-500/20 rounded-lg flex items-center gap-3"
          >
            <ShieldCheck className="w-5 h-5 text-olive-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-olive-400">All steps completed.</p>
              <p className="text-xs text-gray-500 mt-0.5">If you're safe, click "I'm Safe Now" to exit crisis mode.</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Emergency Contacts */}
      <div className="mb-10">
        <p className="label mb-5 flex items-center gap-2">
          <Phone className="w-3.5 h-3.5" /> Emergency Contacts
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {emergencyContacts.map((c) => (
            <div key={c.org} className="glass-card p-4">
              <p className="text-sm font-semibold text-white mb-2 leading-tight">{c.org}</p>
              <p className="text-xs text-gray-400 mb-1 font-mono">{c.phone}</p>
              <p className="text-xs text-gray-500">{c.email}</p>
              <p className="text-[10px] text-crimson-400 font-medium uppercase tracking-wide mt-2">{c.available}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Request Support CTA */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div>
          <p className="text-sm font-semibold text-white mb-1">Need a specialist right now?</p>
          <p className="text-xs text-gray-500">Verified cybersecurity experts available for journalists.</p>
        </div>
        <Link
          to="/request-support"
          className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-midnight-400 hover:bg-midnight-500 text-white rounded-lg text-sm font-semibold transition-all"
        >
          Request Support <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
};

/* ─── Main page ──────────────────────────────────────────────────────────── */

const CrisisMode = () => {
  const { isInCrisis, activeScenario, activateCrisis, deactivateCrisis } = useCrisis();
  const [view, setView] = useState('select');   // 'select' | 'active'
  const [completedSteps, setCompletedSteps] = useState([]);

  // Sync local view with global crisis state
  useEffect(() => {
    if (isInCrisis && activeScenario) {
      setView('active');
    } else if (!isInCrisis) {
      setView('select');
      setCompletedSteps([]);
    }
  }, [isInCrisis, activeScenario]);

  const currentScenario = scenarios.find(s => s.id === activeScenario);

  const handleSelectScenario = (scenarioId) => {
    setCompletedSteps([]);
    activateCrisis(scenarioId);
  };

  const handleDeactivate = () => {
    deactivateCrisis();
    // view resets via useEffect
  };

  const toggleStep = (stepId) => {
    setCompletedSteps(prev =>
      prev.includes(stepId) ? prev.filter(id => id !== stepId) : [...prev, stepId]
    );
  };

  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="max-w-4xl mx-auto">

        <AnimatePresence mode="wait">

          {/* ── Select view ───────────────────────────────────────────────── */}
          {view === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="pt-12"
            >
              {/* Hero */}
              <div className="text-center mb-14">
                <motion.div
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-crimson-500/10 border border-crimson-500/20 mb-6"
                >
                  <AlertCircle className="w-8 h-8 text-crimson-500" />
                </motion.div>

                <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 tracking-tight lowercase">
                  you're going to be <span className="text-crimson-500">okay.</span>
                </h1>
                <p className="text-gray-500 text-base max-w-md mx-auto leading-relaxed lowercase">
                  take a breath. choose what's happening. we'll guide you through it step by step.
                </p>
              </div>

              {/* Scenario grid */}
              <div className="mb-8">
                <p className="label mb-6 text-center">What's happening right now?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {scenarios.map((s) => (
                    <ScenarioCard
                      key={s.id}
                      scenario={s}
                      onActivate={handleSelectScenario}
                    />
                  ))}
                </div>
              </div>

              {/* Planning section below — security protocols */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-20"
              >
                  <hr className="rule mb-10" />
                  <p className="label mb-6">Security Protocols — Reference</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {securityProtocols.map((p) => (
                      <div key={p.title} className="glass-card p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                            <p.icon className="w-4.5 h-4.5 text-midnight-400" />
                          </div>
                          <h3 className="text-sm font-semibold text-white">{p.title}</h3>
                        </div>
                        <ul className="space-y-1.5">
                          {p.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-gray-500 leading-snug">
                              <div className="w-1 h-1 rounded-full bg-gray-600 mt-1.5 flex-shrink-0" />
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </motion.div>
            </motion.div>
          )}

          {/* ── Active view ───────────────────────────────────────────────── */}
          {view === 'active' && currentScenario && (
            <div className="pt-12">
              <ActiveView
                scenario={currentScenario}
                completedSteps={completedSteps}
                onToggleStep={toggleStep}
                onDeactivate={handleDeactivate}
                onSwitchScenario={() => setView('select')}
              />
            </div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default CrisisMode;
