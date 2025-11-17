import { PrimaryButton } from "@/components/ui/primary-button";
import { SimpleHeader } from "@/components/ui/simple-header";
import { showToastError } from "@/components/ui/toast";
import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import { useDynamicSafeAreaInsets } from "@/providers/DynamicSafeAreaProvider";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { useProfileStore } from "@/stores/profileStore";
import { mnemonicToWords, validateMnemonic, wordlist } from "@starkms/key-management";
import * as Clipboard from "expo-clipboard";
import { useNavigation, useRouter } from "expo-router";
import { useEffect, useLayoutEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function RestoreScreen() {
    const navigation = useNavigation();
    const router = useRouter();
    const { insets } = useDynamicSafeAreaInsets();
    const { restore } = useProfileStore();

    const [passphrase, setPassphrase] = useState("");
    const [confirmPassphrase, setConfirmPassphrase] = useState("");
    const [showPassphrase, setShowPassphrase] = useState(false);
    const [showConfirmPassphrase, setShowConfirmPassphrase] = useState(false);

    const [seedPhrase, setSeedPhrase] = useState("");
    const [wordCount, setWordCount] = useState(0);
    const [isAllowedWordCount, setIsAllowedWordCount] = useState(false);
    const [isSeedPhraseValid, setIsSeedPhraseValid] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();
    
    const MIN_PASSPHRASE_LENGTH = 7;

    useLayoutEffect(() => {
        navigation.setOptions({
            header: () => (
                <SimpleHeader
                    title="Restore your Wallet"
                    onBackPress={() => router.back()}
                    style={{ paddingTop: insets.top }}
                />
            ),
        });
    }, [navigation, router]);

    // Validate seed phrase
    useEffect(() => {
        const allowedWordCounts = [12, 24];
        const trimmed = seedPhrase.trim();
        const words = mnemonicToWords(trimmed);

        setWordCount(words.length);
        setIsAllowedWordCount(allowedWordCounts.includes(words.length));
        setIsSeedPhraseValid(validateMnemonic(trimmed, wordlist));
    }, [seedPhrase]);

    // Validation checks
    const isPassphraseLongEnough = passphrase.length >= MIN_PASSPHRASE_LENGTH;
    const doPassphrasesMatch = passphrase === confirmPassphrase && confirmPassphrase.length > 0;
    const isFormValid = isPassphraseLongEnough && doPassphrasesMatch && isSeedPhraseValid;

    const handlePaste = async () => {
        try {
            const hasText = await Clipboard.hasStringAsync();
            if (!hasText) return;

            const text = await Clipboard.getStringAsync();
            if (text) setSeedPhrase(text);
        } catch (e) {
            console.warn('Paste failed or clipboard not text:', e);
        }
    };

    const handleRestore = async () => {
        if (!isFormValid) return;

        try {
            setIsRestoring(true);
            const words = mnemonicToWords(seedPhrase.trim());

            await restore(passphrase, words);
        } catch (error) {
            showToastError(error);
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <ScrollView 
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <Text style={styles.subtitle}>
                        Enter your recovery phrase and create a new passphrase to restore your wallet.
                    </Text>
                </View>

                {/* Seed Phrase Section */}
                <View style={styles.section}>
                    <Text style={styles.label}>Recovery Phrase</Text>
                    <Text style={styles.helperText}>
                        Enter your 12 or 24 word recovery phrase. Separate words with spaces.
                    </Text>

                    <TextInput
                        style={styles.seedPhraseInput}
                        value={seedPhrase}
                        placeholder="word1 word2 word3 ..."
                        placeholderTextColor={colorTokens['text.muted']}
                        onChangeText={setSeedPhrase}
                        multiline
                        autoCapitalize="none"
                        autoCorrect={false}
                        textAlignVertical="top"
                        returnKeyType="done"
                    />

                    <View style={styles.inlineActions}>
                        <Pressable onPress={handlePaste} accessibilityRole="button">
                            <Text style={styles.link}>Paste</Text>
                        </Pressable>
                        {seedPhrase.length > 0 && (
                            <Pressable
                                onPress={() => setSeedPhrase("")}
                                accessibilityRole="button"
                            >
                                <Text style={styles.link}>Clear</Text>
                            </Pressable>
                        )}
                    </View>

                    <View style={styles.validationRow}>
                        <Text
                            style={[
                                styles.validationText,
                                isAllowedWordCount ? styles.validationSuccess : styles.validationError
                            ]}
                        >
                            Words: {wordCount} {isAllowedWordCount ? '✓' : '(use 12 or 24)'}
                        </Text>
                        {seedPhrase.length > 0 && (
                            <Text
                                style={[
                                    styles.validationText,
                                    isSeedPhraseValid ? styles.validationSuccess : styles.validationError
                                ]}
                            >
                                {isSeedPhraseValid ? '✓ Valid phrase' : 'Invalid phrase'}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Passphrase Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Create a passphrase</Text>
                    <Text style={styles.helperText}>
                        This passphrase will encrypt your restored wallet.
                    </Text>

                    {/* Passphrase Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Passphrase</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={passphrase}
                                onChangeText={setPassphrase}
                                placeholder="Enter your passphrase"
                                placeholderTextColor={colorTokens['text.muted']}
                                secureTextEntry={!showPassphrase}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <Pressable
                                style={styles.eyeButton}
                                onPress={() => setShowPassphrase(!showPassphrase)}
                            >
                                <Text style={styles.eyeButtonText}>
                                    {showPassphrase ? "Hide" : "Show"}
                                </Text>
                            </Pressable>
                        </View>
                        {passphrase.length > 0 && (
                            <Text
                                style={[
                                    styles.validationText,
                                    isPassphraseLongEnough ? styles.validationSuccess : styles.validationError
                                ]}
                            >
                                {isPassphraseLongEnough
                                    ? `✓ Strong passphrase`
                                    : `At least ${MIN_PASSPHRASE_LENGTH} characters required`}
                            </Text>
                        )}
                    </View>

                    {/* Confirm Passphrase Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm Passphrase</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={confirmPassphrase}
                                onChangeText={setConfirmPassphrase}
                                placeholder="Confirm your passphrase"
                                placeholderTextColor={colorTokens['text.muted']}
                                secureTextEntry={!showConfirmPassphrase}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <Pressable
                                style={styles.eyeButton}
                                onPress={() => setShowConfirmPassphrase(!showConfirmPassphrase)}
                            >
                                <Text style={styles.eyeButtonText}>
                                    {showConfirmPassphrase ? "Hide" : "Show"}
                                </Text>
                            </Pressable>
                        </View>
                        {confirmPassphrase.length > 0 && (
                            <Text
                                style={[
                                    styles.validationText,
                                    doPassphrasesMatch ? styles.validationSuccess : styles.validationError
                                ]}
                            >
                                {doPassphrasesMatch ? "✓ Passphrases match" : "Passphrases don't match"}
                            </Text>
                        )}
                    </View>
                </View>

            </ScrollView>

            {/* Button Section */}
            <View style={[styles.buttonSection, { paddingBottom: insets.bottom }]}>
                <PrimaryButton
                    title={isRestoring ? "Restoring..." : "Restore Wallet"}
                    onPress={handleRestore}
                    disabled={!isFormValid || isRestoring}
                />
            </View>
        </KeyboardAvoidingView>
    );
}

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        flex: 1,
        backgroundColor: colorTokens['bg.default'],
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spaceTokens[4],
        paddingBottom: spaceTokens[4],
    },
    headerSection: {
        paddingTop: spaceTokens[5],
        paddingBottom: spaceTokens[4],
        gap: spaceTokens[2],
    },
    subtitle: {
        fontSize: 15,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
        lineHeight: 22,
    },
    section: {
        gap: spaceTokens[3],
        marginBottom: spaceTokens[4],
    },
    sectionTitle: {
        fontSize: 18,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
    },
    label: {
        fontSize: 15,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
    },
    helperText: {
        fontSize: 13,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
        lineHeight: 18,
    },
    seedPhraseInput: {
        minHeight: 120,
        borderWidth: 1.5,
        borderColor: colorTokens['border.subtle'],
        borderRadius: radiusTokens.md,
        padding: spaceTokens[4],
        fontSize: 16,
        ...fontStyles.ubuntuMono.regular,
        backgroundColor: colorTokens['bg.elevated'],
        color: colorTokens['text.primary'],
    },
    inlineActions: {
        flexDirection: 'row',
        gap: spaceTokens[4],
    },
    link: {
        color: colorTokens['brand.accent'],
        fontSize: 15,
        ...fontStyles.ubuntuMono.semibold,
    },
    validationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    validationText: {
        fontSize: 13,
        ...fontStyles.ubuntuMono.regular,
    },
    validationSuccess: {
        color: colorTokens['status.success'],
    },
    validationError: {
        color: colorTokens['status.error'],
    },
    inputGroup: {
        gap: spaceTokens[2],
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.md,
        borderWidth: 1.5,
        borderColor: colorTokens['border.subtle'],
    },
    input: {
        flex: 1,
        paddingVertical: spaceTokens[4],
        paddingHorizontal: spaceTokens[4],
        fontSize: 16,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.primary'],
    },
    eyeButton: {
        paddingHorizontal: spaceTokens[4],
        paddingVertical: spaceTokens[2],
    },
    eyeButtonText: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['brand.accent'],
    },
    buttonSection: {
        paddingHorizontal: spaceTokens[3],
    },
}));

