import { PrimaryButton } from "@/components/ui/primary-button";
import { SimpleHeader } from "@/components/ui/simple-header";
import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import { useDynamicSafeAreaInsets } from "@/providers/DynamicSafeAreaProvider";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { useTempStore } from "@/stores/tempStore";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

const MIN_PASSPHRASE_LENGTH = 7;

type OnboardingMode = 'create' | 'restore';

export default function SetPassphraseScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const { insets } = useDynamicSafeAreaInsets();
    const [passphrase, setPassphrase] = useState("");
    const [confirmPassphrase, setConfirmPassphrase] = useState("");
    const [showPassphrase, setShowPassphrase] = useState(false);
    const [showConfirmPassphrase, setShowConfirmPassphrase] = useState(false);
    const { setTempPassphrase } = useTempStore();

    const { mode } = useLocalSearchParams<{ mode: OnboardingMode }>();
    
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();

    useLayoutEffect(() => {
        navigation.setOptions({
            header: () => (
                <SimpleHeader
                    title="Create a passphrase"
                    onBackPress={() => router.back()}
                    style={{ paddingTop: insets.top }}
                />
            ),
        });
    }, [navigation, insets.top, router]);

    // Validation checks
    const isPassphraseLongEnough = passphrase.length >= MIN_PASSPHRASE_LENGTH;
    const doPassphrasesMatch = passphrase === confirmPassphrase && confirmPassphrase.length > 0;
    const isFormValid = isPassphraseLongEnough && doPassphrasesMatch;

    const handleCreateAccount = () => {
        if (!isFormValid) return;

        setTempPassphrase(passphrase);
        router.push({
            pathname: "/create-first-account",
        });
    };

    const handleRestoreWallet = () => {
        if (!isFormValid) return;

        setTempPassphrase(passphrase);
        router.push({
            pathname: "/restore-wallet",
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <Text style={styles.subtitle}>
                        Your passphrase will be used to encrypt and protect your wallet. Make sure it's strong and memorable.
                    </Text>
                </View>

                {/* Input Section */}
                <View style={styles.inputSection}>
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
                                    styles.helperText,
                                    isPassphraseLongEnough ? styles.helperSuccess : styles.helperError
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
                                    styles.helperText,
                                    doPassphrasesMatch ? styles.helperSuccess : styles.helperError
                                ]}
                            >
                                {doPassphrasesMatch ? "✓ Passphrases match" : "Passphrases don't match"}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Spacer */}
                <View style={{ flex: 1 }} />

                {/* Button Section */}
                <View style={[styles.buttonSection, { paddingBottom: insets.bottom }]}>
                    <PrimaryButton
                        title={mode === "create" ? "Create Account" : "Restore Wallet"}
                        onPress={mode === "create" ? handleCreateAccount : handleRestoreWallet}
                        disabled={!isFormValid}
                    />
                </View>
            </View>
        </View>
    );
}

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        flex: 1,
        backgroundColor: colorTokens['bg.default'],
    },
    content: {
        flex: 1,
        paddingHorizontal: spaceTokens[4],
    },
    headerSection: {
        paddingTop: spaceTokens[5],
        paddingBottom: spaceTokens[6],
        gap: spaceTokens[2],
    },
    title: {
        fontSize: 28,
        ...fontStyles.ubuntuMono.bold,
        color: colorTokens['text.primary'],
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
        lineHeight: 22,
    },
    inputSection: {
        gap: spaceTokens[5],
    },
    inputGroup: {
        gap: spaceTokens[2],
    },
    label: {
        fontSize: 15,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
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
    helperText: {
        fontSize: 13,
        ...fontStyles.ubuntuMono.regular,
        marginTop: -spaceTokens[1],
    },
    helperSuccess: {
        color: colorTokens['status.success'],
    },
    helperError: {
        color: colorTokens['status.error'],
    },
    buttonSection: {
        paddingBottom: spaceTokens[4],
    },
}));