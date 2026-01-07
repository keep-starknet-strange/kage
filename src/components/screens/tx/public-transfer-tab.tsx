import { AccountAddressInput } from "@/components/ui/account-address-input";
import { BalanceInput } from "@/components/ui/balance-input";
import { PrimaryButton } from "@/components/ui/primary-button";
import { showToastError } from "@/components/ui/toast";
import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import Account, { AccountAddress } from "@/profile/account";
import { ThemedStyleSheet, useThemedStyle } from "@/providers/ThemeProvider";
import { useBalanceStore } from "@/stores/balance/balanceStore";
import { useOnChainStore } from "@/stores/onChainStore";
import { PublicAmount } from "@/types/amount";
import { PublicTokenBalance } from "@/types/tokenBalance";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

type PublicTransferTabProps = {
    account: Account;
};

export function PublicTransferTab({
    account,
}: PublicTransferTabProps) {
    const { t } = useTranslation();
    const { publicTransfer } = useOnChainStore();
    const router = useRouter();

    const isFocused = useIsFocused();
    const isFocusedRef = useRef(isFocused);

    const [recipientAddress, setRecipientAddress] = useState<AccountAddress | null>(null);
    const [amount, setAmount] = useState<PublicAmount | null>(null);
    const [isTransferring, setIsTransferring] = useState(false);
    const styles = useThemedStyle(themedStyleSheet);

    const publicBalances: PublicTokenBalance[] | null = useBalanceStore(state => state.publicBalances.get(account.address) ?? null);

    const handleTransfer = useCallback(() => {
        if (!recipientAddress || !amount) {
            return;
        }

        const transferAsync = async () => {
            setIsTransferring(true);
            try {
                await publicTransfer(account, amount, recipientAddress);
            } catch (error) {
                showToastError(error);
            } finally {
                setIsTransferring(false);
            }
        }

        transferAsync().then(() => {
            // Only navigate back if the screen is still focused/visible
            if (isFocusedRef.current) {
                router.back();
            }
        });
    }, [recipientAddress, amount, publicTransfer, account, router]);

    return (
        <View style={styles.container}>
            <Text style={styles.description}>
                {t('transactions.publicTransfer.description')}
            </Text>

            <AccountAddressInput
                label={t('transactions.publicTransfer.recipientLabel')}
                placeholder={t('transactions.publicTransfer.recipientPlaceholder')}
                from={account.address}
                onAddressChange={setRecipientAddress}
            />

            <BalanceInput
                label={t('forms.amount.label')}
                placeholder={t('forms.amount.placeholder')}
                balances={publicBalances ?? []}
                onAmountChange={setAmount}
            />

            <PrimaryButton
                title={t('transactions.publicTransfer.sendButton')}
                onPress={handleTransfer}
                disabled={!recipientAddress || !amount}
                loading={isTransferring}
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
    inputGroup: {
        gap: spaceTokens[1],
    },
    inputLabel: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
    },
    input: {
        backgroundColor: colorTokens['bg.elevated'],
        borderWidth: 1,
        borderColor: colorTokens['border.subtle'],
        borderRadius: radiusTokens.sm,
        padding: spaceTokens[3],
        fontSize: 16,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.primary'],
    },
}));

