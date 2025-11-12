import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { appTheme } from "@/design/theme";
import Account from "@/profile/account";
import { useAccountsStore } from "@/stores/accountsStore";
import { useMemo, useState } from "react";
import { LOG } from "@/utils/logs";

export interface DeployButtonProps {
    account: Account;
    onDeploySuccess?: () => void;
    onDeployError?: (error: Error) => void;
}

export const DeployButton = ({ account }: DeployButtonProps) => {
    const { deployAccount } = useAccountsStore();

    const handleDeploy = async () => {
        try {
            await deployAccount(account);
        } catch (error) {
            LOG.error(`Failed to deploy account ${account.address}:`, error);
        }
    };

    const status = useAccountsStore((state) => state.status.get(account.address) ?? "unknown")
    if (status === "deployed" || status === "unknown") {
        return null;
    }

    const isDeploying = status === "deploying";
    return (
        <Pressable
            style={[styles.button, isDeploying && styles.buttonDisabled]}
            onPress={handleDeploy}
            disabled={isDeploying}
        >
            <View style={styles.content}>
                {isDeploying && (
                    <ActivityIndicator
                        size="small"
                        color={appTheme.colors.accent}
                        style={styles.loader}
                    />
                )}
                <Text style={[styles.buttonText, isDeploying && styles.buttonTextLoading]}>
                    {isDeploying ? 'Deploying...' : 'Deploy'}
                </Text>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: appTheme.spacing[1],
        paddingHorizontal: appTheme.spacing[1],
        borderRadius: appTheme.radii.sm,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    loader: {
        marginRight: appTheme.spacing[2],
    },
    buttonText: {
        color: appTheme.colors.warning,
        fontSize: 16,
        fontWeight: "600",
    },
    buttonTextLoading: {
        opacity: 0.8,
    },
});

