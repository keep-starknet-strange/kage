import { AddressView } from "@/components/address-view";
import { FundTab } from "@/components/screens/tx/fund-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { TransferTab } from "@/components/screens/tx/transfer-tab";
import { WithdrawTab } from "@/components/screens/tx/withdraw-tab";
import { colorTokens, radiusTokens, spaceTokens } from "@/design/tokens";
import { AccountAddress } from "@/profile/account";
import { ProfileState } from "@/profile/profileState";
import { useDynamicSafeAreaInsets } from "@/providers/DynamicSafeAreaProvider";
import { useProfileStore } from "@/stores/profileStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type TxType = 'fund' | 'transfer' | 'withdraw';

const TransactionScreen = () => {
    const { insets } = useDynamicSafeAreaInsets();
    const router = useRouter();
    const { txType, accountAddress } = useLocalSearchParams<{ txType: TxType, accountAddress: AccountAddress }>();
    const { profileState } = useProfileStore();

    const [activeTab, setActiveTab] = useState<TxType>(txType as TxType || 'fund');
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Find the account from the profile state
    const account = useMemo(() => {
        if (!ProfileState.isProfile(profileState)) {
            return null;
        }
        return profileState.getAccountOnCurrentNetwork(accountAddress);
    }, [profileState, accountAddress]);

    const handleWithdraw = useCallback(async () => {
        if (!withdrawAmount) {
            Alert.alert('Error', 'Please enter an amount');
            return;
        }

        setIsLoading(true);
        try {
            // TODO: Implement withdraw logic
            console.log('Withdrawing from account:', withdrawAmount);
            Alert.alert('Success', `Withdrawn ${withdrawAmount} tokens`);
            setWithdrawAmount("");
        } catch (error) {
            console.error('Error withdrawing:', error);
            Alert.alert('Error', 'Failed to withdraw tokens');
        } finally {
            setIsLoading(false);
        }
    }, [withdrawAmount]);

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
            <ScrollView style={styles.content}>
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

                {/* Tab Navigation */}
                <View style={styles.tabContainer}>
                    <Pressable
                        style={[styles.tab, activeTab === 'fund' && styles.activeTab]}
                        onPress={() => setActiveTab('fund')}
                    >
                        <IconSymbol
                            name="plus.circle"
                            size={20}
                            color={activeTab === 'fund' ? colorTokens['text.primary'] : colorTokens['text.secondary']}
                        />
                        <Text style={[styles.tabText, activeTab === 'fund' && styles.activeTabText]}>
                            Fund
                        </Text>
                    </Pressable>

                    <Pressable
                        style={[styles.tab, activeTab === 'transfer' && styles.activeTab]}
                        onPress={() => setActiveTab('transfer')}
                    >
                        <IconSymbol
                            name="arrow.right.circle"
                            size={20}
                            color={activeTab === 'transfer' ? colorTokens['text.primary'] : colorTokens['text.secondary']}
                        />
                        <Text style={[styles.tabText, activeTab === 'transfer' && styles.activeTabText]}>
                            Transfer
                        </Text>
                    </Pressable>

                    <Pressable
                        style={[styles.tab, activeTab === 'withdraw' && styles.activeTab]}
                        onPress={() => setActiveTab('withdraw')}
                    >
                        <IconSymbol
                            name="arrow.up.circle"
                            size={20}
                            color={activeTab === 'withdraw' ? colorTokens['text.primary'] : colorTokens['text.secondary']}
                        />
                        <Text style={[styles.tabText, activeTab === 'withdraw' && styles.activeTabText]}>
                            Withdraw
                        </Text>
                    </Pressable>
                </View>

                {/* Tab Content */}
                <View style={styles.tabContent}>
                    {activeTab === 'fund' && (
                        <FundTab account={account} />
                    )}

                    {activeTab === 'transfer' && (
                        <TransferTab account={account} />
                    )}

                    {activeTab === 'withdraw' && (
                        <WithdrawTab account={account} />
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

export default TransactionScreen;

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
    content: {
        flex: 1,
    },
    accountSection: {
        marginBottom: spaceTokens[5],
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: colorTokens['text.secondary'],
        marginBottom: spaceTokens[1],
    },
    accountCard: {
        backgroundColor: colorTokens['bg.elevated'],
        padding: spaceTokens[3],
        borderRadius: radiusTokens.md,
        borderWidth: 1,
        borderColor: colorTokens['border.subtle'],
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: colorTokens['bg.sunken'],
        borderRadius: radiusTokens.md,
        padding: spaceTokens[1],
        marginHorizontal: spaceTokens[4],
        marginVertical: spaceTokens[1],
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spaceTokens[2],
        paddingHorizontal: spaceTokens[1],
        borderRadius: radiusTokens.sm,
        gap: spaceTokens[1],
    },
    activeTab: {
        backgroundColor: colorTokens['bg.elevated'],
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: colorTokens['text.secondary'],
    },
    activeTabText: {
        color: colorTokens['text.primary'],
        fontWeight: '600',
    },
    tabContent: {
        flex: 1,
        marginHorizontal: spaceTokens[4],
        marginVertical: spaceTokens[1],
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spaceTokens[5],
    },
    errorText: {
        fontSize: 16,
        color: colorTokens['text.primary'],
        marginBottom: spaceTokens[3],
    },
    backButton: {
        paddingHorizontal: spaceTokens[5],
        paddingVertical: spaceTokens[2],
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.sm,
    },
    backButtonText: {
        fontSize: 16,
        color: colorTokens['text.primary'],
    },
});