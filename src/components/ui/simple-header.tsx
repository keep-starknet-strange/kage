import { IconSymbol } from "@/components/ui/icon-symbol";
import { fontStyles, radiusTokens, spaceTokens } from "@/design/tokens";
import { useDynamicSafeAreaInsets } from "@/providers/DynamicSafeAreaProvider";
import { ThemedStyleSheet, useTheme, useThemedStyle } from "@/providers/ThemeProvider";
import { TouchableOpacity, Text, View, ViewStyle } from "react-native";

export interface SimpleHeaderProps {
    title: string;
    subtitle?: string;
    onBackPress: () => void;
    style?: ViewStyle;
}

export const SimpleHeader = ({ title, subtitle, onBackPress, style }: SimpleHeaderProps) => {
    const styles = useThemedStyle(themedStyleSheet);
    const { insets } = useDynamicSafeAreaInsets();
    const { colors: colorTokens } = useTheme();

    return (
        <View style={[styles.headerContainer, { paddingTop: insets.top + spaceTokens[3] }, style]}>
            {/* Back Button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={onBackPress}
            >
                <IconSymbol name="chevron.left" size={24} color={colorTokens['text.primary']} />
            </TouchableOpacity>

            {/* Header Content */}
            <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>{title}</Text>
                {subtitle && (
                    <Text style={styles.headerSubtitle}>
                        {subtitle}
                    </Text>
                )}
            </View>
        </View>
    );
};

const themedStyleSheet = ThemedStyleSheet.create((colorTokens) => ({
    headerContainer: {
        backgroundColor: colorTokens['bg.elevated'],
        borderBottomWidth: 1,
        borderBottomColor: colorTokens['border.subtle'],
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spaceTokens[4],
        paddingVertical: spaceTokens[3],
        gap: spaceTokens[3],
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radiusTokens.md,
        backgroundColor: colorTokens['bg.elevated'],
    },
    headerContent: {
        flex: 1,
        gap: spaceTokens[1],
    },
    headerTitle: {
        fontSize: 20,
        ...fontStyles.ubuntuMono.bold,
        color: colorTokens['text.primary'],
    },
    headerSubtitle: {
        fontSize: 14,
        ...fontStyles.ubuntuMono.regular,
        color: colorTokens['text.secondary'],
        lineHeight: 18,
    },
}));

