import { useState, useEffect } from 'react';
import {
  getApprovedSpecialistHomeStats,
  getExternalFieldSignal,
  getInternalFieldSignal,
  getJournalistHomeSupportSnapshot,
  getSpecialistVerificationState,
} from '../services/homeService';
import { logError } from '../../../utils/logger';

export const useHomeData = (user) => {
  const [fieldSignals, setFieldSignals] = useState({
    externalAdvisory: null,
    internalSignal: null,
    loading: true,
  });
  const [journalistSnapshot, setJournalistSnapshot] = useState({
    loading: false,
    latestRequest: null,
  });
  const [specialistStats, setSpecialistStats] = useState({
    loading: false,
    openCount: 0,
    claimedCount: 0,
    resolvedCount: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const loadFieldSignals = async () => {
      setFieldSignals((current) => ({ ...current, loading: true }));
      const [externalResult, internalResult] = await Promise.allSettled([
        getExternalFieldSignal(),
        getInternalFieldSignal(),
      ]);

      if (cancelled) return;

      if (externalResult.status === 'rejected') {
        logError('Failed to load external Home advisory:', externalResult.reason);
      }
      if (internalResult.status === 'rejected') {
        logError('Failed to load internal Home signal:', internalResult.reason);
      }

      setFieldSignals({
        externalAdvisory: externalResult.status === 'fulfilled' ? externalResult.value : null,
        internalSignal: internalResult.status === 'fulfilled' ? internalResult.value : null,
        loading: false,
      });
    };

    loadFieldSignals();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const verificationState = getSpecialistVerificationState(user);

    const resetJournalist = () => setJournalistSnapshot({ loading: false, latestRequest: null });
    const resetSpecialist = () => setSpecialistStats({ loading: false, openCount: 0, claimedCount: 0, resolvedCount: 0 });

    if (!user) {
      resetJournalist();
      resetSpecialist();
      return undefined;
    }

    if (user.accountType === 'specialist') {
      resetJournalist();

      if (verificationState !== 'approved') {
        resetSpecialist();
        return undefined;
      }

      const loadSpecialistStats = async () => {
        setSpecialistStats((current) => ({ ...current, loading: true }));
        try {
          const stats = await getApprovedSpecialistHomeStats(user.uid);
          if (cancelled) return;
          setSpecialistStats({ loading: false, ...stats });
        } catch (error) {
          if (!cancelled) {
            logError('Failed to load specialist Home stats:', error);
            resetSpecialist();
          }
        }
      };

      loadSpecialistStats();
      return () => { cancelled = true; };
    }

    resetSpecialist();

    const loadJournalistSnapshot = async () => {
      setJournalistSnapshot((current) => ({ ...current, loading: true }));
      try {
        const snapshot = await getJournalistHomeSupportSnapshot(user.uid);
        if (cancelled) return;
        setJournalistSnapshot({ loading: false, latestRequest: snapshot.latestRequest });
      } catch (error) {
        if (!cancelled) {
          logError('Failed to load journalist Home support state:', error);
          resetJournalist();
        }
      }
    };

    loadJournalistSnapshot();

    return () => { cancelled = true; };
  }, [user]);

  return { fieldSignals, journalistSnapshot, specialistStats };
};
