import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { PrivateTokenBalance, PublicTokenBalance } from "@/types/tokenBalance";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { PrivateAddressView } from "./private-address-view";
import { Image } from "expo-image";
import { IconSymbol } from "@/components/ui/icon-symbol/icon-symbol";

export interface PublicTokenBalanceViewProps {
    balance: PublicTokenBalance;
}

export const PublicTokenBalanceView = ({ balance }: PublicTokenBalanceViewProps) => {
    const styles = useThemedStyle(themedStyleSheet);
    const fiatPriceFormatted = useMemo(() => {
        return balance.formattedFiatPrice();
    }, [balance.fiatPrice]);
    const { colors: colorTokens } = useTheme();

    return (
        <View style={styles.tokenCard}>
            <View style={styles.tokenInfo}>
                {balance.token.logo ? (
                    <Image source={{ uri: balance.token.logo.toString() }} style={styles.tokenLogo} />
                ) : <IconSymbol name="currency" size={spaceTokens[6]} color={colorTokens['text.primary']} />}
                <Text style={styles.tokenSymbol}>{balance.token.name ?? balance.token.symbol}</Text>
            </View>
            <View style={styles.tokenBalance}>
                <Text style={styles.tokenBalanceAmount}>
                    {balance.formattedBalance(true)}
                </Text>
                {fiatPriceFormatted && (
                    <Text style={styles.tokenFiatPrice}>
                        {fiatPriceFormatted}
                    </Text>
                )}

            </View>
        </View>
    )
}

export interface PrivateTokenBalanceViewProps {
    balance: PrivateTokenBalance;
}

export const PrivateTokenBalanceView = ({ balance }: PrivateTokenBalanceViewProps) => {
    const styles = useThemedStyle(themedStyleSheet);
    const fiatPriceFormatted = useMemo(() => {
        return balance.formattedFiatPrice();
    }, [balance.fiatPrice]);
    const { colors: colorTokens } = useTheme();
    
    return (
        <View style={styles.tokenCard}>
            <View style={styles.tokenInfo}>
                {balance.token.logo ? (
                    <Image source={{ uri: balance.token.logo.toString() }} style={styles.tokenLogo} />
                ) : <IconSymbol name="currency" size={spaceTokens[6]} color={colorTokens['text.primary']} />}
                
                <View style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-start', gap: spaceTokens[2] }}>
                    <Text style={styles.tokenSymbol}>{balance.token.name ?? balance.token.symbol}</Text>
                    {balance.isUnlocked && (
                        <PrivateAddressView address={balance.privateTokenAddress!} />
                    )}
                </View>
            </View>

            <View style={styles.tokenBalance}>
                <Text style={styles.tokenBalanceAmount}>
                    {balance.formattedBalance(true)}
                </Text>

                {fiatPriceFormatted && (
                    <Text style={styles.tokenFiatPrice}>
                        {fiatPriceFormatted}
                    </Text>
                )}
            </View>
        </View>
    )
}

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    tokenCard: {
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.md,
        padding: spaceTokens[4],
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: colorTokens['shadow.primary'],
        gap: spaceTokens[1],
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 1,
    },
    tokenInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spaceTokens[2],
    },
    tokenLogo: {
        width: spaceTokens[6],
        height: spaceTokens[6],
        borderRadius: radiusTokens.sm,
    },
    tokenSymbol: {
        fontSize: 18,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
    },
    tokenAddress: {
        fontSize: 12,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.muted'],
        maxWidth: 200,
    },
    tokenBalance: {
        alignItems: 'flex-end',
    },
    tokenBalanceAmount: {
        fontSize: 16,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
    },
    tokenFiatPrice: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.muted'],
    },
}));