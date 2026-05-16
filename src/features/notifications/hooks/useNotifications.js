import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getNotificationCount, getNotifications } from '../services/notificationService';
import { logError } from '../../../utils/logger';

const CACHE_PREFIX = 'notif-count:';

const getCacheKey = (uid) => `${CACHE_PREFIX}${uid}`;

const readCache = (uid) => {
  if (!uid || typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(getCacheKey(uid));
  return raw !== null ? Number(raw) || 0 : null;
};

const writeCache = (uid, count) => {
  if (!uid || typeof window === 'undefined') return;
  window.sessionStorage.setItem(getCacheKey(uid), String(count));
};

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setNotifCount(0);
      return;
    }

    let cancelled = false;
    let timeoutId = null;
    let idleId = null;

    const cached = readCache(user.uid);
    if (cached !== null) setNotifCount(cached);

    const loadCount = async () => {
      try {
        const count = await getNotificationCount(user);
        if (cancelled) return;
        setNotifCount(count);
        writeCache(user.uid, count);
      } catch {
        // notifications never block navigation
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(loadCount, { timeout: 2500 });
    } else {
      timeoutId = window.setTimeout(loadCount, 1200);
    }

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      if (idleId && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [user?.uid]);

  const onOpen = async () => {
    if (!user) return;
    setNotifLoading(true);
    try {
      const notifs = await getNotifications(user);
      setNotifications(notifs);
      setNotifCount(0);
      writeCache(user.uid, 0);
    } catch (err) {
      logError('Error fetching notifications:', err);
    }
    setNotifLoading(false);
  };

  return { notifications, notifCount, notifLoading, onOpen };
};
