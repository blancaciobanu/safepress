import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import CrisisOverlay from '../CrisisOverlay';
import { useCrisis } from '../../contexts/CrisisContext';
import { useAuth } from '../../contexts/AuthContext';
import { needsWelcomePathChoice } from '../../features/users/accountRouting';
import PageLoader from '../PageLoader';

const MainLayout = () => {
  const { isInCrisis } = useCrisis();
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  const shouldForceWelcome =
    user
    && needsWelcomePathChoice(user)
    && location.pathname !== '/welcome';

  if (shouldForceWelcome) {
    return <Navigate to="/welcome" replace />;
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      {user?.accountType !== 'specialist' && <CrisisOverlay />}
      {/*
        Single-row editorial header: h-16 (64px) → pt-20 with breathing room.
        Crisis banner adds ~32px → pt-28 with breathing room.
      */}
      <main className={`pb-12 px-6 md:px-10 lg:px-14 transition-[padding-top] duration-300 ${isInCrisis ? 'pt-28' : 'pt-20'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
