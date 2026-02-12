import { motion } from 'framer-motion';
import { Zap, Check } from 'lucide-react';

const SecureSetup = () => {
  const steps = [
    { title: 'Enable Two-Factor Authentication', status: 'completed' },
    { title: 'Install a Password Manager', status: 'completed' },
    { title: 'Set up Signal for secure messaging', status: 'in-progress' },
    { title: 'Enable device encryption', status: 'pending' },
    { title: 'Configure VPN', status: 'pending' },
    { title: 'Secure your email', status: 'pending' },
  ];

  return (
    <div className="section-container max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
          Secure Your Setup
        </h1>
        <p className="text-xl text-gray-400 mb-12">
          Follow these steps to harden your digital security
        </p>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card p-6 hover:bg-white/10 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.status === 'completed'
                      ? 'bg-safe-green-500/20 text-safe-green-400'
                      : step.status === 'in-progress'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {step.status === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="font-semibold">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold group-hover:text-electric-purple-400 transition-colors">
                    {step.title}
                  </h3>
                </div>
                <Zap className="w-5 h-5 text-gray-500 group-hover:text-electric-teal-400 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default SecureSetup;
