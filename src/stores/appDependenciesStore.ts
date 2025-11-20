import { MobilePKDFPerformer } from "@/crypto/pbkdf/MobilePBKDFPerformer";
import { WebPKDFPerformer } from "@/crypto/pbkdf/WebPBKDFPerformer";
import { BiometricsProvider, BiometricsProviderImpl } from "@/crypto/provider/biometrics/BiometricsProvider";
import { CryptoProvider } from "@/crypto/provider/CryptoProvider";
import { EMIP3CryptoProvider } from "@/crypto/provider/EMIP3CryptoProvider";
import EncryptedStorage from "@/storage/encrypted/EncryptedStorage";
import MobileEncryptedStorage from "@/storage/encrypted/MobileEncryptedStorage";
import WebEncryptedStorage from "@/storage/encrypted/WebEncryptedStorage";
import KeyValueStorage from "@/storage/kv/KeyValueStorage";
import MobileKeyValueStorage from "@/storage/kv/MobileKeyValueStorage";
import WebKeyValueStorage from "@/storage/kv/WebKeyValueStorage";
import MobileProfileStorage from "@/storage/profile/MobileProfileStorage";
import ProfileStorage from "@/storage/profile/ProfileStorage";
import WebProfileStorage from "@/storage/profile/WebProfileStorage";
import SeedPhraseVault from "@/storage/SeedPhraseVault";
import { platform } from "@/utils/platform";
import Constants from 'expo-constants';
import { create } from "zustand";
import PrivateBalanceRepository from "./balance/privateBalanceRepository";
import { PublicBalanceRepository } from "./balance/publicBalanceRepository";
import { Platform } from "react-native";
import { AppError } from "@/types/appError";
import { MarketRepository } from "@/market/MarketRepository";
import AVNUMarketRepository from "@/market/AVNUMarketRespository";

export interface AppDependencies {
    encryptedStorage: EncryptedStorage;
    keyValueStorage: KeyValueStorage;
    cryptoProvider: CryptoProvider;
    biometricsProvider: BiometricsProvider;
    profileStorage: ProfileStorage;
    seedPhraseVault: SeedPhraseVault;
    publicBalanceRepository: PublicBalanceRepository;
    privateBalanceRepository: PrivateBalanceRepository;
    marketRepository: MarketRepository;
}

function getApplicationId(): string {
    if (Platform.OS === "android") {
        const packageName = Constants.expoConfig?.android?.package;
        if (!packageName) {
            throw new AppError("Android package not found in app.json");
        }
        return packageName;
    } else if (Platform.OS === "ios") {
        const bundleId = Constants.expoConfig?.ios?.bundleIdentifier
        if (!bundleId) {
            throw new AppError("iOS bundle identifier not found in app.json");
        }
        return bundleId
    } else {
        return `kage-${Platform.OS}`
    }
}

export const useAppDependenciesStore = create<AppDependencies>(() => {
    const applicationId = getApplicationId();
    const encryptedStorage = platform<EncryptedStorage>(
        () => new MobileEncryptedStorage(applicationId),
        () => new WebEncryptedStorage(applicationId)
    );
    const cryptoProvider = new EMIP3CryptoProvider(
        platform(() => new MobilePKDFPerformer(), () => new WebPKDFPerformer())
    );

    return {
        encryptedStorage: encryptedStorage,
        keyValueStorage: platform(() => new MobileKeyValueStorage(), () => new WebKeyValueStorage()),
        cryptoProvider: cryptoProvider,
        biometricsProvider: new BiometricsProviderImpl(),
        profileStorage: platform<ProfileStorage>(() => new MobileProfileStorage(), () => new WebProfileStorage()),
        seedPhraseVault: new SeedPhraseVault(encryptedStorage, cryptoProvider),
        publicBalanceRepository: new PublicBalanceRepository(),
        privateBalanceRepository: new PrivateBalanceRepository(),
        marketRepository: new AVNUMarketRepository(),
    }
});

