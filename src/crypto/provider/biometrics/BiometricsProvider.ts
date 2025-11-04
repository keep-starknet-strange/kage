import { Platform } from "react-native";
import { BiometryType } from "./BiometryType";
import Keychain from "react-native-keychain";

export interface BiometricsProvider {
    isBiometricsAvailable: () => Promise<boolean>;
    getBiometricsType: () => Promise<BiometryType | null>;
}

export class BiometricsProviderImpl implements BiometricsProvider {
    async isBiometricsAvailable(): Promise<boolean> {
        return await this.getBiometricsType() !== null;
    }

    async getBiometricsType(): Promise<BiometryType | null> {
        if (Platform.OS === "web") {
            return null;
        }

        if (Platform.OS === "ios" || Platform.OS === "android") {
            const biometryType = await Keychain.getSupportedBiometryType();
            
            if (!biometryType) {
                return null;
            }

            return BiometryType.fromKeychain(biometryType);
        }

        return null;
    }
}