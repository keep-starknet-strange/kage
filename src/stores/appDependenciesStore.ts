import { CryptoProvider } from "@/crypto/provider/CryptoProvider";
import { EMIP3CryptoProvider } from "@/crypto/provider/EMIP3CryptoProvider";
import EncryptedStorage from "@/storage/EncryptedStorage";
import KeychainStorage from "@/storage/KeychainStorage";
import { create } from "zustand";
import SeedPhraseVault from "@/storage/SeedPhraseVault";
import { Platform } from "react-native";
import Constants from 'expo-constants';

export interface AppDependencies {
    encryptedStorage: EncryptedStorage;
    cryptoProvider: CryptoProvider;
    seedPhraseVault: SeedPhraseVault;
}

function getApplicationId(): string {
    if (Platform.OS === "android") {
        const packageName = Constants.expoConfig?.android?.package;
        if (!packageName) {
            throw new Error("Android package not found in app.json");
        }
        return packageName;
    } else if (Platform.OS === "ios") {
        const bundleId = Constants.expoConfig?.ios?.bundleIdentifier
        if (!bundleId) {
            throw new Error("iOS bundle identifier not found in app.json");
        }
        return bundleId
    } else {
        return `kage-${Platform.OS}`
    }
}

export const useAppDependenciesStore = create<AppDependencies>((set) => {
    const encryptedStorage = new KeychainStorage(getApplicationId());
    const cryptoProvider = new EMIP3CryptoProvider();

    console.log("App Dependencies Initialized");

    return {
        encryptedStorage: encryptedStorage,
        cryptoProvider: cryptoProvider,
        seedPhraseVault: new SeedPhraseVault(encryptedStorage, cryptoProvider),
    }
});