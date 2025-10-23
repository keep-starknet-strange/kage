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

export type RequestAccessInput = "passphrase" | "seedphrase";

export type RequestAccessPrompt = {
    input: RequestAccessInput;
    validateWith: "passphrase" | "biometrics";
}

export interface AccessVaultState {
    prompt: RequestAccessPrompt | null;

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
    requestAccess: (input: RequestAccessInput) => Promise<string | null>;
    
    readonly passphrasePromise: {
        resolve: (passphrase: string) => void;
        reject: (reason?: string) => void;
    } |  null;

    handlePassphraseSubmit: (passphrase: string) => Promise<void>;
    handlePassphraseReject: (reason?: string) => void;
}

export const useAccessVaultStore = create<AccessVaultState>((set) => ({
    prompt: null,
    passphrasePromise: null,

    requestAccess: async (input: RequestAccessInput) => {    
        if (input === "passphrase") {
            return await new Promise<string>((resolve, reject) => {
                set({
                    prompt: { input, validateWith: "passphrase" },
                    passphrasePromise: { resolve, reject },
                })
            });
        }

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
            set({ prompt: { input, validateWith: "biometrics" } });
            const seedPhrase = await seedPhraseVault.getSeedPhraseWithBiometrics({
                title: "Access Seed Phrase",
            });
            set({ prompt: null });

            if (seedPhrase) {
                return seedPhrase;
            } else {
                throw new Error("Failed to get seed phrase with biometrics");
            }
        } else {
            let passphrase = await new Promise<string>((resolve, reject) => {
                set({
                    prompt: { input, validateWith: "passphrase" },
                    passphrasePromise: { resolve, reject },
                })
            })

            const seedPhraseVault = useAppDependenciesStore.getState().seedPhraseVault;
            const seedPhrase = await seedPhraseVault.getSeedPhraseWithPassphrase(passphrase);
            return seedPhrase;
        }
    },

    handlePassphraseSubmit: async (passphrase: string) => {
        set((state) => {
            state.passphrasePromise?.resolve(passphrase);
            return {
                prompt: null,
                requestAccessPromise: null,
            }
        })
    },

    handlePassphraseReject: (reason?: string) => {
        set((state) => {
            state.passphrasePromise?.reject(reason);
            return {
                prompt: null,
                requestAccessPromise: null,
            }
        })
    },
}));