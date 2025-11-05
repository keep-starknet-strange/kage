import { appTheme } from '@/design/theme';
import Account from '@/profile/account';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import ActionButton from './action-buttons';
import { useBalanceStore } from '@/stores/balance/balanceStore';
import { IconSymbol } from './icon-symbol';

export interface PublicBalanceProps {
    type: 'public';
    account: Account;
    style?: StyleProp<ViewStyle>;
}

export interface PrivateBalanceProps {
    type: 'private';
    account: Account;
    style?: StyleProp<ViewStyle>;
    onFundPress: () => void;
    onTransferPress: () => void;
    onWithdrawPress: () => void;
}

export interface TotalBalanceProps {
    type: 'total';
    accounts: readonly Account[];
    style?: StyleProp<ViewStyle>;
}

export type BalanceCardProps = PublicBalanceProps | PrivateBalanceProps | TotalBalanceProps;

export const BalanceCard = (props: BalanceCardProps) => {
    const { type, style } = props;
    const isUnlocked = useBalanceStore(state => {
        if (type !== 'private') { return null }

        return state.unlockedPrivateBalances.has(props.account.address);
    });

    // Automatically determine label based on type
    const label =
        type === 'public' ? 'Public Balance' :
            type === 'private' ? 'Private Balance' :
                'Total Balance';

    const actions = (type === 'private') ? (
        <View style={styles.actionsContainer}>
            <ActionButton
                icon="plus.circle.fill"
                label="Fund"
                onPress={() => { 
                    props?.onFundPress?.();
                }}
                disabled={false}
            />
            <ActionButton
                icon="arrow.right.circle.fill"
                label="Transfer"
                onPress={() => {
                    props?.onTransferPress?.();
                 }}
                disabled={false}
            />
            <ActionButton
                icon="arrow.down.circle.fill"
                label="Withdraw"
                onPress={() => { 
                    props?.onWithdrawPress?.();
                }}
                disabled={false}
            />
        </View>
    ) : null;

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.amountRow}>
                <Text style={styles.amount}>
                    {"$ "}{"0.00"} {/* TODO: Add actual fiat balance */}
                </Text>
                {isUnlocked !== null && (
                    <IconSymbol
                        name={isUnlocked ? "lock.open.fill" : "lock.fill"}
                        size={24}
                        color={appTheme.colors.textMuted}
                        style={styles.lockIcon}
                    />
                )}
            </View>

            {actions}
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
        right: -appTheme.spacing[5],
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: appTheme.spacing[4],
        marginTop: appTheme.spacing[2],
    },
});

