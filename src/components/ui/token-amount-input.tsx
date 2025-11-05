import { colorTokens, radiusTokens, spaceTokens } from "@/design/tokens";
import { PrivateTokenBalance, PublicTokenBalance, TokenBalance } from "@/stores/balance/tokenBalance";
import { stringToBigint } from "@/utils/formattedBalance";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { ModalPicker } from "./modal-picker";
import Amount, { PrivateAmount, PublicAmount } from "@/types/amount";

type TokenAmountInputProps<T extends TokenBalance> = {
    label?: string;
    onAmountChange: (amount: Amount | null) => void;
    placeholder?: string;
    disabled?: boolean;
    balances: T[];
};

export function TokenAmountInput<T extends TokenBalance>({
    label = "Amount",
    onAmountChange,
    placeholder = "0.0",
    disabled = false,
    balances
}: TokenAmountInputProps<T>) {
    const [selectedBalance, setSelectedBalance] = useState<T | null>(null);
    const [amountText, setAmountText] = useState<string>("");
    const [amountDecimal, setAmountDecimal] = useState<bigint | null>(null);
    const [hintMessage, setHintMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (selectedBalance) {
            setHintMessage(`Balance: ${selectedBalance.formattedSpendableBalance()}`);
        }
    }, [selectedBalance]);

    useEffect(() => {
        if (!amountDecimal || !selectedBalance) {
            onAmountChange(null);
            return;
        }
        
        if (selectedBalance instanceof PublicTokenBalance) {
            const amount = PublicAmount.fromTokenBalance(selectedBalance, amountDecimal);
            onAmountChange(amount);
        } else if (selectedBalance instanceof PrivateTokenBalance) {
            const amount = PrivateAmount.fromTokenBalance(selectedBalance, amountDecimal);
            onAmountChange(amount);
        }
    }, [amountDecimal, selectedBalance]);

    useEffect(() => {
        if (!selectedBalance) {
            setError(null);
            return;
        }

        if (!amountDecimal) {
            setError(null);
            return;
        }

        const minRange = selectedBalance instanceof PrivateTokenBalance ? selectedBalance.minAcceptedBalance : 0n;
        const maxRange = selectedBalance.spendableBalance;

        if (amountDecimal > maxRange) {
            setError("Exceeds balance")
            return;
        } else if (selectedBalance instanceof PrivateTokenBalance && amountDecimal < minRange) {
            setError(`Private ${selectedBalance.token.symbol} amount must be at least ${selectedBalance.formattedBalance(true, minRange)}`)
            return;
        } else if (amountDecimal < minRange) {
            setError("Negative amounts are not allowed")
            return;
        }

        setError(null);
    }, [amountDecimal, selectedBalance]);

    const handleChangeText = (text: string) => {
        if (!selectedBalance) {
            return;
        }
        
        if (text.trim() === '') {
            setAmountDecimal(null);
            setAmountText('');
            return;
        }

        if (!isNaN(Number(text))) {
            setAmountText(text);
            setAmountDecimal(stringToBigint(text, selectedBalance.token.decimals, '.'));
        }
    };

    const renderItem = (balance: T) => {
        return (
            <View style={styles.tokenItem}>
                <Text style={styles.tokenText}>
                    {balance.token.symbol}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[
                styles.inputContainer,
                error && styles.inputContainerError,
                disabled && styles.inputContainerDisabled
            ]}>
                <TextInput
                    style={[styles.input, disabled && styles.inputDisabled]}
                    value={amountText}
                    onChangeText={handleChangeText}
                    placeholder={placeholder}
                    keyboardType="numeric"
                    placeholderTextColor={colorTokens['text.muted']}
                    editable={!disabled}
                />

                <ModalPicker
                    items={balances}
                    selectedItem={selectedBalance}
                    onSelectItem={setSelectedBalance}
                    placeholder="Select a token"
                    disabled={disabled}
                    renderItem={renderItem}
                    pickerButtonStyle={styles.tokenPickerButton}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            {!error && hintMessage && <Text style={styles.hintText}>{hintMessage}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: spaceTokens[1],
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: colorTokens['text.primary'],
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colorTokens['bg.elevated'],
        borderWidth: 1,
        borderColor: colorTokens['border.subtle'],
        borderRadius: radiusTokens.sm,
        paddingHorizontal: spaceTokens[3],
    },
    inputContainerError: {
        borderColor: colorTokens['status.error'],
    },
    inputContainerDisabled: {
        backgroundColor: colorTokens['bg.sunken'],
        opacity: 0.6,
    },
    input: {
        flex: 1,
        paddingVertical: spaceTokens[3],
        fontSize: 16,
        color: colorTokens['text.primary'],
    },
    inputDisabled: {
        color: colorTokens['text.muted'],
    },
    tokenSymbol: {
        fontSize: 14,
        fontWeight: '600',
        color: colorTokens['text.secondary'],
        paddingLeft: spaceTokens[2],
    },
    tokenSymbolDisabled: {
        color: colorTokens['text.muted'],
    },
    errorText: {
        fontSize: 12,
        color: colorTokens['status.error'],
        marginStart: spaceTokens[0],
    },
    hintText: {
        fontSize: 12,
        color: colorTokens['text.secondary'],
        marginStart: spaceTokens[0],
    },
    tokenPickerButton: {
        flex: 1,
    },
    tokenItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12
    },
    tokenText: {
        fontSize: 14,
        fontWeight: '500',
        color: colorTokens['text.primary']
    }
});

