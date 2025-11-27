import { PrimaryButton } from "@/components/ui/primary-button";
import { SimpleHeader } from "@/components/ui/simple-header";
import { showToastError } from "@/components/ui/toast";
import { KeyPair, kmsProvider } from "@/crypto/kms/KMSProvider";
import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import { AccountAddress } from "@/profile/account";
import NetworkDefinition from "@/profile/settings/networkDefinition";
import { useDynamicSafeAreaInsets } from "@/providers/DynamicSafeAreaProvider";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { DeployedStatus, useOnChainStore } from "@/stores/onChainStore";
import { useProfileStore } from "@/stores/profileStore";
import { useTempStore } from "@/stores/tempStore";
import { AppError } from "@/types/appError";
import SeedPhraseWords from "@/types/seedPhraseWords";
import { useNavigation, useRouter } from "expo-router";
import { useCallback, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { RpcProvider } from "starknet";
import { useTranslation } from "react-i18next";

const MAX_ACCOUNTS_PER_BATCH = 10;
const GAP_TO_STOP_SEARCH = 5;

const NETWORKS = NetworkDefinition.wellKnown();

function getRpcProvider(networkDefinition: NetworkDefinition): RpcProvider {
    return new RpcProvider({ nodeUrl: networkDefinition.rpcUrl.toString(), batch: 0 });
}

function isNetworkEligibleForRestore(networkDefinition: NetworkDefinition): boolean {
    return networkDefinition.chainId === "SN_SEPOLIA" || networkDefinition.chainId === "SN_MAIN";
}

export default function RestoreWalletScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const navigation = useNavigation();
    const { insets } = useDynamicSafeAreaInsets();
    const [isRestoring, setIsRestoring] = useState(false);
    const [visibleNetworks, setVisibleNetworks] = useState<NetworkDefinition[]>(NETWORKS);
    const [progress, setProgress] = useState<string>(t('onboarding.restoreWallet.status.ready'));
    const [selectedNetwork, setSelectedNetwork] = useState<NetworkDefinition | null>(null);

    const { consumeTempPassphrase, consumeTempSeedPhraseWords } = useTempStore();
    const { checkAccountAddressesDeployed } = useOnChainStore();
    const { restore } = useProfileStore();

    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();

    useLayoutEffect(() => {
        navigation.setOptions({
            header: () => (
                <SimpleHeader
                    title={t('onboarding.restoreWallet.title')}
                    onBackPress={() => router.back()}
                    style={{ paddingTop: insets.top }}
                />
            ),
        });
    }, [navigation, insets.top, router, t]);

    const deriveAccountData = useCallback(async (startIndex: number, selectedNetwork: NetworkDefinition, seedPhraseWords: SeedPhraseWords) => {
        const accountData: Map<AccountAddress, { index: number, keyPair: KeyPair }> = new Map();
        for (let i = startIndex; i < startIndex + MAX_ACCOUNTS_PER_BATCH; i++) {
            const keyPair = kmsProvider.deriveKeyPair({
                type: "account-key-pair",
                accountIndex: i
            }, seedPhraseWords);

            const accountAddress = kmsProvider.deriveAccountAddress(keyPair.publicKey, selectedNetwork.accountClassHash, "0x0");

            accountData.set(accountAddress, { index: i, keyPair });
        }
        return accountData;
    }, []);

    const handleRestoreWallet = async () => {
        try {
            if (!selectedNetwork) {
                throw new AppError(t('errors.noNetwork'));
            }

            setIsRestoring(true);
            setVisibleNetworks([selectedNetwork]);

            const seedPhraseWords = consumeTempSeedPhraseWords();
            if (!seedPhraseWords) {
                throw new AppError(t('errors.noSeedPhrase'));
            }

            const passphrase = consumeTempPassphrase() ?? null;
            if (!passphrase) {
                throw new AppError(t('errors.noPassphrase'));
            }

            const rpcProvider = getRpcProvider(selectedNetwork);
            setProgress(t('onboarding.restoreWallet.status.deriving'));

            let startIndex = 0;
            const accountData: Map<AccountAddress, { index: number; keyPair: KeyPair }> = new Map();
            const deployedAccounts: Map<AccountAddress, DeployedStatus> = new Map();

            setTimeout(async () => {
                while (true) {
                    console.log("Deriving account data from index", startIndex);
                    const derivedData = await deriveAccountData(startIndex, selectedNetwork, seedPhraseWords);
                    derivedData.forEach((keyPairWithIndex, accountAddress) => {
                        accountData.set(accountAddress, keyPairWithIndex);
                    });

                    setProgress(t('onboarding.restoreWallet.status.searching'));

                    const onChainData = await checkAccountAddressesDeployed(Array.from(accountData.keys()), rpcProvider);

                    let notDeployedCount = 0;
                    onChainData.forEach((status, accountAddress) => {
                        deployedAccounts.set(accountAddress, status);
                        if (status === "not-deployed") {
                            notDeployedCount++;
                        }
                    });

                    if (notDeployedCount >= GAP_TO_STOP_SEARCH) {
                        break;
                    } else {
                        startIndex += MAX_ACCOUNTS_PER_BATCH;
                    }
                }

                const accountDataMap = new Map<AccountAddress, { index: number; keyPair: KeyPair }>();
                deployedAccounts.forEach((status, accountAddress) => {
                    if (status === "deployed") {
                        const keyPairWithIndex = accountData.get(accountAddress);
                        if (!keyPairWithIndex) {
                            return;
                        }

                        accountDataMap.set(accountAddress, keyPairWithIndex);
                    }
                });

                await restore(
                    selectedNetwork,
                    passphrase,
                    seedPhraseWords,
                    accountDataMap
                )
            }, 500); // Wait for the UI to update. KMS is slow...
        } catch (error) {
            setIsRestoring(false);
            showToastError(error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <Text style={styles.subtitle}>
                        {t('onboarding.restoreWallet.description')}
                    </Text>
                </View>

                {/* Network Picker */}
                <View style={styles.networkSection}>
                    <Text style={styles.sectionLabel}>{t('onboarding.restoreWallet.selectNetwork')}</Text>
                    <View style={styles.networkOptions}>
                        {visibleNetworks.map((network) => (
                            <TouchableOpacity
                                key={network.chainId}
                                style={[
                                    styles.networkOption,
                                    selectedNetwork?.chainId === network.chainId && styles.networkOptionSelected,
                                ]}
                                onPress={() => { setSelectedNetwork(network) }}
                                disabled={isRestoring || !isNetworkEligibleForRestore(network)}
                            >
                                <View style={styles.networkOptionContent}>
                                    <View style={styles.networkOptionHeader}>
                                        <Text style={[
                                            styles.networkOptionName,
                                            selectedNetwork?.chainId === network.chainId && styles.networkOptionNameSelected,
                                        ]}>
                                            {network.displayName}

                                        </Text>
                                        
                                        {!isNetworkEligibleForRestore(network) && (
                                            <Text style={styles.networkOptionNameDisabled}>
                                                {t('onboarding.restoreWallet.networkNotAvailable')}
                                            </Text>
                                        )}

                                        {selectedNetwork?.chainId === network.chainId && (
                                            <View style={styles.selectedIndicator}>
                                                <Text style={styles.selectedIndicatorText}>✓</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Loading Section */}
                {isRestoring && (
                    <View style={styles.loadingSection}>
                        <ActivityIndicator
                            size="large"
                            color={colorTokens['brand.accent']}
                        />
                        <Text style={styles.progressText}>{progress}</Text>
                    </View>
                )}
                {!isRestoring && (
                    <View style={{ flex: 1 }} />
                )}


                {/* Button Section */}
                <View style={[styles.buttonSection, { marginBottom: insets.bottom }]}>
                    <PrimaryButton
                        title={isRestoring ? t('onboarding.restoreWallet.buttonRestoring') : t('onboarding.restoreWallet.button')}
                        onPress={handleRestoreWallet}
                        disabled={isRestoring}
                    />
                </View>
            </View>
        </View >
    );
}

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        flex: 1,
        backgroundColor: colorTokens['bg.default'],
    },
    content: {
        flex: 1,
        paddingHorizontal: spaceTokens[4],
    },
    headerSection: {
        paddingTop: spaceTokens[5],
        paddingBottom: spaceTokens[4],
        gap: spaceTokens[2],
    },
    subtitle: {
        fontSize: 15,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
        lineHeight: 22,
    },
    networkSection: {
        gap: spaceTokens[3],
    },
    sectionLabel: {
        fontSize: 15,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
    },
    networkOptions: {
        gap: spaceTokens[3],
    },
    networkOption: {
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.md,
        borderWidth: 2,
        borderColor: colorTokens['border.subtle'],
        padding: spaceTokens[4],
    },
    networkOptionSelected: {
        backgroundColor: colorTokens['brand.glow'],
        borderColor: colorTokens['brand.accent'],
    },
    networkOptionContent: {
        gap: spaceTokens[1],
    },
    networkOptionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    networkOptionName: {
        fontSize: 18,
        ...fontStyles.ubuntuMono.bold,
        color: colorTokens['text.primary'],
    },
    networkOptionNameSelected: {
        color: colorTokens['brand.accent'],
    },
    networkOptionDescription: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
    },
    networkOptionDescriptionSelected: {
        color: colorTokens['text.primary'],
    },
    selectedIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colorTokens['brand.accent'],
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedIndicatorText: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.bold,
        color: colorTokens['bg.default'],
    },
    loadingSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spaceTokens[4],
        gap: spaceTokens[2],
    },
    progressText: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.muted'],
        textAlign: 'center',
        maxWidth: '80%',
    },
    buttonSection: {
        paddingBottom: spaceTokens[4],
    },
    networkOptionNameDisabled: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.muted'],
    },
}));

