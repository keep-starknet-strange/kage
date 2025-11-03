import { appTheme } from '@/design/theme';
import Account from '@/profile/account';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import ActionButton from './action-buttons';

export interface PublicBalanceProps {
    type: 'public';
    account: Account;
    style?: StyleProp<ViewStyle>;
}

export interface PrivateBalanceProps {
    type: 'private';
    account: Account;
    style?: StyleProp<ViewStyle>;
}

export interface TotalBalanceProps {
    type: 'total';
    accounts: readonly Account[];
    style?: StyleProp<ViewStyle>;
}

export type BalanceCardProps = PublicBalanceProps | PrivateBalanceProps | TotalBalanceProps;

export const BalanceCard = (props: BalanceCardProps) => {
    const { type, style } = props;

    // Automatically determine label based on type
    const label =
        type === 'public' ? 'Public Balance' :
            type === 'private' ? 'Private Balance' :
                'Total Balance';

    const actions = type !== 'total' ? (
        <View style={styles.actionsContainer}>
            <ActionButton
                icon="plus.circle.fill"
                label="Fund"
                onPress={() => { }}
                disabled={false}
            />
            <ActionButton
                icon="arrow.right.circle.fill"
                label="Transfer"
                onPress={() => { }}
                disabled={false}
            />
            <ActionButton
                icon="arrow.down.circle.fill"
                label="Withdraw"
                onPress={() => { }}
                disabled={false}
            />
        </View>
    ) : null;

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.amount}>
                {"$ "}{"0.00"} {/* TODO: Add actual fiat balance */}
            </Text>
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
    amount: {
        fontSize: 48,
        fontWeight: '700',
        color: appTheme.colors.text,
        letterSpacing: -0.5,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: appTheme.spacing[4],
        marginTop: appTheme.spacing[2],
    },
});

