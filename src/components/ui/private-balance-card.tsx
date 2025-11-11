import { appTheme } from "@/design/theme";
import Account from "@/profile/account";
import { useBalanceStore } from "@/stores/balance/balanceStore";
import { getAggregatedFiatBalance } from "@/types/tokenBalance";
import { fiatBalanceToFormatted } from "@/utils/formattedBalance";
import { useEffect, useState } from "react";
import { StyleProp, StyleSheet, View, ViewStyle, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { IconSymbol } from "./icon-symbol";
import ActionButton from "./action-buttons";

export interface PrivateBalanceCardProps {
    account: Account;
    style?: StyleProp<ViewStyle>;
    onFundPress: () => void;
    onTransferPress: () => void;
    onWithdrawPress: () => void;
}

export const PrivateBalanceCard = (props: PrivateBalanceCardProps) => {
    const { account, style } = props;
    const [fiatBalance, setFiatBalance] = useState<string | null>(null);
    const [isUpdatingLockState, setIsUpdatingLockState] = useState(false);
    const { privateBalances, unlockPrivateBalances, lockPrivateBalances } = useBalanceStore()

    const isUnlocked = useBalanceStore(state => {
        return state.unlockedPrivateBalances.has(account.address);
    });

    useEffect(() => {
        const aggregated = getAggregatedFiatBalance([account], privateBalances);
        const formatted = fiatBalanceToFormatted(aggregated)
        setFiatBalance(formatted);
    }, [account, privateBalances, setFiatBalance]);

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.label}>{"Private Balance"}</Text>
            <View style={styles.amountRow}>
                <Text style={styles.amount}>
                    {isUnlocked ? fiatBalance : '••••••'}
                </Text>

                <TouchableOpacity onPress={() => {
                    const update = async (isUnlocked: boolean) => {
                        setIsUpdatingLockState(true);
                        try {
                            if (isUnlocked) {
                                await lockPrivateBalances([account]);
                            } else {
                                await unlockPrivateBalances([account]);
                            }
                        } catch (error) {
                            console.error('Error updating lock state:', error);
                        } finally {
                            setIsUpdatingLockState(false);
                        }
                    }

                    update(isUnlocked);
                }} style={styles.lockIcon}>
                    {isUpdatingLockState && (
                        <ActivityIndicator size="small" color={appTheme.colors.textMuted} />
                    )}
                    {!isUpdatingLockState && (
                        <IconSymbol
                            name={isUnlocked ? "lock.open.fill" : "lock.fill"}
                            size={24}
                            color={appTheme.colors.textMuted}
                        />
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.actionsContainer}>
                <ActionButton
                    icon="plus.circle.fill"
                    label="Fund"
                    onPress={() => {
                        props.onFundPress();
                    }}
                    disabled={false}
                />
                <ActionButton
                    icon="arrow.right.circle.fill"
                    label="Transfer"
                    onPress={() => {
                        props.onTransferPress();
                    }}
                    disabled={false}
                />
                <ActionButton
                    icon="arrow.up.circle.fill"
                    label="Withdraw"
                    onPress={() => {
                        props.onWithdrawPress();
                    }}
                    disabled={false}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: appTheme.colors.surfaceElevated,
        borderRadius: appTheme.radii.lg,
        padding: appTheme.spacing[5],
        alignItems: 'center',
        shadowColor: appTheme.colors.shadowPrimary,
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 1,
        shadowRadius: appTheme.spacing[0],
        elevation: 2,
    },
    label: {
        fontSize: 14,
        color: appTheme.colors.textMuted,
        marginBottom: appTheme.spacing[1],
        fontWeight: '500',
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: appTheme.spacing[2],
    },
    amount: {
        fontSize: 48,
        fontWeight: '700',
        color: appTheme.colors.text,
        letterSpacing: -0.5,
    },
    lockIcon: {
        position: 'absolute',
        alignSelf: 'center',
        right: -appTheme.spacing[6],
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: appTheme.spacing[4],
        marginTop: appTheme.spacing[2],
    },
});
