import { AccountPicker } from "@/components/ui/account-picker";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TokenAmountInput } from "@/components/ui/token-amount-input";
import { colorTokens, spaceTokens } from "@/design/tokens";
import Account from "@/profile/account";
import { ProfileState } from "@/profile/profileState";
import { useBalanceStore } from "@/stores/balance/balanceStore";
import { useProfileStore } from "@/stores/profileStore";
import Amount from "@/types/amount";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

type FundTabProps = {
    account: Account;
};

export function FundTab({
    account,
}: FundTabProps) {
    const { profileState } = useProfileStore();
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [amount, setAmount] = useState<Amount | null>(null);
    const [isFunding, setIsFunding] = useState<boolean>(false);

    const accounts = useMemo(() => {
        if (!ProfileState.isProfile(profileState)) {
            return null;
        }
        return profileState.accountsOnCurrentNetwork as Account[];
    }, [profileState, account]);

    const selectedAccountBalances = useMemo(() => {
        if (!selectedAccount) {
            return null;
        }

        return useBalanceStore.getState().publicBalances.get(selectedAccount.address) ?? null;
    }, [selectedAccount]);

    const handleFund = useCallback(() => {
        if (!amount) {
            return;
        }

        setIsFunding(true);
        
        console.log(`Fund from ${selectedAccount?.address} ${amount.formatted()} to ${account.address}`);
        // TODO: Implement funding logic
        setIsFunding(false);
    }, [setIsFunding, amount, selectedAccount]);

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

const styles = StyleSheet.create({
    container: {
        gap: spaceTokens[3],
    },
    description: {
        fontSize: 14,
        color: colorTokens['text.secondary'],
        lineHeight: 20,
    },
});

