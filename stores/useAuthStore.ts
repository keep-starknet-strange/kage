import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { hashSecret } from '../utils/security';

const PASSCODE_KEY = 'kage_passcode_hash';
const DECOY_KEY = 'kage_decoy_hash';
const ONBOARD_KEY = 'kage_onboarded_flag';

let passcodeHashMemory: string | null = null;
let decoyHashMemory: string | null = null;

interface AuthState {
  initialized: boolean;
  isOnboarded: boolean;
  isLocked: boolean;
  hasPasscode: boolean;
  hasDecoy: boolean;
  isDecoySession: boolean;
}

interface AuthActions {
  initialize: () => Promise<void>;
  completeOnboarding: () => void;
  setPasscode: (pin: string) => Promise<void>;
  setDecoyPin: (pin: string | null) => Promise<void>;
  validatePasscode: (pin: string) => Promise<'primary' | 'decoy' | 'invalid'>;
  lock: () => void;
  unlock: (mode: 'primary' | 'decoy') => void;
}

const DEFAULT_STATE: AuthState = {
  initialized: false,
  isOnboarded: false,
  isLocked: false,
  hasPasscode: false,
  hasDecoy: false,
  isDecoySession: false,
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...DEFAULT_STATE,
  initialize: async () => {
    const [passcodeHash, decoyHash, onboardedFlag] = await Promise.all([
      SecureStore.getItemAsync(PASSCODE_KEY),
      SecureStore.getItemAsync(DECOY_KEY),
      SecureStore.getItemAsync(ONBOARD_KEY),
    ]);
    passcodeHashMemory = passcodeHash;
    decoyHashMemory = decoyHash;
    set({
      initialized: true,
      hasPasscode: Boolean(passcodeHash),
      hasDecoy: Boolean(decoyHash),
      isLocked: Boolean(passcodeHash),
      isOnboarded: onboardedFlag === 'yes',
    });
  },
  completeOnboarding: () => {
    SecureStore.setItemAsync(ONBOARD_KEY, 'yes').catch(() => undefined);
    set({ isOnboarded: true });
  },
  setPasscode: async (pin: string) => {
    const hashed = await hashSecret(pin);
    await SecureStore.setItemAsync(PASSCODE_KEY, hashed);
    passcodeHashMemory = hashed;
    set({ hasPasscode: true, isLocked: true });
  },
  setDecoyPin: async (pin) => {
    if (!pin) {
      await SecureStore.deleteItemAsync(DECOY_KEY);
      decoyHashMemory = null;
      set({ hasDecoy: false });
      return;
    }
    const hashed = await hashSecret(pin);
    await SecureStore.setItemAsync(DECOY_KEY, hashed);
    decoyHashMemory = hashed;
    set({ hasDecoy: true });
  },
  validatePasscode: async (pin) => {
    const hashed = await hashSecret(pin);
    if (passcodeHashMemory && hashed === passcodeHashMemory) {
      set({ isLocked: false, isDecoySession: false });
      return 'primary';
    }
    if (decoyHashMemory && hashed === decoyHashMemory) {
      set({ isLocked: false, isDecoySession: true });
      return 'decoy';
    }
    return 'invalid';
  },
  lock: () => set({ isLocked: true, isDecoySession: false }),
  unlock: (mode) => set({ isLocked: false, isDecoySession: mode === 'decoy' }),
}));
