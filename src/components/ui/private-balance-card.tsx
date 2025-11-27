import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import Account from "@/profile/account";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { useBalanceStore } from "@/stores/balance/balanceStore";
import { getAggregatedFiatBalance } from "@/types/tokenBalance";
import { fiatBalanceToFormatted } from "@/utils/formattedBalance";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleProp, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import ActionButton from "./action-buttons";
import { IconSymbol } from "@/components/ui/icon-symbol/icon-symbol";
import { showToastError } from "./toast";
import { useTranslation } from "react-i18next";

export interface PrivateBalanceCardProps {
    account: Account;
    style?: StyleProp<ViewStyle>;
    onFundPress: () => void;
    onTransferPress: () => void;
    onWithdrawPress: () => void;
}

export const PrivateBalanceCard = (props: PrivateBalanceCardProps) => {
    const { t } = useTranslation();
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();
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
            <Text style={styles.label}>{t('balance.private.label')}</Text>
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
                            showToastError(error);
                        } finally {
                            setIsUpdatingLockState(false);
                        }
                    }

                    update(isUnlocked);
                }} style={styles.lockIcon}>
                    {isUpdatingLockState && (
                        <ActivityIndicator size="small" color={colorTokens['text.muted']} />
                    )}
                    {!isUpdatingLockState && (
                        <IconSymbol
                            name={isUnlocked ? "lock-open" : "lock"}
                            size={24}
                            color={colorTokens['text.muted']}
                        />
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.actionsContainer}>
                <ActionButton
                    icon="shield"
                    label={t('balance.private.shieldButton')}
                    onPress={() => {
                        props.onFundPress();
                    }}
                    disabled={false}
                />
                <ActionButton
                    icon="cash-lock"
                    label={t('balance.private.transferButton')}
                    onPress={() => {
                        props.onTransferPress();
                    }}
                    disabled={false}
                />
                <ActionButton
                    icon="shield-off"
                    label={t('balance.private.unshieldButton')}
                    onPress={() => {
                        props.onWithdrawPress();
                    }}
                    disabled={false}
                />
            </View>
        </View>
    );
};

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.lg,
        padding: spaceTokens[5],
        alignItems: 'center',
        shadowColor: colorTokens['shadow.primary'],
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 1,
        shadowRadius: spaceTokens[0],
        elevation: 2,
    },
    label: {
        fontSize: 14,
        color: colorTokens['text.muted'],
        marginBottom: spaceTokens[1],
        ...fontStyles.ubuntuMono.semibold,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spaceTokens[2],
    },
    amount: {
        fontSize: 48,
        ...fontStyles.ubuntuMono.bold,
        color: colorTokens['text.primary'],
        letterSpacing: -0.5,
    },
    lockIcon: {
        position: 'absolute',
        alignSelf: 'center',
        right: -spaceTokens[6],
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spaceTokens[4],
        marginTop: spaceTokens[2],
    },
}));
