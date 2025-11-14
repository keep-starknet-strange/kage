import { AddressView } from '@/components/address-view';
import { AccountContextMenu } from '@/components/ui/account-context-menu';
import { TotalBalanceCard } from '@/components/ui/total-balance-card';
import { radiusTokens, spaceTokens } from '@/design/tokens';
import Account from '@/profile/account';
import { ProfileState } from '@/profile/profileState';
import { useDynamicSafeAreaInsets } from '@/providers/DynamicSafeAreaProvider';
import { ThemedStyleSheet, useTheme, useThemedStyle } from '@/providers/ThemeProvider';
import { useProfileStore } from '@/stores/profileStore';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
    const { insets } = useDynamicSafeAreaInsets();
    const { colors } = useTheme();
    const router = useRouter();
    const { profileState } = useProfileStore();
    const styles = useThemedStyle(themedStyleSheet);

    // Get accounts from the current network
    const accounts = useMemo(() => {
        return ProfileState.isProfile(profileState)
            ? profileState.currentNetwork.accounts
            : [];
    }, [profileState]);

    const renderHeader = () => (
        <>
            <TotalBalanceCard
                accounts={accounts as Account[]}
            />
            <Text style={[styles.sectionTitle, { color: colors['text.primary'] }]}>My Public Accounts</Text>
        </>
    );

    const renderAccountCard = ({ item: account }: { item: Account }) => (
        <TouchableOpacity
            style={[styles.accountCard, { backgroundColor: colors['bg.elevated'], shadowColor: colors['shadow.primary'] }]}
            activeOpacity={0.7}
            onPress={() => {
                router.push(`/account/${account.address}`);
            }}
        >
            <View style={styles.accountNameContainer}>
                <Text style={[styles.accountName, { color: colors['text.primary'] }]}>{account.name}</Text>
                
                <AccountContextMenu account={account} />
            </View>

            <AddressView address={account.address} variant='compact' />
        </TouchableOpacity>
    );

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors['text.muted'] }]}>No accounts yet</Text>
        </View>
    );

    const renderFooter = () => (
        <TouchableOpacity
            style={[styles.createAccountButton, { backgroundColor: colors['brand.glow'], borderColor: colors['brand.accent'] + '40' }]}
            activeOpacity={0.7}
            onPress={() => {
                router.push('/account/create');
            }}
        >
            <Text style={[styles.createAccountButtonText, { color: colors['brand.accent'] }]}>Add a new public account</Text>
        </TouchableOpacity>
    );

    return (
        <FlatList
            style={[styles.container, { paddingTop: insets.top, backgroundColor: colors['bg.default'] }]}
            contentContainerStyle={[
                styles.contentContainer,
                { paddingBottom: insets.bottom }
            ]}
            data={accounts}
            renderItem={renderAccountCard}
            keyExtractor={(item, index) => `${item.address}-${index}`}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
    );
}

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: spaceTokens[4], // 16px
    },
    networkBadgeMargin: {
        alignSelf: "center",
        marginBottom: spaceTokens[4], // 16px
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: spaceTokens[3], // 12px
        marginTop: spaceTokens[5], // 24px
    },
    separator: {
        height: spaceTokens[2], // 12px
    },
    accountCard: {
        borderRadius: radiusTokens.md,
        padding: spaceTokens[4], // 16px
        gap: spaceTokens[2], // 12px
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 1,
    },
    accountName: {
        fontSize: 18,
        fontWeight: '600',
    },
    emptyState: {
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.md,
        padding: spaceTokens[6], // 32px
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 16,
        color: colorTokens['text.muted'],
    },
    createAccountButton: {
        backgroundColor: colorTokens['brand.accent'],
        paddingVertical: spaceTokens[3], // 12px
        paddingHorizontal: spaceTokens[5], // 24px
        borderRadius: radiusTokens.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spaceTokens[4], // 16px
        minHeight: 48,
        shadowColor: colorTokens['brand.accent'],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    createAccountButtonText: {
        color: colorTokens['text.inverted'],
        fontSize: 16,
        fontWeight: '600',
    },
    accountNameContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
}));

