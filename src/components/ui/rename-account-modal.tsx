import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import Account from "@/profile/account";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { LOG } from "@/utils/logs";
import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { PrimaryButton } from "./primary-button";
import { SecondaryButton } from "./secondary-button";
import { useTranslation } from "react-i18next";

export interface RenameAccountModalProps {
    account: Account;
    visible: boolean;
    onClose: () => void;
    onRename: (newName: string) => Promise<void>;
}

export const RenameAccountModal = ({ account, visible, onClose, onRename }: RenameAccountModalProps) => {
    const { t } = useTranslation();
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();
    const [accountName, setAccountName] = useState(account.name);
    const [isRenaming, setIsRenaming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRename = async () => {
        // Validate account name
        if (!accountName.trim()) {
            setError(t('accounts.validation.required'));
            return;
        }

        if (accountName.trim().length < 2) {
            setError(t('accounts.validation.tooShort'));
            return;
        }

        if (accountName.trim().length > 50) {
            setError(t('accounts.validation.tooLong'));
            return;
        }

        setIsRenaming(true);
        setError(null);

        try {
            await onRename(accountName.trim());
            onClose();
        } catch (err) {
            LOG.error('Failed to rename account:', err);
            setError(err instanceof Error ? err.message : t('accounts.validation.renameFailed'));
        } finally {
            setIsRenaming(false);
        }
    };

    const handleClose = () => {
        if (!isRenaming) {
            setAccountName(account.name);
            setError(null);
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <Pressable
                style={styles.modalOverlay}
                onPress={handleClose}
            >
                <Pressable style={styles.modalContainer}>
                    <KeyboardAvoidingView
                        keyboardVerticalOffset={200}
                        behavior={"position"}
                        contentContainerStyle={styles.modalContent}
                    >
                        <Text style={styles.title}>{t('accounts.rename.title')}</Text>
                        <Text style={styles.description}>
                            {t('accounts.rename.description')}
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('accounts.rename.label')}</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    error && styles.inputError,
                                    isRenaming && styles.inputDisabled
                                ]}
                                value={accountName}
                                onChangeText={(text) => {
                                    setAccountName(text);
                                    setError(null);
                                }}
                                placeholder={t('accounts.rename.placeholder')}
                                placeholderTextColor={colorTokens['text.muted']}
                                editable={!isRenaming}
                                autoFocus
                                maxLength={50}
                            />
                            {error && (
                                <Text style={styles.errorText}>{error}</Text>
                            )}
                            <Text style={styles.hintText}>
                                {t('common.characters', { count: accountName.length, max: 50 })}
                            </Text>
                        </View>

                        <View style={styles.buttonContainer}>
                            <SecondaryButton
                                title={t('common.cancel')}
                                onPress={handleClose}
                                disabled={isRenaming}
                                style={styles.cancelButton}
                            />

                            <PrimaryButton
                                title={isRenaming ? t('accounts.rename.buttonRenaming') : t('accounts.rename.button')}
                                onPress={handleRename}
                                disabled={!accountName.trim() || isRenaming}
                                loading={isRenaming}
                                style={styles.renameButton}
                            />
                        </View>
                    </KeyboardAvoidingView>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        maxWidth: 400,
    },
    modalContent: {
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.lg,
        padding: spaceTokens[5],
        gap: spaceTokens[4],
        shadowColor: colorTokens['shadow.deep'],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    title: {
        fontSize: 24,
        ...fontStyles.ubuntuMono.bold,
        color: colorTokens['text.primary'],
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
        textAlign: 'center',
        lineHeight: 20,
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
        backgroundColor: colorTokens['bg.default'],
        borderWidth: 1,
        borderColor: colorTokens['border.subtle'],
        borderRadius: radiusTokens.sm,
        paddingHorizontal: spaceTokens[3],
        paddingVertical: spaceTokens[3],
        fontSize: 16,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.primary'],
        outlineStyle: 'none'
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
    buttonContainer: {
        flexDirection: 'row',
        gap: spaceTokens[3],
        marginTop: spaceTokens[2],
    },
    cancelButton: {
        flex: 1,
    },
    renameButton: {
        flex: 1,
    },
}));

