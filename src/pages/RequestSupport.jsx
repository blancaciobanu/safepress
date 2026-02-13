import { motion } from 'framer-motion';
import { Shield, Send, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const RequestSupport = () => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.realName || '',
    email: user?.email || '',
    phone: '',
    crisisType: 'hacked',
    urgency: 'urgent',
    description: '',
    contactMethod: 'email'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'support-requests'), {
        requesterId: user?.uid || null,
        requesterName: formData.name,
        requesterEmail: formData.email,
        requesterPhone: formData.phone || null,
        crisisType: formData.crisisType,
        urgency: formData.urgency,
        description: formData.description,
        contactMethod: formData.contactMethod,
        status: 'open',
        claimedBy: null,
        claimedByName: null,
        claimedAt: null,
        resolvedAt: null,
        createdAt: new Date().toISOString()
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('something went wrong. please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const crisisTypes = [
    { id: 'hacked', label: "i've been hacked" },
    { id: 'source', label: 'my source has been exposed' },
    { id: 'doxxed', label: "i'm being doxxed" },
    { id: 'phishing', label: 'i received a phishing attempt' },
    { id: 'other', label: 'other security concern' }
  ];

  const urgencyLevels = [
    { id: 'emergency', label: 'emergency - immediate threat' },
    { id: 'urgent', label: 'urgent - within 24 hours' },
    { id: 'normal', label: 'normal - within 48 hours' }
  ];

  const contactMethods = [
    { id: 'email', label: 'email' },
    { id: 'phone', label: 'phone call' },
    { id: 'signal', label: 'signal messenger' }
  ];

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-olive-500/10 border border-olive-500/20 mb-5">
              <CheckCircle className="w-7 h-7 text-olive-500" />
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 lowercase">
              request submitted
            </h1>

            <p className="text-base text-gray-500 lowercase max-w-md mx-auto leading-relaxed mb-8"
              style={{ letterSpacing: '0.03em' }}
            >
              a verified cybersecurity specialist will review your request and reach out to you soon
            </p>

            <div className="glass-card p-6 max-w-sm mx-auto mb-8">
              <div className="space-y-3 text-sm lowercase">
                <div className="flex justify-between">
                  <span className="text-gray-500">type</span>
                  <span className="text-white">{crisisTypes.find(t => t.id === formData.crisisType)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">urgency</span>
                  <span className={`${formData.urgency === 'emergency' ? 'text-crimson-500' : formData.urgency === 'urgent' ? 'text-amber-500' : 'text-white'}`}>
                    {formData.urgency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">contact via</span>
                  <span className="text-white">{formData.contactMethod}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-midnight-400 hover:bg-midnight-500 text-white rounded-lg font-semibold transition-all lowercase"
              >
                back to dashboard
              </Link>
              <Link
                to="/crisis"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] text-white rounded-lg font-semibold transition-all lowercase"
              >
                view crisis steps
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-midnight-400/10 border border-midnight-400/20 mb-5">
            <Shield className="w-7 h-7 text-midnight-400" />
          </div>

          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 lowercase">
            request specialist support
          </h1>

          <p className="text-base text-gray-500 lowercase max-w-md mx-auto leading-relaxed"
            style={{ letterSpacing: '0.03em' }}
          >
            fill out this form and a verified cybersecurity expert will contact you
          </p>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap justify-center items-center gap-6 mb-12 text-xs text-gray-500 lowercase"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-olive-500" />
            <span>verified experts</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-olive-500" />
            <span>confidential</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-olive-500" />
            <span>24/7 available</span>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onSubmit={handleSubmit}
          className="glass-card p-8"
        >
          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="text-xl font-display font-semibold mb-6 lowercase">
              your information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                  name <span className="text-crimson-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-midnight-400 transition-colors lowercase"
                  placeholder="your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                  email <span className="text-crimson-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-midnight-400 transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                  phone number (optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-midnight-400 transition-colors"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Crisis Details */}
          <div className="mb-8">
            <h2 className="text-xl font-display font-semibold mb-6 lowercase">
              crisis details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                  type of crisis <span className="text-crimson-500">*</span>
                </label>
                <select
                  name="crisisType"
                  value={formData.crisisType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-midnight-400 transition-colors lowercase"
                >
                  {crisisTypes.map((type) => (
                    <option key={type.id} value={type.id} className="bg-dark-900">
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                  urgency level <span className="text-crimson-500">*</span>
                </label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-midnight-400 transition-colors lowercase"
                >
                  {urgencyLevels.map((level) => (
                    <option key={level.id} value={level.id} className="bg-dark-900">
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                  describe your situation <span className="text-crimson-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="5"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-midnight-400 transition-colors resize-none lowercase"
                  placeholder="please provide details about what happened and what help you need..."
                />
              </div>
            </div>
          </div>

          {/* Contact Preferences */}
          <div className="mb-8">
            <h2 className="text-xl font-display font-semibold mb-6 lowercase">
              how should we contact you?
            </h2>

            <div>
              <label className="block text-sm font-sans text-gray-400 mb-2 lowercase">
                preferred contact method <span className="text-crimson-500">*</span>
              </label>
              <select
                name="contactMethod"
                value={formData.contactMethod}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-midnight-400 transition-colors lowercase"
              >
                {contactMethods.map((method) => (
                  <option key={method.id} value={method.id} className="bg-dark-900">
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="mb-8 p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-gray-400 font-sans lowercase leading-relaxed">
              <span className="text-white font-semibold">privacy notice:</span> all information submitted is encrypted and confidential.
              we will only use your details to provide security support and will never share them with third parties.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-midnight-400 hover:bg-midnight-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all hover:scale-[1.02] lowercase"
          >
            <Send className="w-5 h-5" />
            {submitting ? 'submitting...' : 'submit request'}
          </button>

          {/* Help Text */}
          <p className="text-xs text-gray-500 font-sans text-center mt-4 lowercase">
            emergency? call <a href="tel:+12124651004" className="text-crimson-500 hover:underline">+1 (212) 465-1004</a> (cpj 24/7 hotline)
          </p>
        </motion.form>
      </div>
    </div>
  );
};

export default RequestSupport;
