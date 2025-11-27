import { KeyPair } from "@/crypto/kms/KMSProvider";
import Account, { AccountAddress } from "@/profile/account";
import { NetworkId } from "@/profile/misc";
import Profile from "@/profile/profile";
import { ProfileState } from "@/profile/profileState";
import NetworkDefinition from "@/profile/settings/networkDefinition";
import { AppError } from "@/types/appError";
import SeedPhraseWords from "@/types/seedPhraseWords";
import i18n from "@/utils/i18n";
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
        seedPhrase: SeedPhraseWords,
        accountData: Map<AccountAddress, {index: number; keyPair: KeyPair}>
    ) => Promise<void>;
    addAccount: (accountName: string, requestAccess: RequestAccessFn) => Promise<void>;
    renameAccount: (account: Account, newName: string) => Promise<void>;
    changeNetwork: (network: NetworkId) => Promise<void>;
    delete: () => Promise<void>;
}

export const useProfileStore = create<ProfileStoreState>((set, get) => ({
    profileState: "idle",
    initialize: async () => {
        const { profileState } = get();
        const { profileStorage } = useAppDependenciesStore.getState();

        if (!ProfileState.canChangeProfileState(profileState)) {
            throw new AppError(i18n.t('errors.profileCannotBeUpdated'), profileState);
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
            set({ profileState: { type: "profileStateError", error: Error(i18n.t('errors.failedToInitializeProfile')) } });
            throw error;
        }
    },

    create: async (passphrase: string, accountName: string) => {
        const { profileState } = get();
        const { seedPhraseVault, profileStorage } = useAppDependenciesStore.getState();

        if (!ProfileState.canCreateProfile(profileState)) {
            throw new AppError(i18n.t('errors.profileCannotBeCreated'), profileState);
        }

        const seedPhrase = SeedPhraseWords.generate();
        const profile = Profile.createFromSeedPhrase(seedPhrase);
        const updatedProfile = profile.addAccountOnCurrentNetwork(accountName, seedPhrase);

        await seedPhraseVault.setup(passphrase, seedPhrase);

        await profileStorage.storeProfile(updatedProfile);
        set({ profileState: updatedProfile });
    },

    restore: async (
        networkDefinition: NetworkDefinition,
        passphrase: string,
        seedPhrase: SeedPhraseWords,
        accountData: Map<AccountAddress, {
            index: number;
            keyPair: KeyPair;
        }>,
    ) => {
        const { profileState } = get();
        const { seedPhraseVault, profileStorage } = useAppDependenciesStore.getState();

        if (!ProfileState.canCreateProfile(profileState)) {
            throw new AppError(i18n.t('errors.profileCannotBeCreated'), profileState);
        }

        const profile = Profile.createFromSeedPhraseOnNetwork(networkDefinition, seedPhrase);
        const data = Array.from(accountData.entries()).map(([accountAddress, { index, keyPair }]) => ({
            index,
            accountAddress,
            keySourceId: profile.keySources[0].id,
            keyPair,
        }));
        
        const updatedProfile = profile.addRestoredAccountsWithSeedPhraseOnCurrentNetwork(data);

        await profileStorage.storeProfile(updatedProfile);

        const created = seedPhraseVault.setup(passphrase, seedPhrase);
        if (!created) {
            throw new AppError(i18n.t('errors.failedToStoreSeedPhrase'));
        }

        set({ profileState: updatedProfile });
    },

    addAccount: async (accountName: string, requestAccess: RequestAccessFn) => {
        const { profileState } = get();
        const { profileStorage } = useAppDependenciesStore.getState();

        if (!ProfileState.isProfile(profileState)) {
            throw new AppError(i18n.t('errors.profileCannotBeUpdated'), profileState);
        }

        const result = await requestAccess({
            requestFor: "seedPhrase",
            keySourceId: profileState.keySources[0].id,
        }, {
            title: i18n.t('biometricPrompts.creatingAccount.title'),
            subtitleAndroid: `Authorize to create account ${accountName}`,
            descriptionAndroid: "KAGE needs your authentication to securely create an account using your private keys.",
            cancelAndroid: i18n.t('biometricPrompts.creatingAccount.cancelAndroid'),
        });

        const updatedProfile = profileState.addAccountOnCurrentNetwork(accountName, result.seedPhrase);
        await profileStorage.storeProfile(updatedProfile);

        set({ profileState: updatedProfile });
    },

    renameAccount: async (account: Account, newName: string) => {
        const { profileState } = get();
        const { profileStorage } = useAppDependenciesStore.getState();

        if (!ProfileState.isProfile(profileState)) {
            throw new AppError(i18n.t('errors.profileCannotBeUpdated'), profileState);
        }

        const updatedProfile = profileState.renameAccount(account, newName);
        await profileStorage.storeProfile(updatedProfile);
        set({ profileState: updatedProfile });
    },

    changeNetwork: async (network: NetworkId) => {
        const { profileState } = get();
        const { profileStorage } = useAppDependenciesStore.getState();

        if (!ProfileState.isProfile(profileState)) {
            throw new AppError(i18n.t('errors.profileCannotBeUpdated'), profileState);
        }

        const updatedProfile = profileState.changeNetwork(network);
        await profileStorage.storeProfile(updatedProfile);
        set({ profileState: updatedProfile });
    },
    
    delete: async () => {
        const { profileState } = get();
        const { profileStorage, seedPhraseVault } = useAppDependenciesStore.getState();

        if (!ProfileState.isProfile(profileState)) {
            throw new AppError(i18n.t('errors.profileCannotBeDeleted'), profileState);
        }

        await profileStorage.deleteProfile();
        await seedPhraseVault.reset(profileState.keySources.map(keySource => keySource.id));

        set({ profileState: null });
    },
}));