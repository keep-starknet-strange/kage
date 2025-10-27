import { PassphraseInput } from "@/components/passphrase-input";
import { useAccountStore } from "@/stores/accountStore";
import { useAppDependenciesStore } from "@/stores/appDependenciesStore";
import { generateMnemonicWords, mnemonicToWords, validateMnemonic, wordlist } from "@starkms/key-management";
import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { Button, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WelcomeScreen() {
    const {
        restoreFromMnemonic,
    } = useAccountStore();
    const insets = useSafeAreaInsets();
    const { seedPhraseVault, keyValueStorage } = useAppDependenciesStore();
    const [passphrase, setPassphrase] = useState<string | null>("");
    
    const [isRestoring, setIsRestoring] = useState(false);
    const [restoreMnemonicInput, setRestoreMnemonic] = useState("");
    const [wordCount, setWordCount] = useState(0);
    const [isAllowedWordCount, setIsAllowedWordCount] = useState(false);
    const [isMnemonicValid, setIsMnemonicValid] = useState(false);


    useEffect(() => {
        const allowedWordCounts = [12, 24];

        const trimmed = restoreMnemonicInput.trim();
        const words = mnemonicToWords(trimmed);
        
        setWordCount(words.length);
        setIsAllowedWordCount(allowedWordCounts.includes(words.length));
        setIsMnemonicValid(validateMnemonic(trimmed, wordlist));
    }, [restoreMnemonicInput, mnemonicToWords, setIsAllowedWordCount, setIsMnemonicValid]);
    

    const handleCreateWallet = () => {
        if (!passphrase) return;
        const words = generateMnemonicWords();

        void restoreFromMnemonic(words, passphrase, true);
    };

    const handleRestoreWallet = async () => {
        if (!isMnemonicValid) return;
        if (!passphrase) return;
        try {
            setIsRestoring(true);
            
            const words = mnemonicToWords(restoreMnemonicInput.trim());
            setRestoreMnemonic("")
            await restoreFromMnemonic(words, passphrase, true);
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.section}>
                {!passphrase && (
                    <PassphraseInput
                        onPassphraseSet={(passphrase) => {
                            setPassphrase(passphrase)
                        }}
                        placeholder="Enter a strong passphrase..."
                        helperText="This passphrase will be used to encrypt your wallet"
                    />
                )}
                {passphrase && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={styles.sectionHint}>Passphrase is set ✓</Text>

                        <Pressable onPress={() => {
                            setPassphrase(null)
                        }} accessibilityRole="button">
                            <Text style={styles.link}>Clear</Text>
                        </Pressable>
                    </View>
                )}
            </View>

            {passphrase && (
                <>
                    <View style={styles.section}>
                        <Button
                            onPress={handleCreateWallet}
                            title={"Create a new (wallet)"}
                            disabled={passphrase == null}
                        />
                    </View>

                    <View style={styles.dividerRow}>
                        <View style={styles.divider} />
                        <Text style={styles.orText}>or</Text>
                        <View style={styles.divider} />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Restore from recovery phrase</Text>
                        <Text style={styles.sectionHint}>Paste your 12 or 24 words. Separate by spaces.</Text>

                        <TextInput
                            style={styles.mnemonicInput}
                            value={restoreMnemonicInput}
                            placeholder={"twelve or twenty four words..."}
                            onChangeText={setRestoreMnemonic}
                            multiline
                            autoCapitalize="none"
                            autoCorrect={false}
                            textAlignVertical="top"
                            returnKeyType="done"
                            onSubmitEditing={handleRestoreWallet}
                        />
                        <View style={styles.inlineActions}>
                            <Pressable
                                onPress={() => {
                                    const handlePaste = async () => {
                                        try {
                                            const hasText = await Clipboard.hasStringAsync();
                                            if (!hasText) {
                                                return;
                                            }
                                            const text = await Clipboard.getStringAsync();
                                            if (text) setRestoreMnemonic(text);
                                        } catch (e) {
                                            // Some iOS simulator versions log pasteboard errors for non-text items.
                                            // Gracefully ignore and avoid spamming logs.
                                            console.warn('Paste failed or clipboard not text:', e);
                                        }
                                    };

                                    void handlePaste();
                                }}
                                accessibilityRole="button"
                            >
                                <Text style={styles.link}>Paste</Text>
                            </Pressable>
                            {restoreMnemonicInput.length > 0 && (
                                <Pressable
                                    onPress={() => {
                                        setRestoreMnemonic("")
                                    }}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.link}>Clear</Text>
                                </Pressable>
                            )}
                        </View>

                        <View style={styles.validationRow}>
                            <Text
                                style={[styles.helperText, isAllowedWordCount ? styles.ok : styles.warn]}>Words: {wordCount} {isAllowedWordCount ? '' : `(use 12 or 24)`}</Text>
                            {restoreMnemonicInput.length > 0 && (
                                <Text
                                    style={[styles.helperText, isMnemonicValid ? styles.ok : styles.warn]}>{isMnemonicValid ? 'Looks good' : 'Invalid phrase'}</Text>
                            )}
                        </View>

                        <Button
                            onPress={handleRestoreWallet}
                            disabled={!isMnemonicValid || isRestoring || passphrase === null}
                            title={isRestoring ? "Restoring..." : "Restore (wallet)"}
                        />
                    </View>
                </>
            )}

            <Button
                title="Reset all data"
                onPress={() => {
                    void keyValueStorage.clear()
                        .then(() => {
                            void seedPhraseVault.reset();
                        });

                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 24,
        gap: 16,
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    sectionHint: {
        color: '#666',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 4,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#e0e0e0',
    },
    orText: {
        color: '#888',
        textTransform: 'uppercase',
        fontSize: 12,
        letterSpacing: 1,
    },
    mnemonicInput: {
        minHeight: 100,
        borderWidth: 1,
        borderColor: '#d0d0d0',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    inlineActions: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 6,
        marginBottom: 6,
    },
    link: {
        color: '#007AFF',
        fontWeight: '500',
    },
    validationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    helperText: {
        fontSize: 12,
    },
    ok: { color: '#1f8b4c' },
    warn: { color: '#c0392b' },
});
