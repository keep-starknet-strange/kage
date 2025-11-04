import { base64ToBytes, bytesToBase64, bytesToString, stringToBytes } from "@/crypto/utils/encoding";
import { create } from "zustand";

export interface TempPassphraseState {
    readonly passphraseEncoded: string | null;
    
    setTempPassphrase: (passphrase: string) => void;
    consumeTempPassphrase: () => string | null;
}

export const useTempPassphraseStore = create<TempPassphraseState>((set, get) => ({
    passphraseEncoded: null,

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
    }
}));