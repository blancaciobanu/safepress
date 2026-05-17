import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  getCommunityNotificationCount,
  getNotifications,
  subscribeToSupportNotificationCount,
} from '../services/notificationService';
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
  const [supportCount, setSupportCount] = useState(0);
  const [communityCount, setCommunityCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    const total = supportCount + communityCount;
    setNotifCount(total);
    if (user?.uid) writeCache(user.uid, total);
  }, [supportCount, communityCount, user?.uid]);

  useEffect(() => {
    if (!user) {
      setSupportCount(0);
      setCommunityCount(0);
      setNotifCount(0);
      return;
    }

    let cancelled = false;

    const cached = readCache(user.uid);
    if (cached !== null) setNotifCount(cached);

    const unsubscribeSupport = subscribeToSupportNotificationCount(
      user,
      (supportCount) => {
        if (cancelled) return;
        setSupportCount(supportCount);
      },
      () => {}
    );

    const loadCommunityCount = async () => {
      try {
        const count = await getCommunityNotificationCount(user);
        if (cancelled) return;
        setCommunityCount(count);
      } catch {
        // notifications never block navigation
      }
    };

    loadCommunityCount();

    return () => {
      cancelled = true;
      unsubscribeSupport();
    };
  }, [user?.uid]);

  const onOpen = async () => {
    if (!user) return;
    setNotifLoading(true);
    try {
      const notifs = await getNotifications(user);
      setNotifications(notifs);
      setSupportCount(0);
      setCommunityCount(0);
      setNotifCount(0);
      writeCache(user.uid, 0);
    } catch (err) {
      logError('Error fetching notifications:', err);
    }
    setNotifLoading(false);
  };

  return { notifications, notifCount, notifLoading, onOpen };
};
