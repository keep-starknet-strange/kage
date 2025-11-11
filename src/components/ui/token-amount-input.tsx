import { colorTokens, radiusTokens, spaceTokens } from "@/design/tokens";
import { PrivateTokenBalance, PublicTokenBalance, TokenBalance } from "@/types/tokenBalance";
import { stringToBigint, tokenAmountToFormatted } from "@/utils/formattedBalance";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { ModalPicker } from "./modal-picker";
import Amount, { PrivateAmount, PublicAmount } from "@/types/amount";

type AmountType<T extends TokenBalance> = 
    T extends PrivateTokenBalance ? PrivateAmount :
    T extends PublicTokenBalance ? PublicAmount :
    Amount;

type TokenAmountInputProps<T extends TokenBalance> = {
    label?: string;
    onAmountChange: (amount: AmountType<T> | null) => void;
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
            if (selectedBalance instanceof PrivateTokenBalance) {
                setHintMessage(`Private Balance: ${selectedBalance.formattedBalance()}`);
            } else {
                setHintMessage(`Balance: ${selectedBalance.formattedBalance()}`);
            }

        }
    }, [selectedBalance]);

    useEffect(() => {
        if (!amountDecimal || !selectedBalance) {
            onAmountChange(null);
            return;
        }

        if (selectedBalance instanceof PublicTokenBalance) {
            const amount = PublicAmount.fromTokenBalance(selectedBalance, amountDecimal);
            onAmountChange(amount as AmountType<T>);
        } else if (selectedBalance instanceof PrivateTokenBalance) {
            const amount = PrivateAmount.fromTokenBalance(selectedBalance, amountDecimal);
            onAmountChange(amount as AmountType<T>);
        }
    }, [amountDecimal, selectedBalance, onAmountChange]);

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
        } else if (selectedBalance instanceof PrivateTokenBalance && amountDecimal < minRange) {6
            setError(`Private ${selectedBalance.token.symbol} amount must be at least ${tokenAmountToFormatted(true, minRange, selectedBalance.token)}`)
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
            <Text style={styles.tokenText}>
                {balance.token.symbol}
            </Text>
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
                    placeholder="Token"
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
        gap: spaceTokens[1],
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: spaceTokens[0],
    },
    tokenText: {
        fontSize: 14,
        fontWeight: '500',
        color: colorTokens['text.primary']
    }
});

