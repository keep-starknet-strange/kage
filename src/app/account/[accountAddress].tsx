import { AddressView } from '@/components/address-view';
import { colorTokens, radiusTokens, spaceTokens } from '@/design/tokens';
import { ProfileState } from '@/profile/profileState';
import { useAppDependenciesStore } from '@/stores/appDependenciesStore';
import TokenBalance from '@/stores/balance/tokenBalance';
import { useProfileStore } from '@/stores/profileStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

type TabType = 'public' | 'private';

export default function AccountDetailScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { accountAddress } = useLocalSearchParams<{ accountAddress: string }>();
    const { profileState } = useProfileStore();
    const [balances, setBalances] = useState<TokenBalance[]>([]);
    const [isLoadingBalances, setIsLoadingBalances] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('public');

    // Find the account from the profile state
    const account = useMemo(() => {
        if (!ProfileState.isProfile(profileState)) {
            return null;
        }
        return profileState.getAccountOnCurrentNetwork(accountAddress);
    }, [profileState, accountAddress]);

    // Calculate total balance in USD (placeholder - you can implement actual price conversion)
    const totalBalance = useMemo(() => {
        // TODO: Implement actual USD conversion based on token prices
        return "0.00";
    }, [balances]);

    // Dynamic balance label based on active tab
    const balanceLabel = activeTab === 'public' ? 'Public Balance' : 'Private Balance';

    // Fetch balances for this account
    const fetchBalances = useCallback(async () => {
        if (!account) return;

        setIsLoadingBalances(true);
        try {
            const { publicBalanceRepository } = useAppDependenciesStore.getState();
            const balancesMap = await publicBalanceRepository.getBalances([account]);
            const accountBalances = balancesMap.get(account.address) ?? [];
            setBalances(accountBalances);
        } catch (error) {
            console.error('Error fetching balances:', error);
        } finally {
            setIsLoadingBalances(false);
        }
    }, [account]);

    useEffect(() => {
        void fetchBalances();
    }, [fetchBalances]);

    // If account not found, show error
    if (!account) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Account not found</Text>
                    <Pressable
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header Section */}
            <View style={styles.header}>
                {/* Back Button */}
                <Pressable
                    style={styles.backIconButton}
                    onPress={() => router.back()}
                >
                    <IconSymbol name="chevron.left" size={24} color={colorTokens['text.primary']} />
                </Pressable>

                {/* Account Info */}
                <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>{account.name}</Text>
                    <AddressView address={account.address} variant="compact" />
                </View>
            </View>

            {/* Total Balance Section */}
            <View style={styles.balanceSection}>
                <Text style={styles.balanceLabel}>{balanceLabel}</Text>
                <Text style={styles.balanceAmount}>${totalBalance}</Text>
            </View>

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                <Pressable
                    style={[styles.tabButton, activeTab === 'public' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('public')}
                >
                    <Text style={[styles.tabButtonText, activeTab === 'public' && styles.tabButtonTextActive]}>
                        Public
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.tabButton, activeTab === 'private' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('private')}
                >
                    <Text style={[styles.tabButtonText, activeTab === 'private' && styles.tabButtonTextActive]}>
                        Private
                    </Text>
                </Pressable>
            </View>

            {/* Tab Content */}
            <View style={[styles.tabsContainer, { paddingBottom: insets.bottom }]}>
                {activeTab === 'public' && (
                    <PublicTab
                        balances={balances}
                        isLoading={isLoadingBalances}
                        onRefresh={fetchBalances}
                    />
                )}
                {activeTab === 'private' && <PrivateTab />}
            </View>
        </View>
    );
}

// Public Tab Component
function PublicTab({
    balances,
    isLoading,
    onRefresh
}: {
    balances: TokenBalance[];
    isLoading: boolean;
    onRefresh: () => void;
}) {
    const renderTokenItem = ({ item }: { item: TokenBalance }) => (
        <View style={styles.tokenCard}>
            <View style={styles.tokenInfo}>
                <Text style={styles.tokenSymbol}>{item.token.symbol}</Text>
                <Text style={styles.tokenAddress} numberOfLines={1}>
                    {item.token.contractAddress}
                </Text>
            </View>
            <View style={styles.tokenBalance}>
                <Text style={styles.tokenBalanceAmount}>
                    {item.formattedBalance(true)}
                </Text>
            </View>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <IconSymbol name="tray" size={48} color={colorTokens['text.muted']} />
            <Text style={styles.emptyStateText}>No tokens found</Text>
        </View>
    );

    const renderHeader = () => (
        <View style={styles.tabHeader}>
            <Text style={styles.tabHeaderText}>Your Tokens</Text>
        </View>
    );

    if (isLoading && balances.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colorTokens['brand.accent']} />
                <Text style={styles.loadingText}>Loading balances...</Text>
            </View>
        );
    }

    return (
        <FlatList
            style={styles.tabContent}
            contentContainerStyle={styles.tabContentContainer}
            data={balances}
            renderItem={renderTokenItem}
            keyExtractor={(item) => item.token.contractAddress}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            ItemSeparatorComponent={() => <View style={styles.tokenSeparator} />}
            refreshing={isLoading}
            onRefresh={onRefresh}
        />
    );
}

