import Account from "@/profile/account";
import { colorTokens, radiusTokens, spaceTokens } from "@/design/tokens";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { PrimaryButton } from "./primary-button";
import { LOG } from "@/utils/logs";

export interface RenameAccountModalProps {
    account: Account;
    visible: boolean;
    onClose: () => void;
    onRename: (newName: string) => Promise<void>;
}

export const RenameAccountModal = ({ account, visible, onClose, onRename }: RenameAccountModalProps) => {
    const [accountName, setAccountName] = useState(account.name);
    const [isRenaming, setIsRenaming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRename = async () => {
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

        setIsRenaming(true);
        setError(null);

        try {
            await onRename(accountName.trim());
            onClose();
        } catch (err) {
            LOG.error('Failed to rename account:', err);
            setError(err instanceof Error ? err.message : 'Failed to rename account');
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
                    <View style={styles.modalContent}>
                        <Text style={styles.title}>Rename Account</Text>
                        <Text style={styles.description}>
                            Choose a new name for your account.
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Account Name</Text>
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
                                placeholder="e.g., Main Account"
                                placeholderTextColor={colorTokens['text.muted']}
                                editable={!isRenaming}
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

                        <View style={styles.buttonContainer}>
                            <Pressable
                                style={[styles.cancelButton, isRenaming && styles.buttonDisabled]}
                                onPress={handleClose}
                                disabled={isRenaming}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>

                            <PrimaryButton
                                title={isRenaming ? 'Renaming...' : 'Rename'}
                                onPress={handleRename}
                                disabled={!accountName.trim() || isRenaming}
                                loading={isRenaming}
                                style={styles.renameButton}
                            />
                        </View>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
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
        fontWeight: '700',
        color: colorTokens['text.primary'],
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: colorTokens['text.secondary'],
        textAlign: 'center',
        lineHeight: 20,
    },
    inputContainer: {
        gap: spaceTokens[1],
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
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
        color: colorTokens['status.error'],
    },
    hintText: {
        fontSize: 12,
        color: colorTokens['text.muted'],
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: spaceTokens[3],
        marginTop: spaceTokens[2],
    },
    cancelButton: {
        flex: 1,
        paddingVertical: spaceTokens[3],
        paddingHorizontal: spaceTokens[4],
        borderRadius: radiusTokens.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colorTokens['bg.sunken'],
    },
    cancelButtonText: {
        color: colorTokens['text.primary'],
        fontSize: 16,
        fontWeight: '600',
    },
    renameButton: {
        flex: 1,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});

