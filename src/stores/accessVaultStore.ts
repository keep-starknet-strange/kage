import KeySource, { KeySourceId } from "@/profile/keys/keySource";
import { AuthPrompt } from "@/storage/encrypted/EncryptedStorage";
import { deriveStarknetKeyPairs, mnemonicToWords, pathHash, StarknetKeyPair } from "@starkms/key-management";
import { create } from "zustand";
import { useAppDependenciesStore } from "./appDependenciesStore";
import HDKeyInstance, { KeyInstance } from "@/profile/keyInstance";
import { useProfileStore } from "./profileStore";
import { ProfileState } from "@/profile/profileState";
import { KeySourceKind } from "@/profile/keys/keySourceKind";
import Account from "@/profile/account";
import SeedPhraseWords from "@/types/seedPhraseWords";
import Token from "@/types/token";
import { groupBy } from "@/utils/collections";
import { AppError } from "@/types/appError";

export type AuthorizationType = "passphrase" | "biometrics";

export type PrivateKeysInput = {
    requestFor: "privateKeys";
    signing: Account[];
    tokens: Map<Account, Token[]>;
}

export type PassphraseInput = {
    requestFor: "passphrase";
}

export type SeedPhraseInput = {
    requestFor: "seedPhrase";
    keySourceId: KeySourceId;
}

export type SeedPhraseOutput = {
    keySourceId: KeySourceId;
    seedPhrase: SeedPhraseWords;
}

export type Input = PrivateKeysInput | PassphraseInput | SeedPhraseInput;

export type PrivateKeysOutput = {
    signing: Map<Account, StarknetKeyPair>;
    tokens: Map<Account, { token: Token, keyPairs: StarknetKeyPair }>;
}

export type Output<I extends Input> =
    I extends PassphraseInput ? string :
    I extends PrivateKeysInput ? PrivateKeysOutput :
    I extends SeedPhraseInput ? SeedPhraseOutput :
    never;

export type RequestAccessPrompt = {
    input: {
        requestFor: "passphrase"
    } | {
        requestFor: "keySources";
        keySourceIds: KeySourceId[];
    };
    validateWith: AuthorizationType;
}

export type RequestAccessFn = <I extends Input>(input: I, prompt?: AuthPrompt) => Promise<Output<I>>;

