import { AccountPicker } from "@/components/ui/account-picker";
import { BalanceInput } from "@/components/ui/balance-input";
import { PrimaryButton } from "@/components/ui/primary-button";
import { showToastError } from "@/components/ui/toast";
import { fontStyles, spaceTokens } from "@/design/tokens";
import Account from "@/profile/account";
import { ProfileState } from "@/profile/profileState";
import { ThemedStyleSheet, useThemedStyle } from "@/providers/ThemeProvider";
import { useBalanceStore } from "@/stores/balance/balanceStore";
import { useOnChainStore } from "@/stores/onChainStore";
import { useProfileStore } from "@/stores/profileStore";
import { PublicAmount } from "@/types/amount";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

type FundTabProps = {
    account: Account;
};

export function FundTab({
    account,
}: FundTabProps) {
    const { t } = useTranslation();
    const { profileState } = useProfileStore();
    const { fund } = useOnChainStore();
    const router = useRouter();
    const isFocused = useIsFocused();
    const isFocusedRef = useRef(isFocused);

    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [amount, setAmount] = useState<PublicAmount | null>(null);
    const [isFunding, setIsFunding] = useState<boolean>(false);

    const styles = useThemedStyle(themedStyleSheet);

    // Keep the ref updated with the current focus state
    isFocusedRef.current = isFocused;

    const accounts = useMemo(() => {
        if (!ProfileState.isProfile(profileState)) {
            return null;
        }
        return profileState.accountsOnCurrentNetwork as Account[];
    }, [profileState]);

    const selectedAccountBalances = useMemo(() => {
        if (!selectedAccount) {
            return null;
        }

        return useBalanceStore.getState().publicBalances.get(selectedAccount.address) ?? null;
    }, [selectedAccount]);

    const handleFund = useCallback(() => {
        const fundAsync = async (account: Account, amount: PublicAmount) => {
            setIsFunding(true);
            try {
                await fund(account, amount, account);
            } catch (error) {
                showToastError(error);
            } finally {
                setIsFunding(false);
            }
        }

        if (!amount || !selectedAccount) {
            return;
        }
        
        fundAsync(selectedAccount, amount).then(() => {
            // Only navigate back if the screen is still focused/visible
            if (isFocusedRef.current) {
                router.back();
            }
        });
    }, [setIsFunding, amount, selectedAccount, router, fund]);

    if (!accounts) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.description}>
                {t('transactions.fund.description')}
            </Text>

            <AccountPicker
                label={t('transactions.fund.fromLabel')}
                accounts={accounts}
                selectedAccount={selectedAccount}
                onSelectAccount={setSelectedAccount}
                placeholder={t('transactions.fund.selectAccountPlaceholder')}
            />

            <BalanceInput
                label={t('transactions.fund.publicAmountLabel')}
                onAmountChange={setAmount}
                balances={selectedAccountBalances ?? []}
                placeholder={t('forms.amount.placeholder')}
                disabled={!selectedAccountBalances}
            />

            <PrimaryButton
                title={t('transactions.fund.fundButton')}
                onPress={handleFund}
                disabled={!amount}
                loading={isFunding}
            />
        </View>
    );
}

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        gap: spaceTokens[3],
    },
    description: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
        lineHeight: 20,
    },
}));

