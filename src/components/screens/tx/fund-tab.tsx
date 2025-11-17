import { AccountPicker } from "@/components/ui/account-picker";
import { PrimaryButton } from "@/components/ui/primary-button";
import { showToastError } from "@/components/ui/toast";
import { TokenAmountInput } from "@/components/ui/token-amount-input";
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
import { Text, View } from "react-native";

type FundTabProps = {
    account: Account;
};

export function FundTab({
    account,
}: FundTabProps) {
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
                Add private funds to your account.
            </Text>

            <AccountPicker
                label="Fund from this account's public balance:"
                accounts={accounts}
                selectedAccount={selectedAccount}
                onSelectAccount={setSelectedAccount}
                placeholder="Select an account"
            />

            <TokenAmountInput
                label="Public Amount"
                onAmountChange={setAmount}
                balances={selectedAccountBalances ?? []}
                placeholder="0.0"
                disabled={!selectedAccountBalances}
            />

            <PrimaryButton
                title="Fund Private Balance"
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

