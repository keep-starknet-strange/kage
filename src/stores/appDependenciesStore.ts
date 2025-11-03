import { CryptoProvider } from "@/crypto/provider/CryptoProvider";
import { EMIP3CryptoProvider } from "@/crypto/provider/EMIP3CryptoProvider";
import EncryptedStorage from "@/storage/encrypted/EncryptedStorage";
import KeychainStorage from "@/storage/encrypted/KeychainStorage";
import KeyValueStorage from "@/storage/kv/KeyValueStorage";
import ProfileStorage from "@/storage/profile/ProfileStorage";
import SeedPhraseVault from "@/storage/SeedPhraseVault";
import Constants from 'expo-constants';
import { Platform } from "react-native";
import { create } from "zustand";
import { PublicBalanceRepository } from "./balance/publicBalanceRepository";
import PrivateBalanceRepository from "./balance/privateBalanceRepository";
import MobileProfileStorage from "@/storage/profile/MobileProfileStorage";
import WebProfileStorage from "@/storage/profile/WebProfileStorage";
import WebKeyValueStorage from "@/storage/kv/WebKeyValueStorage";
import MobileKeyValueStorage from "@/storage/kv/MobileKeyValueStorage";
import { MobilePKDFPerformer } from "@/crypto/pbkdf/MobilePBKDFPerformer";
import { WebPKDFPerformer } from "@/crypto/pbkdf/WebPBKDFPerformer";

export interface AppDependencies {
    encryptedStorage: EncryptedStorage;
    keyValueStorage: KeyValueStorage;
    cryptoProvider: CryptoProvider;
    profileStorage: ProfileStorage;
    seedPhraseVault: SeedPhraseVault;
    publicBalanceRepository: PublicBalanceRepository;
    privateBalanceRepository: PrivateBalanceRepository;
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

export const useAppDependenciesStore = create<AppDependencies>(() => {
    const encryptedStorage = new KeychainStorage(getApplicationId());
    const cryptoProvider = new EMIP3CryptoProvider(
        Platform.OS === "ios" || Platform.OS === "android" ? new MobilePKDFPerformer() : new WebPKDFPerformer()
    );

    return {
        encryptedStorage: encryptedStorage,
        keyValueStorage: Platform.OS === "ios" || Platform.OS === "android" ? new MobileKeyValueStorage() : new WebKeyValueStorage(),
        cryptoProvider: cryptoProvider,
        profileStorage: Platform.OS === "ios" || Platform.OS === "android" ? new MobileProfileStorage() : new WebProfileStorage(),
        seedPhraseVault: new SeedPhraseVault(encryptedStorage, cryptoProvider),
        publicBalanceRepository: new PublicBalanceRepository(),
        privateBalanceRepository: new PrivateBalanceRepository(),
    }
});