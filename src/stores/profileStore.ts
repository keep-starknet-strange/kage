import Profile from "@/profile/profile";
import { ProfileState } from "@/profile/profileState";
import { generateMnemonicWords } from "@starkms/key-management";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { useAppDependenciesStore } from "./appDependenciesStore";

export interface ProfileStoreState {
    readonly profileState: ProfileState;

    initialize: () => Promise<void>;
    create: (passphrase: string, accountName: string) => Promise<void>;
    update: (profile: Profile) => Promise<void>;
    restore: (passphrase: string, seedPhraseWords: string[]) => Promise<void>;
    delete: () => Promise<void>;
}

export const useProfileStore = create<ProfileStoreState>()(
    subscribeWithSelector((set, get) => ({
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
                console.error("Failed to initialize profile", error);
            }
        },

        create: async (passphrase: string, accountName: string) => {
            const { profileState } = get();
            const { seedPhraseVault, profileStorage } = useAppDependenciesStore.getState();

            if (!ProfileState.canCreateProfile(profileState)) {
                throw new Error(`Profile state cannot be created: ${profileState}`);
            }

            const seedPhraseWords = generateMnemonicWords();
            const profile = Profile.createFromSeedPhrase(seedPhraseWords);
            const updatedProfile = profile.addAccountOnCurrentNetwork(accountName, seedPhraseWords);

            const created = await seedPhraseVault.setup(passphrase, seedPhraseWords);
            if (!created) {
                throw new Error("Failed to store seed phrase in vault");
            }

            await profileStorage.storeProfile(updatedProfile);
            set({ profileState: updatedProfile });
        },

        restore: async (passphrase: string, seedPhraseWords: string[]) => {
            const { profileState } = get();
            const { seedPhraseVault, profileStorage } = useAppDependenciesStore.getState();

            if (!ProfileState.canCreateProfile(profileState)) {
                throw new Error(`Profile state cannot be created: ${profileState}`);
            }

            const profile = Profile.createFromSeedPhrase(seedPhraseWords);
            const updatedProfile = profile.addAccountOnCurrentNetwork("Restored Account 1", seedPhraseWords);
            await profileStorage.storeProfile(updatedProfile);

            const created = seedPhraseVault.setup(passphrase, seedPhraseWords);
            if (!created) {
                throw new Error("Failed to store seed phrase in vault");
            }

            set({ profileState: updatedProfile });
        },

        update: async (profile: Profile) => {
            set({ profileState: profile });
        },

        delete: async () => {
            const { profileState } = get();
            const { profileStorage, seedPhraseVault, keyValueStorage } = useAppDependenciesStore.getState();

            if (!ProfileState.isProfile(profileState)) {
                throw new Error(`Profile state cannot be deleted: ${profileState}`);
            }

            await profileStorage.deleteProfile();
            await keyValueStorage.clear();
            await seedPhraseVault.reset(profileState.keySources.map(keySource => keySource.id));

            set({ profileState: null });
        },
    })));