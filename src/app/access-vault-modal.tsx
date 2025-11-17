import { RequestAccessPrompt, useAccessVaultStore } from "@/stores/accessVaultStore";
import { useState, useEffect } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { useAppDependenciesStore } from "@/stores/appDependenciesStore";
import { BiometryType } from "@/crypto/provider/biometrics/BiometryType";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { CancellationError } from "@/types/appError";

export default function AccessVaultModal() {
    const { prompt, handlePassphraseSubmit, handlePassphraseReject } = useAccessVaultStore();
    const { biometricsProvider } = useAppDependenciesStore();
    const [inputPassphrase, setInputPassphrase] = useState("");
    const [isInputVisible, setIsInputVisible] = useState(false);
    const [biometryType, setBiometryType] = useState<BiometryType | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const insets = useSafeAreaInsets();
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();

    // Get biometry type when modal opens
    useEffect(() => {
        if (prompt?.validateWith === "biometrics") {
            biometricsProvider.getBiometricsType().then(setBiometryType);
        }
    }, [prompt, biometricsProvider]);

    const onRequestClose = () => {
        if (!isSubmitting) {
            void handlePassphraseReject(new CancellationError());
        }
    }

    const onPassphraseSubmit = async (passphrase: string) => {
        setIsSubmitting(true);
        try {
            await handlePassphraseSubmit(passphrase);
        } finally {
            setIsSubmitting(false);
            setInputPassphrase("");
        }
    }

    const getTitle = (prompt: RequestAccessPrompt): string => {
        if (prompt.input.requestFor === "passphrase") {
            return "Enable Biometrics";
        } else if (prompt.input.requestFor === "keySources") {
            if (prompt.validateWith === "biometrics") {
                return "Unlock Wallet";
            } else if (prompt.validateWith === "passphrase") {
                return "Enter Passphrase";
            }
        }
        return "Authentication Required";
    }

    const getDescription = (prompt: RequestAccessPrompt): string => {
        if (prompt.input.requestFor === "passphrase") {
            return "Enter your passphrase to enable biometric authentication for future access.";
        } else if (prompt.input.requestFor === "keySources") {
            if (prompt.validateWith === "biometrics") {
                const biometryName = getBiometryName(biometryType);
                return `Authenticate with ${biometryName} to access your private keys.`;
            } else if (prompt.validateWith === "passphrase") {
                return "Enter your passphrase to access your private keys.";
            }
        }
        return "";
    }

    const getBiometryName = (type: BiometryType | null): string => {
        switch (type) {
            case BiometryType.FACE_ID:
                return "Face ID";
            case BiometryType.TOUCH_ID:
                return "Touch ID";
            case BiometryType.OPTIC_ID:
                return "Optic ID";
            case BiometryType.FINGERPRINT:
                return "Fingerprint";
            case BiometryType.FACE:
                return "Face Recognition";
            case BiometryType.IRIS:
                return "Iris Recognition";
            default:
                return "Biometrics";
        }
    }

    const getBiometryIcon = (type: BiometryType | null) => {
        switch (type) {
            case BiometryType.FACE_ID:
            case BiometryType.FACE:
                return "faceid" as const;
            case BiometryType.TOUCH_ID:
            case BiometryType.FINGERPRINT:
                return "touchid" as const;
            case BiometryType.OPTIC_ID:
                return "opticid" as const;
            case BiometryType.IRIS:
                return "eye.fill" as const;
            default:
                return "lock.shield.fill" as const;
        }
    }

    if (!prompt) {
        return null;
    }

    const title = getTitle(prompt);
    const description = getDescription(prompt);

    return (
        <Modal
            visible={prompt !== null}
            animationType="slide"
            onRequestClose={onRequestClose}
            presentationStyle="pageSheet"
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                <ScrollView 
                    contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <IconSymbol
                                name={prompt.validateWith === "biometrics" ? getBiometryIcon(biometryType) : "key.fill"}
                                size={40}
                                color={colorTokens['brand.accent']}
                            />
                        </View>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.description}>{description}</Text>
                    </View>

                    {/* Biometrics View */}
                    {prompt.validateWith === "biometrics" && (
                        <View style={styles.biometricsContainer}>
                            <ActivityIndicator 
                                size="large" 
                                color={colorTokens['brand.accent']}
                            />
                            <Text style={styles.biometricsHint}>
                                Waiting for authentication...
                            </Text>
                        </View>
                    )}

                    {/* Passphrase View */}
                    {prompt.validateWith === "passphrase" && (
                        <View style={styles.passphraseContainer}>
                            <View style={styles.inputWrapper}>
                                <View style={styles.inputIconContainer}>
                                    <IconSymbol
                                        name="lock.fill"
                                        size={18}
                                        color={colorTokens['text.muted']}
                                    />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    value={inputPassphrase}
                                    onChangeText={setInputPassphrase}
                                    placeholder="Enter your passphrase"
                                    placeholderTextColor={colorTokens['text.muted']}
                                    secureTextEntry={!isInputVisible}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoFocus
                                    returnKeyType="done"
                                    onSubmitEditing={() => {
                                        if (inputPassphrase.length > 0 && !isSubmitting) {
                                            onPassphraseSubmit(inputPassphrase);
                                        }
                                    }}
                                    editable={!isSubmitting}
                                />
                                <TouchableOpacity 
                                    onPress={() => setIsInputVisible((state) => !state)}
                                    style={styles.toggleButton}
                                    disabled={isSubmitting}
                                >
                                    <IconSymbol
                                        name={isInputVisible ? "eye.slash.fill" : "eye.fill"}
                                        size={18}
                                        color={colorTokens['text.muted']}
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.buttonContainer}>
                                <SecondaryButton
                                    title="Cancel"
                                    onPress={onRequestClose}
                                    disabled={isSubmitting}
                                    style={styles.cancelButton}
                                />

                                <PrimaryButton
                                    title="Unlock"
                                    onPress={() => onPassphraseSubmit(inputPassphrase)}
                                    disabled={inputPassphrase.length === 0}
                                    loading={isSubmitting}
                                    style={styles.submitButton}
                                />
                            </View>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        flex: 1,
        backgroundColor: colorTokens['bg.default'],
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spaceTokens[5],
        paddingBottom: spaceTokens[6],
    },
    header: {
        alignItems: 'center',
        marginTop: spaceTokens[5],
        marginBottom: spaceTokens[6],
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: radiusTokens.pill,
        backgroundColor: colorTokens['brand.glow'],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spaceTokens[4],
    },
    title: {
        fontSize: 24,
        ...fontStyles.ubuntuMono.bold,
        color: colorTokens['text.primary'],
        marginBottom: spaceTokens[2],
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: spaceTokens[2],
    },
    biometricsContainer: {
        alignItems: 'center',
        paddingVertical: spaceTokens[6],
        gap: spaceTokens[4],
    },
    biometricsHint: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.muted'],
        textAlign: 'center',
    },
    passphraseContainer: {
        gap: spaceTokens[4],
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colorTokens['bg.sunken'],
        borderRadius: radiusTokens.md,
        borderWidth: 2,
        borderColor: colorTokens['border.subtle'],
        paddingHorizontal: spaceTokens[3],
        gap: spaceTokens[2],
    },
    inputIconContainer: {
        width: 24,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        fontSize: 16,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.primary'],
        paddingVertical: spaceTokens[3],
        minHeight: 48,
    },
    toggleButton: {
        padding: spaceTokens[2],
        width: 40,
        alignItems: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: spaceTokens[3],
        marginTop: spaceTokens[2],
    },
    cancelButton: {
        flex: 1,
    },
    submitButton: {
        flex: 1,
    },
}));