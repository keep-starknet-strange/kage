import { PrimaryButton } from "@/components/ui/primary-button";
import { TokenAmountInput } from "@/components/ui/token-amount-input";
import { colorTokens, radiusTokens, spaceTokens } from "@/design/tokens";
import { StyleSheet, Text, TextInput, View } from "react-native";

type TransferTabProps = {
    recipientAddress: string;
    amount: string;
    onRecipientAddressChange: (address: string) => void;
    onAmountChange: (amount: string) => void;
    onTransfer: () => void;
    isLoading: boolean;
};

export function TransferTab({ 
    recipientAddress, 
    amount, 
    onRecipientAddressChange, 
    onAmountChange, 
    onTransfer, 
    isLoading 
}: TransferTabProps) {
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
                    onChangeText={onRecipientAddressChange}
                    placeholder="0x..."
                    placeholderTextColor={colorTokens['text.muted']}
                />
            </View>

            <TokenAmountInput
                label="Amount"
                value={amount}
                onChangeText={onAmountChange}
                tokenSymbol="STRK"
                placeholder="0.0"
            />

            <PrimaryButton
                title="Transfer"
                onPress={onTransfer}
                disabled={!recipientAddress || !amount || isLoading}
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

