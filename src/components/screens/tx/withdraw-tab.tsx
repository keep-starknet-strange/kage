import { PrivateBalancesLocked } from "@/components/private-balances-locked";
import { PrimaryButton } from "@/components/ui/primary-button";
import { showToastError } from "@/components/ui/toast";
import { TokenAmountInput } from "@/components/ui/token-amount-input";
import { spaceTokens } from "@/design/tokens";
import Account from "@/profile/account";
import { ThemedStyleSheet, useThemedStyle } from "@/providers/ThemeProvider";
import { useBalanceStore } from "@/stores/balance/balanceStore";
import { useOnChainStore } from "@/stores/onChainStore";
import { PrivateAmount } from "@/types/amount";
import { PrivateTokenBalance } from "@/types/tokenBalance";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Text, View } from "react-native";

type WithdrawTabProps = {
    account: Account;
};

export function WithdrawTab({ account }: WithdrawTabProps) {
    const { unlockPrivateBalances } = useBalanceStore();
    const { withdraw } = useOnChainStore();
    const router = useRouter();
    const styles = useThemedStyle(themedStyleSheet);

    const isFocused = useIsFocused();
    const isFocusedRef = useRef(isFocused);

    const [amount, setAmount] = useState<PrivateAmount | null>(null);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [isUnlockingBalances, setIsUnlockingBalances] = useState(false);

    
    const isLocked = useBalanceStore(state => !state.unlockedPrivateBalances.has(account.address));
    const privateBalances: PrivateTokenBalance[] | null = useBalanceStore(state => state.privateBalances.get(account.address) ?? null);


    const handleWithdraw = useCallback(() => {
        if (!amount) {
            return;
        }

        const withdrawAsync = async () => {
            setIsWithdrawing(true);
            try {
                await withdraw(account, amount, account);
            } catch (error) {
                showToastError(error);
            } finally {
                setIsWithdrawing(false);
            }
        }

        withdrawAsync().then(() => {
            // Only navigate back if the screen is still focused/visible
            if (isFocusedRef.current) {
                router.back();
            }
        });
    }, [account, isFocusedRef, router, withdraw, amount]);


    const handleUnlockPrivateBalances = useCallback(async () => {
        setIsUnlockingBalances(true);
        try {
            await unlockPrivateBalances([account]);
        } catch (error) {
            showToastError(error);
        } finally {
            setIsUnlockingBalances(false);
        }
    }, [account, unlockPrivateBalances]);
    
    return (
        <View style={styles.container}>
            {isLocked ? (
                <PrivateBalancesLocked
                    isLoadingBalances={isUnlockingBalances}
                    handleUnlockPrivateBalances={handleUnlockPrivateBalances}
                />
            ) : (
                <>
                    <Text style={styles.description}>
                        Withdraw tokens from your private balance to your public wallet.
                    </Text>

                    <TokenAmountInput
                        label="Amount"
                        placeholder="0.0"
                        balances={privateBalances ?? []}
                        onAmountChange={setAmount}
                    />

                    <PrimaryButton
                        title="Withdraw"
                        onPress={handleWithdraw}
                        disabled={!amount}
                        loading={isWithdrawing}
                    />
                </>

            )}
        </View>
    );
}

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        gap: spaceTokens[3],
    },
    description: {
        fontSize: 14,
        color: colorTokens['text.secondary'],
        lineHeight: 20,
    },
}));

