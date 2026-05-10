import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  writeBatch,
  where,
} from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { COLLECTIONS } from '../../../config/firebaseCollections';
import {
  SUPPORT_CONTACT_METHODS,
  SUPPORT_REQUEST_TYPES,
  SUPPORT_REQUEST_URGENCIES,
} from '../../../config/security';

const SUPPORT_REQUESTS_COLLECTION = COLLECTIONS.SUPPORT_REQUESTS;
const SUPPORT_REQUEST_QUEUE_COLLECTION = COLLECTIONS.SUPPORT_REQUEST_QUEUE;
const PUBLIC_PROFILES_COLLECTION = COLLECTIONS.PUBLIC_PROFILES;

const mapSnapshotDocs = (snapshot) =>
  snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));

const sortByCreatedAtDesc = (items = []) =>
  [...items].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

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
    createdAt,
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

export const claimSupportRequest = async ({ requestId, specialistId, specialistName }) => {
  const claimedAt = new Date().toISOString();
  const payload = {
    status: 'claimed',
    claimedBy: specialistId,
    claimedByName: specialistName,
    claimedAt,
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
  };

  const batch = writeBatch(db);
  batch.update(doc(db, SUPPORT_REQUESTS_COLLECTION, requestId), payload);
  batch.update(doc(db, SUPPORT_REQUEST_QUEUE_COLLECTION, requestId), payload);
  await batch.commit();

  return payload;
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
