import Account from "@/profile/account";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { IconSymbol } from "./icon-symbol";
import { colorTokens, radiusTokens, spaceTokens } from "@/design/tokens";
import { useAccountsStore } from "@/stores/accountsStore";
import { useState } from "react";
import { LOG } from "@/utils/logs";
import { RenameAccountModal } from "./rename-account-modal";
import { useProfileStore } from "@/stores/profileStore";
import { showToastError } from "./toast";

export interface AccountContextMenuProps {
    account: Account;
}

export const AccountContextMenu = ({ account }: AccountContextMenuProps) => {
    const [showModal, setShowModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const { deployAccount } = useAccountsStore();
    const { renameAccount } = useProfileStore();
    const status = useAccountsStore((state) => state.status.get(account.address) ?? "unknown");

    const deployButtonVisible = status === "not-deployed" || status === "deploying";
    const isDeploying = status === "deploying";

    const handleDeploy = async () => {
        if (isDeploying) {
            return;
        }

        try {
            setShowModal(false);
            await deployAccount(account);
        } catch (error) {
            showToastError(error);
        }
    };

    const handleRename = () => {
        setShowModal(false);
        setShowRenameModal(true);
    };

    const handleRenameSubmit = async (newName: string) => {
        renameAccount(account, newName);
    };

    return (
        <>
            <TouchableOpacity onPress={() => setShowModal(true)} style={styles.iconButton}>
                <IconSymbol name="ellipsis" size={24} color={colorTokens['text.primary']} />
                {deployButtonVisible && (
                    <View style={styles.warningDot} />
                )}
            </TouchableOpacity>

            <Modal
                visible={showModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowModal(false)}
                >
                    <View style={styles.menuContainer}>
                        {deployButtonVisible && (
                            <>
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={handleDeploy}
                                    disabled={isDeploying}
                                >
                                    {isDeploying && (
                                        <ActivityIndicator
                                            size="small"
                                            color={colorTokens['status.warning']}
                                        />
                                    )}
                                    {!isDeploying && (
                                        <IconSymbol
                                            name="arrow.up.circle.fill"
                                            size={20}
                                            color={colorTokens['status.warning']}
                                        />
                                    )}

                                    <Text style={[styles.menuItemText, { color: colorTokens['status.warning'] }]}>{isDeploying ? "Deploying..." : "Deploy Account"}</Text>
                                </TouchableOpacity>
                                <View style={styles.menuDivider} />
                            </>
                        )}

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={handleRename}
                        >
                            <IconSymbol
                                name="pencil"
                                size={20}
                                color={colorTokens['text.primary']}
                            />
                            <Text style={styles.menuItemText}>Rename Account</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            <RenameAccountModal
                account={account}
                visible={showRenameModal}
                onClose={() => setShowRenameModal(false)}
                onRename={handleRenameSubmit}
            />
        </>
    );
};

const styles = StyleSheet.create({
    iconButton: {
        position: 'relative',
    },
    warningDot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 12,
        backgroundColor: colorTokens['status.warning'],
        borderWidth: 1.5,
        borderColor: colorTokens['bg.default'],
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContainer: {
        backgroundColor: colorTokens['bg.elevated'],
        borderRadius: radiusTokens.lg,
        minWidth: 220,
        paddingVertical: spaceTokens[2],
        shadowColor: colorTokens['shadow.deep'],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spaceTokens[3],
        paddingHorizontal: spaceTokens[4],
        paddingVertical: spaceTokens[3],
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '500',
        color: colorTokens['text.primary'],
    },
    menuDivider: {
        height: 1,
        backgroundColor: colorTokens['border.subtle'],
        marginVertical: spaceTokens[1],
    },
});