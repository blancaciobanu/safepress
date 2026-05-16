import { useState } from 'react';
import { getPublicProfile } from '../../users/services/userService';
import { getAuthorProfile } from '../services/communityService';
import { logError } from '../../../utils/logger';

export const useAuthorProfile = () => {
  const [authorProfile, setAuthorProfile] = useState(null);

  const openProfile = async (uid, type = 'journalist') => {
    if (!uid) return;
    setAuthorProfile({ uid, loading: true, type });
    try {
      const profile = await getAuthorProfile(uid, getPublicProfile, type);
      setAuthorProfile(profile ? { ...profile, loading: false } : null);
    } catch (err) {
      logError('Error loading profile:', err);
      setAuthorProfile(null);
    }
  };

  return { authorProfile, setAuthorProfile, openProfile };
};