// Private Tab Component
function PrivateTab() {
    return (
        <View style={styles.tabContent}>
            <View style={styles.emptyState}>
                <IconSymbol name="lock.fill" size={48} color={colorTokens['text.muted']} />
                <Text style={styles.emptyStateText}>Private tokens coming soon</Text>
                <Text style={styles.emptyStateSubtext}>
                    Private token balances will be displayed here
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colorTokens['bg.default'],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spaceTokens[4],
        paddingVertical: spaceTokens[3],
        gap: spaceTokens[3],
    },
    backIconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radiusTokens.md,
        backgroundColor: colorTokens['bg.elevated'],
    },
    accountInfo: {
        flex: 1,
        gap: spaceTokens[1],
    },
    accountName: {
        fontSize: 20,
        fontWeight: '700',
        color: colorTokens['text.primary'],
    },
    balanceSection: {
        backgroundColor: colorTokens['bg.elevated'],
        marginHorizontal: spaceTokens[4],
        borderRadius: radiusTokens.lg,
        padding: spaceTokens[5],
        alignItems: 'center',
        shadowColor: colorTokens['shadow.primary'],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 2,
        marginBottom: spaceTokens[4],
    },
    balanceLabel: {
        fontSize: 14,
        color: colorTokens['text.muted'],
        marginBottom: spaceTokens[1],
        fontWeight: '500',
    },
    balanceAmount: {
        fontSize: 48,
        fontWeight: '700',
        color: colorTokens['text.primary'],
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: colorTokens['bg.default'],
        borderBottomWidth: 1,
        borderBottomColor: colorTokens['border.subtle'],
        paddingHorizontal: spaceTokens[4],
    },
    tabButton: {
        flex: 1,
        paddingVertical: spaceTokens[3],
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabButtonActive: {
        borderBottomColor: colorTokens['brand.accent'],
    },
    tabButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colorTokens['text.muted'],
    },
    tabButtonTextActive: {
        color: colorTokens['brand.accent'],
    },
    tabsContainer: {
        flex: 1,
    },
    tabContent: {
        flex: 1,
        backgroundColor: colorTokens['bg.default'],
    },
    tabContentContainer: {
        padding: spaceTokens[4],
    },
    tabHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spaceTokens[3],
    },
    tabHeaderText: {
        fontSize: 18,
        fontWeight: '600',
        color: colorTokens['text.primary'],
    },
    refreshButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radiusTokens.sm,
        backgroundColor: colorTokens['bg.elevated'],
    },
    tokenCard: {
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.md,
        padding: spaceTokens[4],
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: colorTokens['shadow.primary'],
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 1,
    },
    tokenInfo: {
        flex: 1,
        gap: spaceTokens[1],
    },
    tokenSymbol: {
        fontSize: 18,
        fontWeight: '600',
        color: colorTokens['text.primary'],
    },
    tokenAddress: {
        fontSize: 12,
        color: colorTokens['text.muted'],
        maxWidth: 200,
    },
    tokenBalance: {
        alignItems: 'flex-end',
    },
    tokenBalanceAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: colorTokens['text.primary'],
    },
    tokenSeparator: {
        height: spaceTokens[2],
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spaceTokens[8],
        gap: spaceTokens[2],
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '500',
        color: colorTokens['text.muted'],
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: colorTokens['text.muted'],
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spaceTokens[3],
    },
    loadingText: {
        fontSize: 14,
        color: colorTokens['text.muted'],
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spaceTokens[4],
        gap: spaceTokens[4],
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: colorTokens['text.primary'],
    },
    backButton: {
        backgroundColor: colorTokens['brand.accent'],
        paddingVertical: spaceTokens[3],
        paddingHorizontal: spaceTokens[5],
        borderRadius: radiusTokens.md,
    },
    backButtonText: {
        color: colorTokens['text.inverted'],
        fontSize: 16,
        fontWeight: '600',
    },
});

