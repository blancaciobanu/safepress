import { motion } from 'framer-motion';
import { Shield, AlertCircle, Lock, Users, ArrowRight, BookOpen, FileText, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCrisis } from '../contexts/CrisisContext';

const Home = () => {
  const { openOverlay } = useCrisis();

  return (
    <div className="overflow-hidden">

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-8">
        <div className="max-w-5xl mx-auto text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-midnight-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-midnight-400" />
            </span>
            <span className="text-xs lowercase tracking-wide text-gray-500">trusted by journalists worldwide</span>
          </motion.div>

          {/* Main heading */}
          <motion.h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold mb-6 tracking-tight">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="mb-3"
            >
              protect your
            </motion.div>
            <div className="flex flex-wrap gap-3 md:gap-4 justify-center items-center">
              <motion.span
                initial={{ opacity: 0, x: -60, rotate: -8 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                whileHover={{ y: -8, rotate: 2, transition: { duration: 0.22, ease: 'easeOut' } }}
                transition={{ delay: 0.6, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="text-midnight-400 cursor-default"
              >story.</motion.span>
              <motion.span
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ y: -8, scale: 1.05, transition: { duration: 0.22, ease: 'easeOut' } }}
                transition={{ delay: 0.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="text-teal-400 cursor-default"
              >sources.</motion.span>
              <motion.span
                initial={{ opacity: 0, x: 60, rotate: 8 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                whileHover={{ y: -8, rotate: -2, transition: { duration: 0.22, ease: 'easeOut' } }}
                transition={{ delay: 1.0, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="text-purple-400 cursor-default"
              >truth.</motion.span>
            </div>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="text-sm md:text-base text-gray-400 mb-10 lowercase"
            style={{ letterSpacing: '0.05em', wordSpacing: '0.3em' }}
          >
            digital tools. safety practices. trusted community.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10"
          >
            <button
              onClick={openOverlay}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-crimson-500 hover:bg-crimson-600 text-white rounded-lg font-semibold text-sm lowercase transition-all duration-200"
            >
              i'm in trouble <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/security-score"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/5 hover:bg-white/10 border border-white/15 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition-all duration-200 lowercase"
            >
              check my security
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.9 }}
            className="flex flex-wrap justify-center gap-6 text-xs text-gray-600 lowercase"
          >
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-midnight-400" /> zero-knowledge encryption</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-midnight-400" /> open source</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-midnight-400" /> no tracking</span>
          </motion.div>
        </div>
      </section>

      {/* ── What's inside ── */}
      <section className="py-32 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, amount: 0.3 }}
            className="mb-16"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-600 mb-4">
              what's inside
            </p>
            <h2 className="text-4xl md:text-5xl font-display font-bold lowercase leading-tight">
              every tool a journalist<br />
              needs to <span className="text-midnight-400">stay safe.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureTile
              icon={Shield}
              title="Security Assessment"
              description="A 31-question evaluation across 6 risk categories — passwords, devices, communications, and more. Get a personalised score and actionable recommendations."
              link="/security-score"
              linkLabel="Take the quiz"
              delay={0}
            />
            <FeatureTile
              icon={Lock}
              title="Secure Setup Checklist"
              description="31 concrete security tasks, from setting up a password manager to encrypting your device. Track your progress as you go."
              link="/secure-setup"
              linkLabel="Start checklist"
              delay={0.07}
            />
            <FeatureTile
              icon={BookOpen}
              title="OS Guides &amp; Tools"
              description="Step-by-step hardening guides for Windows, macOS, Linux, iOS, and Android. 25+ curated security tools filtered to your risk level."
              link="/resources"
              linkLabel="Browse resources"
              delay={0.14}
            />
            <FeatureTile
              icon={Users}
              title="Journalist Community"
              description="Anonymous stories, open discussions, and a Q&amp;A space where journalists share security experiences from the field."
              link="/community"
              linkLabel="Join the community"
              delay={0.21}
            />
            <FeatureTile
              icon={FileText}
              title="Specialist Support"
              description="Submit a crisis request and get matched with a verified digital security specialist for direct, personalised help."
              link="/request-support"
              linkLabel="Request support"
              delay={0.28}
            />
            <CrisisTile openOverlay={openOverlay} delay={0.35} />
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-32 px-4 border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, amount: 0.3 }}
          className="max-w-3xl mx-auto text-center"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-600 mb-6">
            no account required
          </p>
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-8 lowercase leading-tight">
            start with a<br />
            <span className="text-midnight-400">security score.</span>
          </h2>
          <p className="text-gray-500 mb-10 text-sm lowercase">
            takes 5 minutes. completely free.
          </p>
          <Link
            to="/security-score"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-dark-900 rounded-lg font-bold text-sm hover:scale-105 transition-transform lowercase"
          >
            assess my digital safety
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

    </div>
  );
};

const FeatureTile = ({ icon: Icon, title, description, link, linkLabel, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    viewport={{ once: true, amount: 0.2 }}
    className="glass-card p-7 flex flex-col gap-5 group hover:border-white/10 transition-colors"
  >
    <div className="inline-flex w-10 h-10 rounded-xl items-center justify-center bg-midnight-400/10">
      <Icon className="w-5 h-5 text-midnight-400" />
    </div>
    <div className="flex-1">
      <h3 className="text-sm font-semibold text-white mb-2 lowercase">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed lowercase">{description}</p>
    </div>
    <Link
      to={link}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-midnight-400 hover:text-midnight-300 lowercase transition-colors"
    >
      {linkLabel} <ArrowRight className="w-3 h-3" />
    </Link>
  </motion.div>
);

const CrisisTile = ({ openOverlay, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    viewport={{ once: true, amount: 0.2 }}
    className="glass-card p-7 flex flex-col gap-5"
    style={{ borderColor: 'rgba(229,62,62,0.2)', background: 'rgba(229,62,62,0.04)' }}
  >
    <div className="inline-flex w-10 h-10 rounded-xl items-center justify-center bg-crimson-500/15">
      <AlertCircle className="w-5 h-5 text-crimson-400" />
    </div>
    <div className="flex-1">
      <h3 className="text-sm font-semibold text-white mb-2 lowercase">Crisis Mode</h3>
      <p className="text-sm text-gray-500 leading-relaxed lowercase">
        immediate step-by-step protocols for hacking, doxxing, source exposure, and phishing — available any time, no login needed.
      </p>
    </div>
    <button
      onClick={openOverlay}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-crimson-400 hover:text-crimson-300 lowercase transition-colors"
    >
      open crisis mode <ArrowRight className="w-3 h-3" />
    </button>
  </motion.div>
);

export default Home;
