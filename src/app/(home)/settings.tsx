import { DangerButton } from "@/components/ui/danger-button";
import { BiometryType } from "@/crypto/provider/biometrics/BiometryType";
import { useDynamicSafeAreaInsets } from "@/providers/DynamicSafeAreaProvider";
import { useAccessVaultStore } from "@/stores/accessVaultStore";
import { useAppDependenciesStore } from "@/stores/appDependenciesStore";
import { useProfileStore } from "@/stores/profileStore";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

export default function SettingsScreen() {
    const { insets } = useDynamicSafeAreaInsets();
    const { keyValueStorage, seedPhraseVault, biometricsProvider } = useAppDependenciesStore();
    const { requestAccess } = useAccessVaultStore();
    const { delete: deleteProfile } = useProfileStore();

    const [isResolvingBiometrics, setIsResolvingBiometrics] = useState(false);
    const [supportedBiometryType, setSupportedBiometryType] = useState<BiometryType | null>(null);
    const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);
    const [isDeletingProfile, setIsDeletingProfile] = useState(false);

    const resolveBiometricsStatus = useCallback(() => {
        setIsResolvingBiometrics(true);
        biometricsProvider.getBiometricsType()
            .then(async (biometryType) => {
                setSupportedBiometryType(biometryType);
                return biometryType !== null;
            })
            .then((isAvailable) => {
                if (isAvailable) {
                    return keyValueStorage.getOrDefault("device.biometrics.enabled", false);
                }

                return false;
            })
            .then((isEnabled) => {
                setIsBiometricsEnabled(isEnabled);
                setIsResolvingBiometrics(false);
            });
    }, [setIsResolvingBiometrics, setSupportedBiometryType]);


    useFocusEffect(
        useCallback(() => {
            void resolveBiometricsStatus();
        }, [resolveBiometricsStatus])
    );

    const handleBiometricsChange = async (enabled: boolean) => {
        if (!enabled) {
            await keyValueStorage.set("device.biometrics.enabled", false);
            await seedPhraseVault.disableBiometrics();
            setIsBiometricsEnabled(false);
        } else {
            try {
                const passphrase = await requestAccess({ requestFor: "passphrase" });

                if (passphrase) {
                    const enabeld = await seedPhraseVault.enableBiometrics(passphrase, {
                        title: "Enable Biometrics",
                        subtitleAndroid: "Confirming your change",
                        descriptionAndroid: "KAGE needs to confirm your change to enable biometrics.",
                        cancelAndroid: "Cancel",
                    });

                    await keyValueStorage.set("device.biometrics.enabled", enabeld);
                    setIsBiometricsEnabled(enabeld);
                }
            } catch (e) {
                console.error("Failed to enable biometrics", e);
            }
        }
    }

    const handleDeleteWallet = async () => {
        setIsDeletingProfile(true);
        
        try {
            await deleteProfile();
        } catch (e) {
            console.error("Failed to delete profile", e);
        } finally {
            setIsDeletingProfile(false);
        }
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Text style={styles.title}>Settings</Text>

            <View style={styles.row}>
                <View>
                    <Text style={styles.label}>Enable Biometrics</Text>

                    {!supportedBiometryType && (
                        <Text style={styles.error}>Biometrics Unavailable</Text>
                    )}

                    {supportedBiometryType && (
                        <Text style={styles.labelSecondary}>Using {biometryTypeToString(supportedBiometryType)}</Text>
                    )}
                </View>

                <Switch
                    value={isBiometricsEnabled}
                    onValueChange={(enabled) => {
                        void handleBiometricsChange(enabled);
                    }}
                    disabled={isResolvingBiometrics || !supportedBiometryType}
                />

            </View>

            <View style={styles.dangerZone}>
                <DangerButton
                    title="Delete Wallet"
                    onPress={handleDeleteWallet}
                    loading={isDeletingProfile}
                />
            </View>
        </View>
    );
}

function biometryTypeToString(biometryType: BiometryType): string {
    switch (biometryType) {
        case BiometryType.TOUCH_ID:
            return "Touch ID";
        case BiometryType.FACE_ID:
            return "Face ID";
        case BiometryType.FINGERPRINT:
            return "Fingerprint";
        case BiometryType.IRIS:
            return "Iris";
        case BiometryType.FACE:
            return "Face";
        case BiometryType.OPTIC_ID:
            return "Optic ID";
        default:
            return "Unknown";
    }
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    label: {
        fontSize: 17,
    },
    labelSecondary: {
        fontSize: 14,
    },
    error: {
        fontSize: 14,
        color: 'red',
    },
    dangerZone: {
        marginTop: 32,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#E4E6EF',
    }
});