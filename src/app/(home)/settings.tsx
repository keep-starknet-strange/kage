import { DangerButton } from "@/components/ui/danger-button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { showToastError } from "@/components/ui/toast";
import { BiometryType } from "@/crypto/provider/biometrics/BiometryType";
import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import { useDynamicSafeAreaInsets } from "@/providers/DynamicSafeAreaProvider";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { useAccessVaultStore } from "@/stores/accessVaultStore";
import { useAppDependenciesStore } from "@/stores/appDependenciesStore";
import { useBalanceStore } from "@/stores/balance/balanceStore";
import { useOnChainStore } from "@/stores/onChainStore";
import { useProfileStore } from "@/stores/profileStore";
import { useRpcStore } from "@/stores/useRpcStore";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";

export default function SettingsScreen() {
    const { insets } = useDynamicSafeAreaInsets();
    const router = useRouter();
    const { keyValueStorage, seedPhraseVault, biometricsProvider } = useAppDependenciesStore();
    const { requestAccess } = useAccessVaultStore();
    const { delete: deleteProfile } = useProfileStore();
    const { reset: resetOnChainStore } = useOnChainStore();
    const { reset: resetRpcStore } = useRpcStore();
    const { reset: resetBalanceStore } = useBalanceStore();

    const [isResolvingBiometrics, setIsResolvingBiometrics] = useState(false);
    const [supportedBiometryType, setSupportedBiometryType] = useState<BiometryType | null>(null);
    const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);
    const [isDeletingProfile, setIsDeletingProfile] = useState(false);

    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();

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
                    await seedPhraseVault.enableBiometrics(passphrase, {
                        title: "Enable Biometrics",
                        subtitleAndroid: "Confirming your change",
                        descriptionAndroid: "KAGE needs to confirm your change to enable biometrics.",
                        cancelAndroid: "Cancel",
                    });

                    await keyValueStorage.set("device.biometrics.enabled", true);
                    setIsBiometricsEnabled(true);
                }
            } catch (e) {
                showToastError(e);
            }
        }
    }

    const handleDeleteWallet = async () => {
        setIsDeletingProfile(true);
        
        try {
            await deleteProfile();
            await resetBalanceStore();
            await resetOnChainStore();
            await resetRpcStore();
            keyValueStorage.clear();
        } catch (e) {
            showToastError(e);
        } finally {
            setIsDeletingProfile(false);
        }
    }

    const getBiometryIcon = () => {
        switch (supportedBiometryType) {
            case BiometryType.FACE_ID:
            case BiometryType.FACE:
                return "faceid" as const;
            case BiometryType.TOUCH_ID:
            case BiometryType.FINGERPRINT:
                return "touchid" as const;
            case BiometryType.OPTIC_ID:
                return "opticid" as const;
            case BiometryType.IRIS:
                return "eye.fill" as const;
            default:
                return "lock.shield.fill" as const;
        }
    };

    return (
        <ScrollView 
            style={styles.container}
            contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.subtitle}>Manage your wallet preferences</Text>
            </View>

            {/* Keys Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Security</Text>
                
                <TouchableOpacity 
                    style={styles.settingsItem}
                    onPress={() => router.push('/keys')}
                    activeOpacity={0.7}
                >
                    <View style={styles.itemLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: colorTokens['brand.glow'] }]}>
                            <IconSymbol
                                name="key"
                                size={20}
                                color={colorTokens['brand.accent']}
                            />
                        </View>
                        <View style={styles.itemTextContainer}>
                            <Text style={styles.itemTitle}>Keys</Text>
                            <Text style={styles.itemDescription}>View and backup your keys</Text>
                        </View>
                    </View>
                    <IconSymbol
                        name="chevron.right"
                        size={20}
                        color={colorTokens['text.muted']}
                    />
                </TouchableOpacity>

                {/* Biometrics Toggle */}
                <View style={styles.settingsItem}>
                    <View style={styles.itemLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: supportedBiometryType ? 'rgba(47, 185, 132, 0.16)' : 'rgba(108, 114, 133, 0.16)' }]}>
                            <IconSymbol
                                name={supportedBiometryType ? getBiometryIcon() : "lock.fill"}
                                size={20}
                                color={supportedBiometryType ? colorTokens['status.success'] : colorTokens['text.muted']}
                            />
                        </View>
                        <View style={styles.itemTextContainer}>
                            <Text style={styles.itemTitle}>
                                {supportedBiometryType ? biometryTypeToString(supportedBiometryType) : 'Biometrics'}
                            </Text>
                            <Text style={styles.itemDescription}>
                                {!supportedBiometryType && 'Not available on this device'}
                                {supportedBiometryType && isBiometricsEnabled && 'Enabled for quick access'}
                                {supportedBiometryType && !isBiometricsEnabled && 'Disabled'}
                            </Text>
                        </View>
                    </View>
                    {isResolvingBiometrics ? (
                        <ActivityIndicator size="small" color={colorTokens['brand.accent']} />
                    ) : (
                        <Switch
                            value={isBiometricsEnabled}
                            onValueChange={handleBiometricsChange}
                            disabled={!supportedBiometryType}
                            trackColor={{ 
                                false: colorTokens['border.strong'], 
                                true: colorTokens['brand.accent'] 
                            }}
                            thumbColor={colorTokens['bg.elevated']}
                        />
                    )}
                </View>
            </View>

            {/* Danger Zone */}
            <View style={styles.dangerSection}>
                <Text style={styles.dangerSectionTitle}>Danger Zone</Text>
                <View style={styles.dangerCard}>
                    <View style={styles.dangerContent}>
                        <View style={styles.dangerIconContainer}>
                            <IconSymbol
                                name="exclamationmark.circle.fill"
                                size={24}
                                color={colorTokens['status.error']}
                            />
                        </View>
                        <View style={styles.dangerTextContainer}>
                            <Text style={styles.dangerTitle}>Delete Wallet</Text>
                            <Text style={styles.dangerDescription}>
                                Permanently delete your wallet. Make sure you have backed up your recovery phrase.
                            </Text>
                        </View>
                    </View>
                    <DangerButton
                        title="Delete Wallet"
                        onPress={handleDeleteWallet}
                        loading={isDeletingProfile}
                    />
                </View>
            </View>
        </ScrollView>
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

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        flex: 1,
        backgroundColor: colorTokens['bg.default'],
    },
    scrollContent: {
        paddingHorizontal: spaceTokens[5],
        paddingBottom: spaceTokens[8],
    },
    header: {
        marginTop: spaceTokens[5],
        marginBottom: spaceTokens[6],
    },
    title: {
        fontSize: 32,
        ...fontStyles.ubuntuMono.bold,
        color: colorTokens['text.primary'],
        marginBottom: spaceTokens[1],
    },
    subtitle: {
        fontSize: 16,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
    },
    section: {
        marginBottom: spaceTokens[6],
    },
    sectionTitle: {
        fontSize: 13,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.muted'],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spaceTokens[3],
        paddingHorizontal: spaceTokens[1],
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.md,
        padding: spaceTokens[4],
        marginBottom: spaceTokens[2],
        shadowColor: colorTokens['shadow.primary'],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: spaceTokens[3],
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: radiusTokens.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemTextContainer: {
        flex: 1,
        gap: spaceTokens[1],
    },
    itemTitle: {
        fontSize: 16,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
    },
    itemDescription: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
        lineHeight: 18,
    },
    dangerSection: {
        marginTop: spaceTokens[4],
    },
    dangerSectionTitle: {
        fontSize: 13,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['status.error'],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spaceTokens[3],
        paddingHorizontal: spaceTokens[1],
    },
    dangerCard: {
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.md,
        padding: spaceTokens[4],
        borderWidth: 1,
        borderColor: 'rgba(233, 75, 101, 0.2)',
        shadowColor: colorTokens['status.error'],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    dangerContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spaceTokens[4],
        gap: spaceTokens[3],
    },
    dangerIconContainer: {
        width: 40,
        height: 40,
        borderRadius: radiusTokens.sm,
        backgroundColor: 'rgba(233, 75, 101, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dangerTextContainer: {
        flex: 1,
        gap: spaceTokens[1],
    },
    dangerTitle: {
        fontSize: 16,
        ...fontStyles.ubuntuMono.bold,
        color: colorTokens['status.error'],
    },
    dangerDescription: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
        lineHeight: 20,
    },
}));