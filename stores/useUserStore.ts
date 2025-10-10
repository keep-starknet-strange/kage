import { create } from 'zustand';

type UserState = {
  paranoidMode: boolean;
  biometricsEnabled: boolean;
  decoyPinEnabled: boolean;
  autoLockSeconds: number;
};

type UserActions = {
  setParanoidMode: (enabled: boolean) => void;
  setBiometricsEnabled: (enabled: boolean) => void;
  setDecoyPinEnabled: (enabled: boolean) => void;
  setAutoLockSeconds: (seconds: number) => void;
};

const DEFAULT_STATE: UserState = {
  paranoidMode: true,
  biometricsEnabled: true,
  decoyPinEnabled: false,
  autoLockSeconds: 60,
};

export const useUserStore = create<UserState & UserActions>((set) => ({
  ...DEFAULT_STATE,
  setParanoidMode: (enabled) => set({ paranoidMode: enabled }),
  setBiometricsEnabled: (enabled) => set({ biometricsEnabled: enabled }),
  setDecoyPinEnabled: (enabled) => set({ decoyPinEnabled: enabled }),
  setAutoLockSeconds: (seconds) => set({ autoLockSeconds: seconds }),
}));
