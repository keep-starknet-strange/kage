import Account from "@/profile/account";
import Amount from "@/types/amount";
import { create } from "zustand";
import { useAccessVaultStore } from "./accessVaultStore";

interface PrivateTxStoreState {
    fund: (from: Account, to: Account, amount: Amount) => Promise<void>;
}

const usePrivateTxStore = create<PrivateTxStoreState>(() => ({
    fund: async (from: Account, to: Account, amount: Amount) => {
        const { requestAccess } = useAccessVaultStore.getState();


    }
}));