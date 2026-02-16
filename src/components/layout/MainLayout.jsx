import { Outlet } from 'react-router-dom';
import Header from './Header';
import CrisisOverlay from '../CrisisOverlay';
import { useCrisis } from '../../contexts/CrisisContext';

const MainLayout = () => {
  const { isInCrisis } = useCrisis();

  return (
    <div className="min-h-screen bg-dark-900 scrollbar-thin">
      <Header />
      <CrisisOverlay />
      {/*
        Header height: ~96px (pt-24)
        Crisis banner: ~40px
        Total with crisis: ~136px → pt-36 (144px) gives safe clearance
      */}
      <main className={`pb-12 transition-[padding-top] duration-300 ${isInCrisis ? 'pt-36' : 'pt-24'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
