import { base64ToBytes, bytesToBase64, bytesToString, stringToBytes } from "@/crypto/utils/encoding";
import SeedPhraseWords from "@/types/seedPhraseWords";
import { LOG } from "@/utils/logs";
import { create } from "zustand";

export interface TempState {
    readonly passphraseEncoded: string | null;
    readonly seedPhraseEncoded: string | null;
    setTempPassphrase: (passphrase: string) => void;
    setTempSeedPhraseWords: (seedPhraseWords: SeedPhraseWords) => void;
    consumeTempPassphrase: () => string | null;
    consumeTempSeedPhraseWords: () => SeedPhraseWords | null;
}

export const useTempStore = create<TempState>((set, get) => {
    return {
        passphraseEncoded: null,
        seedPhraseEncoded: null,

        setTempPassphrase: (passphrase: string) => {
            set({ passphraseEncoded: bytesToBase64(stringToBytes(passphrase)) });
        },

        consumeTempPassphrase: () => {
            const passphraseEncoded = get().passphraseEncoded;

            if (!passphraseEncoded) {
                return null;
            }

            const temp = bytesToString(base64ToBytes(passphraseEncoded));
            set({ passphraseEncoded: null });
            return temp
        },

        setTempSeedPhraseWords: (seedPhraseWords: SeedPhraseWords) => {
            const encoded = bytesToBase64(stringToBytes(seedPhraseWords.toString()))
            set({ seedPhraseEncoded: encoded });
        },

        consumeTempSeedPhraseWords: () => {
            const seedPhraseEncoded = get().seedPhraseEncoded;
            if (!seedPhraseEncoded) {
                return null;
            }

            const seedPhraseWords = bytesToString(base64ToBytes(seedPhraseEncoded));
            
            try {
                return SeedPhraseWords.fromMnemonic(seedPhraseWords);
            } catch (error) {
                LOG.info(error);
            } finally {
                set({ seedPhraseEncoded: null });
            }

            return null;
        },
    }
});