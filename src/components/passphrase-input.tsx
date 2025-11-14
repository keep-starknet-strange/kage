import { ThemedStyleSheet, useThemedStyle } from "@/providers/ThemeProvider";
import { useState } from "react";
import { Button, Pressable, Text, TextInput, View } from "react-native";

interface PassphraseInputProps {
    onPassphraseSet: (passphrase: string) => void;
    placeholder?: string;
    helperText?: string;
}

export function PassphraseInput({ 
    onPassphraseSet,
    placeholder = "Enter your passphrase...",
    helperText = "Passphrase must be at least 7 characters"
}: PassphraseInputProps) {
    const [passphrase, setPassphrase] = useState("");
    const [confirmPassphrase, setConfirmPassphrase] = useState("");

    const [isVisible, setIsVisible] = useState(false);
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    
    const styles = useThemedStyle(themedStyleSheet);

    const isValid = passphrase.length >= 7;
    const showValidation = passphrase.length > 0;
    const showConfirmValidation = confirmPassphrase.length > 0;
    const doPasswordsMatch = passphrase === confirmPassphrase && confirmPassphrase.length > 0;
    const isFullyValid = isValid && doPasswordsMatch;

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Passphrase</Text>
            <Text style={styles.hint}>{helperText}</Text>
            
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={passphrase}
                    onChangeText={setPassphrase}
                    placeholder={placeholder}
                    secureTextEntry={!isVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                />
                <Pressable 
                    onPress={() => setIsVisible(!isVisible)}
                    style={styles.toggleButton}
                    accessibilityRole="button"
                    accessibilityLabel={isVisible ? "Hide passphrase" : "Show passphrase"}
                >
                    <Text style={styles.toggleText}>{isVisible ? "Hide" : "Show"}</Text>
                </Pressable>
            </View>

            {showValidation && (
                <Text style={[styles.validationText, isValid ? styles.valid : styles.invalid]}>
                    {isValid ? "✓ Strong enough" : "✗ Too short (minimum 7 characters)"}
                </Text>
            )}

            <Text style={[styles.label, { marginTop: 8 }]}>Confirm Passphrase</Text>
            
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={confirmPassphrase}
                    onChangeText={setConfirmPassphrase}
                    placeholder="Re-enter your passphrase..."
                    secureTextEntry={!isConfirmVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                />
                <Pressable 
                    onPress={() => setIsConfirmVisible(!isConfirmVisible)}
                    style={styles.toggleButton}
                    accessibilityRole="button"
                    accessibilityLabel={isConfirmVisible ? "Hide passphrase" : "Show passphrase"}
                >
                    <Text style={styles.toggleText}>{isConfirmVisible ? "Hide" : "Show"}</Text>
                </Pressable>
            </View>

            {showConfirmValidation && (
                <Text style={[styles.validationText, doPasswordsMatch ? styles.valid : styles.invalid]}>
                    {doPasswordsMatch ? "✓ Passphrases match" : "✗ Passphrases do not match"}
                </Text>
            )}

            <Button title="Set Passphrase" 
                onPress={() => {
                    onPassphraseSet(passphrase)
                }} 
                disabled={!isFullyValid} 
            />
        </View>
    );
}

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    hint: {
        fontSize: 13,
        color: '#666',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d0d0d0',
        borderRadius: 10,
        backgroundColor: '#fafafa',
        overflow: 'hidden',
    },
    input: {
        flex: 1,
        padding: 12,
        fontSize: 16,
        minHeight: 48,
    },
    toggleButton: {
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    toggleText: {
        color: '#007AFF',
        fontWeight: '500',
        fontSize: 14,
    },
    validationText: {
        fontSize: 12,
        marginTop: 4,
    },
    valid: {
        color: '#1f8b4c',
    },
    invalid: {
        color: '#c0392b',
    },
}));

