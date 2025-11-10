import { AddressView } from '@/components/address-view';
import { PrivateBalancesLocked } from '@/components/private-balances-locked';
import { BalanceCard } from '@/components/ui/balance-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PrivateAddressView } from '@/components/ui/private-address-view';
import { colorTokens, radiusTokens, spaceTokens } from '@/design/tokens';
import { AccountAddress } from '@/profile/account';
import { ProfileState } from '@/profile/profileState';
import { useDynamicSafeAreaInsets } from '@/providers/DynamicSafeAreaProvider';
import { useBalanceStore } from '@/stores/balance/balanceStore';
import { useProfileStore } from '@/stores/profileStore';
import { PrivateTokenBalance, PublicTokenBalance } from '@/types/tokenBalance';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

type TabType = 'public' | 'private';

export default function AccountDetailScreen() {
    const { insets } = useDynamicSafeAreaInsets();
    const router = useRouter();
    const { accountAddress } = useLocalSearchParams<{ accountAddress: AccountAddress }>();
    const { profileState } = useProfileStore();
    const { requestRefresh, unlockPrivateBalances, lockPrivateBalances } = useBalanceStore();
    const publicBalances = useBalanceStore(state => state.publicBalances.get(accountAddress) ?? null);
    const privateBalances = useBalanceStore(state => state.privateBalances.get(accountAddress) ?? null);
    const isPrivateBalancesUnlocked = useBalanceStore(state => state.unlockedPrivateBalances.has(accountAddress));

    const [isLoadingBalances, setIsLoadingBalances] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('public');

    // Find the account from the profile state
    const account = useMemo(() => {
        if (!ProfileState.isProfile(profileState)) {
            return null;
        }
        return profileState.getAccountOnCurrentNetwork(accountAddress);
    }, [profileState, accountAddress]);

    // Fetch balances for this account
    const fetchBalances = useCallback(async () => {
        if (!account) return;

        setIsLoadingBalances(true);
        try {
            await requestRefresh([account], [account]);
        } catch (error) {
            console.error('Error fetching balances:', error);
        } finally {
            setIsLoadingBalances(false);
        }
    }, [account, requestRefresh]);

    const handleUnlockPrivateBalances = useCallback(async () => {
        if (!account) return;

        setIsLoadingBalances(true);
        try {
            await unlockPrivateBalances([account]);
        } catch (error) {
            console.error('Error unlocking private balances:', error);
        } finally {
            setIsLoadingBalances(false);
        }
    }, [account, unlockPrivateBalances]);

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
            <BalanceCard
                type={activeTab}
                account={account}
                style={styles.balanceCard}
                onFundPress={() => { 
                    router.push(`/tx/fund/${accountAddress}`);
                }}
                onTransferPress={() => { 
                    router.push(`/tx/transfer/${accountAddress}`);
                }}
                onWithdrawPress={() => {
                    router.push(`/tx/withdraw/${accountAddress}`);
                 }}
            />

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
                        balances={publicBalances ?? []}
                        isLoading={isLoadingBalances}
                        onRefresh={fetchBalances}
                    />
                )}
                {activeTab === 'private' && (
                    isPrivateBalancesUnlocked ? (
                        <PrivateTab
                            balances={privateBalances ?? []}
                            isLoading={isLoadingBalances}
                            onRefresh={fetchBalances}
                            onLock={() => lockPrivateBalances([account])}
                        />
                    ) : (
                        <PrivateBalancesLocked
                            isLoadingBalances={isLoadingBalances}
                            handleUnlockPrivateBalances={handleUnlockPrivateBalances}
                        />
                    )
                )}
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
    balances: PublicTokenBalance[];
    isLoading: boolean;
    onRefresh: () => void;
}) {
    const renderTokenItem = ({ item }: { item: PublicTokenBalance }) => {
        return (
            <View style={styles.tokenCard}>
                <View style={styles.tokenInfo}>
                    <Text style={styles.tokenSymbol}>{item.token.symbol}</Text>
                </View>
                <View style={styles.tokenBalance}>
                    <Text style={styles.tokenBalanceAmount}>
                        {item.formattedSpendableBalance(true)}
                    </Text>
                </View>
            </View>
        )
    };

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
function PrivateTab({
    balances,
    isLoading,
    onRefresh,
    onLock
}: {
    balances: PrivateTokenBalance[];
    isLoading: boolean;
    onRefresh: () => void;
    onLock: () => void;
}) {
    const renderTokenItem = ({ item }: { item: PrivateTokenBalance }) => {
        return (
            <View style={styles.tokenCard}>
                <View style={styles.tokenInfo}>
                    <Text style={styles.tokenSymbol}>{item.token.symbol}</Text>
                    {item.isUnlocked && (
                        <PrivateAddressView address={item.privateTokenAddress!} />
                    )}
                </View>
                <View style={styles.tokenBalance}>
                    <Text style={styles.tokenBalanceAmount}>
                        {item.formattedSpendableBalance(true)}
                    </Text>
                </View>
            </View>
        )
    };

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <IconSymbol name="tray" size={48} color={colorTokens['text.muted']} />
            <Text style={styles.emptyStateText}>No tokens found</Text>
        </View>
    );

    const renderHeader = () => (
        <View style={[styles.tabHeader]}>
            <Text style={styles.tabHeaderText}>Your Tokens</Text>
            <Pressable onPress={() => onLock()} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <IconSymbol name="lock.open.fill" size={18} color={colorTokens['brand.accent']} />
                <Text style={{ color: colorTokens['brand.accent'], fontWeight: '600', fontSize: 16, marginLeft: 4 }}>Lock</Text>
            </Pressable>
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
    balanceCard: {
        marginHorizontal: spaceTokens[4],
        marginVertical: spaceTokens[1],
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
        gap: spaceTokens[1],
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

