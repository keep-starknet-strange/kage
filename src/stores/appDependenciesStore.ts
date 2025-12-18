import StarKMSProvider from "@/crypto/kms/StarKMSProvider";
import { MobilePKDFPerformer } from "@/crypto/pbkdf/MobilePBKDFPerformer";
import { WebPKDFPerformer } from "@/crypto/pbkdf/WebPBKDFPerformer";
import { BiometricsProvider, BiometricsProviderImpl } from "@/crypto/provider/biometrics/BiometricsProvider";
import { CryptoProvider } from "@/crypto/provider/CryptoProvider";
import { EMIP3CryptoProvider } from "@/crypto/provider/EMIP3CryptoProvider";
import AVNUMarketRepository from "@/market/AVNUMarketRespository";
import { MarketRepository } from "@/market/MarketRepository";
import EncryptedStorage from "@/storage/encrypted/EncryptedStorage";
import MobileEncryptedStorage from "@/storage/encrypted/MobileEncryptedStorage";
import WebEncryptedStorage from "@/storage/encrypted/WebEncryptedStorage";
import ChromeEncryptedStorage from "@/storage/encrypted/ChromeEncryptedStorage";
import KeyValueStorage from "@/storage/kv/KeyValueStorage";
import MobileKeyValueStorage from "@/storage/kv/MobileKeyValueStorage";
import WebKeyValueStorage from "@/storage/kv/WebKeyValueStorage";
import ChromeKeyValueStorage from "@/storage/kv/ChromeKeyValueStorage";
import MobileProfileStorage from "@/storage/profile/MobileProfileStorage";
import ProfileStorage from "@/storage/profile/ProfileStorage";
import WebProfileStorage from "@/storage/profile/WebProfileStorage";
import SeedPhraseVault from "@/storage/SeedPhraseVault";
import { AppError } from "@/types/appError";
import i18n from "@/utils/i18n";
import { platform } from "@/utils/platform";
import Constants from 'expo-constants';
import { Platform } from "react-native";
import { create } from "zustand";
import PrivateBalanceRepository from "./balance/privateBalanceRepository";
import { PublicBalanceRepository } from "./balance/publicBalanceRepository";
import { SwapRepository } from "@/swap/SwapRepository";
import { NearSwapRepository } from "@/swap/NearSwapRepository";
import { MockNearSwapRepository } from "@/swap/MockNearSwapRepository";

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
    swapRepository: SwapRepository;
}

function getApplicationId(): string {
    if (Platform.OS === "android") {
        const packageName = Constants.expoConfig?.android?.package;
        if (!packageName) {
            throw new AppError(i18n.t('errors.androidPackageNotFound'));
        }
        return packageName;
    } else if (Platform.OS === "ios") {
        const bundleId = Constants.expoConfig?.ios?.bundleIdentifier
        if (!bundleId) {
            throw new AppError(i18n.t('errors.androidPackageNotFound'));
        }
        return bundleId
    } else {
        return `kage-${Platform.OS}`
    }
}

export const useAppDependenciesStore = create<AppDependencies>(() => {
    const applicationId = getApplicationId();
    
    // Use Chrome extension storage when running as an extension
    const encryptedStorage = platform<EncryptedStorage>(
        () => new MobileEncryptedStorage(applicationId),
        () => new WebEncryptedStorage(applicationId),
        () => new ChromeEncryptedStorage(applicationId)
    );
    
    const keyValueStorage = platform<KeyValueStorage>(
        () => new MobileKeyValueStorage(),
        () => new WebKeyValueStorage(),
        () => new ChromeKeyValueStorage()
    );
    
    const cryptoProvider = new EMIP3CryptoProvider(
        platform(
            () => new MobilePKDFPerformer(), 
            () => new WebPKDFPerformer(),
            () => new WebPKDFPerformer()
        )
    );

    return {
        encryptedStorage: encryptedStorage,
        keyValueStorage: keyValueStorage,
        cryptoProvider: cryptoProvider,
        biometricsProvider: new BiometricsProviderImpl(),
        profileStorage: platform<ProfileStorage>(
            () => new MobileProfileStorage(), 
            () => new WebProfileStorage(),
            () => new WebProfileStorage()
        ),
        seedPhraseVault: new SeedPhraseVault(encryptedStorage, cryptoProvider),
        publicBalanceRepository: new PublicBalanceRepository(),
        privateBalanceRepository: new PrivateBalanceRepository(),
        marketRepository: new AVNUMarketRepository(),
        kmsProvider: new StarKMSProvider(),
        swapRepository: new MockNearSwapRepository(),
    }
});

