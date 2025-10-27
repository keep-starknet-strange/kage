import { useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useState } from "react";
import { Text, View, TextInput, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { appTheme } from "@/design/theme";
import { PrimaryButton } from "@/components/ui/primary-button";

const MIN_PASSPHRASE_LENGTH = 7;

export default function SetPassphraseScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const [passphrase, setPassphrase] = useState("");
    const [confirmPassphrase, setConfirmPassphrase] = useState("");
    const [showPassphrase, setShowPassphrase] = useState(false);
    const [showConfirmPassphrase, setShowConfirmPassphrase] = useState(false);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: "Setup a passphrase",
            headerBackButtonDisplayMode: "minimal"
        });
    }, [navigation]);

    // Validation checks
    const isPassphraseLongEnough = passphrase.length >= MIN_PASSPHRASE_LENGTH;
    const doPassphrasesMatch = passphrase === confirmPassphrase && confirmPassphrase.length > 0;
    const isFormValid = isPassphraseLongEnough && doPassphrasesMatch;

    const handleCreateAccount = () => {
        if (!isFormValid) return;
        
        router.navigate({
            pathname: "/create-first-account",
            params: {
                passphrase,
            },
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <Text style={styles.title}>Create a passphrase</Text>
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
                                placeholderTextColor={appTheme.colors.textMuted}
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
                                placeholderTextColor={appTheme.colors.textMuted}
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
                <View style={styles.buttonSection}>
                    <PrimaryButton
                        title="Create Account"
                        onPress={handleCreateAccount}
                        disabled={!isFormValid}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: appTheme.colors.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: appTheme.spacing[4],
    },
    headerSection: {
        paddingTop: appTheme.spacing[5],
        paddingBottom: appTheme.spacing[6],
        gap: appTheme.spacing[2],
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: appTheme.colors.text,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: appTheme.colors.textSecondary,
        lineHeight: 22,
    },
    inputSection: {
        gap: appTheme.spacing[5],
    },
    inputGroup: {
        gap: appTheme.spacing[2],
    },
    label: {
        fontSize: 15,
        fontWeight: "600",
        color: appTheme.colors.text,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: appTheme.colors.surface,
        borderRadius: appTheme.radii.md,
        borderWidth: 1.5,
        borderColor: appTheme.colors.border,
    },
    input: {
        flex: 1,
        paddingVertical: appTheme.spacing[4],
        paddingHorizontal: appTheme.spacing[4],
        fontSize: 16,
        color: appTheme.colors.text,
    },
    eyeButton: {
        paddingHorizontal: appTheme.spacing[4],
        paddingVertical: appTheme.spacing[2],
    },
    eyeButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: appTheme.colors.accent,
    },
    helperText: {
        fontSize: 13,
        marginTop: -appTheme.spacing[1],
    },
    helperSuccess: {
        color: appTheme.colors.success,
    },
    helperError: {
        color: appTheme.colors.error,
    },
    buttonSection: {
        paddingBottom: appTheme.spacing[4],
    },
});