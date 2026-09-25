import { useEffect, useState } from 'react';
import { useAuthUser } from './useStudentAuth';
import { fallbackProfileFromUser, getMyProfile, registerUserProfile } from '../lib/userProfile';

export function useUserProfile() {
  const user = useAuthUser();
  const [profile, setProfile] = useState(undefined);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      setProfile(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        let data = await getMyProfile(user);
        if (!data.profile) {
          data = await registerUserProfile(user, user.displayName);
        }
        if (!cancelled) setProfile(data.profile);
      } catch (err) {
        try {
          const data = await registerUserProfile(user, user.displayName);
          if (!cancelled) setProfile(data.profile);
        } catch (regErr) {
          if (!cancelled) {
            setError(regErr.message || 'Failed to load profile');
            setProfile(fallbackProfileFromUser(user));
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { user, profile, error, loading: user === undefined || profile === undefined };
}
