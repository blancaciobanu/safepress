import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { COLLECTIONS } from '../../../config/firebaseCollections';

export const getSimulationProgress = async (userId) => {
  const snapshot = await getDoc(doc(db, COLLECTIONS.USERS, userId));
  if (!snapshot.exists()) return {};
  return snapshot.data().simulationProgress || {};
};

export const saveSimulationConfidence = async (userId, scenarioId, confidence) => {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
    [`simulationProgress.${scenarioId}`]: {
      confidence,
      recordedAt: new Date().toISOString(),
    },
  });
};
