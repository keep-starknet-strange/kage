import { PrimaryButton } from "@/components/ui/primary-button";
import { appTheme } from "@/design/theme";
import { useProfileStore } from "@/stores/profileStore";
import { useTempPassphraseStore } from "@/stores/tempPassphraseStore";
import { useNavigation } from "expo-router";
import { useLayoutEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateFirstAccountScreen() {
    const navigation = useNavigation();
    const [accountName, setAccountName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const { create } = useProfileStore();
    const { consumeTempPassphrase } = useTempPassphraseStore();

    useLayoutEffect(() => {
        navigation.setOptions({
            title: "Create your First Account",
            headerBackButtonDisplayMode: "minimal"
        });
    }, [navigation]);

    const isFormValid = accountName.trim().length > 0;

    const handleCreateAccount = async () => {
        if (!isFormValid) return;
        const passphrase = consumeTempPassphrase();
        if (!passphrase) {
            console.error("No passphrase is set");
            return;
        }

        setIsCreating(true);
        try {
            await create(passphrase, accountName);
        } catch (error) {
            console.error("Failed to create account:", error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <Text style={styles.title}>Name your account</Text>
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
                            placeholderTextColor={appTheme.colors.textMuted}
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
    input: {
        backgroundColor: appTheme.colors.surface,
        borderRadius: appTheme.radii.md,
        borderWidth: 1.5,
        borderColor: appTheme.colors.border,
        paddingVertical: appTheme.spacing[4],
        paddingHorizontal: appTheme.spacing[4],
        fontSize: 16,
        color: appTheme.colors.text,
    },
    helperText: {
        fontSize: 13,
        color: appTheme.colors.success,
        marginTop: -appTheme.spacing[1],
    },
    buttonSection: {
        paddingBottom: appTheme.spacing[4],
    },
});

