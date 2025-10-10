import { create } from 'zustand';

type PrivacyState = {
  privateMode: boolean;
  screenshotGuard: boolean;
  quickHideEnabled: boolean;
  camouflageEnabled: boolean;
  balancesHidden: boolean;
};

type PrivacyActions = {
  togglePrivateMode: () => void;
  setPrivateMode: (enabled: boolean) => void;
  setScreenshotGuard: (enabled: boolean) => void;
  setQuickHideEnabled: (enabled: boolean) => void;
  setCamouflageEnabled: (enabled: boolean) => void;
  quickHide: () => void;
  revealBalances: () => void;
};

const INITIAL_STATE: PrivacyState = {
  privateMode: true,
  screenshotGuard: true,
  quickHideEnabled: true,
  camouflageEnabled: false,
  balancesHidden: false,
};

export const usePrivacyStore = create<PrivacyState & PrivacyActions>((set) => ({
  ...INITIAL_STATE,
  togglePrivateMode: () => set((state) => ({ privateMode: !state.privateMode })),
  setPrivateMode: (enabled) => set({ privateMode: enabled }),
  setScreenshotGuard: (enabled) => set({ screenshotGuard: enabled }),
  setQuickHideEnabled: (enabled) => set({ quickHideEnabled: enabled }),
  setCamouflageEnabled: (enabled) => set({ camouflageEnabled: enabled }),
  quickHide: () => set({ balancesHidden: true }),
  revealBalances: () => set({ balancesHidden: false }),
}));
