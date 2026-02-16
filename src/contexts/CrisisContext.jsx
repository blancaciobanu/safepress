import { createContext, useContext, useState } from 'react';

const CrisisContext = createContext({});

export const useCrisis = () => {
  const context = useContext(CrisisContext);
  if (!context) throw new Error('useCrisis must be used within CrisisProvider');
  return context;
};

export const CrisisProvider = ({ children }) => {
  const [isInCrisis, setIsInCrisis] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const activateCrisis = (scenarioId) => {
    setActiveScenario(scenarioId);
    setIsInCrisis(true);
  };

  const deactivateCrisis = () => {
    setIsInCrisis(false);
    setActiveScenario(null);
  };

  const openOverlay   = () => setOverlayOpen(true);
  const closeOverlay  = () => setOverlayOpen(false);
  const toggleOverlay = () => setOverlayOpen(prev => !prev);

  return (
    <CrisisContext.Provider value={{
      isInCrisis, activeScenario,
      overlayOpen, openOverlay, closeOverlay, toggleOverlay,
      activateCrisis, deactivateCrisis,
    }}>
      {children}
    </CrisisContext.Provider>
  );
};
