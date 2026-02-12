import { Outlet } from 'react-router-dom';
import Header from './Header';
import { motion } from 'framer-motion';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-dark-900 scrollbar-thin">
      <Header />

      {/* Main content area with padding for fixed header */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="pt-24 pb-12"
      >
        <Outlet />
      </motion.main>

      {/* Optional: Footer can be added here later */}
    </div>
  );
};

export default MainLayout;
