import { PrimaryButton } from "@/components/ui/primary-button";
import { TokenAmountInput } from "@/components/ui/token-amount-input";
import { colorTokens, spaceTokens } from "@/design/tokens";
import { StyleSheet, Text, View } from "react-native";

type WithdrawTabProps = {
    amount: string;
    onAmountChange: (amount: string) => void;
    onWithdraw: () => void;
    isLoading: boolean;
};

export function WithdrawTab({ amount, onAmountChange, onWithdraw, isLoading }: WithdrawTabProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.description}>
                Withdraw tokens from your account to an external wallet.
            </Text>
            
            <TokenAmountInput
                label="Amount"
                value={amount}
                onChangeText={onAmountChange}
                tokenSymbol="STRK"
                placeholder="0.0"
            />

            <PrimaryButton
                title="Withdraw"
                onPress={onWithdraw}
                disabled={!amount || isLoading}
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

