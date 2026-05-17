import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../../firebase/config';
import { COLLECTIONS } from '../../../config/firebaseCollections';
import {
  SUPPORT_CONTACT_METHODS,
  SUPPORT_REQUEST_TYPES,
  SUPPORT_REQUEST_URGENCIES,
} from '../../../config/security';

const SUPPORT_REQUESTS_COLLECTION = COLLECTIONS.SUPPORT_REQUESTS;
const SUPPORT_REQUEST_QUEUE_COLLECTION = COLLECTIONS.SUPPORT_REQUEST_QUEUE;
const PUBLIC_PROFILES_COLLECTION = COLLECTIONS.PUBLIC_PROFILES;
const SUPPORT_CASE_MESSAGES_SUBCOLLECTION = 'messages';

const mapSnapshotDocs = (snapshot) =>
  snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));

const sortByCreatedAtDesc = (items = []) =>
  [...items].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

const getSupportCaseMessagesCollection = (requestId) =>
  collection(db, SUPPORT_REQUESTS_COLLECTION, requestId, SUPPORT_CASE_MESSAGES_SUBCOLLECTION);

const buildQueueCardData = (entry) => ({
  ...entry,
  queueOnly: true,
  description: 'confidential details unlock after you claim this request',
  requesterName: 'confidential until claimed',
  requesterEmail: 'claim to view contact details',
  requesterPhone: null,
});

export const listApprovedSpecialists = async () => {
  const specialistsQuery = query(
    collection(db, PUBLIC_PROFILES_COLLECTION),
    where('accountType', '==', 'specialist'),
    where('verificationStatus', '==', 'approved')
  );

  const snapshot = await getDocs(specialistsQuery);
  const specialists = mapSnapshotDocs(snapshot);

  return specialists.sort((a, b) => {
    const left = a.verificationDate || a.createdAt || '';
    const right = b.verificationDate || b.createdAt || '';
    return right.localeCompare(left);
  });
};

export const createSupportRequest = async ({
  requesterId,
  requesterName,
  requesterEmail,
  requesterPhone,
  crisisType,
  urgency,
  description,
  contactMethod,
}) => {
  const createdAt = new Date().toISOString();
  const privatePayload = {
    requesterId,
    requesterName,
    requesterEmail,
    requesterPhone: requesterPhone || null,
    crisisType,
    urgency,
    description,
    contactMethod,
    status: 'open',
    claimedBy: null,
    claimedByName: null,
    claimedAt: null,
    resolvedAt: null,
    caseReport: null,
    createdAt,
    lastCaseActivityAt: createdAt,
  };
  const queuePayload = {
    requesterId,
    crisisType,
    urgency,
    contactMethod,
    status: 'open',
    claimedBy: null,
    claimedByName: null,
    claimedAt: null,
    resolvedAt: null,
    createdAt,
    lastCaseActivityAt: createdAt,
  };

  if (
    !SUPPORT_REQUEST_TYPES.includes(crisisType)
    || !SUPPORT_REQUEST_URGENCIES.includes(urgency)
    || !SUPPORT_CONTACT_METHODS.includes(contactMethod)
  ) {
    throw new Error('invalid-support-request');
  }

  const requestRef = doc(collection(db, SUPPORT_REQUESTS_COLLECTION));
  const queueRef = doc(db, SUPPORT_REQUEST_QUEUE_COLLECTION, requestRef.id);
  const batch = writeBatch(db);
  batch.set(requestRef, privatePayload);
  batch.set(queueRef, queuePayload);
  await batch.commit();

  return { id: requestRef.id, ...privatePayload };
};

export const draftSupportRequestWithAI = async ({ roughDetails }) => {
  if (typeof roughDetails !== 'string' || roughDetails.trim().length < 20) {
    throw new Error('support-draft-too-short');
  }

  const callable = httpsCallable(functions, 'draftSupportRequest');
  const result = await callable({ roughDetails: roughDetails.trim() });
  return result.data;
};

export const getActiveSupportRequests = async () => {
  return getOpenSupportQueueRequests();
};

