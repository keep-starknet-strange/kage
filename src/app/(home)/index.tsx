import { AddressView } from '@/components/address-view';
import { AccountContextMenu } from '@/components/ui/account-context-menu';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TotalBalanceCard } from '@/components/ui/total-balance-card';
import { fontStyles, radiusTokens, spaceTokens } from '@/design/tokens';
import Account from '@/profile/account';
import { ProfileState } from '@/profile/profileState';
import { useDynamicSafeAreaInsets } from '@/providers/DynamicSafeAreaProvider';
import { ThemedStyleSheet, useTheme, useThemedStyle } from '@/providers/ThemeProvider';
import { useProfileStore } from '@/stores/profileStore';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function HomeScreen() {
    const { t } = useTranslation();
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
            <Text style={[styles.sectionTitle, { color: colors['text.primary'] }]}>{t('home.sectionTitle')}</Text>
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
            <Text style={[styles.emptyStateText, { color: colors['text.muted'] }]}>{t('home.emptyState')}</Text>
        </View>
    );

    const renderFooter = () => (
        <PrimaryButton
            title={t('home.addAccount')}
            onPress={() => {
                router.push('/account/create');
            }}
            style={styles.createAccountButton}
        />
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
        padding: spaceTokens[4], 
    },
    networkBadgeMargin: {
        alignSelf: "center",
        marginBottom: spaceTokens[4], 
    },
    sectionTitle: {
        fontSize: 20,
        ...fontStyles.ubuntuMono.bold,
        marginBottom: spaceTokens[3], 
        marginTop: spaceTokens[5], 
    },
    separator: {
        height: spaceTokens[3], 
    },
    accountCard: {
        borderRadius: radiusTokens.md,
        padding: spaceTokens[4], 
        gap: spaceTokens[2], 
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 1,
    },
    accountName: {
        fontSize: 18,
        ...fontStyles.ubuntuMono.semibold,
    },
    emptyState: {
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.md,
        padding: spaceTokens[6], 
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 16,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.muted'],
    },
    createAccountButton: {
        marginTop: spaceTokens[4], 
    },
    accountNameContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
}));

