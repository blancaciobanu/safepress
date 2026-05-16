import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { COLLECTIONS } from '../../../config/firebaseCollections';

export const useAMAs = () => {
  const [amas, setAmas]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.COMMUNITY_POSTS),
      where('type', '==', 'ama'),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const ta = a.lastCommentAt || a.createdAt || '';
            const tb = b.lastCommentAt || b.createdAt || '';
            return tb > ta ? 1 : -1;
          });
        setAmas(docs);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  return { amas, loading };
};
