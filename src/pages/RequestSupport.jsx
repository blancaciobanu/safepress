import { motion } from 'framer-motion';
import { Shield, Send, AlertCircle, Phone, Mail, Clock } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RequestSupport = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    crisisType: 'hacked',
    urgency: 'urgent',
    description: '',
    contactMethod: 'email'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would send to a backend
    console.log('Form submitted:', formData);
    // Show success and redirect
    alert('Request submitted successfully! A specialist will contact you soon.');
    navigate('/crisis');
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

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-midnight-400/10 border border-midnight-400/20 mb-6">
            <Shield className="w-8 h-8 text-midnight-400" />
          </div>

          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 lowercase">
            request specialist support
          </h1>

          <p className="text-lg text-gray-400 font-sans lowercase leading-relaxed">
            fill out this form and a verified cybersecurity expert will contact you
          </p>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
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
          initial={{ opacity: 0, y: 30 }}
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
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-midnight-400 hover:bg-midnight-500 text-white rounded-lg font-semibold transition-all hover:scale-[1.02] lowercase"
          >
            <Send className="w-5 h-5" />
            submit request
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
