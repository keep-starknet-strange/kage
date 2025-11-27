import { IconSymbol } from "@/components/ui/icon-symbol/icon-symbol";
import { SimpleHeader } from "@/components/ui/simple-header";
import { showToastError } from "@/components/ui/toast";
import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import { NetworkId } from "@/profile/misc";
import { ProfileState } from "@/profile/profileState";
import NetworkDefinition from "@/profile/settings/networkDefinition";
import { useDynamicSafeAreaInsets } from "@/providers/DynamicSafeAreaProvider";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { useOnChainStore } from "@/stores/onChainStore";
import { useProfileStore } from "@/stores/profileStore";
import { useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";

export default function NetworksScreen() {
    const { t } = useTranslation();
    const { insets } = useDynamicSafeAreaInsets();
    const router = useRouter();
    const navigation = useNavigation();
    const { profileState, changeNetwork } = useProfileStore();
    const [switchingToNetwork, setSwitchingToNetwork] = useState<NetworkId | null>(null);
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();

    const profile = useMemo(() => ProfileState.getProfileOrNull(profileState), [profileState]);

    const networksData = useMemo(() => {
        if (!profile) return [];

        const currentNetworkId = profile.settings.networks.current;
        return profile.settings.networks.definitions.map(networkDef => ({
            definition: networkDef,
            isSelected: networkDef.chainId === currentNetworkId,
        }));
    }, [profile]);

    const handleNetworkChange = async (networkId: NetworkId) => {
        if (!profile) return;
        
        // Don't switch if already on this network
        if (profile.settings.networks.current === networkId) {
            return;
        }

        const { reset: resetOnChainCachedState } = useOnChainStore.getState();

        try {
            setSwitchingToNetwork(networkId);
            
            await changeNetwork(networkId);
            resetOnChainCachedState();
            
            Toast.show({
                type: "networkChange",
                props: {
                    networkId: networkId,
                    onPress: () => handleNetworkChange(networkId),
                },
            });
        } catch (error) {
            showToastError(error);
        } finally {
            setSwitchingToNetwork(null);
        }
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            header: () => (
                <SimpleHeader
                    title={t('networks.title')}
                    subtitle={t('networks.subtitle')}
                    onBackPress={() => router.back()}
                />
            ),
        });
    }, [navigation, insets.top, router, t]);

    if (!profile) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.emptyState}>
                    <IconSymbol name="network-off" size={48} color={colorTokens['text.muted']} />
                    <Text style={styles.emptyStateText}>{t('networks.emptyState.noProfile')}</Text>
                </View>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: spaceTokens[3] + insets.bottom }]}
        >
            {/* Networks List */}
            {networksData.length === 0 ? (
                <View style={styles.emptyState}>
                    <IconSymbol name="network-off" size={48} color={colorTokens['text.muted']} />
                    <Text style={styles.emptyStateText}>{t('networks.emptyState.noNetworks')}</Text>
                    <Text style={styles.emptyStateSubtext}>
                        {t('networks.emptyState.noNetworksDescription')}
                    </Text>
                </View>
            ) : (
                <View style={styles.networksList}>
                    {networksData.map(({ definition, isSelected }) => (
                        <NetworkItem
                            key={definition.chainId}
                            definition={definition}
                            isSelected={isSelected}
                            isSwitching={switchingToNetwork === definition.chainId}
                            onPress={() => handleNetworkChange(definition.chainId)}
                        />
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

interface NetworkItemProps {
    definition: NetworkDefinition;
    isSelected: boolean;
    isSwitching: boolean;
    onPress: () => void;
}

function NetworkItem({ definition, isSelected, isSwitching, onPress }: NetworkItemProps) {
    const { t } = useTranslation();
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();

    const getNetworkIcon = (chainId: NetworkId) => {
        switch (chainId) {
            case "SN_MAIN":
                return "globe" as const;
            case "SN_SEPOLIA":
                return "wrench" as const;
            default:
                return "network" as const;
        }
    };

    const getNetworkColor = (chainId: NetworkId): string => {
        if (isSelected) {
            return colorTokens['brand.accent'];
        }
        switch (chainId) {
            case "SN_MAIN":
                return colorTokens['status.success'];
            case "SN_SEPOLIA":
                return colorTokens['status.warning'];
            default:
                return colorTokens['text.secondary'];
        }
    };

    return (
        <Pressable
            style={[
                styles.networkCard,
                isSelected && styles.networkCardSelected,
            ]}
            onPress={onPress}
            disabled={isSelected || isSwitching}
            android_ripple={{ color: colorTokens['bg.sunken'] }}
        >
            <View style={styles.networkHeader}>
                <View style={styles.networkHeaderLeft}>
                    <View style={[
                        styles.networkIconContainer,
                        isSelected && styles.networkIconContainerSelected
                    ]}>
                        <IconSymbol
                            name={getNetworkIcon(definition.chainId)}
                            size={24}
                            color={getNetworkColor(definition.chainId)}
                        />
                    </View>
                    <View style={styles.networkInfo}>
                        <View style={styles.networkTitleRow}>
                            <Text style={styles.networkTitle}>{definition.displayName}</Text>
                            {definition.isTestNetwork && (
                                <View style={styles.testBadge}>
                                    <Text style={styles.testBadgeText}>{t('networks.testBadge')}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.networkChainId} numberOfLines={1}>
                            {definition.chainId}
                        </Text>
                    </View>
                </View>
                <View style={styles.networkHeaderRight}>
                    {isSwitching ? (
                        <ActivityIndicator size="small" color={colorTokens['brand.accent']} />
                    ) : isSelected ? (
                        <View style={styles.selectedBadge}>
                            <IconSymbol
                                name="checkmark-circle"
                                size={24}
                                color={colorTokens['brand.accent']}
                            />
                        </View>
                    ) : (
                        <View style={styles.unselectedCircle} />
                    )}
                </View>
            </View>

            {/* Network Details */}
            <View style={styles.networkDetails}>
                {definition.blockExplorerUrl && (
                    <View style={styles.detailRow}>
                        <IconSymbol
                            name="web"
                            size={14}
                            color={colorTokens['text.secondary']}
                        />
                        <Text style={styles.detailText} numberOfLines={1}>
                            {definition.blockExplorerUrl.toString()}
                        </Text>
                    </View>
                )}
                <View style={styles.detailRow}>
                    <IconSymbol
                        name="server"
                        size={14}
                        color={colorTokens['text.secondary']}
                    />
                    <Text style={styles.detailText} numberOfLines={1}>
                        {t('networks.rpcLabel', { hostname: definition.rpcUrl.hostname })}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        flex: 1,
        backgroundColor: colorTokens['bg.default'],
    },
    scrollContent: {
        paddingHorizontal: spaceTokens[5],
        paddingVertical: spaceTokens[3],
    },
    networksList: {
        gap: spaceTokens[4],
    },
    networkCard: {
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.lg,
        shadowColor: colorTokens['shadow.primary'],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
        padding: spaceTokens[4],
        gap: spaceTokens[3],
        borderWidth: 2,
        borderColor: 'transparent',
    },
    networkCardSelected: {
        borderColor: colorTokens['brand.accent'],
        backgroundColor: colorTokens['brand.glow'],
    },
    networkHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    networkHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: spaceTokens[3],
    },
    networkHeaderRight: {
        marginLeft: spaceTokens[2],
    },
    networkIconContainer: {
        width: 48,
        height: 48,
        borderRadius: radiusTokens.md,
        backgroundColor: colorTokens['bg.default'],
        justifyContent: 'center',
        alignItems: 'center',
    },
    networkIconContainerSelected: {
        backgroundColor: colorTokens['bg.elevated'],
    },
    networkInfo: {
        flex: 1,
        gap: spaceTokens[1],
    },
    networkTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spaceTokens[2],
    },
    networkTitle: {
        fontSize: 18,
        ...fontStyles.ubuntuMono.bold,
        color: colorTokens['text.primary'],
    },
    testBadge: {
        backgroundColor: colorTokens['status.warning'] + '20',
        paddingHorizontal: spaceTokens[2],
        paddingVertical: spaceTokens[0],
        borderRadius: radiusTokens.sm,
        borderWidth: 1,
        borderColor: colorTokens['status.warning'] + '40',
    },
    testBadgeText: {
        fontSize: 10,
        ...fontStyles.ubuntuMono.bold,
        color: colorTokens['status.warning'],
        letterSpacing: 0.5,
    },
    networkChainId: {
        fontSize: 13,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
    },
    selectedBadge: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unselectedCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colorTokens['border.subtle'],
        backgroundColor: 'transparent',
    },
    networkDetails: {
        gap: spaceTokens[2],
        paddingTop: spaceTokens[2],
        borderTopWidth: 1,
        borderTopColor: colorTokens['border.subtle'],
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spaceTokens[2],
    },
    detailText: {
        fontSize: 12,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
        flex: 1,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spaceTokens[8],
        gap: spaceTokens[3],
    },
    emptyStateText: {
        fontSize: 18,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.secondary'],
    },
    emptyStateSubtext: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.muted'],
        textAlign: 'center',
        paddingHorizontal: spaceTokens[6],
    },
}));

