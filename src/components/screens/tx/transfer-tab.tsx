import { PrivateBalancesLocked } from "@/components/private-balances-locked";
import { PrimaryButton } from "@/components/ui/primary-button";
import { PrivateAddressInput } from "@/components/ui/private-address-input";
import { TokenAmountInput } from "@/components/ui/token-amount-input";
import { colorTokens, radiusTokens, spaceTokens } from "@/design/tokens";
import Account from "@/profile/account";
import { useBalanceStore } from "@/stores/balance/balanceStore";
import { PrivateAmount } from "@/types/amount";
import { PrivateTokenAddress, PrivateTokenRecipient } from "@/types/privateRecipient";
import { PrivateTokenBalance } from "@/types/tokenBalance";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {LOG} from "@/utils/logs";
import { showToastError } from "@/components/ui/toast";
import { useOnChainStore } from "@/stores/onChainStore";

type TransferTabProps = {
    account: Account;
};

export function TransferTab({
    account,
}: TransferTabProps) {
    const { unlockPrivateBalances } = useBalanceStore();
    const { transfer } = useOnChainStore();
    const router = useRouter();

    const isFocused = useIsFocused();
    const isFocusedRef = useRef(isFocused);

    const [recipientAddress, setRecipientAddress] = useState<PrivateTokenAddress | null>(null);
    const [amount, setAmount] = useState<PrivateAmount | null>(null);
    const [isTransferring, setIsTransferring] = useState(false);
    const [isUnlockingBalances, setIsUnlockingBalances] = useState(false);


    const isLocked = useBalanceStore(state => !state.unlockedPrivateBalances.has(account.address));
    const privateBalances: PrivateTokenBalance[] | null = useBalanceStore(state => state.privateBalances.get(account.address) ?? null);

    const handleTransfer = useCallback(() => {
        if (!recipientAddress || !amount) {
            return;
        }

        const transferAsync = async () => {
            setIsTransferring(true);
            try {
                // TODO handle wallet recipient too.
                console.log("recipientAddress", recipientAddress.base58);
                await transfer(account, amount, account, new PrivateTokenRecipient(recipientAddress));
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
    }, [recipientAddress, amount, transfer, account, router]);

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
                        Transfer tokens to another address.
                    </Text>

                    <PrivateAddressInput
                        label="Recipient Address"
                        placeholder="Enter recipient's private address..."
                        onAddressChange={setRecipientAddress}
                    />
                    <TokenAmountInput
                        label="Amount"
                        placeholder="0.0"
                        balances={privateBalances ?? []}
                        onAmountChange={setAmount}
                    />

                    <PrimaryButton
                        title="Transfer"
                        onPress={handleTransfer}
                        disabled={!recipientAddress || !amount}
                        loading={isTransferring}
                    />
                </>

            )}
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
    inputGroup: {
        gap: spaceTokens[1],
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: colorTokens['text.primary'],
    },
    input: {
        backgroundColor: colorTokens['bg.elevated'],
        borderWidth: 1,
        borderColor: colorTokens['border.subtle'],
        borderRadius: radiusTokens.sm,
        padding: spaceTokens[3],
        fontSize: 16,
        color: colorTokens['text.primary'],
    },
});

