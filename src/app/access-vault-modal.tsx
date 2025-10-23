import { BiometricsPrompt, PassphrasePrompt, useAccessVaultStore } from "@/stores/accessVaultStore";
import { useState } from "react";
import { Button, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AccessVaultModal() {
    const { prompt, handlePassphraseSubmit, handlePassphraseReject } = useAccessVaultStore();
    const [inputPassphrase, setInputPassphrase] = useState("");
    const [isInputVisible, setIsInputVisible] = useState(false);
    const insets = useSafeAreaInsets();

    const onRequestClose = () => {
        void handlePassphraseReject("Cancelled");
    }

    const onPassphraseSubmit = (passphrase: string) => {
        void handlePassphraseSubmit(passphrase);
    }

    let innerContent = null;
    if (prompt && prompt.validateWith === "biometrics") {
        innerContent = (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <Text style={styles.label}>Biometric Authentication</Text>

                {prompt.input == "seedphrase" && (
                    <Text style={styles.hint}>Please authenticate using Face ID or your fingerprint to unlock your wallet. Your biometric information is only used on your device to unlock your encrypted seed phrase.</Text>
                )}
            </View>
        );
    } else if (prompt && prompt.validateWith === "passphrase") { 
        innerContent = (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <Text style={styles.label}>Enter Passphrase</Text>

                {prompt.input == "seedphrase" && (
                    <Text style={styles.hint}>Please authenticate using your passphrase to unlock your wallet. Your passphrase is used to decrypt your encrypted seed phrase.</Text>
                )}

                <Text style={styles.hint}>{ 
                    prompt.input == "seedphrase" ? "This will unlock your private key." : "Your passphrase is needed for enabling biometrics."
                }</Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={inputPassphrase}
                        onChangeText={setInputPassphrase}
                        placeholder="Enter your passphrase..."
                        secureTextEntry={!isInputVisible}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                    />
                    <Pressable 
                        onPress={() => setIsInputVisible((state) => !state)}
                        style={styles.toggleButton}
                        accessibilityRole="button"
                        accessibilityLabel={isInputVisible ? "Hide passphrase" : "Show passphrase"}
                    >
                        <Text style={styles.toggleText}>{isInputVisible ? "Hide" : "Show"}</Text>
                    </Pressable>
                </View>

                <Button 
                    title="Submit" 
                    disabled={inputPassphrase.length === 0}
                    onPress={() => {
                        setInputPassphrase("");
                        onPassphraseSubmit(inputPassphrase)
                    }} 
                />
            </View>
        );
    }
    return (
        <Modal
            visible={prompt !== null}
            animationType="slide"
            onRequestClose={onRequestClose}

            // iOS only
            presentationStyle="pageSheet"
            allowSwipeDismissal={true}
        >
            {innerContent}
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 8,
        paddingHorizontal: 16,
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
    }
});