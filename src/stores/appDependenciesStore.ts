import { CryptoProvider } from "@/crypto/provider/CryptoProvider";
import { EMIP3CryptoProvider } from "@/crypto/provider/EMIP3CryptoProvider";
import EncryptedStorage from "@/storage/encrypted/EncryptedStorage";
import KeychainStorage from "@/storage/encrypted/KeychainStorage";
import { create } from "zustand";
import SeedPhraseVault from "@/storage/SeedPhraseVault";
import { Platform } from "react-native";
import Constants from 'expo-constants';
import KeyValueStorage from "@/storage/kv/KeyValueStorage";
import AsyncKeyValueStorage from "@/storage/kv/AsyncKeyValueStorage";
import ProfileStorage from "@/storage/profile/ProfileStorage";

export interface AppDependencies {
    encryptedStorage: EncryptedStorage;
    keyValueStorage: KeyValueStorage;
    cryptoProvider: CryptoProvider;
    profileStorage: ProfileStorage;
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
        keyValueStorage: new AsyncKeyValueStorage(),
        cryptoProvider: cryptoProvider,
        profileStorage: new ProfileStorage(),
        seedPhraseVault: new SeedPhraseVault(encryptedStorage, cryptoProvider),
    }
});