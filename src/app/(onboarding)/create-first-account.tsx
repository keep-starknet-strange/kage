import { PrimaryButton } from "@/components/ui/primary-button";
import { SimpleHeader } from "@/components/ui/simple-header";
import { showToastError } from "@/components/ui/toast";
import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import { useDynamicSafeAreaInsets } from "@/providers/DynamicSafeAreaProvider";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { useProfileStore } from "@/stores/profileStore";
import { useTempPassphraseStore } from "@/stores/tempPassphraseStore";
import { AppError } from "@/types/appError";
import { useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";

export default function CreateFirstAccountScreen() {
    const navigation = useNavigation();
    const router = useRouter();
    const { insets } = useDynamicSafeAreaInsets();
    const [accountName, setAccountName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const { create } = useProfileStore();
    const { consumeTempPassphrase } = useTempPassphraseStore();
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();

    useLayoutEffect(() => {
        navigation.setOptions({
            header: () => (
                <SimpleHeader
                    title="Name your First Account"
                    onBackPress={() => router.back()}
                    style={{ paddingTop: insets.top }}
                />
            ),
        });
    }, [navigation, insets.top, router]);

    const isFormValid = accountName.trim().length > 0;

    const handleCreateAccount = async () => {
        if (!isFormValid) return;
        const passphrase = consumeTempPassphrase();
        if (!passphrase) {
            showToastError(new AppError("No passphrase is set"));
            return;
        }

        setIsCreating(true);
        try {
            await create(passphrase, accountName);
        } catch (error) {
            showToastError(error); 
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <Text style={styles.subtitle}>
                        Choose a name to help you identify this account. You can always change it later.
                    </Text>
                </View>

                {/* Input Section */}
                <View style={styles.inputSection}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Account Name</Text>
                        <TextInput
                            style={styles.input}
                            value={accountName}
                            onChangeText={setAccountName}
                            placeholder="e.g., My Main Account"
                            placeholderTextColor={colorTokens['text.muted']}
                            autoCapitalize="words"
                            autoCorrect={false}
                            autoFocus
                        />
                        {accountName.trim().length > 0 && (
                            <Text style={styles.helperText}>
                                ✓ Looks good
                            </Text>
                        )}
                    </View>
                </View>

                {/* Spacer */}
                <View style={{ flex: 1 }} />

                {/* Button Section */}
                <View style={styles.buttonSection}>
                    <PrimaryButton
                        title={isCreating ? "Creating Account..." : "Create Account"}
                        onPress={handleCreateAccount}
                        disabled={!isFormValid}
                        loading={isCreating}
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
    input: {
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.md,
        borderWidth: 1.5,
        borderColor: colorTokens['border.subtle'],
        paddingVertical: spaceTokens[4],
        paddingHorizontal: spaceTokens[4],
        fontSize: 16,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.primary'],
    },
    helperText: {
        fontSize: 13,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['status.success'],
        marginTop: -spaceTokens[1],
    },
    buttonSection: {
        paddingBottom: spaceTokens[4],
    },
}));

