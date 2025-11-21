import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { NetworkId } from "@/profile/misc";
import NetworkDefinition from "@/profile/settings/networkDefinition";
import { Pressable, Text, View } from "react-native";
import { IconSymbol } from "./icon-symbol";

export interface NetworkChangeToastProps {
    networkId: NetworkId;
    onPress?: () => void;
}

export const NetworkChangeToast = ({ networkId, onPress }: NetworkChangeToastProps) => {
    const styles = useThemedStyle(themedStyleSheet);
    const { colors: colorTokens } = useTheme();

    const getNetworkName = () => {
        // Try to get the display name from well-known networks
        const wellKnownNetwork = NetworkDefinition.wellKnown().find(
            network => network.chainId === networkId
        );
        
        if (wellKnownNetwork) {
            return wellKnownNetwork.displayName;
        }
        
        // Fallback to the networkId itself for custom networks
        return networkId;
    };

    return (
        <Pressable
            style={styles.container}
            onPress={onPress}
        >
            <View style={styles.content}>
                {/* Icon and Main Content */}
                <View style={styles.mainRow}>
                    <View style={styles.iconContainer}>
                        <IconSymbol
                            name="checkmark-circle"
                            size={24}
                            color={colorTokens['text.inverted']}
                        />
                    </View>

                    <View style={styles.textContainer}>
                        <Text style={styles.title} numberOfLines={1}>
                            Network Switched
                        </Text>
                        <Text style={styles.subtitle} numberOfLines={1}>
                            Network switched to {getNetworkName()}
                        </Text>
                    </View>
                </View>
            </View>
        </Pressable>
    );
};

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    container: {
        width: '90%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    content: {
        backgroundColor: colorTokens['status.success'],
        borderRadius: radiusTokens.lg,
        shadowColor: colorTokens['shadow.deep'],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        overflow: 'hidden',
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: spaceTokens[4],
        gap: spaceTokens[3],
    },
    iconContainer: {
        paddingTop: spaceTokens[0],
    },
    textContainer: {
        flex: 1,
        gap: spaceTokens[1],
    },
    title: {
        fontSize: 16,
        ...fontStyles.ubuntuMono.bold,
        color: colorTokens['text.inverted'],
    },
    subtitle: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.inverted'],
        lineHeight: 20,
    },
}));

