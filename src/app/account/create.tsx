import { IconSymbol } from "@/components/ui/icon-symbol/icon-symbol";
import { PrimaryButton } from '@/components/ui/primary-button';
import { SimpleHeader } from '@/components/ui/simple-header';
import { fontStyles, radiusTokens, spaceTokens } from '@/design/tokens';
import { useDynamicSafeAreaInsets } from '@/providers/DynamicSafeAreaProvider';
import { ThemedStyleSheet, useTheme, useThemedStyle } from '@/providers/ThemeProvider';
import { useAccessVaultStore } from '@/stores/accessVaultStore';
import { useProfileStore } from '@/stores/profileStore';
import { LOG } from '@/utils/logs';
import { useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

export default function CreateAccountScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const { insets } = useDynamicSafeAreaInsets();
    const { addAccount } = useProfileStore();
    const { requestAccess } = useAccessVaultStore();

    const [accountName, setAccountName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();

    const handleCreate = async () => {
        // Validate account name
        if (!accountName.trim()) {
            setError('Account name is required');
            return;
        }

        if (accountName.trim().length < 2) {
            setError('Account name must be at least 2 characters');
            return;
        }

        if (accountName.trim().length > 50) {
            setError('Account name must be less than 50 characters');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            await addAccount(accountName.trim(), requestAccess);
            LOG.info('Account created successfully:', accountName);
            router.back();
        } catch (err) {
            LOG.error('Failed to create account:', err);
            setError(err instanceof Error ? err.message : 'Failed to create account');
        } finally {
            setIsCreating(false);
        }
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            header: () => (
                <SimpleHeader
                    title="Create Account"
                    onBackPress={() => router.back()}
                />
            ),
        });
    }, [navigation, insets.top, router]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Form */}
            <View style={styles.form}>
                <View style={styles.iconContainer}>
                    <IconSymbol
                        name="wallet"
                        size={48}
                        color={colorTokens['brand.accent']}
                    />
                </View>

                <Text style={styles.title}>New Account</Text>
                <Text style={styles.description}>
                    Choose a name for your new account. This will help you identify it later.
                </Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Account Name</Text>
                    <TextInput
                        style={[
                            styles.input,
                            error && styles.inputError,
                            isCreating && styles.inputDisabled
                        ]}
                        value={accountName}
                        onChangeText={(text) => {
                            setAccountName(text);
                            setError(null);
                        }}
                        placeholder="e.g., Main Account"
                        placeholderTextColor={colorTokens['text.muted']}
                        editable={!isCreating}
                        autoFocus
                        maxLength={50}
                    />
                    {error && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}
                    <Text style={styles.hintText}>
                        {accountName.length}/50 characters
                    </Text>
                </View>

                <PrimaryButton
                    title={isCreating ? 'Creating...' : 'Create Account'}
                    onPress={handleCreate}
                    disabled={!accountName.trim() || isCreating}
                    loading={isCreating}
                    style={styles.createButton}
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
    form: {
        flex: 1,
        padding: spaceTokens[4],
        justifyContent: 'center',
        gap: spaceTokens[4],
    },
    iconContainer: {
        alignSelf: 'center',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colorTokens['brand.glow'],
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spaceTokens[2],
    },
    title: {
        fontSize: 28,
        ...fontStyles.ubuntuMono.bold,
        color: colorTokens['text.primary'],
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: spaceTokens[2],
    },
    inputContainer: {
        gap: spaceTokens[1],
    },
    label: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.semibold,
        color: colorTokens['text.primary'],
    },
    input: {
        backgroundColor: colorTokens['bg.elevated'],
        borderWidth: 1,
        borderColor: colorTokens['border.subtle'],
        borderRadius: radiusTokens.sm,
        paddingHorizontal: spaceTokens[3],
        paddingVertical: spaceTokens[3],
        fontSize: 16,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.primary'],
    },
    inputError: {
        borderColor: colorTokens['status.error'],
    },
    inputDisabled: {
        backgroundColor: colorTokens['bg.sunken'],
        opacity: 0.6,
    },
    errorText: {
        fontSize: 12,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['status.error'],
    },
    hintText: {
        fontSize: 12,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.muted'],
    },
    createButton: {
        marginTop: spaceTokens[4],
    },
}));
