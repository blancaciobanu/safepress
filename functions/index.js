import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp();

const callerIsAdmin = (auth) =>
  auth?.token?.admin === true && auth?.token?.email_verified === true;

export const setAdminClaim = onCall({ region: 'europe-west1' }, async (request) => {
  if (!callerIsAdmin(request.auth)) {
    throw new HttpsError('permission-denied', 'caller must be an admin');
  }

  const { targetUid, admin } = request.data || {};
  if (typeof targetUid !== 'string' || targetUid.length === 0) {
    throw new HttpsError('invalid-argument', 'targetUid is required');
  }
  if (typeof admin !== 'boolean') {
    throw new HttpsError('invalid-argument', 'admin must be a boolean');
  }

  const targetUser = await getAuth().getUser(targetUid).catch(() => null);
  if (!targetUser) {
    throw new HttpsError('not-found', 'no user with that uid');
  }

  const existingClaims = targetUser.customClaims || {};
  await getAuth().setCustomUserClaims(targetUid, {
    ...existingClaims,
    admin,
  });

  await getFirestore()
    .collection('users')
    .doc(targetUid)
    .set({ claimsUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });

  return { success: true, targetUid, admin };
});
