import { motion } from 'framer-motion';
import {
  AlertCircle, CheckCircle2, Phone, Lock, Shield,
  Database, MapPin, Users, FileText, Smartphone, Wifi, Power
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const CrisisMode = () => {
  const [completedSteps, setCompletedSteps] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState('hacked');

  const toggleStep = (stepId) => {
    setCompletedSteps(prev =>
      prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const scenarios = [
    {
      id: 'hacked',
      title: "i've been hacked",
      icon: Lock,
      actions: [
        { id: 'h1', text: 'disconnect from wifi and disable mobile data immediately' },
        { id: 'h2', text: 'change all passwords from a secure device' },
        { id: 'h3', text: 'enable two-factor authentication on all accounts' },
        { id: 'h4', text: 'check for unauthorized access or changes' },
        { id: 'h5', text: 'document everything - screenshots, logs, timestamps' },
        { id: 'h6', text: 'contact press freedom organizations for support' },
      ]
    },
    {
      id: 'source',
      title: 'my source has been exposed',
      icon: Users,
      actions: [
        { id: 's1', text: 'alert the source immediately through secure channels' },
        { id: 's2', text: 'delete all communication records if safe to do so' },
        { id: 's3', text: 'contact legal support and press freedom organizations' },
        { id: 's4', text: 'document the exposure incident thoroughly' },
        { id: 's5', text: 'review and secure other source communications' },
        { id: 's6', text: 'prepare public statement if necessary' },
      ]
    },
    {
      id: 'doxxed',
      title: "i'm being doxxed",
      icon: AlertCircle,
      actions: [
        { id: 'd1', text: 'alert trusted contacts and family members' },
        { id: 'd2', text: 'document all doxxing posts and threats' },
        { id: 'd3', text: 'report to platform administrators and law enforcement' },
        { id: 'd4', text: 'enable maximum privacy settings on all accounts' },
        { id: 'd5', text: 'consider temporary relocation if physical safety at risk' },
        { id: 'd6', text: 'contact press freedom organizations for immediate support' },
      ]
    },
    {
      id: 'phishing',
      title: 'i received a phishing attempt',
      icon: Shield,
      actions: [
        { id: 'p1', text: 'do not click any links or download attachments' },
        { id: 'p2', text: 'forward the email to your IT security team' },
        { id: 'p3', text: 'mark as phishing/spam and delete' },
        { id: 'p4', text: 'check if credentials were compromised' },
        { id: 'p5', text: 'change passwords if you clicked anything' },
        { id: 'p6', text: 'alert colleagues about the phishing campaign' },
      ]
    }
  ];

  const currentScenario = scenarios.find(s => s.id === selectedScenario);
  const immediateActions = currentScenario.actions;

  const emergencyContacts = [
    {
      org: 'Committee to Protect Journalists',
      phone: '+1 (212) 465-1004',
      email: 'emergencies@cpj.org',
      available: '24/7 hotline'
    },
    {
      org: 'Reporters Without Borders',
      phone: '+33 1 44 83 84 84',
      email: 'sos@rsf.org',
      available: 'emergency assistance'
    },
    {
      org: 'Electronic Frontier Foundation',
      phone: '+1 (415) 436-9333',
      email: 'info@eff.org',
      available: 'digital rights support'
    },
  ];

  const securityProtocols = [
    {
      title: 'device security',
      icon: Smartphone,
      steps: [
        'turn off device location services',
        'factory reset compromised devices',
        'use encrypted communications only',
        'install security updates immediately'
      ]
    },
    {
      title: 'data protection',
      icon: Database,
      steps: [
        'backup sensitive materials to encrypted storage',
        'delete exposed data from compromised systems',
        'use secure file deletion tools',
        'encrypt all remaining files'
      ]
    },
    {
      title: 'communication',
      icon: Lock,
      steps: [
        'switch to signal or other e2e encrypted apps',
        'verify contact identities before sharing info',
        'use secure email (protonmail, tutanota)',
        'avoid phone calls - assume monitored'
      ]
    },
    {
      title: 'physical safety',
      icon: MapPin,
      steps: [
        'vary your daily routes and patterns',
        'inform trusted contacts of your location',
        'secure physical documents and devices',
        'consider temporary relocation if needed'
      ]
    },
  ];

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-crimson-500/10 border border-crimson-500/20 mb-5"
          >
            <AlertCircle className="w-7 h-7 text-crimson-500" />
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 lowercase">
            you're going to be <span className="text-crimson-500">okay</span>
          </h1>

          <p className="text-base text-gray-500 lowercase max-w-lg mx-auto leading-relaxed"
            style={{ letterSpacing: '0.03em' }}
          >
            take a breath. follow these steps. we'll help you through this.
          </p>
        </motion.div>

        {/* Scenario Selection */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-6 lowercase">
            what's happening?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((scenario, index) => {
              const Icon = scenario.icon;
              const isSelected = selectedScenario === scenario.id;

              return (
                <motion.button
                  key={scenario.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  onClick={() => {
                    setSelectedScenario(scenario.id);
                    setCompletedSteps([]);
                  }}
                  className={`glass-card p-6 text-left transition-all hover:scale-[1.02] ${
                    isSelected
                      ? 'border-crimson-500/50 bg-crimson-500/10'
                      : 'hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-crimson-500/20 border-2 border-crimson-500'
                        : 'bg-white/5 border-2 border-white/10'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        isSelected ? 'text-crimson-500' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-base md:text-lg font-display font-semibold lowercase ${
                        isSelected ? 'text-white' : 'text-gray-300'
                      }`}>
                        {scenario.title}
                      </h3>
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 rounded-full bg-crimson-500"
                      />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* Immediate Actions Checklist */}
        <motion.section
          key={selectedScenario}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-6 lowercase">
            immediate actions
            <span className="text-gray-500 text-xl ml-3">
              for: {currentScenario.title}
            </span>
          </h2>

          <div className="glass-card p-6 md:p-8">
            <p className="text-sm text-gray-400 mb-6 lowercase">
              complete these steps right now, in order:
            </p>

            <div className="space-y-4">
              {immediateActions.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  onClick={() => toggleStep(action.id)}
                  className="flex items-start gap-4 w-full text-left p-4 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-gray-600 group-hover:border-crimson-500 transition-colors mt-0.5 flex-shrink-0">
                    {completedSteps.includes(action.id) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-3 h-3 rounded-full bg-crimson-500"
                      />
                    )}
                  </div>

                  <div className="flex-1">
                    <span className={`text-sm md:text-base font-sans lowercase ${
                      completedSteps.includes(action.id)
                        ? 'text-gray-500 line-through'
                        : 'text-white'
                    }`}>
                      {index + 1}. {action.text}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Emergency Contacts */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-6 lowercase flex items-center gap-3">
            <Phone className="w-6 h-6 text-crimson-500" />
            emergency contacts
          </h2>

          <div className="space-y-4">
            {emergencyContacts.map((contact, index) => (
              <motion.div
                key={contact.org}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card p-6"
              >
                <h3 className="text-lg font-display font-semibold mb-3 lowercase">
                  {contact.org}
                </h3>
                <div className="space-y-2 text-sm font-sans">
                  <p className="text-gray-400">
                    <span className="text-white">phone:</span> {contact.phone}
                  </p>
                  <p className="text-gray-400">
                    <span className="text-white">email:</span> {contact.email}
                  </p>
                  <p className="text-crimson-400 lowercase text-xs">
                    {contact.available}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Security Protocols */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-6 lowercase">
            detailed security protocols
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityProtocols.map((protocol, index) => (
              <motion.div
                key={protocol.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <protocol.icon className="w-5 h-5 text-midnight-400" />
                  </div>
                  <h3 className="text-lg font-display font-semibold lowercase">
                    {protocol.title}
                  </h3>
                </div>

                <ul className="space-y-2">
                  {protocol.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex items-start gap-2 text-sm text-gray-400 font-sans lowercase">
                      <CheckCircle2 className="w-4 h-4 text-olive-500 mt-0.5 flex-shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Connect with Specialist */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-6 lowercase">
            need personalized help?
          </h2>

          <div className="glass-card p-8 text-center">
            <div className="max-w-2xl mx-auto">
              <Shield className="w-16 h-16 text-midnight-400 mx-auto mb-6" />
              <h3 className="text-xl md:text-2xl font-display font-semibold mb-4 lowercase">
                connect with a cybersecurity specialist
              </h3>
              <p className="text-gray-400 text-sm md:text-base font-sans lowercase mb-8 leading-relaxed">
                get one-on-one support from verified security experts who understand journalist-specific threats. available 24/7 for emergency situations.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Link
                  to="/request-support"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-midnight-400 hover:bg-midnight-500 text-white rounded-lg font-semibold transition-all hover:scale-105 lowercase"
                >
                  <Users className="w-5 h-5" />
                  request specialist support
                </Link>
                <Link
                  to="/community"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg font-medium transition-all lowercase"
                >
                  <Users className="w-4 h-4" />
                  or join community
                </Link>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-gray-500 lowercase">
                <span>✓ verified experts</span>
                <span>✓ confidential consultations</span>
                <span>✓ journalist-focused</span>
                <span>✓ 24/7 availability</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Bottom Support Message */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <p className="text-gray-500 text-sm font-sans lowercase">
            you're not alone. thousands of journalists have been through this.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default CrisisMode;
