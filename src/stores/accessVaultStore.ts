import { create } from "zustand";
import { useAppDependenciesStore } from "./appDependenciesStore";
import Keychain from "react-native-keychain";
import { mnemonicToWords } from "@starkms/key-management";
import { AuthPrompt } from "@/storage/encrypted/EncryptedStorage";
import { KeySourceId } from "@/profile/keys/keySource";

export type AuthorizationType = "passphrase" | "biometrics";

export type SeedPhraseRequest = {
    keySourceId: KeySourceId;
    output: string[] // Seed phrase words
};

export type PassphraseRequest = {
    output: string // Passphrase
};

interface RequestSchema {
    seedphrase: SeedPhraseRequest;

    passphrase: PassphraseRequest;
}

export type RequestAccessPrompt = {
    input: keyof RequestSchema;
    validateWith: AuthorizationType;
}

export interface AccessVaultState {
    prompt: RequestAccessPrompt | null;

    /**
     /**
      * Requests access to the vault and returns either the user's passphrase or their seed phrase,
      * depending on the type of input requested.
      * 
      * This method can prompt the user for a passphrase, or for seed phrase access via biometrics (if enabled)
      * or a fallback passphrase prompt as appropriate. An optional `prompt` parameter may be provided to customize
      * the UI prompt (e.g., title or message) shown to the user during authentication.
      * 
      * Remarks:
      * - Only one seed phrase is currently stored; future versions may support accessing multiple factors by ID.
      * - If biometrics are disabled or unavailable, the method will fall back to a passphrase prompt for seed phrase access.
      * - Triggers the appropriate UI prompt by updating `prompt` in the store state.
      * - Returns a promise that resolves to either the unlocked seed phrase (as a string array), or the user's passphrase (as a string),
      *   depending on the input specified.
      * - The promise is rejected if authentication fails or is cancelled.
      * 
      * @param input The type of credential to request ("passphrase" or "seedphrase").
      * @param [prompt] Optional prompt to customize the authentication UI (e.g., title/message).
      * @returns Promise<string | string[]> The user's passphrase, or the decrypted seed phrase as an array of words.
      */
    requestAccess: <I extends keyof RequestSchema>(input: I, prompt?: AuthPrompt) => Promise<RequestSchema[I]["output"]>;
    
    // Promises for async passphrase input
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

    requestAccess: async <I extends keyof RequestSchema>(input: I, authPrompt?: AuthPrompt) => {    
        if (input === "passphrase") {
            return await new Promise<string>((resolve, reject) => {
                set({
                    prompt: { input, validateWith: "passphrase" },
                    passphrasePromise: { resolve, reject },
                })
            });
        }

        const {keySourceId} = input;

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
            const seedPhrase = await seedPhraseVault.getSeedPhraseWithBiometrics(authPrompt ?? { title: "Access Seed Phrase" }, keySourceId);
            set({ prompt: null });

            if (seedPhrase) {
                return mnemonicToWords(seedPhrase);
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

            if (seedPhrase) {
                return mnemonicToWords(seedPhrase);
            } else {
                throw new Error("Failed to get seed phrase with passphrase");
            }
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