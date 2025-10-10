import { create } from 'zustand';

import { mockChain } from '../domain/mockChain';
import { AssocSet, Balance, Contact, Txn, ViewingKey } from '../domain/models';
import { generateAddressList } from '../utils/address';

type WalletState = {
  balances: Balance[];
  activity: Txn[];
  viewingKeys: ViewingKey[];
  contacts: Contact[];
  mnemonicPreview: string[];
  receiveQueue: string[];
  loading: boolean;
  lastUpdated?: number;
};

type WalletActions = {
  bootstrap: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  refreshActivity: () => Promise<void>;
  setMnemonicPreview: (words: string[]) => void;
  rotateReceiveAddress: () => void;
  send: (options: {
    to: string;
    amount: number;
    currency: Balance['currency'];
    privacy: 'PUBLIC' | 'PRIVATE';
    assocSet?: AssocSet;
  }) => Promise<Txn>;
  swap: (options: {
    fromCurrency: Balance['currency'];
    toCurrency: Balance['currency'];
    amount: number;
    privacy: 'PUBLIC' | 'PRIVATE';
  }) => Promise<Txn>;
  depositShielded: (options: { amount: number; denom: number }) => Promise<void>;
  withdrawShielded: (options: { amount: number; assocSet: AssocSet }) => Promise<{ proof: string }>;
  issueViewingKey: (label: string) => Promise<ViewingKey>;
  revokeViewingKey: (id: string) => Promise<ViewingKey | undefined>;
};

const INITIAL_STATE: WalletState = {
  balances: [],
  activity: [],
  viewingKeys: [],
  contacts: [],
  mnemonicPreview: [],
  receiveQueue: generateAddressList(),
  loading: false,
};

export const useWalletStore = create<WalletState & WalletActions>((set) => ({
  ...INITIAL_STATE,
  setMnemonicPreview: (words) => set({ mnemonicPreview: words }),
  rotateReceiveAddress: () =>
    set((state) => ({
      receiveQueue: state.receiveQueue.length
        ? [...state.receiveQueue.slice(1), state.receiveQueue[0]]
        : generateAddressList(),
    })),
  bootstrap: async () => {
    set({ loading: true });
    const [balances, activity, contacts, viewingKeys] = await Promise.all([
      Promise.resolve(mockChain.getBalances()),
      Promise.resolve(mockChain.listActivity()),
      Promise.resolve(mockChain.listContacts()),
      Promise.resolve(mockChain.listViewingKeys()),
    ]);
    set((state) => ({
      balances,
      activity,
      contacts,
      viewingKeys,
      receiveQueue: state.receiveQueue.length ? state.receiveQueue : generateAddressList(),
      loading: false,
      lastUpdated: Date.now(),
    }));
  },
  refreshBalances: async () => {
    const balances = await Promise.resolve(mockChain.getBalances());
    set({ balances, lastUpdated: Date.now() });
  },
  refreshActivity: async () => {
    const activity = await Promise.resolve(mockChain.listActivity());
    set({ activity, lastUpdated: Date.now() });
  },
  send: async (options) => {
    set({ loading: true });
    const txn = await mockChain.send(options);
    const balances = mockChain.getBalances();
    const activity = mockChain.listActivity();
    set({
      balances,
      activity,
      loading: false,
      lastUpdated: Date.now(),
    });
    return txn;
  },
  swap: async ({ fromCurrency, toCurrency, amount, privacy }) => {
    set({ loading: true });
    const { txn } = await mockChain.swap({ fromCurrency, toCurrency, amount, privacy });
    const balances = mockChain.getBalances();
    const activity = mockChain.listActivity();
    set({
      balances,
      activity,
      loading: false,
      lastUpdated: Date.now(),
    });
    return txn;
  },
  depositShielded: async ({ amount, denom }) => {
    set({ loading: true });
    await mockChain.depositShielded({ amount, denom });
    set({
      balances: mockChain.getBalances(),
      activity: mockChain.listActivity(),
      loading: false,
      lastUpdated: Date.now(),
    });
  },
  withdrawShielded: async ({ amount, assocSet }) => {
    set({ loading: true });
    const result = await mockChain.withdrawShielded({ amount, assocSet });
    set({
      balances: mockChain.getBalances(),
      activity: mockChain.listActivity(),
      loading: false,
      lastUpdated: Date.now(),
    });
    return result;
  },
  issueViewingKey: async (label) => {
    const key = await Promise.resolve(mockChain.issueViewingKey({ label }));
    set({ viewingKeys: mockChain.listViewingKeys(), lastUpdated: Date.now() });
    return key;
  },
  revokeViewingKey: async (id) => {
    const key = await Promise.resolve(mockChain.revokeViewingKey(id));
    set({ viewingKeys: mockChain.listViewingKeys(), lastUpdated: Date.now() });
    return key;
  },
}));
