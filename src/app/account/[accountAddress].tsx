import { PrivateBalancesLocked } from '@/components/private-balances-locked';
import AccountHeader from '@/components/ui/account-header';
import { IconSymbol } from "@/components/ui/icon-symbol/icon-symbol";
import { PrivateBalanceCard } from '@/components/ui/private-balance-card';
import { PublicBalanceCard } from '@/components/ui/public-balance-card';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { showToastError } from '@/components/ui/toast';
import { PrivateTokenBalanceView, PublicTokenBalanceView } from '@/components/ui/token-balance-view';
import { fontStyles, radiusTokens, spaceTokens } from '@/design/tokens';
import { AccountAddress } from '@/profile/account';
import { ProfileState } from '@/profile/profileState';
import { useDynamicSafeAreaInsets } from '@/providers/DynamicSafeAreaProvider';
import { ThemedStyleSheet, useTheme, useThemedStyle } from '@/providers/ThemeProvider';
import { useBalanceStore } from '@/stores/balance/balanceStore';
import { useProfileStore } from '@/stores/profileStore';
import { PrivateTokenBalance, PublicTokenBalance } from '@/types/tokenBalance';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

type TabType = 'public' | 'private';

export default function AccountDetailScreen() {
    const { insets } = useDynamicSafeAreaInsets();
    const router = useRouter();
    const navigation = useNavigation();
    const { accountAddress } = useLocalSearchParams<{ accountAddress: AccountAddress }>();
    const { profileState } = useProfileStore();
    const { requestRefresh, unlockPrivateBalances, lockPrivateBalances } = useBalanceStore();
    const publicBalances = useBalanceStore(state => state.publicBalances.get(accountAddress) ?? null);
    const privateBalances = useBalanceStore(state => state.privateBalances.get(accountAddress) ?? null);
    const isPrivateBalancesUnlocked = useBalanceStore(state => state.unlockedPrivateBalances.has(accountAddress));

    const [isLoadingBalances, setIsLoadingBalances] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('public');

    const styles = useThemedStyle(themedStyleSheet);

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
            showToastError(error);
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
            showToastError(error);
        } finally {
            setIsLoadingBalances(false);
        }
    }, [account, unlockPrivateBalances]);

    useLayoutEffect(() => {
        navigation.setOptions({
            header: () => <AccountHeader account={account} />,
        });
    }, [navigation, account]);

    // If account not found, show error
    if (!account) {
        return (
            <View style={[styles.container]}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Account not found</Text>
                    <SecondaryButton
                        title="Go Back"
                        onPress={() => router.back()}
                    />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container]}>
            {/* Total Balance Section */}
            {activeTab === 'public' && (
                <PublicBalanceCard
                    account={account}
                    onTransferPress={() => {
                        router.push(`/tx/publicTransfer/${accountAddress}`);
                    }}
                    style={styles.balanceCard}
                />
            )}

            {activeTab === 'private' && (
                <PrivateBalanceCard
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
            )}

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
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();

    const renderTokenItem = ({ item }: { item: PublicTokenBalance }) => {
        return <PublicTokenBalanceView balance={item} />
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
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();

    const renderTokenItem = ({ item }: { item: PrivateTokenBalance }) => {
        return <PrivateTokenBalanceView balance={item} />
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

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        flex: 1,
        backgroundColor: colorTokens['bg.default'],
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
        ...fontStyles.ubuntuMono.semibold,
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
        ...fontStyles.ubuntuMono.semibold,
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
        ...fontStyles.ubuntuMono.semibold,
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
        ...fontStyles.ubuntuMono.regular,
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
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
    },
}));