export const getOpenSupportQueueRequests = async () => {
  const requestsQuery = query(
    collection(db, SUPPORT_REQUEST_QUEUE_COLLECTION),
    where('status', '==', 'open'),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(requestsQuery);
  return mapSnapshotDocs(snapshot).map(buildQueueCardData);
};

export const getClaimedSupportRequestsBySpecialist = async (specialistId) => {
  const requestsQuery = query(
    collection(db, SUPPORT_REQUESTS_COLLECTION),
    where('claimedBy', '==', specialistId),
    where('status', '==', 'claimed')
  );

  const snapshot = await getDocs(requestsQuery);
  return sortByCreatedAtDesc(mapSnapshotDocs(snapshot));
};

export const getResolvedSupportRequestsBySpecialist = async (specialistId) => {
  const requestsQuery = query(
    collection(db, SUPPORT_REQUESTS_COLLECTION),
    where('claimedBy', '==', specialistId),
    where('status', '==', 'resolved')
  );

  const snapshot = await getDocs(requestsQuery);
  return sortByCreatedAtDesc(mapSnapshotDocs(snapshot));
};

export const getSupportRequestsByRequester = async (requesterId) => {
  const requestsQuery = query(
    collection(db, SUPPORT_REQUESTS_COLLECTION),
    where('requesterId', '==', requesterId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(requestsQuery);
  return sortByCreatedAtDesc(mapSnapshotDocs(snapshot));
};

export const getRequesterCaseFile = async ({ requestId, requesterId }) => {
  const privateRef = doc(db, SUPPORT_REQUESTS_COLLECTION, requestId);
  const privateSnap = await getDoc(privateRef);

  if (!privateSnap.exists()) {
    throw new Error('support-request-not-found');
  }

  const privateData = { id: privateSnap.id, ...privateSnap.data() };

  if (privateData.requesterId !== requesterId) {
    throw new Error('support-request-access-denied');
  }

  return privateData;
};

export const getSpecialistCaseFile = async ({ requestId, specialistId }) => {
  const privateRef = doc(db, SUPPORT_REQUESTS_COLLECTION, requestId);
  const privateSnap = await getDoc(privateRef);

  if (!privateSnap.exists()) {
    throw new Error('support-request-not-found');
  }

  const privateData = { id: privateSnap.id, ...privateSnap.data() };

  if (privateData.status === 'open') {
    return buildQueueCardData(privateData);
  }

  if (privateData.claimedBy !== specialistId) {
    throw new Error('support-request-access-denied');
  }

  return privateData;
};

export const listenToSupportCaseFile = ({ requestId, onData, onError }) => {
  const privateRef = doc(db, SUPPORT_REQUESTS_COLLECTION, requestId);
  return onSnapshot(
    privateRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onError?.(new Error('support-request-not-found'));
        return;
      }

      onData?.({ id: snapshot.id, ...snapshot.data() });
    },
    (error) => {
      onError?.(error);
    }
  );
};

export const listenToSupportCaseMessages = ({ requestId, onData, onError }) => {
  const messagesQuery = query(
    getSupportCaseMessagesCollection(requestId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      onData?.(mapSnapshotDocs(snapshot));
    },
    (error) => {
      onError?.(error);
    }
  );
};

export const addSupportCaseMessage = async ({
  requestId,
  authorId,
  authorName,
  authorRole,
  body,
}) => {
  const trimmedBody = body.trim();
  if (!trimmedBody) {
    throw new Error('support-message-empty');
  }

  const createdAt = new Date().toISOString();
  await addDoc(getSupportCaseMessagesCollection(requestId), {
    authorId,
    authorName,
    authorRole,
    body: trimmedBody,
    createdAt,
  });

  await updateDoc(doc(db, SUPPORT_REQUESTS_COLLECTION, requestId), {
    lastCaseActivityAt: createdAt,
  });

  return {
    authorId,
    authorName,
    authorRole,
    body: trimmedBody,
    createdAt,
  };
};

export const claimSupportRequest = async ({ requestId, specialistId, specialistName }) => {
  const claimedAt = new Date().toISOString();
  const payload = {
    status: 'claimed',
    claimedBy: specialistId,
    claimedByName: specialistName,
    claimedAt,
    lastCaseActivityAt: claimedAt,
  };

  const batch = writeBatch(db);
  batch.update(doc(db, SUPPORT_REQUESTS_COLLECTION, requestId), payload);
  batch.update(doc(db, SUPPORT_REQUEST_QUEUE_COLLECTION, requestId), payload);
  await batch.commit();

  return payload;
};

export const resolveSupportRequest = async (requestId) => {
  const resolvedAt = new Date().toISOString();
  const payload = {
    status: 'resolved',
    resolvedAt,
    lastCaseActivityAt: resolvedAt,
  };

  const batch = writeBatch(db);
  batch.update(doc(db, SUPPORT_REQUESTS_COLLECTION, requestId), payload);
  batch.update(doc(db, SUPPORT_REQUEST_QUEUE_COLLECTION, requestId), payload);
  await batch.commit();

  return payload;
};

export const saveSupportCaseReport = async ({
  requestId,
  specialistId,
  specialistName,
  report,
}) => {
  const updatedAt = new Date().toISOString();
  const payload = {
    caseReport: {
      summary: report.summary?.trim() || '',
      actionsTaken: report.actionsTaken?.trim() || '',
      outstandingRisks: report.outstandingRisks?.trim() || '',
      nextSteps: report.nextSteps?.trim() || '',
      updatedAt,
      specialistId,
      specialistName,
    },
    lastCaseActivityAt: updatedAt,
  };

  await updateDoc(doc(db, SUPPORT_REQUESTS_COLLECTION, requestId), payload);
  return payload.caseReport;
};

export const submitSupportFeedback = async ({ requestId, rating, comment }) => {
  const submittedAt = new Date().toISOString();
  const feedback = {
    rating,
    comment,
    submittedAt,
  };

  await updateDoc(doc(db, SUPPORT_REQUESTS_COLLECTION, requestId), { feedback });

  return feedback;
};
