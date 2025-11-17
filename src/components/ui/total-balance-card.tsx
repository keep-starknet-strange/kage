import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import Account from "@/profile/account";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { useBalanceStore } from "@/stores/balance/balanceStore";
import { getAggregatedFiatBalance } from "@/types/tokenBalance";
import { fiatBalanceToFormatted } from "@/utils/formattedBalance";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleProp, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { IconSymbol } from "./icon-symbol";
import { showToastError } from "./toast";

export interface TotalBalanceCardProps {
    accounts: Account[];
    style?: StyleProp<ViewStyle>;
}

export const TotalBalanceCard = (props: TotalBalanceCardProps) => {
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();
    const { accounts, style } = props;
    const [fiatPublicBalance, setFiatPublicBalance] = useState<string | null>(null);
    const [fiatPrivateBalance, setFiatPrivateBalance] = useState<string | null>(null);
    const [isUpdatingLockState, setIsUpdatingLockState] = useState(false);
    const { publicBalances, privateBalances, unlockedPrivateBalances, unlockPrivateBalances, lockPrivateBalances } = useBalanceStore();

    // Check if any private balances are unlocked
    const hasUnlockedPrivateBalances = useMemo(() => {
        return accounts.every(account => unlockedPrivateBalances.has(account.address));
    }, [accounts, unlockedPrivateBalances]);

    useEffect(() => {
        // Calculate public balance
        const publicTotal = getAggregatedFiatBalance(accounts, publicBalances);
        setFiatPublicBalance(fiatBalanceToFormatted(publicTotal));

        // Calculate private balance
        const privateTotal = getAggregatedFiatBalance(accounts, privateBalances);
        setFiatPrivateBalance(fiatBalanceToFormatted(privateTotal));
    }, [accounts, publicBalances, privateBalances]);

    const balanceText = useMemo(() => {
        if (hasUnlockedPrivateBalances && !isUpdatingLockState) {
            return fiatPrivateBalance;
        }

        if (!hasUnlockedPrivateBalances) {
            return '••••••';
        }

        return null;
    }, [hasUnlockedPrivateBalances, isUpdatingLockState, fiatPrivateBalance])

    return (
        <View style={[styles.container, style]}>
            {/* Public Balance Section */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Public Balance</Text>
                <Text style={styles.sectionAmount}>{fiatPublicBalance ?? '$0.00'}</Text>
            </View>

            <View style={styles.divider} />

            {/* Private Balance Section */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Private Balance</Text>
                <View style={styles.amountRow}>
                    <Text style={styles.sectionAmount}>
                        {balanceText}
                    </Text>
                    
                    <TouchableOpacity onPress={() => {
                        const update = async (isUnlocked: boolean) => {
                            setIsUpdatingLockState(true);
                            try {
                                if (isUnlocked) {
                                    await lockPrivateBalances(accounts);
                                } else {
                                    await unlockPrivateBalances(accounts);
                                }
                            } catch (error) {
                                showToastError(error);
                            } finally {
                                setIsUpdatingLockState(false);
                            }
                        }

                        update(hasUnlockedPrivateBalances);
                    }} style={styles.lockIcon}>
                        {isUpdatingLockState && (
                            <ActivityIndicator size="small" color={colorTokens['text.muted']} />
                        )}
                        {!isUpdatingLockState && (
                            <IconSymbol
                                name={hasUnlockedPrivateBalances ? "lock.open.fill" : "lock.fill"}
                                size={24}
                                color={colorTokens['text.muted']}
                            />
                        )}
                    </TouchableOpacity>
                </View>

            </View>
        </View>
    );
};

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.lg,
        padding: spaceTokens[5],
        flexDirection: 'row',
        shadowColor: colorTokens['shadow.primary'],
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 1,
        shadowRadius: spaceTokens[0],
        elevation: 2,
    },
    section: {
        flex: 1,
        alignItems: 'center',
        gap: spaceTokens[2],
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spaceTokens[2],
    },
    sectionLabel: {
        fontSize: 14,
        color: colorTokens['text.muted'],
        ...fontStyles.ubuntuMono.semibold,
    },
    sectionAmount: {
        fontSize: 32,
        ...fontStyles.ubuntuMono.bold,
        color: colorTokens['text.primary'],
        letterSpacing: -0.5,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    divider: {
        width: 1,
        height: '100%',
        backgroundColor: colorTokens['border.subtle'],
        marginHorizontal: spaceTokens[4],
    },
    lockIcon: {
        position: 'absolute',
        alignSelf: 'center',
        right: -spaceTokens[6],
    },
}));