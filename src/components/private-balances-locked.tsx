import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { Text, View } from "react-native";
import { IconSymbol } from "./ui/icon-symbol";
import { PrimaryButton } from "./ui/primary-button";

export interface PrivateBalancesLockedProps {
    isLoadingBalances: boolean;
    handleUnlockPrivateBalances: () => void;
}


export function PrivateBalancesLocked({
    isLoadingBalances,
    handleUnlockPrivateBalances,
}: PrivateBalancesLockedProps) {
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();
    
    return (
        <View style={styles.container}>
            <IconSymbol name="lock" size={48} color={colorTokens['text.muted']} />
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

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spaceTokens[8],
        gap: spaceTokens[2],
    },
    label: {
        fontSize: 16,
        ...fontStyles.ubuntuMono.semibold,
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
        ...fontStyles.ubuntuMono.semibold,
    }
}));