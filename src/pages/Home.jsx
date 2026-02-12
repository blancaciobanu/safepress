import { motion } from 'framer-motion';
import { Shield, Zap, Lock, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

const Home = () => {
  return (
    <div className="overflow-hidden">
      {/* Hero Section - Centered Editorial */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.8 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1
            }}
            transition={{
              delay: 0.2,
              duration: 1,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-midnight-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-midnight-400"></span>
            </span>
            <span className="text-xs lowercase tracking-wide text-gray-500">trusted by journalists worldwide</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: 0.3,
              duration: 1,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="text-5xl md:text-7xl lg:text-8xl font-display font-bold mb-6 tracking-tight"
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.4,
                duration: 1,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="mb-3"
            >
              protect your
            </motion.div>
            <div className="flex flex-wrap gap-3 md:gap-4 justify-center items-center">
              <motion.span
                initial={{ opacity: 0, x: -60, rotate: -8 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                whileHover={{ y: -8, rotate: 2, transition: { duration: 0.2 } }}
                transition={{
                  delay: 0.6,
                  duration: 1.2,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="text-midnight-400 cursor-default"
              >
                story.
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 60, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ y: -8, scale: 1.05, transition: { duration: 0.2 } }}
                transition={{
                  delay: 0.8,
                  duration: 1.2,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="text-teal-400 cursor-default"
              >
                sources.
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: 60, rotate: 8 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                whileHover={{ y: -8, rotate: -2, transition: { duration: 0.2 } }}
                transition={{
                  delay: 1.0,
                  duration: 1.2,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="text-purple-400 cursor-default"
              >
                truth.
              </motion.span>
            </div>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 1.2,
              duration: 1,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="text-base md:text-lg font-sans font-normal mb-8 max-w-2xl mx-auto leading-relaxed lowercase text-gray-400"
            style={{ letterSpacing: '0.05em', wordSpacing: '0.3em' }}
          >
            digital tools. safety practices. trusted community.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.8,
              duration: 1,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10"
          >
            <Link
              to="/crisis"
              className="btn-crisis inline-flex items-center gap-2 lowercase"
            >
              i'm in trouble
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/security-score"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg font-medium transition-all duration-200 lowercase"
            >
              check security score
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 1.1,
              duration: 1,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="flex flex-wrap justify-center items-center gap-6 text-xs text-gray-500 lowercase tracking-wide"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-olive-500" />
              <span>zero-knowledge encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-olive-500" />
              <span>open source</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-olive-500" />
              <span>no tracking</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Clean Grid */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: 1.2,
              ease: [0.22, 1, 0.36, 1]
            }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 lowercase">
              everything you need
              <br />
              to stay <span className="text-midnight-400">safe</span>
            </h2>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <FeatureCard
              icon={Shield}
              title="Security score"
              description="Real-time assessment of your digital safety"
              delay={0.1}
            />
            <FeatureCard
              icon={Zap}
              title="Crisis mode"
              description="Immediate protocols for security incidents"
              delay={0.2}
            />
            <FeatureCard
              icon={Lock}
              title="Source protection"
              description="Secure communication tools"
              delay={0.3}
            />
            <FeatureCard
              icon={Users}
              title="Community"
              description="Learn from experienced journalists"
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
            <StatCard number="89" suffix="%" label="Journalists at risk online" />
            <StatCard number="1200" suffix="+" label="Threats blocked daily" />
            <StatCard number="50" suffix="+" label="Countries supported" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1.2,
            ease: [0.22, 1, 0.36, 1]
          }}
          viewport={{ once: true, amount: 0.3 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 lowercase">
            ready to secure
            <br />
            your <span className="text-midnight-400">work?</span>
          </h2>
          <p className="text-lg text-gray-400 mb-10 lowercase">
            start with a free security assessment
          </p>
          <Link
            to="/secure-setup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-dark-900 rounded-lg font-semibold hover:scale-105 transition-transform lowercase"
          >
            get started free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

// Feature Card Component - Minimal with Color
const FeatureCard = ({ icon: Icon, title, description, delay }) => {
  const iconColors = {
    'security score': 'text-midnight-400',
    'crisis mode': 'text-crimson-500',
    'source protection': 'text-midnight-400',
    'community': 'text-steel-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 1,
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
      viewport={{ once: true, amount: 0.3 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="text-center group"
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-6 group-hover:bg-white/10 transition-colors">
        <Icon className={`w-5 h-5 ${iconColors[title.toLowerCase()] || 'text-gray-400'}`} />
      </div>
      <h3 className="text-base font-display font-semibold mb-3 lowercase tracking-wide">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed lowercase">{description}</p>
    </motion.div>
  );
};

// Stat Card Component
const StatCard = ({ number, suffix, label }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const end = parseInt(number);
          const duration = 2000;
          const increment = end / (duration / 16);

          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, [number]);

  return (
    <motion.div
      ref={countRef}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 1,
        ease: [0.22, 1, 0.36, 1]
      }}
      viewport={{ once: true, amount: 0.3 }}
    >
      <div className="text-5xl md:text-6xl font-display font-bold text-white mb-3">
        {count}{suffix}
      </div>
      <div className="text-sm text-gray-500 uppercase tracking-wide">{label}</div>
    </motion.div>
  );
};

export default Home;
