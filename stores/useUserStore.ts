import { create } from 'zustand';

type ThemePreference = 'dark' | 'light';

type UserState = {
  theme: ThemePreference;
  paranoidMode: boolean;
  biometricsEnabled: boolean;
  decoyPinEnabled: boolean;
  autoLockSeconds: number;
};

type UserActions = {
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
  setParanoidMode: (enabled: boolean) => void;
  setBiometricsEnabled: (enabled: boolean) => void;
  setDecoyPinEnabled: (enabled: boolean) => void;
  setAutoLockSeconds: (seconds: number) => void;
};

const DEFAULT_STATE: UserState = {
  theme: 'light',
  paranoidMode: true,
  biometricsEnabled: true,
  decoyPinEnabled: false,
  autoLockSeconds: 60,
};

export const useUserStore = create<UserState & UserActions>((set) => ({
  ...DEFAULT_STATE,
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'dark' ? 'light' : 'dark',
    })),
  setParanoidMode: (enabled) => set({ paranoidMode: enabled }),
  setBiometricsEnabled: (enabled) => set({ biometricsEnabled: enabled }),
  setDecoyPinEnabled: (enabled) => set({ decoyPinEnabled: enabled }),
  setAutoLockSeconds: (seconds) => set({ autoLockSeconds: seconds }),
}));

export const selectTheme = (state: UserState) => state.theme;
