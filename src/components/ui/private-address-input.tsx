import { IconSymbol } from "@/components/ui/icon-symbol";
import { radiusTokens, spaceTokens } from "@/design/tokens";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { PrivateTokenAddress } from "@/types/privateRecipient";
import { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

type PrivateAddressInputProps = {
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    onAddressChange: (address: PrivateTokenAddress | null) => void;
};

export function PrivateAddressInput({
    label = "Private Address",
    placeholder = "Enter private address...",
    disabled = false,
    onAddressChange,
}: PrivateAddressInputProps) {
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();
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
        const parsedAddress = PrivateTokenAddress.fromBase58OrNull(addressText.trim());

        if (parsedAddress) {
            setError(null);
            setIsValid(true);
            onAddressChange(parsedAddress);
        } else {
            setError("Invalid private address format");
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
                <View style={styles.iconContainer}>
                    <IconSymbol
                        name="lock.shield.fill"
                        size={20}
                        color={colorTokens['status.success']}
                    />
                </View>

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
                <Text style={styles.hintText}>Valid private address</Text>
            )}
        </View>
    );
}

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
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
}));

