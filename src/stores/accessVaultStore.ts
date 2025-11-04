import { KeySourceId } from "@/profile/keys/keySource";
import { AuthPrompt } from "@/storage/encrypted/EncryptedStorage";
import { mnemonicToWords } from "@starkms/key-management";
import { create } from "zustand";
import { useAppDependenciesStore } from "./appDependenciesStore";

export type AuthorizationType = "passphrase" | "biometrics";

export type SeedPhraseInput = {
    requestFor: "seedphrase";
    keySourceId: KeySourceId;
}

export type PassphraseInput = {
    requestFor: "passphrase";
}

export type Input = SeedPhraseInput | PassphraseInput;

export type Output<I extends Input> =
    I extends SeedPhraseInput ? string[] :
    I extends PassphraseInput ? string :
    never;

export type RequestAccessPrompt = {
    input: Input;
    validateWith: AuthorizationType;
}

export type RequestAccessFn = <I extends Input>(input: I, prompt?: AuthPrompt) => Promise<Output<I>>;

export interface AccessVaultState {
    prompt: RequestAccessPrompt | null;

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
    requestAccess: RequestAccessFn;

    // Promises for async passphrase input
    readonly passphrasePromise: {
        resolve: (passphrase: string) => void;
        reject: (reason?: string) => void;
    } | null;
    handlePassphraseSubmit: (passphrase: string) => Promise<void>;
    handlePassphraseReject: (reason?: string) => void;
}

export const useAccessVaultStore = create<AccessVaultState>((set) => ({
    prompt: null,
    passphrasePromise: null,

    requestAccess: async <I extends Input>(input: I, authPrompt?: AuthPrompt): Promise<Output<I>> => {
        if (input.requestFor === "passphrase") {
            return await new Promise<string>((resolve, reject) => {
                set({
                    prompt: { input, validateWith: "passphrase" },
                    passphrasePromise: { resolve, reject },
                })
            }) as Output<I>;
        }

        const { keySourceId } = input;

        const appDependencies = useAppDependenciesStore.getState();
        const storage = appDependencies.keyValueStorage;
        const seedPhraseVault = appDependencies.seedPhraseVault;
        const biometricsProvider = appDependencies.biometricsProvider;

        // Could decide what factor to request access.
        // For now, only one seed phrase is stored.
        let useBiometrics = await storage.getOrDefault("device.biometrics.enabled", false)
        if (useBiometrics) {
            const biometricsAvailable = await biometricsProvider.isBiometricsAvailable();

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
                return mnemonicToWords(seedPhrase) as Output<I>;
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
            const seedPhrase = await seedPhraseVault.getSeedPhraseWithPassphrase(passphrase, keySourceId);

            if (seedPhrase) {
                return mnemonicToWords(seedPhrase) as Output<I>;
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