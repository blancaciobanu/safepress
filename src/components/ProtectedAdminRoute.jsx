import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Admin emails - add your email here
const ADMIN_EMAILS = [
  'ciobanubianca20@stud.ase.ro',
  // Add more admin emails as needed
];

const ProtectedAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 lowercase">loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is logged in and is an admin
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!ADMIN_EMAILS.includes(user.email)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default ProtectedAdminRoute;
