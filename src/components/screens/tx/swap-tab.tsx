import { TokenAmountInput } from "@/components/ui/token-amount-input";
import { fontStyles, spaceTokens } from "@/design/tokens";
import Account from "@/profile/account";
import { ThemedStyleSheet, useThemedStyle } from "@/providers/ThemeProvider";
import { useBalanceStore } from "@/stores/balance/balanceStore";
import { PublicAmount } from "@/types/amount";
import { PublicTokenBalance } from "@/types/tokenBalance";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSwapStore } from "@/stores/swapStore";

type SwapTabProps = {
    account: Account;
};

export function SwapTab({
    account,
}: SwapTabProps) {
    const { t } = useTranslation();
    const { fetchTokens } = useSwapStore();
    const styles = useThemedStyle(themedStyleSheet);

    const [sellAmount, setSellAmount] = useState<PublicAmount | null>(null);
    const [buyAmount, setBuyAmount] = useState<PublicAmount | null>(null);

    const publicBalances: PublicTokenBalance[] | null = useBalanceStore(state => state.publicBalances.get(account.address) ?? null);

    useEffect(() => {
        fetchTokens();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.description}>
                {t('transactions.swap.description')}
            </Text>

            <TokenAmountInput
                label={t('transactions.swap.sellLabel')}
                placeholder={t('transactions.swap.sellPlaceholder')}
                balances={publicBalances ?? []}
                onAmountChange={setSellAmount}
            />

            <TokenAmountInput
                label={t('transactions.swap.buyLabel')}
                placeholder={t('transactions.swap.buyPlaceholder')}
                balances={publicBalances ?? []}
                onAmountChange={setBuyAmount}
            />
        </View>
    );
}

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        gap: spaceTokens[3],
        paddingHorizontal: spaceTokens[3],
    },
    description: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
        lineHeight: 20,
    },
}));

