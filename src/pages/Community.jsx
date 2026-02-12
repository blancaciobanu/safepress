import { motion } from 'framer-motion';
import { Users, MessageSquare } from 'lucide-react';

const Community = () => {
  return (
    <div className="section-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto text-center"
      >
        <Users className="w-20 h-20 text-electric-purple-400 mx-auto mb-6" />
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
          Community
        </h1>
        <p className="text-xl text-gray-400 mb-12">
          Connect with other journalists and share security experiences
        </p>

        <div className="glass-card p-12">
          <MessageSquare className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">
            Community features coming soon. This is where users will share experiences and solutions.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Community;