export interface AccessVaultState {
    prompt: RequestAccessPrompt | null;

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
                    prompt: { input: { requestFor: "passphrase" }, validateWith: "passphrase" },
                    passphrasePromise: { resolve, reject },
                })
            }) as Output<I>;
        } else if (input.requestFor === "privateKeys") {
            const appDependencies = useAppDependenciesStore.getState();
            const storage = appDependencies.keyValueStorage;
            const biometricsProvider = appDependencies.biometricsProvider;
            const seedPhraseVault = appDependencies.seedPhraseVault;

            const profileState = useProfileStore.getState().profileState;
            if (!ProfileState.isProfile(profileState)) {
                throw new AppError("Profile state is not initialized", profileState);
            }

            const allAccounts = new Set(input.signing.concat(Array.from(input.tokens.keys())));
            const keyInstances = Array.from(allAccounts).map(account => account.keyInstance);

            const keySources = keyInstances
                .map(instance => profileState.keySources.find(keySource => keySource.id === instance.keySourceId) ?? null)
                .filter(keySource => keySource !== null);

            const groupedByKind = groupBy(keySources, keySource => keySource.kind);

            const signingResult: Map<Account, StarknetKeyPair> = new Map();
            const tokensResult: Map<Account, { token: Token, keyPairs: StarknetKeyPair }> = new Map();

            for (const [kind, keySources] of groupedByKind) {
                switch (kind) {
                    case KeySourceKind.SEED_PHRASE:
                        const ids = keySources.map(keySource => keySource.id);
                        const relatedSigningAccounts = input.signing.filter(account => ids.some(id => id === account.keyInstance.keySourceId));
                        const relatedTokens = new Map([...input.tokens.entries()].filter(([account, _]) => ids.some(id => id === account.keyInstance.keySourceId)));

                        let useBiometrics = await storage.getOrDefault("device.biometrics.enabled", false)
                        if (useBiometrics) {
                            const biometricsAvailable = await biometricsProvider.isBiometricsAvailable();

                            if (!biometricsAvailable) {
                                await storage.set("device.biometrics.enabled", false);
                                useBiometrics = false;
                            }
                        }

                        let seedPhrasesMap: Map<KeySourceId, SeedPhraseWords>;
                        if (useBiometrics) {
                            set({ prompt: { input: { requestFor: "keySources", keySourceIds: ids }, validateWith: "biometrics" } });
                            seedPhrasesMap = await seedPhraseVault.getSeedPhrasesWithBiometrics(authPrompt ?? { title: "Access Seed Phrase" }, ids);
                            set({ prompt: null });
                        } else {
                            let passphrase = await new Promise<string>((resolve, reject) => {
                                set({
                                    prompt: { input: { requestFor: "keySources", keySourceIds: ids }, validateWith: "passphrase" },
                                    passphrasePromise: { resolve, reject },
                                })
                            })

                            const seedPhraseVault = useAppDependenciesStore.getState().seedPhraseVault;
                            seedPhrasesMap = await seedPhraseVault.getSeedPhrasesWithPassphrase(passphrase, ids);
                        }

                        for (const signingAccount of relatedSigningAccounts) {
                            const seedPhrase = seedPhrasesMap.get(signingAccount.keyInstance.keySourceId)?.toString();
                            if (!seedPhrase) {
                                throw new AppError(`Seed phrase not found for account ${signingAccount.address}`);
                            }

                            const keyPairs = deriveStarknetKeyPairs({
                                accountIndex: 0,
                                addressIndex: (signingAccount.keyInstance as HDKeyInstance).index,
                            }, seedPhrase, true)
                            signingResult.set(signingAccount, keyPairs);
                        }

                        for (const [account, tokens] of relatedTokens) {
                            const seedPhrase = seedPhrasesMap.get(account.keyInstance.keySourceId)?.toString();
                            if (!seedPhrase) {
                                throw new AppError(`Seed phrase not found for account ${account.address}`);
                            }

                            for (const token of tokens) {
                                const tokenIndex = pathHash(`${account.address}.${token.contractAddress}.${token.tongoAddress}`);
                                const keyPairs = deriveStarknetKeyPairs({
                                    accountIndex: (account.keyInstance as HDKeyInstance).index,
                                    addressIndex: tokenIndex,
                                }, seedPhrase, true);
                                tokensResult.set(account, { token, keyPairs: keyPairs });
                            }
                        }

                        break;
                    default:
                        throw new AppError("Unsupported key source kind", kind);
                }
            }

            return {
                signing: signingResult,
                tokens: tokensResult,
            } as Output<I>;
        } else if (input.requestFor === "seedPhrase") {
            const appDependencies = useAppDependenciesStore.getState();
            const storage = appDependencies.keyValueStorage;
            const biometricsProvider = appDependencies.biometricsProvider;
            const seedPhraseVault = appDependencies.seedPhraseVault;

            let useBiometrics = await storage.getOrDefault("device.biometrics.enabled", false)
            if (useBiometrics) {
                const biometricsAvailable = await biometricsProvider.isBiometricsAvailable();

                if (!biometricsAvailable) {
                    await storage.set("device.biometrics.enabled", false);
                    useBiometrics = false;
                }
            }

            let output: SeedPhraseOutput;
            if (useBiometrics) {
                set({ prompt: { input: { requestFor: "keySources", keySourceIds: [input.keySourceId] }, validateWith: "biometrics" } });
                const seedPhrases = await seedPhraseVault.getSeedPhrasesWithBiometrics(authPrompt ?? { title: "Access Seed Phrase" }, [input.keySourceId])
                const seedPhrase = seedPhrases.get(input.keySourceId);
                if (!seedPhrase) {
                    throw new AppError(`Seed phrase not found for key source ${input.keySourceId}`);
                }

                output = {
                    keySourceId: input.keySourceId,
                    seedPhrase: seedPhrase,
                }
        
                set({ prompt: null });
            } else {
                let passphrase = await new Promise<string>((resolve, reject) => {
                    set({
                        prompt: { input: { requestFor: "keySources", keySourceIds: [input.keySourceId] }, validateWith: "passphrase" },
                        passphrasePromise: { resolve, reject },
                    })
                })

                const seedPhraseVault = useAppDependenciesStore.getState().seedPhraseVault;
                const seedPhrases = await seedPhraseVault.getSeedPhrasesWithPassphrase(passphrase, [input.keySourceId]);

                const seedPhrase = seedPhrases.get(input.keySourceId);
                if (!seedPhrase) {
                    throw new AppError(`Seed phrase not found for key source ${input.keySourceId}`);
                }

                output = {
                    keySourceId: input.keySourceId,
                    seedPhrase: seedPhrase,
                }
            }

            return output as Output<I>;
        } else {
            throw new AppError(`Unsupported input type: ${input}`);
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
    }
}));