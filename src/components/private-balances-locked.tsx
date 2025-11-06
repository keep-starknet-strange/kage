import { View, Text, StyleSheet } from "react-native";
import { IconSymbol } from "./ui/icon-symbol";
import { PrimaryButton } from "./ui/primary-button";
import { colorTokens, radiusTokens, spaceTokens } from "@/design/tokens";

export interface PrivateBalancesLockedProps {
    isLoadingBalances: boolean;
    handleUnlockPrivateBalances: () => void;
}


export function PrivateBalancesLocked({
    isLoadingBalances,
    handleUnlockPrivateBalances,
}: PrivateBalancesLockedProps) {
    return (
        <View style={styles.container}>
            <IconSymbol name="lock.fill" size={48} color={colorTokens['text.muted']} />
            <Text style={styles.label}>Private balances are locked</Text>

            <PrimaryButton
                style={styles.unlockButton}
                title="Unlock"
                loading={isLoadingBalances}
                onPress={handleUnlockPrivateBalances}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spaceTokens[8],
        gap: spaceTokens[2],
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: colorTokens['text.muted'],
    },
    unlockButton: {
        marginTop: spaceTokens[4],
        paddingVertical: spaceTokens[3],
        paddingHorizontal: spaceTokens[6],
        backgroundColor: colorTokens['brand.accent'],
        borderRadius: radiusTokens.md,
        alignItems: 'center',
    },
    unlockButtonText: {
        color: colorTokens['text.inverted'],
        fontSize: 16,
        fontWeight: '600',
    }
});