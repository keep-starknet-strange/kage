import { appTheme } from "@/design/theme";
import Account from "@/profile/account";
import { useBalanceStore } from "@/stores/balance/balanceStore";
import { getAggregatedFiatBalance } from "@/types/tokenBalance";
import { fiatBalanceToFormatted } from "@/utils/formattedBalance";
import { useEffect, useState } from "react";
import { StyleProp, StyleSheet, View, ViewStyle, Text } from "react-native";

export interface PublicBalanceCardProps {
    account: Account;
    style?: StyleProp<ViewStyle>;
}

export const PublicBalanceCard = (props: PublicBalanceCardProps) => {
    const { account, style } = props;
    const [fiatBalance, setFiatBalance] = useState<string | null>(null);
    const { publicBalances } = useBalanceStore()

    useEffect(() => {
        const aggregated = getAggregatedFiatBalance([account], publicBalances);
        const formatted = fiatBalanceToFormatted(aggregated)
        setFiatBalance(formatted);
    }, [account, publicBalances, setFiatBalance]);

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.label}>{"Public Balance"}</Text>
            <View style={styles.amountRow}>
                <Text style={styles.amount}>
                    {fiatBalance}
                </Text>
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
    }
});
