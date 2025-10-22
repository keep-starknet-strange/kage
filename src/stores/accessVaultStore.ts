import { create } from "zustand";
import { useAppDependenciesStore } from "./appDependenciesStore";
import Keychain from "react-native-keychain";

export type PassphrasePrompt = {
    type: "passphrasePrompt";
}

export type BiometricsPrompt = {
    type: "biometricsPrompt";
}

export type AccessVaultChallenge = {
    prompt: PassphrasePrompt | BiometricsPrompt | null;
}

export interface AccessVaultState {
    challenge: AccessVaultChallenge;

    /**
     * Requests access to the vault and returns the user's seed phrase if access is granted.
     * 
     * This method will determine which authentication factor to prompt the user for—
     * either biometrics (if enabled and available) or a passphrase prompt.
     * 
     * Remarks:
     * - Only one seed phrase is currently stored; future versions may support accessing multiple factors by ID.
     * - If biometrics have been disabled or are unavailable, falls back to passphrase prompt.
     * - Triggers the appropriate UI prompt by updating `challenge.prompt` in the store state.
     * - Returns a promise that resolves to the unlocked seed phrase, or rejects if authentication fails.
     * 
     * @returns Promise<string> The user's decrypted seed phrase.
     */
    requestAccess: () => Promise<string>;

    readonly resolveSeedPhrasePromise: ((seedPhrase: string) => void) | null;
    readonly rejectSeedPhrasePromise: ((reason?: string) => void) | null;

    handlePassphraseSubmit: (passphrase: string) => Promise<void>;
    handlePassphraseReject: (reason?: string) => void;
}

export const useAccessVaultStore = create<AccessVaultState>((set) => ({
    challenge: {
        prompt: null,
    },
    resolveSeedPhrasePromise: null,
    rejectSeedPhrasePromise: null,

    requestAccess: async () => {
        const appDependencies = useAppDependenciesStore.getState();
        const storage = appDependencies.keyValueStorage;
        const seedPhraseVault = appDependencies.seedPhraseVault;

        // Could decide what factor to request access.
        // For now, only one seed phrase is stored.

        let useBiometrics = await storage.getOrDefault("device.biometrics.enabled", false)
        if (useBiometrics) {
            const biometricsAvailable = await Keychain.getSupportedBiometryType() !== null;

            if (!biometricsAvailable) {
                await storage.set("device.biometrics.enabled", false);
                useBiometrics = false;
            }
        }

        if (useBiometrics) {
            set({ challenge: { prompt: { type: "biometricsPrompt" } } });
            const seedPhrase = await seedPhraseVault.getSeedPhraseWithBiometrics({});
            set({challenge: { prompt: null } });

            if (seedPhrase) {
                return seedPhrase;
            } else {
                throw new Error("Failed to get seed phrase with biometrics");
            }
        } else {
            return new Promise((resolve, reject) => {
                set({
                    challenge: { prompt: { type: "passphrasePrompt" } },
                    resolveSeedPhrasePromise: resolve,
                    rejectSeedPhrasePromise: reject,
                })
            })
        }

    },

    handlePassphraseSubmit: async (passphrase: string) => {
        const seedPhraseVault = useAppDependenciesStore.getState().seedPhraseVault;
        const seedPhrase = await seedPhraseVault.getSeedPhraseWithPassphrase(passphrase);
        
        set((state) => {
            if (state.resolveSeedPhrasePromise && state.rejectSeedPhrasePromise) {
                if (seedPhrase) {
                    state.resolveSeedPhrasePromise(seedPhrase);
                } else {
                    state.rejectSeedPhrasePromise("Failed to get seed phrase with passphrase");
                }
            }
            return {
                challenge: {
                    prompt: null
                },
                resolvePassphreasePromise: null,
                rejectPassphreasePromise: null,
            }
        })
    },

    handlePassphraseReject: (reason?: string) => {
        set((state) => {
            if (state.rejectSeedPhrasePromise) {
                state.rejectSeedPhrasePromise(reason);
            }
            return {
                challenge: {
                    prompt: null
                },
                resolvePassphreasePromise: null,
                rejectPassphreasePromise: null,
            }
        })
    },
}));