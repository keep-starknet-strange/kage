import { IconSymbol } from "@/components/ui/icon-symbol/icon-symbol";
import { IconSymbolName } from "@/components/ui/icon-symbol/mapping";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { BiometryType } from "@/crypto/provider/biometrics/BiometryType";
import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { AuthorizationType, RequestAccessPrompt, useAccessVaultStore } from "@/stores/accessVaultStore";
import { useAppDependenciesStore } from "@/stores/appDependenciesStore";
import { CancellationError } from "@/types/appError";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

const STAY_VISIBLE_MAX_DELAY = 1000;

export default function AccessVaultModal() {
    const { t } = useTranslation();
    const { prompt, handlePassphraseSubmit, handlePassphraseReject } = useAccessVaultStore();
    const { biometricsProvider } = useAppDependenciesStore();
    const [inputPassphrase, setInputPassphrase] = useState("");
    const [isInputVisible, setIsInputVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const insets = useSafeAreaInsets();
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();

    const onCreateRef = useRef<number>(0);
    const [viewDetails, setViewDetails] = useState<{
        title: string;
        description: string;
        validateWith: AuthorizationType;
        icon: IconSymbolName;
    } | null>(null);

    const getTitle = (prompt: RequestAccessPrompt): string => {
        if (prompt.input.requestFor === "passphrase") {
            return t('auth.enableBiometrics');
        } else if (prompt.input.requestFor === "keySources") {
            if (prompt.validateWith === "biometrics") {
                return t('auth.unlockWallet');
            } else if (prompt.validateWith === "passphrase") {
                return t('auth.enterPassphrase');
            }
        }
        return t('auth.authenticationRequired');
    }

    const getDescription = (prompt: RequestAccessPrompt, biometryType: BiometryType | null): string => {
        if (prompt.input.requestFor === "passphrase") {
            return t('auth.passphrasePrompt.enableBiometrics');
        } else if (prompt.input.requestFor === "keySources") {
            if (prompt.validateWith === "biometrics") {
                const biometryName = getBiometryName(biometryType);
                return t('auth.passphrasePrompt.authenticateWithBiometrics', { biometryName });
            } else if (prompt.validateWith === "passphrase") {
                return t('auth.passphrasePrompt.accessKeys');
            }
        }
        return "";
    }

    const getBiometryName = (type: BiometryType | null): string => {
        switch (type) {
            case BiometryType.FACE_ID:
                return t('auth.biometryTypes.faceId');
            case BiometryType.TOUCH_ID:
                return t('auth.biometryTypes.touchId');
            case BiometryType.OPTIC_ID:
                return t('auth.biometryTypes.opticId');
            case BiometryType.FINGERPRINT:
                return t('auth.biometryTypes.fingerprint');
            case BiometryType.FACE:
                return t('auth.biometryTypes.faceRecognition');
            case BiometryType.IRIS:
                return t('auth.biometryTypes.irisRecognition');
            default:
                return t('auth.biometryTypes.biometrics');
        }
    }

    const getBiometryIcon = (type: BiometryType | null) => {
        switch (type) {
            case BiometryType.FACE_ID:
            case BiometryType.FACE:
                return "face-id" as const;
            case BiometryType.TOUCH_ID:
            case BiometryType.FINGERPRINT:
                return "touch-id" as const;
            case BiometryType.OPTIC_ID:
                return "optic-id" as const;
            case BiometryType.IRIS:
                return "eye" as const;
            default:
                return "lock-shield" as const;
        }
    }

    useEffect(() => {
        if (prompt) {
            onCreateRef.current = Date.now();
            if (prompt.validateWith === "biometrics") {
                biometricsProvider.getBiometricsType().then((type) => {
                    setViewDetails({
                        title: getTitle(prompt),
                        description: getDescription(prompt, type),
                        validateWith: prompt.validateWith,
                        icon: prompt.validateWith === "biometrics" ? getBiometryIcon(type) : "key",
                    });
                });
            } else {
                setViewDetails({
                    title: getTitle(prompt),
                    description: getDescription(prompt, null),
                    validateWith: prompt.validateWith,
                    icon: "key",
                });
            }
        } else {
            const now = Date.now();
            const delay = Math.max(0, STAY_VISIBLE_MAX_DELAY - (now - onCreateRef.current));
            setTimeout(() => {
                setViewDetails(null);
            }, delay);
        }
    }, [prompt, biometricsProvider]);

    const onRequestClose = () => {
        if (!isSubmitting) {
            void handlePassphraseReject(new CancellationError());
        }
    }

    const onPassphraseSubmit = async (passphrase: string) => {
        if (inputPassphrase.length === 0 || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        try {
            await handlePassphraseSubmit(passphrase);
        } finally {
            setIsSubmitting(false);
            setInputPassphrase("");
        }
    }

    return (
        <Modal
            visible={viewDetails !== null}
            animationType="slide"
            onRequestClose={onRequestClose}
            presentationStyle="pageSheet"
        >
            <KeyboardAwareScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingTop: Platform.select({ "android": insets.top }),
                        paddingBottom: insets.bottom,
                    }
                ]}
                keyboardShouldPersistTaps="handled"
                style={styles.container}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <IconSymbol
                            name={viewDetails?.icon ?? "key"}
                            size={40}
                            color={colorTokens['brand.accent']}
                        />
                    </View>
                    <Text style={styles.title}>{viewDetails?.title}</Text>
                    <Text style={styles.description}>{viewDetails?.description}</Text>
                </View>

                {/* Biometrics View */}
                {viewDetails?.validateWith === "biometrics" && (
                    <View style={styles.biometricsContainer}>
                        <ActivityIndicator
                            size="large"
                            color={colorTokens['brand.accent']}
                        />
                        <Text style={styles.biometricsHint}>
                            {t('auth.waitingForAuth')}
                        </Text>
                    </View>
                )}

                {/* Passphrase View */}
                {viewDetails?.validateWith === "passphrase" && (
                    <View style={styles.passphraseContainer}>
                        <View style={styles.inputWrapper}>
                            <View style={styles.inputIconContainer}>
                                <IconSymbol
                                    name="lock"
                                    size={18}
                                    color={colorTokens['text.muted']}
                                />
                            </View>
                            <TextInput
                                style={styles.input}
                                value={inputPassphrase}
                                onChangeText={setInputPassphrase}
                                placeholder={t('auth.enterYourPassphrase')}
                                placeholderTextColor={colorTokens['text.muted']}
                                secureTextEntry={!isInputVisible}
                                textContentType="password"
                                importantForAutofill="yes"
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoFocus
                                returnKeyType="done"
                                onSubmitEditing={() => {
                                    onPassphraseSubmit(inputPassphrase);
                                }}
                                editable={!isSubmitting}
                            />
                            <TouchableOpacity
                                onPress={() => setIsInputVisible((state) => !state)}
                                style={styles.toggleButton}
                                disabled={isSubmitting}
                            >
                                <IconSymbol
                                    name={isInputVisible ? "eye-off" : "eye"}
                                    size={18}
                                    color={colorTokens['text.muted']}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.buttonContainer}>
                            <SecondaryButton
                                title={t('common.cancel')}
                                onPress={onRequestClose}
                                disabled={isSubmitting}
                                style={styles.cancelButton}
                            />

                            <PrimaryButton
                                title={t('auth.unlock')}
                                onPress={() => onPassphraseSubmit(inputPassphrase)}
                                disabled={inputPassphrase.length === 0}
                                loading={isSubmitting}
                                style={styles.submitButton}
                            />
                        </View>
                    </View>
                )}
            </KeyboardAwareScrollView>
        </Modal>
    );
}

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        flex: 1,
        backgroundColor: colorTokens['bg.default'],
    },
    scrollContent: {
        justifyContent: 'center',
        paddingHorizontal: spaceTokens[5],
        flexGrow: 1,
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