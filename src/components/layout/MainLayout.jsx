import { Outlet } from 'react-router-dom';
import Header from './Header';
import CrisisOverlay from '../CrisisOverlay';
import { useCrisis } from '../../contexts/CrisisContext';

const MainLayout = () => {
  const { isInCrisis } = useCrisis();

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <CrisisOverlay />
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
