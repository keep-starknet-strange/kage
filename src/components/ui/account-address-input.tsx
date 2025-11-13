import { IconSymbol } from "@/components/ui/icon-symbol";
import { colorTokens, radiusTokens, spaceTokens } from "@/design/tokens";
import { AccountAddress } from "@/profile/account";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type AccountAddressInputProps = {
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    from: AccountAddress;
    onAddressChange: (address: AccountAddress | null) => void;
};

export function AccountAddressInput({
    label = "Account Address",
    placeholder = "Enter account address...",
    disabled = false,
    from,
    onAddressChange,
}: AccountAddressInputProps) {
    const [addressText, setAddressText] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState<boolean>(false);

    useEffect(() => {
        if (!addressText || addressText.trim() === '') {
            setError(null);
            setIsValid(false);
            onAddressChange(null);
            return;
        }

        // Try to parse the address
        const parsedAddress = AccountAddress.fromHexOrNull(addressText.trim());

        if (parsedAddress) { 
            if (parsedAddress === from) {
                setError("You cannot send tokens to yourself");
                setIsValid(false);
                onAddressChange(null);
                return;
            }
            setError(null);
            setIsValid(true);
            onAddressChange(parsedAddress);
        } else {
            setError("Invalid account address format");
            setIsValid(false);
            onAddressChange(null);
        }
    }, [addressText, onAddressChange]);

    const handleChangeText = (text: string) => {
        setAddressText(text);
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[
                styles.inputContainer,
                error && styles.inputContainerError,
                isValid && styles.inputContainerValid,
                disabled && styles.inputContainerDisabled
            ]}>
                <TextInput
                    style={[styles.input, disabled && styles.inputDisabled]}
                    value={addressText}
                    onChangeText={handleChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colorTokens['text.muted']}
                    editable={!disabled}
                    autoCapitalize="none"
                    autoCorrect={false}
                    multiline={false}
                />

                {isValid && !disabled && (
                    <View style={styles.validIcon}>
                        <IconSymbol
                            name="checkmark"
                            size={20}
                            color={colorTokens['status.success']}
                        />
                    </View>
                )}

                {error && !disabled && (
                    <TouchableOpacity
                        style={styles.errorIcon}
                        onPress={() => setAddressText('')}
                    >
                        <IconSymbol
                            name="xmark"
                            size={20}
                            color={colorTokens['status.error']}
                        />
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            {isValid && !error && (
                <Text style={styles.hintText}>Valid account address</Text>
            )}
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
    iconContainer: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
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
    inputContainerValid: {
        borderColor: colorTokens['status.success'],
    },
    inputContainerDisabled: {
        backgroundColor: colorTokens['bg.sunken'],
        opacity: 0.6,
    },
    input: {
        flex: 1,
        paddingVertical: spaceTokens[3],
        fontSize: 14,
        fontFamily: 'monospace',
        color: colorTokens['text.primary'],
    },
    inputDisabled: {
        color: colorTokens['text.muted'],
    },
    validIcon: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorIcon: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        fontSize: 12,
        color: colorTokens['status.error'],
        marginStart: spaceTokens[0],
    },
    hintText: {
        fontSize: 12,
        color: colorTokens['status.success'],
        marginStart: spaceTokens[0],
    },
});

