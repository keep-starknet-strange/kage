import { PrivateBalancesLocked } from "@/components/private-balances-locked";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TokenAmountInput } from "@/components/ui/token-amount-input";
import { colorTokens, radiusTokens, spaceTokens } from "@/design/tokens";
import Account from "@/profile/account";
import { useBalanceStore } from "@/stores/balance/balanceStore";
import Amount from "@/types/amount";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

type TransferTabProps = {
    account: Account;
};

export function TransferTab({ 
    account,
}: TransferTabProps) {
    const [recipientAddress, setRecipientAddress] = useState("");
    const [amount, setAmount] = useState<Amount | null>(null);
    const [isTransferring, setIsTransferring] = useState(false);
    const [isUnlockingBalances, setIsUnlockingBalances] = useState(false);
    
    const { unlockPrivateBalances } = useBalanceStore();

    const isLocked = useBalanceStore(state => !state.unlockedPrivateBalances.has(account.address));
    const privateBalances = useBalanceStore(state => state.privateBalances.get(account.address) ?? null);

    const handleTransfer = useCallback(() => {
        if (!recipientAddress) {
            return;
        }

        setIsTransferring(true);
        console.log(`Transferring from ${account.address} to ${recipientAddress}`);
        // TODO: Implement transfer logic
        setIsTransferring(false);
    }, [recipientAddress, account]);

    const handleUnlockPrivateBalances = useCallback(async () => {
        setIsUnlockingBalances(true);
        try {
            await unlockPrivateBalances([account]);
        } catch (error) {
            console.error('Error unlocking private balances:', error);
        } finally {
            setIsUnlockingBalances(false);
        }
    }, [account, unlockPrivateBalances]);

    return (
        <View style={styles.container}>
            <Text style={styles.description}>
                Transfer tokens to another address.
            </Text>
            
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Recipient Address</Text>
                <TextInput
                    style={styles.input}
                    value={recipientAddress}
                    onChangeText={setRecipientAddress}
                    placeholder="0x..."
                    placeholderTextColor={colorTokens['text.muted']}
                />
            </View>

            {isLocked ? (
                <PrivateBalancesLocked
                    isLoadingBalances={isUnlockingBalances}
                    handleUnlockPrivateBalances={handleUnlockPrivateBalances}
                />
            ) : (
                <TokenAmountInput
                    label="Amount"
                    placeholder="0.0"
                    onAmountChange={setAmount}
                    balances={privateBalances ?? []}
                />
            )}

            <PrimaryButton
                title="Transfer"
                onPress={handleTransfer}
                disabled={!recipientAddress}
                loading={isTransferring}
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

