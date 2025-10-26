import Profile from "@/profile/profile";
import { ProfileState } from "@/profile/profileState";
import { generateMnemonicWords } from "@starkms/key-management";
import { create } from "zustand";
import { useAppDependenciesStore } from "./appDependenciesStore";

export interface ProfileStoreState {
    readonly profileState: ProfileState;

    initialize: () => Promise<void>;
    create: (passphrase: string, seedPhraseWords: string[]) => Promise<void>;
    update: (profile: Profile) => Promise<void>;

}

export const useProfileStore = create<ProfileStoreState>((set, get) => ({
    profileState: "idle",

    initialize: async () => {
        const { profileState } = get();
        const { profileStorage } = useAppDependenciesStore.getState();

        if (!ProfileState.canChangeProfileState(profileState)) {
            throw new Error(`Profile state cannot be updated: ${profileState}`);
        }

        set({ profileState: "retrieving" });
        try {
            const profile = await profileStorage.readProfile();

            if (profile === null) {
                set({ profileState: null });
            } else {
                set({ profileState: profile });
            }
        } catch (error) {
            set({ profileState: { type: "profileStateError", error: Error("Failed to initialize profile") } });
        }
    },

    create: async (passphrase: string) => {
        const { profileState } = get();
        const { seedPhraseVault } = useAppDependenciesStore.getState();

        if (!ProfileState.canCreateProfile(profileState)) {
            throw new Error(`Profile state cannot be created: ${profileState}`);
        }

        const seedPhraseWords = generateMnemonicWords();
        const created = seedPhraseVault.setup(passphrase, seedPhraseWords);
        if (!created) {
            throw new Error("Failed to create seed phrase");
        }

        const profile = Profile.createFromSeedPhrase(seedPhraseWords);
        set({ profileState: profile });
    },

    update: async (profile: Profile) => {
        set({ profileState: profile });
    }
}));