import Account, { AccountAddress } from "@/profile/account";
import Profile from "@/profile/profile";
import { ProfileState } from "@/profile/profileState";
import NetworkDefinition from "@/profile/settings/networkDefinition";
import { AppError } from "@/types/appError";
import { generateMnemonicWords, StarknetKeyPair } from "@starkms/key-management";
import { create } from "zustand";
import { RequestAccessFn } from "./accessVaultStore";
import { useAppDependenciesStore } from "./appDependenciesStore";

export interface ProfileStoreState {
    readonly profileState: ProfileState;

    initialize: () => Promise<void>;
    create: (passphrase: string, accountName: string) => Promise<void>;
    restore: (
        networkDefinition: NetworkDefinition,
        passphrase: string,
        seedPhraseWords: string[],
        accountData: Map<AccountAddress, {index: number; keyPair: StarknetKeyPair}>
    ) => Promise<void>;
    addAccount: (accountName: string, requestAccess: RequestAccessFn) => Promise<void>;
    renameAccount: (account: Account, newName: string) => Promise<void>;
    delete: () => Promise<void>;
}

export const useProfileStore = create<ProfileStoreState>((set, get) => ({
    profileState: "idle",
    initialize: async () => {
        const { profileState } = get();
        const { profileStorage } = useAppDependenciesStore.getState();

        if (!ProfileState.canChangeProfileState(profileState)) {
            throw new AppError("Profile state cannot be updated", profileState);
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
            throw error;
        }
    },

    create: async (passphrase: string, accountName: string) => {
        const { profileState } = get();
        const { seedPhraseVault, profileStorage } = useAppDependenciesStore.getState();

        if (!ProfileState.canCreateProfile(profileState)) {
            throw new AppError("Profile state cannot be created", profileState);
        }

        const seedPhraseWords = generateMnemonicWords();
        const profile = Profile.createFromSeedPhrase(seedPhraseWords);
        const updatedProfile = profile.addAccountOnCurrentNetwork(accountName, seedPhraseWords);

        await seedPhraseVault.setup(passphrase, seedPhraseWords);

        await profileStorage.storeProfile(updatedProfile);
        set({ profileState: updatedProfile });
    },

    restore: async (
        networkDefinition: NetworkDefinition,
        passphrase: string,
        seedPhraseWords: string[],
        accountData: Map<AccountAddress, {
            index: number;
            keyPair: StarknetKeyPair;
        }>,
    ) => {
        const { profileState } = get();
        const { seedPhraseVault, profileStorage } = useAppDependenciesStore.getState();

        if (!ProfileState.canCreateProfile(profileState)) {
            throw new AppError("Profile state cannot be created", profileState);
        }

        const profile = Profile.createFromSeedPhraseOnNetwork(networkDefinition, seedPhraseWords);
        const data = Array.from(accountData.entries()).map(([accountAddress, { index, keyPair }]) => ({
            index,
            accountAddress,
            keySourceId: profile.keySources[0].id,
            keyPair,
        }));
        
        const updatedProfile = profile.addRestoredAccountsWithSeedPhraseOnCurrentNetwork(data);

        await profileStorage.storeProfile(updatedProfile);

        const created = seedPhraseVault.setup(passphrase, seedPhraseWords);
        if (!created) {
            throw new AppError("Failed to store seed phrase in vault");
        }

        set({ profileState: updatedProfile });
    },

    addAccount: async (accountName: string, requestAccess: RequestAccessFn) => {
        const { profileState } = get();
        const { profileStorage } = useAppDependenciesStore.getState();

        if (!ProfileState.isProfile(profileState)) {
            throw new AppError("Profile state cannot be updated", profileState);
        }

        const result = await requestAccess({
            requestFor: "seedPhrase",
            keySourceId: profileState.keySources[0].id,
        });

        const updatedProfile = profileState.addAccountOnCurrentNetwork(accountName, result.seedPhrase.getWords());
        await profileStorage.storeProfile(updatedProfile);

        set({ profileState: updatedProfile });
    },

    renameAccount: async (account: Account, newName: string) => {
        const { profileState } = get();
        const { profileStorage } = useAppDependenciesStore.getState();

        if (!ProfileState.isProfile(profileState)) {
            throw new AppError("Profile state cannot be updated", profileState);
        }

        const updatedProfile = profileState.renameAccount(account, newName);
        await profileStorage.storeProfile(updatedProfile);
        set({ profileState: updatedProfile });
    },

    delete: async () => {
        const { profileState } = get();
        const { profileStorage, seedPhraseVault } = useAppDependenciesStore.getState();

        if (!ProfileState.isProfile(profileState)) {
            throw new AppError("Profile state cannot be deleted", profileState);
        }

        await profileStorage.deleteProfile();
        await seedPhraseVault.reset(profileState.keySources.map(keySource => keySource.id));

        set({ profileState: null });
    },
}));