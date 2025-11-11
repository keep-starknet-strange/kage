import { AddressView } from '@/components/address-view';
import { TotalBalanceCard } from '@/components/ui/total-balance-card';
import { colorTokens, radiusTokens, spaceTokens } from '@/design/tokens';
import Account from '@/profile/account';
import { ProfileState } from '@/profile/profileState';
import { useDynamicSafeAreaInsets } from '@/providers/DynamicSafeAreaProvider';
import { useProfileStore } from '@/stores/profileStore';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
    const { insets } = useDynamicSafeAreaInsets();
    const router = useRouter();
    const { profileState } = useProfileStore();

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
            <Text style={styles.sectionTitle}>My Public Accounts</Text>
        </>
    );

    const renderAccountCard = ({ item: account }: { item: Account }) => (
        <TouchableOpacity 
            style={styles.accountCard}
            activeOpacity={0.7}
            onPress={() => {
                router.push(`/account/${account.address}`);
            }}
        >
            <Text style={styles.accountName}>{account.name}</Text>
            <AddressView address={account.address} variant='compact'/>
        </TouchableOpacity>
    );

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No accounts yet</Text>
        </View>
    );

    const renderFooter = () => (
        <TouchableOpacity 
            style={styles.createAccountButton}
            activeOpacity={0.7}
            onPress={() => {
                // TODO: Navigate to create account screen
            }}
        >
            <Text style={styles.createAccountButtonText}>Add a new public account</Text>
        </TouchableOpacity>
    );

    return (
        <FlatList
            style={[styles.container, { paddingTop: insets.top }]}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colorTokens['bg.default'],
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
        color: colorTokens['text.primary'],
        marginBottom: spaceTokens[3], // 12px
        marginTop: spaceTokens[5], // 24px
    },
    separator: {
        height: spaceTokens[2], // 12px
    },
    accountCard: {
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.md,
        padding: spaceTokens[4], // 16px
        gap: spaceTokens[2], // 12px
        shadowColor: colorTokens['shadow.primary'],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 1,
    },
    accountName: {
        fontSize: 18,
        fontWeight: '600',
        color: colorTokens['text.primary'],
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
});
