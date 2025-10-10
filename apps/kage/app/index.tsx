import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { useAuthStore } from '../stores/useAuthStore';

export default function Index() {
  const router = useRouter();
  const { initialized, isOnboarded, isLocked } = useAuthStore((state) => ({
    initialized: state.initialized,
    isOnboarded: state.isOnboarded,
    isLocked: state.isLocked,
  }));

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
