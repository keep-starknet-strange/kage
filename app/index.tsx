import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { useAuthStore } from '../stores/useAuthStore';

export default function Index() {
  const router = useRouter();
  const initialized = useAuthStore((state) => state.initialized);
  const isOnboarded = useAuthStore((state) => state.isOnboarded);
  const isLocked = useAuthStore((state) => state.isLocked);

  useEffect(() => {
    if (!initialized) return;
    if (!isOnboarded) {
      router.replace('/auth/onboarding');
      return;
    }
    if (isLocked) {
      router.replace({ pathname: '/auth/passcode', params: { phase: 'unlock' } });
      return;
    }
    router.replace('/(tabs)/home');
  }, [initialized, isOnboarded, isLocked, router]);

  return null;
}
