import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import Account from "@/profile/account";
import { useDynamicSafeAreaInsets } from "@/providers/DynamicSafeAreaProvider";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { AddressView } from "../address-view";
import { AccountContextMenu } from "./account-context-menu";
import { IconSymbol } from "@/components/ui/icon-symbol/icon-symbol";

interface AccountHeaderProps {
    account: Account | null;
}

const AccountHeader = ({ account }: AccountHeaderProps) => {
    const router = useRouter();
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();
    const { insets } = useDynamicSafeAreaInsets();

    return (
        <View style={[styles.header, { marginTop: insets.top }]}>
            {/* Back Button */}
            <TouchableOpacity
                style={styles.backIconButton}
                onPress={() => router.back()}
            >
                <IconSymbol name="chevron-left" size={24} color={colorTokens['text.primary']} />
            </TouchableOpacity>

            {/* Account Info */}
            {account && (
                <View style={styles.accountInfo}>
                    <View style={styles.accountNameContainer}>
                        <Text style={styles.accountName}>{account.name}</Text>

                        {/* Options */}
                        <AccountContextMenu account={account} />
                    </View>
                    <AddressView address={account.address} variant="compact" />
                </View>

            )}
        </View>
    );
};

export default AccountHeader;

export const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    header: {
        backgroundColor: colorTokens['bg.default'],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spaceTokens[4],
        paddingVertical: spaceTokens[3],
        gap: spaceTokens[3],
    },
    backIconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    accountInfo: {
        flex: 1,
        gap: spaceTokens[1],
    },
    accountName: {
        fontSize: 20,
        ...fontStyles.ubuntuMono.bold,
        color: colorTokens['text.primary'],
    },
    accountNameContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
}));